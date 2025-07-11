import { elasticClient, SearchResponse } from '@atc/common';
import { dbClient } from '@atc/db';
import { logger } from '@atc/logger';
import { status } from '@grpc/grpc-js';
import { errorMessage } from '@atc/common';

const productSearch = async (
    keyword: string,
    page: number = 1,
    limit: number = 10,
): Promise<SearchResponse> => {
    const skip = (page - 1) * limit;
    const body = await elasticClient.search({
        index: process.env.ELASTIC_INDEX,
        body: {
            size: limit,
            from: skip,
            query: {
                bool: {
                    should: [
                        {
                            term: {
                                barcode: {
                                    value: keyword,
                                    boost: 10,
                                },
                            },
                        },
                        {
                            match: {
                                barcode: {
                                    query: keyword,
                                    fuzziness: 1,
                                    prefix_length: 3,
                                    max_expansions: 10,
                                    boost: 8,
                                },
                            },
                        },
                        {
                            match: {
                                product_name: {
                                    query: keyword,
                                    analyzer: 'product_name_analyzer',
                                    fuzziness: 'AUTO',
                                    boost: 3,
                                },
                            },
                        },
                        {
                            match: {
                                brand_name: {
                                    query: keyword,
                                    analyzer: 'edge_ngram_analyzer',
                                    fuzziness: 'AUTO',
                                    boost: 2,
                                },
                            },
                        },
                        {
                            match: {
                                category_name: {
                                    query: keyword,
                                    analyzer: 'edge_ngram_analyzer',
                                    fuzziness: 'AUTO',
                                    boost: 1.5,
                                },
                            },
                        },
                        {
                            multi_match: {
                                query: keyword,
                                fields: [
                                    'product_name^3',
                                    'brand_name^2',
                                    'category_name^1.5',
                                ],
                                type: 'best_fields',
                                fuzziness: 'AUTO',
                                operator: 'and',
                            },
                        },
                    ],
                    minimum_should_match: 1,
                },
            },
        },
    });

    return body;
};

const syncDataInElastic = async (): Promise<{
    message: string;
    sync_status: status;
}> => {
    try {
        const productsCount = await dbClient.masterProduct.count();

        if (!productsCount) {
            return {
                message: 'No products found',
                sync_status: status.NOT_FOUND,
            };
        }

        const chunkSize = 200;

        for (let i = 0; i < productsCount; i += chunkSize) {
            const productList = await dbClient.masterProduct.findMany({
                skip: i,
                take: chunkSize,
                select: {
                    id: true,
                    product_name: true,
                    barcode: true,
                    pack_size: true,
                    image_url: true,
                    Brand: {
                        select: {
                            id: true,
                            brand_name: true,
                        },
                    },
                    Category: {
                        select: {
                            id: true,
                            category_name: true,
                        },
                    },
                },
            });

            if (productList.length > 0) {
                const bulkData = productList.flatMap((product) => [
                    {
                        update: {
                            _index: process.env.ELASTIC_INDEX,
                            _id: product.id,
                        },
                    },
                    {
                        doc: {
                            id: product.id,
                            product_name: product.product_name,
                            barcode: product.barcode,
                            pack_size: product.pack_size,
                            image_url: product.image_url,
                            brand_name: product.Brand?.brand_name || '',
                            category_name:
                                product.Category?.category_name || '',
                            brand_id: product.Brand?.id || '',
                            category_id: product.Category?.id || '',
                        },
                        doc_as_upsert: true,
                    },
                ]);

                const bulkResponse = await elasticClient.bulk({
                    body: bulkData,
                });

                if (bulkResponse.errors) {
                    console.error('Bulk operation errors:', bulkResponse.items);
                    throw new Error(
                        'Failed to sync some products to Elasticsearch',
                    );
                }
            }
        }

        return { message: 'Synced successfully', sync_status: status.OK };
    } catch (error) {
        logger.error(error);
        return {
            message: 'Failed to sync products',
            sync_status: status.INTERNAL,
        };
    }
};

// To update the product in Elasticsearch
// Provide the data in form { product_name: 'Updated Product Name'}
// Make sure the key of the object matches the column of elastic index
const updateRecordInElastic = async (
    product_id: string,
    data: any,
): Promise<boolean> => {
    try {
        const index = process.env.ELASTIC_INDEX;
        if (!index) {
            throw new Error(
                'ELASTIC_INDEX is not defined in environment variables',
            );
        }
        const response = await elasticClient.update({
            index,
            id: product_id,
            body: {
                doc: data,
            },
        });

        if (response.result !== 'updated' && response.result !== 'noop') {
            console.error('Unexpected update result:', response.result);
            throw new Error(
                errorMessage.PRODUCT.FAILED_TO_UPDATE_PRODUCT_IN_ELASTIC,
            );
        }

        return true;
    } catch (error) {
        logger.error('Elasticsearch update error:', error);
        return false;
    }
};

const deleteRecordInElastic = async (
    productIDs: string[],
    categoryIDs: string[],
): Promise<boolean> => {
    try {
        const index = process.env.ELASTIC_INDEX;
        if (!index) {
            throw new Error(
                'ELASTIC_INDEX is not defined in environment variables',
            );
        }

        const mustQueries = [];
        if (productIDs.length > 0) {
            mustQueries.push({
                terms: { id: productIDs },
            });
        }

        const response = await elasticClient.deleteByQuery({
            index,
            body: {
                query: {
                    bool: {
                        must: mustQueries,
                        should: [
                            {
                                terms: {
                                    category_id: categoryIDs,
                                },
                            },
                            {
                                terms: {
                                    brand_id: categoryIDs,
                                },
                            },
                        ],
                        minimum_should_match: 1,
                    },
                },
            },
        });

        return response?.deleted ? true : false;
    } catch (error) {
        console.error('Error deleting records from Elasticsearch:', error);
        logger.error(error);
        throw error;
    }
};

export {
    productSearch,
    syncDataInElastic,
    updateRecordInElastic,
    deleteRecordInElastic,
};
