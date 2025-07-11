import {
    ProductSearchRequest__Output,
    ProductSearchResponse,
    ProductSearchResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { productSearch } from '../services/elastic-services';

export const productSearchHandler = async (
    call: ServerUnaryCall<ProductSearchRequest__Output, ProductSearchResponse>,
    callback: sendUnaryData<ProductSearchResponse__Output>,
) => {
    try {
        const { keyword, page, limit } = utilFns.removeEmptyFields(
            call.request,
        ) as ProductSearchRequest__Output;

        if (keyword.length < 3) {
            return callback(null, {
                data: null,
                message: errorMessage.PRODUCT.INCREASE_KEYWORD,
                status: status.NOT_FOUND,
            });
        }

        const { hits } = await productSearch(keyword, page, limit);

        if (hits?.hits?.length) {
            const searchData = hits.hits.map((hit: any) => ({
                id: String(hit?._id) || '',
                product_name: String(hit?._source?.product_name || ''),
                pack_size: String(hit?._source?.pack_size || ''),
                image_url: String(hit?._source?.image_url || ''),
                brand_name: String(hit?._source?.brand_name || ''),
                category_name: String(hit?._source?.category_name || ''),
            }));
            const totalCount =
                typeof hits?.total === 'number'
                    ? hits.total
                    : hits?.total?.value || searchData.length;

            return callback(null, {
                data: { products: searchData, total_count: totalCount },
                message: responseMessage.PRODUCT.SEARCH_SUCCESS,
                status: status.OK,
            });
        }

        return callback(null, {
            data: {
                products: [],
                total_count: 0,
            },
            message: errorMessage.PRODUCT.NOT_FOUND,
            status: status.OK,
        });
    } catch (error) {
        logger.error(error);

        return callback(null, {
            data: null,
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
