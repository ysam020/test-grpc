import { dbClient, prismaClient } from '@atc/db';
import {
    GroupedProduct as GroupedProductType,
    SortByFieldBrandList,
    SortByOrder,
} from '@atc/common';
import { status } from '@grpc/grpc-js';
import { logger } from '@atc/logger';
import {
    errorMessage,
    responseMessage,
    GetAllProducts,
    redisService,
    KeyPrefixEnum,
    invokeLambda,
    putS3Object,
    constants,
} from '@atc/common';
import {
    updateRecordInElastic,
    deleteRecordInElastic,
} from './elastic-services';
import { updateAdminProductType } from '../validations';
import { getAttachedProductsByGroupID } from './client.service';

const getProductDetails = async (
    identifier: string,
    isID: boolean,
    userID?: string,
) => {
    const whereCondition = isID ? { id: identifier } : { barcode: identifier };

    return await dbClient.masterProduct.findUnique({
        where: whereCondition,
        select: {
            id: true,
            barcode: true,
            product_name: true,
            image_url: true,
            category_id: true,
            brand_id: true,
            pack_size: true,
            size: true,
            unit: true,
            configuration: true,
            a2c_size: true,
            Brand: {
                select: {
                    brand_name: true,
                    private_label: true,
                },
            },
            rrp: true,
            Category: {
                select: {
                    category_name: true,
                },
            },
            retailerCurrentPricing: {
                select: {
                    current_price: true,
                    offer_info: true,
                    promotion_type: true,
                    product_url: true,
                    per_unit_price: true,
                    Retailer: {
                        select: {
                            id: true,
                            retailer_name: true,
                            site_url: true,
                        },
                    },
                    retailer_code: true,
                },
                orderBy: {
                    current_price: 'asc',
                },
            },
            BasketItem: userID
                ? {
                      where: {
                          basket: {
                              user_id: userID,
                          },
                      },
                      select: {
                          quantity: true,
                      },
                  }
                : false,
            PriceAlert: userID
                ? {
                      where: {
                          user_id: userID,
                      },
                      select: {
                          id: true,
                      },
                  }
                : false,
        },
    });
};

const getAllProducts = async (
    productIDs?: string[],
    brandIDs?: string[],
    promotionType?: string,
    retailerIDs?: string[],
    categoryIDs?: string[],
    userID?: string,
    sortByField: string = 'id',
    sortByOrder: string = 'asc',
    page: number = 1,
    limit: number = 10,
) => {
    const skip = (page - 1) * limit;
    const filters: string[] = [];
    const whereCondition: any = {};

    const addFilter = (
        field: string,
        values?: string[],
        tableAlias: string = 'p',
    ) => {
        if (Array.isArray(values) && values.length) {
            filters.push(
                `${tableAlias}.${field} IN (${values.map((id) => `'${id}'`).join(',')})`,
            );
            return { [field]: { in: values } };
        }
        return {};
    };

    if (categoryIDs && categoryIDs.length > 0) {
        const categoryIdsQuery = `
            WITH RECURSIVE category_tree AS (
                SELECT id, parent_category_id
                FROM "Category"
                WHERE id IN (${categoryIDs.map((id) => `'${id}'`).join(',')})
                UNION ALL
                SELECT c.id, c.parent_category_id
                FROM "Category" c
                JOIN category_tree ct ON ct.id = c.parent_category_id
            )
            SELECT id FROM category_tree;
        `;
        const subcategoryIds: { id: string }[] =
            await dbClient.$queryRawUnsafe(categoryIdsQuery);
        const allCategoryIds = categoryIDs.concat(
            subcategoryIds.map((row) => row.id),
        );
        Object.assign(whereCondition, addFilter('category_id', allCategoryIds));
    } else {
        Object.assign(whereCondition, addFilter('category_id', categoryIDs));
    }

    Object.assign(whereCondition, addFilter('id', productIDs));
    Object.assign(whereCondition, {
        Brand: addFilter('brand_id', brandIDs).brand_id,
    });

    if (promotionType || (Array.isArray(retailerIDs) && retailerIDs.length)) {
        const pricingFilters: string[] = [];
        if (promotionType)
            pricingFilters.push(`rc.promotion_type = '${promotionType}'`);
        if (retailerIDs?.length)
            pricingFilters.push(
                `rc.retailer_id IN (${retailerIDs.map((id) => `'${id}'`).join(',')})`,
            );

        filters.push(`
            EXISTS (
                SELECT 1 
                FROM "RetailerCurrentPricing" rc 
                WHERE rc.product_id = p.id 
                AND ${pricingFilters.join(' AND ')}
            )
        `);

        whereCondition['retailerCurrentPricing'] = {
            some: {
                ...(promotionType && { promotion_type: promotionType }),
                ...(retailerIDs?.length && {
                    Retailer: {
                        id: { in: retailerIDs },
                    },
                }),
            },
        };
    }

    const whereClause =
        filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const sortFieldMap: { [key: string]: string } = {
        id: 'pp.id',
        name: 'pp.product_name',
        price: 'rc.current_price',
        saving_percentage: 'pp.saving_percentage',
    };
    const orderByField = sortFieldMap[sortByField] || 'pp.id';
    const sortOrder = sortByOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const MasterProductsortMap: { [key: string]: string } = {
        id: 'id',
        name: 'product_name',
        price: 'avg_price',
        saving_percentage: 'saving_percentage',
    };
    const MasterProductOrderByField = MasterProductsortMap[sortByField] || 'id';

    const userDependentJoin = userID
        ? `
            LEFT JOIN "Basket" bas ON bas.user_id = '${userID}'
            LEFT JOIN "BasketItem" bi ON bi.basket_id = bas.id AND bi.master_product_id = pp.id
            LEFT JOIN "PriceAlert" pa ON pa.product_id = pp.id AND pa.user_id = '${userID}'
        `
        : '';

    const userDependentSelect = userID
        ? `
            COALESCE(SUM(CASE WHEN bi.quantity > 0 THEN bi.quantity ELSE 0 END), 0) AS basket_quantity,
            COALESCE(COUNT(CASE WHEN pa.id IS NOT NULL THEN 1 END), 0) > 0 AS price_alert
        `
        : `
            0 AS basket_quantity,
            false AS price_alert
        `;

    const query = `
        WITH ProductPricing AS (
            SELECT 
                p.id,
                p.product_name,
                p.image_url,
                p.category_id,
                b.brand_name,
                p.rrp,
                AVG(rc.current_price) AS avg_price,
                CASE 
                    WHEN p.rrp IS NULL OR p.rrp = 0 THEN 0 
                    ELSE ((p.rrp - AVG(rc.current_price)) / p.rrp) * 100 
                END AS saving_percentage
            FROM "MasterProduct" p
            JOIN "RetailerCurrentPricing" rc ON p.id = rc.product_id
            JOIN "Brand" b ON b.id = p.brand_id
            ${whereClause}
            GROUP BY p.id, p.product_name, p.image_url, p.category_id, b.brand_name, p.rrp
            Order By ${MasterProductOrderByField} ${sortOrder}
            LIMIT ${limit} OFFSET ${skip} 
        )
        SELECT 
            pp.id,
            pp.product_name,
            pp.image_url,
            pp.category_id,
            pp.brand_name,
            pp.rrp,
            rc.current_price,
            rc.offer_info,
            rc.promotion_type,
            rc.per_unit_price,
            rc.product_url,
            r.id as retailer_id,
            r.retailer_name,
            r.site_url as retailer_site_url,
            pp.avg_price,
            CASE 
                WHEN pp.rrp IS NULL OR pp.rrp = 0 THEN 0 
                ELSE ((pp.rrp - rc.current_price) / pp.rrp) * 100 
            END AS saving_percentage,
            ${userDependentSelect}
        FROM ProductPricing pp
        JOIN "RetailerCurrentPricing" rc ON pp.id = rc.product_id
        JOIN "Retailer" r ON r.id = rc.retailer_id
        ${userDependentJoin}
        GROUP BY pp.id, pp.product_name, pp.image_url, pp.category_id, pp.brand_name, pp.avg_price, rc.current_price, rc.offer_info, rc.promotion_type, rc.per_unit_price, rc.product_url, r.retailer_name, r.site_url, r.id, rc.id, pp.saving_percentage, pp.rrp
        ORDER BY ${orderByField} ${sortOrder}
    `;

    const products: GetAllProducts[] = await dbClient.$queryRawUnsafe(query);

    const formattedProducts = products.reduce((acc: any, product: any) => {
        const existingProduct = acc.find((p: any) => p.id === product.id);

        const pricingInfo = {
            retailer_price: parseFloat(product.current_price).toFixed(2),
            offer_info: product.offer_info,
            promotion_type: product.promotion_type,
            product_url: product.product_url,
            per_unit_price: product.per_unit_price,
            saving_percentage_numeric: product.saving_percentage,
            saving_percentage: `${Math.ceil(product.saving_percentage)}%`,
            retailer_id: product.retailer_id,
            retailer_name: product.retailer_name,
            retailer_site_url: product.retailer_site_url,
            site_url: product.product_url,
        };

        if (existingProduct) {
            existingProduct.retailerCurrentPricing.push(pricingInfo);
            existingProduct.retailerCurrentPricing.sort(
                (a: any, b: any) =>
                    b.saving_percentage_numeric - a.saving_percentage_numeric,
            );
        } else {
            acc.push({
                id: product.id,
                product_name: product.product_name,
                image_url: product.image_url,
                category_id: product.category_id,
                basket_quantity: product.basket_quantity,
                price_alert: product.price_alert,
                recommended_retailer_prices: parseFloat(
                    product.rrp || 0,
                ).toFixed(2),
                Brand: { brand_name: product.brand_name },
                retailerCurrentPricing: [pricingInfo],
            });
        }

        return acc;
    }, []);

    const totalCountQuery = `
        SELECT COUNT(*) as total_count
        FROM "MasterProduct" p
        ${whereClause}
    `;

    const totalCount: any[] = await dbClient.$queryRawUnsafe(totalCountQuery);

    return {
        products: formattedProducts,
        totalCount: Number(totalCount[0].total_count ?? 0) ?? 0,
    };
};

const getProductList = async (
    user_id: string,
    productIDs?: string[],
    brandIDs?: string[],
    promotionType?: string,
    retailerIDs?: string[],
    categoryID?: string,
    sortByField: string = 'id',
    sortByOrder: string = 'asc',
    page: number = 1,
    limit: number = 10,
) => {
    const skip = (page - 1) * limit;

    const whereCondition: any = {
        ...(productIDs?.length && { id: { in: productIDs } }),
        ...(brandIDs?.length && { brand_id: { in: brandIDs } }),
        ...(categoryID && { category_id: categoryID }),
        ...(promotionType || retailerIDs?.length
            ? {
                  retailerCurrentPricing: {
                      some: {
                          ...(promotionType && {
                              promotion_type: promotionType,
                          }),
                          ...(retailerIDs?.length && {
                              retailer_id: { in: retailerIDs },
                          }),
                      },
                  },
              }
            : {}),
    };

    const sortFieldMap: Record<string, string> = {
        NAME: 'product_name',
        PRICE: 'current_price',
        ID: 'id',
    };

    const validSortField = sortFieldMap[sortByField.toUpperCase()] || 'id';

    const productslist = await dbClient.masterProduct.findMany({
        where: whereCondition,
        select: {
            id: true,
            barcode: true,
            product_name: true,
            image_url: true,
            category_id: true,
            Brand: {
                select: {
                    brand_name: true,
                },
            },
            Category: {
                select: {
                    category_name: true,
                },
            },
            retailerCurrentPricing: {
                select: {
                    current_price: true,
                    offer_info: true,
                    promotion_type: true,
                    product_url: true,
                    per_unit_price: true,
                    Retailer: {
                        select: {
                            retailer_name: true,
                            site_url: true,
                        },
                    },
                },
            },
            PriceAlert: user_id
                ? {
                      where: { user_id },
                      select: { id: true },
                  }
                : false,
            BasketItem: user_id
                ? {
                      where: {
                          basket: {
                              user_id,
                          },
                      },
                      select: {
                          quantity: true,
                      },
                  }
                : false,
        },
        orderBy: {
            [validSortField]:
                sortByOrder.toLowerCase() === 'desc' ? 'desc' : 'asc',
        },
        skip,
        take: limit,
    });

    const products = productslist.map((product) => ({
        ...product,
        isAlertSet: product.PriceAlert?.length > 0 || false,
        quantity: product.BasketItem?.[0]?.quantity || 0,
    }));

    const totalCount = await dbClient.masterProduct.count({
        where: whereCondition,
    });
    return { products, totalCount };
};

const getCategoryList = async (
    keyword: string = '',
    page: number = 1,
    limit: number = 10,
    sortByOrder: string = 'asc',
) => {
    const skip = (page - 1) * limit;
    const whereCondition: any = {};

    if (keyword) {
        whereCondition['category_name'] = {
            contains: keyword,
            mode: 'insensitive',
        };
    }

    const parentCategoryID = await dbClient.category.findFirst({
        where: { category_name: { contains: 'Home', mode: 'insensitive' } },
        select: { id: true },
    });

    const categories = await dbClient.category.findMany({
        where: {
            parent_category_id: parentCategoryID?.id,
            ...whereCondition,
        },
        select: {
            id: true,
            category_name: true,
            parent_category_id: true,
        },
        orderBy: {
            category_name:
                sortByOrder.toLowerCase() === 'desc' ? 'desc' : 'asc',
        },
        skip,
        take: limit,
    });

    const totalCount = await dbClient.category.count({
        where: {
            parent_category_id: parentCategoryID?.id,
            ...whereCondition,
        },
    });

    const parentCategoryIds = await dbClient.category.findMany({
        where: {
            parent_category_id: {
                in: categories.map((cat) => cat.id),
            },
        },
        select: {
            parent_category_id: true,
        },
    });

    const parentCategoryIdSet = new Set(
        parentCategoryIds.map((cat) => cat.parent_category_id),
    );

    const formattedCategories = categories.map((category) => ({
        ...category,
        has_subcategory: parentCategoryIdSet.has(category.id),
    }));

    return {
        categoryList: formattedCategories,
        totalCount,
    };
};

const getSubCategories = async (category_id: string) => {
    const whereCondition: any = {};

    if (category_id) {
        whereCondition['parent_category_id'] = {
            equals: category_id,
        };
    }

    const categories = await dbClient.category.findMany({
        where: whereCondition,
        select: {
            id: true,
            category_name: true,
            _count: { select: { category: true } },
        },
    });

    return categories.map((category) => ({
        id: category.id,
        category_name: category.category_name,
        has_subcategory: category._count.category > 0,
    }));
};

const getPotentialMatchList = async (
    keyword: string = '',
    sort_by_order: string = 'asc',
    page?: number,
    limit?: number,
    intervention?: string,
) => {
    let skip = 0;
    if (page && limit) {
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        skip = (page - 1) * limit;
    }
    const whereCondition: any = {};

    if (keyword) {
        whereCondition['OR'] = [
            {
                product_name: {
                    contains: keyword,
                    mode: 'insensitive',
                },
            },
            {
                brand_name: {
                    contains: keyword,
                    mode: 'insensitive',
                },
            },
            {
                Retailer: {
                    is: {
                        retailer_name: {
                            contains: keyword,
                            mode: 'insensitive',
                        },
                    },
                },
            },
            {
                category: {
                    is: {
                        category_name: {
                            contains: keyword,
                            mode: 'insensitive',
                        },
                    },
                },
            },
            {
                barcode: {
                    contains: keyword,
                    mode: 'insensitive',
                },
            },
            {
                pack_size: {
                    contains: keyword,
                    mode: 'insensitive',
                },
            },
        ];
    }

    if (intervention) {
        whereCondition['intervention'] = intervention === 'true';
    }

    const result = await dbClient.suggestionDetails.findMany({
        where: whereCondition,
        select: {
            id: true,
            brand_name: true,
            product_name: true,
            barcode: true,
            current_price: true,
            per_unit_price: true,
            rrp: true,
            offer_info: true,
            promotion_type: true,
            product_url: true,
            image_url: true,
            retailer_code: true,
            retailer_id: true,
            pack_size: true,
            size: true,
            unit: true,
            configuration: true,
            a2c_size: true,
            category: {
                select: {
                    id: true,
                    category_name: true,
                },
            },
            Retailer: {
                select: {
                    retailer_name: true,
                    site_url: true,
                },
            },
            intervention: true,
            matchSuggestion: {
                select: {
                    id: true,
                    match_confidence: true,
                    matched_product_pricing_id: true,
                    suggestion_details_id: true,
                },
            },
        },
        skip,
        take: limit,
        orderBy: {
            product_name:
                sort_by_order.toLowerCase() === 'desc' ? 'desc' : 'asc',
        },
    });

    const groupedBySuggestionId = result.reduce((acc: any, suggestion: any) => {
        const suggestionId = suggestion.id;
        if (!acc[suggestionId]) {
            acc[suggestionId] = {
                ...suggestion,
                product_pricing_ids: [],
            };
        }

        suggestion.matchSuggestion.forEach((match: any) => {
            acc[suggestionId].product_pricing_ids.push(
                match.matched_product_pricing_id,
            );
        });
        return acc;
    }, {});

    const productPriceDetailIds = [
        ...new Set(
            result.flatMap((suggestion) =>
                suggestion.matchSuggestion.map(
                    (m) => m.matched_product_pricing_id,
                ),
            ),
        ),
    ];

    const suggestionDetails = await dbClient.masterProduct.findMany({
        where: {
            id: {
                in: productPriceDetailIds,
            },
        },
        select: {
            id: true,
            product_name: true,
            barcode: true,
            pack_size: true,
            image_url: true,
            rrp: true,
            Brand: { select: { brand_name: true } },
            Category: { select: { category_name: true } },
            a2c_size: true,
        },
    });

    const potentialMatchesData = Object.values(
        Object.values(groupedBySuggestionId).reduce<
            Record<string, GroupedProductType>
        >((acc: any, productToMatch: any) => {
            const id = productToMatch.id;

            if (!acc[id]) {
                acc[id] = {
                    product_to_match: {
                        id: productToMatch.id,
                        barcode: productToMatch.barcode || '',
                        product_name: productToMatch.product_name || '',
                        brand_name: productToMatch.brand_name || '',
                        category_name:
                            productToMatch.category?.category_name || '',
                        category_id: productToMatch.category?.id || '',
                        image_url: productToMatch.image_url || '',
                        product_url: productToMatch.product_url || '',
                        retailer_id: productToMatch?.retailer_id || '',
                        retailer_code: productToMatch.retailer_code || '',
                        retailer_name:
                            productToMatch?.Retailer?.retailer_name || '',
                        pack_size: productToMatch.pack_size || '',
                        price: String(productToMatch.rrp?.toFixed(2) || '0.00'),
                        offer_info: productToMatch.offer_info || '',
                        promotion_type: productToMatch.promotion_type || '',
                        per_unit_price: productToMatch.per_unit_price || '',
                        master_product_ids: productToMatch.master_product_ids,
                        intervention: productToMatch.intervention,
                        size: Number(productToMatch.size) || 0,
                        unit: productToMatch.unit || '',
                        configuration: productToMatch.configuration || '',
                        a2c_size: productToMatch.a2c_size || '',
                        current_price: productToMatch.current_price || '0.00',
                        potential_matches: [],
                    },
                };
            }

            const matchedResults = suggestionDetails.filter((res) =>
                productToMatch.product_pricing_ids.includes(res.id),
            );

            acc[id].product_to_match.potential_matches.push(
                ...matchedResults
                    .map((match) => ({
                        id: match.id,
                        barcode: match.barcode,
                        product_name: match.product_name,
                        brand_name: match.Brand.brand_name,
                        category_name: match.Category.category_name,
                        pack_size: match.pack_size || '',
                        image_url: match.image_url || '',
                        price: String(match.rrp?.toFixed(2) || '0.00'),
                        match_confidence: String(
                            productToMatch.matchSuggestion.find(
                                (m: any) =>
                                    m.matched_product_pricing_id === match.id,
                            )?.match_confidence || '',
                        ),
                        a2c_size: match.a2c_size || '',
                    }))
                    .sort(
                        (a, b) =>
                            parseFloat(b.match_confidence) -
                            parseFloat(a.match_confidence),
                    ),
            );

            return acc;
        }, {}),
    );

    const totalCount = await dbClient.suggestionDetails.count({
        where: whereCondition,
    });

    return { potentialMatchesData, totalCount };
};

const matchProducts = async (
    product_to_match_id: string,
    potential_match_id: string,
) => {
    const productDetails = await dbClient.suggestionDetails.findUnique({
        where: {
            id: product_to_match_id,
        },
        select: {
            id: true,
            current_price: true,
            retailer_code: true,
            per_unit_price: true,
            offer_info: true,
            product_url: true,
            promotion_type: true,
            retailer_id: true,
            rrp: true,
        },
    });

    if (!productDetails) {
        return {
            message: errorMessage.PRODUCT.PRODUCT_TO_BE_MATCH_NOT_FOUND,
            update_status: status.NOT_FOUND,
        };
    }

    const potentialMatchDetails = await dbClient.masterProduct.findUnique({
        where: {
            id: potential_match_id,
        },
        include: { retailerCurrentPricing: true },
    });

    if (!potentialMatchDetails) {
        return {
            message: errorMessage.PRODUCT.POTENTIAL_MATCH_NOT_FOUND,
            update_status: status.NOT_FOUND,
        };
    }

    const productToBeMatchedPrice = parseFloat(
        productDetails.current_price || '0',
    );

    let promotionType =
        productDetails?.promotion_type as keyof typeof prismaClient.PromotionTypeEnum;
    if (
        !(
            promotionType &&
            Object.values(prismaClient.PromotionTypeEnum).includes(
                promotionType,
            )
        )
    ) {
        promotionType = prismaClient.PromotionTypeEnum.RETAILER;
    }

    const existingRetailerProduct =
        potentialMatchDetails.retailerCurrentPricing.find(
            (retailer) =>
                retailer.barcode === potentialMatchDetails.barcode &&
                retailer.retailer_id === productDetails.retailer_id,
        );

    if (!existingRetailerProduct) {
        const data = {
            product_id: potentialMatchDetails.id,
            barcode: potentialMatchDetails.barcode,
            retailer_id: productDetails?.retailer_id || '',
            retailer_code: productDetails?.retailer_code || '',
            current_price: productToBeMatchedPrice,
            was_price: productToBeMatchedPrice,
            per_unit_price: productDetails?.per_unit_price || '',
            offer_info: productDetails?.offer_info || '',
            product_url: productDetails?.product_url || '',
            promotion_type: promotionType,
        };

        const retailerCurrentPricing =
            await dbClient.retailerCurrentPricing.create({
                data: data,
            });

        await dbClient.priceHistory.create({
            data: {
                retailer_current_pricing_id: retailerCurrentPricing.id,
                rrp: productDetails.rrp || 0,
                current_price: data.current_price,
                date: new Date(),
            },
        });
    } else if (
        existingRetailerProduct &&
        productToBeMatchedPrice &&
        productToBeMatchedPrice != Number(existingRetailerProduct.current_price)
    ) {
        try {
            let offer_info =
                productDetails?.offer_info ||
                existingRetailerProduct?.offer_info ||
                '';
            let per_unit_price =
                productDetails?.per_unit_price ||
                existingRetailerProduct?.per_unit_price ||
                '';

            const updatedRetailerPricing =
                await dbClient.retailerCurrentPricing.update({
                    where: { id: existingRetailerProduct.id },
                    data: {
                        current_price: productToBeMatchedPrice,
                        was_price:
                            existingRetailerProduct.current_price ||
                            productToBeMatchedPrice,
                        offer_info,
                        per_unit_price,
                        updatedAt: new Date(),
                    },
                });

            await dbClient.priceHistory.create({
                data: {
                    retailer_current_pricing_id: updatedRetailerPricing.id,
                    rrp: productDetails.rrp || 0,
                    current_price: productToBeMatchedPrice,
                    date: new Date(),
                },
            });

            invokeLambda('atc-price-alert-dev-api', {
                productIDs: [existingRetailerProduct.product_id],
            });
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    try {
        await dbClient.matchSuggestion.deleteMany({
            where: {
                suggestion_details_id: productDetails.id,
            },
        });

        await dbClient.suggestionDetails.delete({
            where: { id: productDetails.id },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }

    return {
        message: responseMessage.PRODUCT.MATCH_PRODUCT_SUCCESS,
        update_status: status.OK,
    };
};

const addProductBySuggestionList = async (
    product_id: string = '',
    product_name: string = '',
    barcode: string = '',
    retailer_id: string = '',
    category_id: string = '',
    brand_name: string = '',
    pack_size: string = '',
    image_url: string = '',
    retailer_code: string = '',
    price: string = '',
    per_unit_price: string = '',
    offer_info: string = '',
    promotion_type: prismaClient.PromotionTypeEnum = prismaClient
        .PromotionTypeEnum.RETAILER,
    product_url: string = '',
    rrp: string,
    size: number,
    unit: prismaClient.UnitEnum,
    a2c_size: string,
    configuration?: string,
    image?: Buffer,
    mime_type?: string,
    content_length?: number,
) => {
    if (
        !product_id ||
        !product_name ||
        !barcode ||
        !retailer_id ||
        !category_id ||
        !brand_name ||
        !price ||
        !pack_size
    ) {
        return {
            message: errorMessage.PRODUCT.PROVIDE_VALID_PARAMETER_VALUE,
            insertion_status: status.CANCELLED,
        };
    }

    const checkProductExists = await dbClient.suggestionDetails.findUnique({
        where: { id: product_id },
        select: {
            per_unit_price: true,
            offer_info: true,
            retailer_code: true,
            product_url: true,
            image_url: true,
        },
    });

    if (!checkProductExists) {
        return {
            message: errorMessage.PRODUCT.PRODUCT_NOT_FOUND,
            insertion_status: status.CANCELLED,
        };
    }

    const existingProduct = await dbClient.masterProduct.findUnique({
        where: { barcode: barcode },
    });

    if (existingProduct) {
        return {
            message: errorMessage.PRODUCT.PRODUCT_ALREADY_EXISTS,
            insertion_status: status.ALREADY_EXISTS,
        };
    }

    const categoryDetails = await dbClient.category.findUnique({
        where: { id: category_id },
    });

    if (!categoryDetails) {
        return {
            message: errorMessage.PRODUCT.CATEGORY_NOT_FOUND,
            insertion_status: status.NOT_FOUND,
        };
    }

    const normalizedBrandName = brand_name.toLowerCase().replace(/\s+/g, '');
    const brandDetails = await dbClient.$queryRaw<any>`
        SELECT id FROM "Brand" 
        WHERE LOWER(REPLACE(brand_name, ' ', '')) = ${normalizedBrandName}
        LIMIT 1;
    `;

    let brand_id = brandDetails?.[0]?.id || '';

    if (!brandDetails) {
        const newBrandDetails = await dbClient.brand.create({
            data: {
                brand_name,
            },
        });

        brand_id = newBrandDetails.id;
    }

    if (!brand_id) {
        return {
            message: errorMessage.PRODUCT.BRAND_NOT_FOUND,
            insertion_status: status.NOT_FOUND,
        };
    }

    const retailerDetails = await dbClient.retailer.findUnique({
        where: { id: retailer_id },
    });

    if (!retailerDetails) {
        return {
            message: errorMessage.PRODUCT.RETAILER_NOT_FOUND,
            insertion_status: status.NOT_FOUND,
        };
    }

    if (!image_url) {
        image_url = checkProductExists?.image_url || '';
    }

    const productDetails = await dbClient.masterProduct.create({
        data: {
            barcode,
            product_name,
            pack_size,
            brand_id,
            category_id,
            image_url,
            rrp,
            size,
            unit,
            configuration,
            a2c_size,
        },
    });

    if (image) {
        await putS3Object(
            constants.PRODUCT_IMAGE_FOLDER,
            image,
            productDetails.id,
            mime_type,
            content_length,
        );
        image_url = `${process.env.S3_BUCKET_URL}/${constants.PRODUCT_IMAGE_FOLDER}/${productDetails.id}`;

        await dbClient.masterProduct.update({
            where: { id: productDetails.id },
            data: { image_url },
        });
    }

    if (!retailer_code) {
        retailer_code = checkProductExists?.retailer_code || '';
    }
    if (!per_unit_price) {
        per_unit_price = checkProductExists?.per_unit_price || '';
    }
    if (!offer_info) {
        offer_info = checkProductExists?.offer_info || '';
    }
    if (!product_url) {
        product_url = checkProductExists?.product_url || '';
    }

    const retailerPricing = await dbClient.retailerCurrentPricing.create({
        data: {
            product_id: productDetails.id,
            barcode,
            retailer_id,
            retailer_code,
            current_price: price,
            was_price: price,
            offer_info,
            promotion_type,
            product_url,
            per_unit_price,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    await dbClient.priceHistory.create({
        data: {
            retailer_current_pricing_id: retailerPricing.id,
            rrp,
            current_price: price,
            date: new Date(),
        },
    });

    try {
        await dbClient.matchSuggestion.deleteMany({
            where: {
                suggestion_details_id: product_id,
            },
        });

        await dbClient.suggestionDetails.delete({
            where: { id: product_id },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }

    return {
        message: responseMessage.PRODUCT.ADD_PRODUCT_SUCCESS,
        insertion_status: status.OK,
    };
};

const addBrand = async (
    brand_name: string,
    private_label: boolean,
    image?: Buffer,
    mime_type?: string,
    content_length?: number,
    supplier_id?: string,
) => {
    if (!brand_name) {
        return {
            message: errorMessage.PRODUCT.BRAND_NAME_REQUIRED,
            insert_status: status.INVALID_ARGUMENT,
            data: null,
        };
    }

    const existingBrand = await dbClient.brand.findFirst({
        where: {
            brand_name: brand_name,
        },
    });

    if (existingBrand) {
        return {
            message: errorMessage.PRODUCT.BRAND_NAME_EXISTS,
            insert_status: status.ALREADY_EXISTS,
            data: null,
        };
    }
    const brand = await dbClient.brand.create({
        data: {
            brand_name,
            private_label,
            supplier_id,
        },
    });

    if (image) {
        await putS3Object(
            constants.BRAND_IMAGE_FOLDER,
            image,
            brand.id,
            mime_type,
            content_length,
        );
    }

    return {
        message: responseMessage.PRODUCT.BRAND_ADDED,
        insert_status: status.OK,
        data: brand,
    };
};

const addCategory = async (
    category_name: string,
    parent_category_id: string,
) => {
    let category_id = '';
    if (!category_name) {
        return {
            category_id,
            message: errorMessage.PRODUCT.CATEGORY_NAME_REQUIRED,
            insert_status: status.INVALID_ARGUMENT,
        };
    }

    const existingCategory = await dbClient.category.findFirst({
        where: {
            category_name: category_name,
        },
    });

    if (existingCategory) {
        return {
            category_id,
            message: errorMessage.PRODUCT.CATEGORY_ALREADY_EXISTS,
            insert_status: status.ALREADY_EXISTS,
        };
    }

    if (!parent_category_id) {
        const category = await dbClient.category.create({
            data: {
                category_name,
            },
        });
        category_id = category.id;
    } else {
        const parentCategoryExists = await dbClient.category.findUnique({
            where: { id: parent_category_id },
        });

        if (!parentCategoryExists) {
            return {
                category_id,
                message: errorMessage.PRODUCT.PARENT_CATEGORY_NOT_FOUND,
                insert_status: status.NOT_FOUND,
            };
        }

        const category = await dbClient.category.create({
            data: {
                category_name,
                parent_category_id,
            },
        });
        category_id = category.id;
    }

    return {
        category_id,
        message: responseMessage.PRODUCT.CATEGORY_ADDED,
        insert_status: status.OK,
    };
};

const getProductByID = async (productID: string) => {
    try {
        return await dbClient.masterProduct.findUnique({
            where: { id: productID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateProductData = async (
    productID: string,
    productName: string = '',
    barcode: string = '',
    categoryID: string = '',
    brandID: string = '',
    packSize: string = '',
    promotionType?: prismaClient.PromotionTypeEnum,
    size?: number,
    unit?: prismaClient.UnitEnum,
    configuration?: string,
    a2c_size?: string,
) => {
    try {
        const existingProduct = await dbClient.retailerCurrentPricing.findFirst(
            {
                where: { product_id: productID },
                select: {
                    barcode: true,
                    MasterProduct: {
                        select: {
                            id: true,
                        },
                    },
                },
            },
        );

        if (!existingProduct || !existingProduct?.MasterProduct?.id) {
            return {
                message: errorMessage.PRODUCT.NOT_FOUND,
                update_status: status.NOT_FOUND,
            };
        }

        if (barcode !== existingProduct.barcode) {
            await redisService.removeMembersFromSet(
                KeyPrefixEnum.BARCODE_LIST,
                [existingProduct.barcode],
            );
            await redisService.addMembersToSet(KeyPrefixEnum.BARCODE_LIST, [
                barcode,
            ]);
        }

        let MasterProductID = existingProduct?.MasterProduct?.id;

        const updateData: any = {};
        const retailerCurrentUpdateData: any = {};

        if (productName) updateData.product_name = productName;

        if (barcode) {
            const whereClause = {
                barcode,
                id: { not: MasterProductID },
            };

            const existingBarcodeProduct =
                await dbClient.masterProduct.findFirst({
                    where: whereClause,
                });

            if (existingBarcodeProduct) {
                return {
                    message: errorMessage.PRODUCT.PRODUCT_ALREADY_EXISTS,
                    update_status: status.ALREADY_EXISTS,
                };
            }

            retailerCurrentUpdateData.barcode = barcode;
            updateData.barcode = barcode;
        }

        if (categoryID) updateData.category_id = categoryID;
        if (brandID) updateData.brand_id = brandID;
        if (packSize) updateData.pack_size = packSize;
        if (size) updateData.size = size;
        if (unit) updateData.unit = unit;
        if (configuration) updateData.configuration = configuration;
        if (a2c_size) updateData.a2c_size = a2c_size;

        if (
            promotionType &&
            Object.values(prismaClient.PromotionTypeEnum).includes(
                promotionType,
            )
        ) {
            retailerCurrentUpdateData.promotion_type =
                promotionType as keyof typeof prismaClient.PromotionTypeEnum;
        }

        if (
            Object.keys(updateData).length === 0 &&
            Object.keys(retailerCurrentUpdateData).length === 0
        ) {
            return {
                message: errorMessage.PRODUCT.PROVIDE_VALID_PARAMETER_VALUE,
                update_status: status.INVALID_ARGUMENT,
            };
        }

        if (Object.keys(updateData).length) {
            await dbClient.masterProduct.update({
                where: { id: MasterProductID },
                data: updateData,
            });

            const elasticUpdateResponse = await updateRecordInElastic(
                MasterProductID,
                updateData,
            );

            if (!elasticUpdateResponse) {
                logger.error(
                    errorMessage.PRODUCT.FAILED_TO_UPDATE_PRODUCT_IN_ELASTIC,
                );
            }
        }

        if (Object.keys(retailerCurrentUpdateData).length) {
            await dbClient.retailerCurrentPricing.updateMany({
                where: { product_id: MasterProductID },
                data: retailerCurrentUpdateData,
            });
        }

        return {
            message: responseMessage.PRODUCT.UPDATE_SUCCESS,
            update_status: status.OK,
        };
    } catch (error) {
        logger.error('Error updating product data:', error);
        throw error;
    }
};

const getProductListWithRetailerCode = async (
    keyword: string = '',
    sort_by_order: string = 'asc',
    page?: number,
    limit?: number,
) => {
    let skip = 0;
    if (page && limit) {
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        skip = (page - 1) * limit;
    }
    const whereCondition: any = {};
    if (keyword) {
        whereCondition['OR'] = [
            {
                product_name: {
                    contains: keyword,
                    mode: 'insensitive',
                },
            },
            {
                pack_size: {
                    contains: keyword,
                    mode: 'insensitive',
                },
            },
            {
                Brand: {
                    is: {
                        brand_name: {
                            contains: keyword,
                            mode: 'insensitive',
                        },
                    },
                },
            },
            {
                Category: {
                    is: {
                        category_name: {
                            contains: keyword,
                            mode: 'insensitive',
                        },
                    },
                },
            },
            {
                retailerCurrentPricing: {
                    some: {
                        retailer_code: {
                            contains: keyword,
                            mode: 'insensitive',
                        },
                    },
                },
            },
            {
                retailerCurrentPricing: {
                    some: {
                        Retailer: {
                            is: {
                                retailer_name: {
                                    contains: keyword,
                                    mode: 'insensitive',
                                },
                            },
                        },
                    },
                },
            },
        ];
    }

    const [productList, totalCount] = await Promise.all([
        dbClient.masterProduct.findMany({
            where: whereCondition,
            select: {
                id: true,
                product_name: true,
                pack_size: true,
                image_url: true,
                Brand: {
                    select: { brand_name: true, private_label: true },
                },
                Category: {
                    select: { category_name: true },
                },
                retailerCurrentPricing: {
                    select: {
                        retailer_code: true,
                        retailer_id: true,
                        product_url: true,
                        Retailer: {
                            select: { retailer_name: true },
                        },
                    },
                },
                barcode: true,
                a2c_size: true,
            },
            skip,
            take: limit,
            orderBy: {
                product_name:
                    sort_by_order.toLowerCase() === 'desc' ? 'desc' : 'asc',
            },
        }),
        dbClient.masterProduct.count({ where: whereCondition }),
    ]);

    const formattedProducts = productList.map((product) => ({
        id: product.id,
        product_name: product.product_name,
        pack_size: product.pack_size,
        image_url: product.image_url || '',
        brand_name: product.Brand?.brand_name || '',
        private_label: product.Brand.private_label,
        category_name: product.Category?.category_name || '',
        barcode: product.barcode,
        a2c_size: product.a2c_size || '',
        retailers_data: product.retailerCurrentPricing.map((retailer) => ({
            retailer_name: retailer.Retailer?.retailer_name || '',
            retailer_id: retailer.retailer_id,
            retailer_code: retailer.retailer_code,
            product_url: retailer.product_url,
        })),
    }));

    return {
        products: formattedProducts,
        total_count: totalCount,
    };
};

const getRetailerList = async (
    keyword?: string,
    sort_by_order: string = 'asc',
    page?: number,
    limit?: number,
) => {
    const skip = page && limit ? (page - 1) * limit : 0;
    const whereCondition: any = {};

    if (keyword) {
        whereCondition['retailer_name'] = {
            contains: keyword,
            mode: 'insensitive',
        };
    }

    const retailers = await dbClient.retailer.findMany({
        where: whereCondition,
        select: {
            id: true,
            retailer_name: true,
        },
        skip,
        take: limit || undefined,
        orderBy: {
            retailer_name:
                sort_by_order.toLowerCase() === 'desc' ? 'desc' : 'asc',
        },
    });

    const total_count = await dbClient.retailer.count({
        where: whereCondition,
    });

    return {
        retailers: retailers,
        total_count,
    };
};

const getBrandList = async (
    keyword: string = '',
    sort_by_order: string = 'asc',
    page?: number,
    limit?: number,
    sort_by_field: string = 'brand_name',
) => {
    const skip = page && limit ? (page - 1) * limit : 0;

    const whereCondition: any = {};
    let orderByCondition: any = { brand_name: sort_by_order };

    if (sort_by_field === SortByFieldBrandList.SUPPLIER_NAME) {
        orderByCondition = {
            Supplier: { supplier_name: sort_by_order },
        };
    }

    if (keyword) {
        whereCondition['brand_name'] = {
            contains: keyword,
            mode: 'insensitive',
        };
    }

    const [brandList, totalCount] = await Promise.all([
        await dbClient.brand.findMany({
            where: whereCondition,
            select: {
                id: true,
                brand_name: true,
                private_label: true,
                Supplier: {
                    select: { id: true, supplier_name: true },
                },
            },
            skip,
            take: limit || undefined,
            orderBy: orderByCondition,
        }),
        dbClient.brand.count({ where: whereCondition }),
    ]);
    return {
        brands: brandList.map((brand) => ({
            id: brand.id,
            brand_name: brand.brand_name,
            private_label: brand.private_label,
            supplier_id: brand.Supplier?.id || '',
            supplier_name: brand.Supplier?.supplier_name || '',
        })),
        total_count: totalCount,
    };
};

const getAllCategoryList = async (
    keyword: string = '',
    sort_by_order: string = 'asc',
    page?: number,
    limit?: number,
) => {
    let skip = 0;
    if (page && limit) {
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        skip = (page - 1) * limit;
    }
    const whereCondition: any = {};

    if (keyword) {
        whereCondition['OR'] = [
            {
                category_name: {
                    contains: keyword,
                    mode: 'insensitive',
                },
            },
            {
                parent_category: {
                    category_name: {
                        contains: keyword,
                        mode: 'insensitive',
                    },
                },
            },
        ];
    }
    const categories = await dbClient.category.findMany({
        where: whereCondition,
        select: {
            id: true,
            category_name: true,
            parent_category_id: true,
            parent_category: {
                select: {
                    category_name: true,
                },
            },
        },
        orderBy: {
            category_name:
                sort_by_order.toLowerCase() === 'desc' ? 'desc' : 'asc',
        },
        skip,
        take: limit,
    });

    const totalCount = await dbClient.category.count({ where: whereCondition });
    const aliasedCategories = categories.map((category) => ({
        ...category,
        parent_category_name: category?.parent_category?.category_name || '',
        parent_category_id: category?.parent_category_id || '',
    }));

    return {
        categories: aliasedCategories,
        totalCount,
    };
};

const getProductsCount = async () => {
    const count = await dbClient.masterProduct.count({});
    return count;
};

async function getCountOfNewProducts() {
    const latestProduct = await dbClient.masterProduct.findFirst({
        orderBy: {
            createdAt: 'desc',
        },
        select: {
            createdAt: true,
        },
    });

    if (latestProduct) {
        const latestDate = latestProduct.createdAt.toISOString().split('T')[0];
        const count = await dbClient.masterProduct.count({
            where: {
                createdAt: {
                    gte: new Date(`${latestDate}T00:00:00`),
                    lt: new Date(`${latestDate}T23:59:59.999`),
                },
            },
        });
        return count;
    }

    return 0;
}

const getCountOfUnmatchedProducts = async () => {
    const count = await dbClient.suggestionDetails.count({});
    return count;
};

const getNewProductList = async () => {
    const newProductList = await dbClient.masterProduct.findMany({
        select: {
            product_name: true,
            image_url: true,
            pack_size: true,
            barcode: true,
            Brand: {
                select: {
                    brand_name: true,
                },
            },
            Category: {
                select: {
                    category_name: true,
                },
            },
        },
        take: 6,
    });

    const formattedProducts = newProductList.map((product) => ({
        product_name: product.product_name,
        barcode: product.barcode,
        image_url: product.image_url || '',
        pack_size: product.pack_size,
        brand_name: product.Brand?.brand_name || '',
        category_name: product.Category?.category_name || '',
    }));

    return formattedProducts;
};

const getProductByCategoryCount = async () => {
    const productCountByCategory = await dbClient.masterProduct.groupBy({
        by: ['category_id'],
        _count: {
            id: true,
        },
        orderBy: {
            _count: {
                id: 'desc',
            },
        },
    });

    const categoryDetails = await Promise.all(
        productCountByCategory.map(async (item) => {
            const category = await dbClient.category.findUnique({
                where: { id: item.category_id },
                select: { category_name: true },
            });
            return {
                category_name: category?.category_name || 'General',
                count: item._count.id,
            };
        }),
    );

    return categoryDetails;
};

const getProductByRetailerCount = async () => {
    const productCountByRetailer =
        await dbClient.retailerCurrentPricing.groupBy({
            by: ['retailer_id'],
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
        });

    const retailerDetails = await Promise.all(
        productCountByRetailer.map(async (item) => {
            const retailer = await dbClient.retailer.findUnique({
                where: { id: item.retailer_id },
                select: { retailer_name: true },
            });
            return {
                retailer_name: retailer?.retailer_name || 'General',
                count: item._count.id,
            };
        }),
    );

    return retailerDetails;
};

const updateCategory = async (
    id: string,
    category_name: string,
    parent_category_id: string = '',
) => {
    let data: {
        category_name: string;
        parent_category_id?: string;
    } = {
        category_name,
    };

    if (parent_category_id) {
        const parentCategoryExists = await dbClient.category.findUnique({
            where: { id: parent_category_id },
        });

        if (!parentCategoryExists) {
            return {
                message: errorMessage.PRODUCT.PARENT_CATEGORY_NOT_FOUND,
                insert_status: status.NOT_FOUND,
            };
        }
        data.parent_category_id = parent_category_id;
    }

    try {
        await dbClient.category.update({
            where: { id },
            data,
        });

        return {
            message: responseMessage.PRODUCT.CATEGORY_UPDATED,
            insert_status: status.OK,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateRetailer = async (id: string, retailer_name: string) => {
    let rawDBClient;
    try {
        await dbClient.retailer.update({
            where: { id },
            data: {
                retailer_name,
                site_url: '',
            },
        });

        const { getRawDBConnection }: any = await import(
            '../database/rawDB.js'
        );
        const rawDBPool = await getRawDBConnection();
        rawDBClient = await rawDBPool.connect();

        await rawDBClient.query('BEGIN');

        await rawDBClient.query(
            'UPDATE public."Retailer" SET retailer_name = $1, site_url = $2 WHERE id = $3 RETURNING id',
            [retailer_name, '', id],
        );

        await rawDBClient.query('COMMIT');

        return {
            message: responseMessage.PRODUCT.RETAILER_UPDATED,
            insert_status: status.OK,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    } finally {
        if (rawDBClient) {
            rawDBClient.release();
        }
    }
};

const addRetailer = async (retailer_name: string) => {
    let rawDBClient;
    try {
        const existingRetailer = await dbClient.retailer.findFirst({
            where: {
                retailer_name,
            },
        });

        if (existingRetailer) {
            return {
                retailer_id: '',
                message: errorMessage.PRODUCT.RETAILER_ALREADY_EXISTS,
                insert_status: status.ALREADY_EXISTS,
            };
        }

        const retailer = await dbClient.retailer.create({
            data: {
                retailer_name,
                site_url: '',
            },
        });

        const { getRawDBConnection }: any = await import(
            '../database/rawDB.js'
        );
        const rawDBPool = await getRawDBConnection();
        rawDBClient = await rawDBPool.connect();

        await rawDBClient.query('BEGIN');

        await rawDBClient.query(
            'INSERT INTO public."Retailer" (id, retailer_name, site_url) VALUES ($1, $2, $3) RETURNING id',
            [retailer.id, retailer_name, ''],
        );

        await rawDBClient.query('COMMIT');

        return {
            retailer_id: retailer.id,
            message: responseMessage.PRODUCT.RETAILER_ADDED,
            insert_status: status.OK,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    } finally {
        if (rawDBClient) {
            rawDBClient.release();
        }
    }
};

const findRetailer = async (retailer_id: string) => {
    try {
        return await dbClient.retailer.findUnique({
            where: { id: retailer_id },
            select: {
                id: true,
                retailer_name: true,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const findCategory = async (category_id: string) => {
    try {
        return await dbClient.category.findUnique({
            where: { id: category_id },
            select: {
                id: true,
                category_name: true,
                parent_category_id: true,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const createProduct = async (
    productName: string,
    barcode: string,
    packSize: string,
    brandID: string,
    categoryID: string,
    rrp: number,
    size: number,
    unit: prismaClient.UnitEnum,
    a2c_size: string,
    configuration?: string,
) => {
    try {
        return await dbClient.masterProduct.create({
            data: {
                product_name: productName,
                barcode: barcode,
                pack_size: packSize,
                brand_id: brandID,
                category_id: categoryID,
                rrp,
                size,
                unit,
                configuration,
                a2c_size,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const createRetailerPricing = async (
    data: prismaClient.Prisma.RetailerCurrentPricingCreateManyInput[],
) => {
    try {
        return await dbClient.retailerCurrentPricing.createMany({ data });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateProductImage = async (
    productID: prismaClient.Prisma.MasterProductWhereUniqueInput['id'],
    imageURL: string,
) => {
    try {
        return await dbClient.masterProduct.update({
            where: { id: productID },
            data: { image_url: imageURL },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getBrandByID = async (brandID: string) => {
    try {
        return await dbClient.brand.findUnique({ where: { id: brandID } });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getCategoryByID = async (categoryID: string) => {
    try {
        return await dbClient.category.findUnique({
            where: { id: categoryID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getRetailersByIDs = async (retailerIDs: string[]) => {
    try {
        return await dbClient.retailer.findMany({
            where: { id: { in: retailerIDs } },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const deleteCategory = async (id: string) => {
    try {
        const subCategoryIds = await dbClient.category.findMany({
            where: { parent_category_id: id },
            select: { id: true },
        });

        const categoryIDs = subCategoryIds.map((subCategory) => subCategory.id);
        categoryIDs.push(id);

        const elasticDeleteResponse = await deleteRecordInElastic(
            [],
            categoryIDs,
        );

        if (!elasticDeleteResponse) {
            logger.error(
                errorMessage.PRODUCT.FAILED_TO_UPDATE_PRODUCT_IN_ELASTIC,
            );
        }

        await dbClient.category.delete({
            where: { id },
        });

        return {
            message: responseMessage.PRODUCT.DELETE_CATEGORY_SUCCESS,
            status: status.OK,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const deleteProduct = async (id: string) => {
    try {
        const elasticDeleteResponse = await deleteRecordInElastic([id], []);

        if (!elasticDeleteResponse) {
            logger.error(
                errorMessage.PRODUCT.FAILED_TO_UPDATE_PRODUCT_IN_ELASTIC,
            );
        }

        await dbClient.masterProduct.delete({
            where: { id },
        });

        return {
            message: responseMessage.PRODUCT.DELETE_PRODUCT_SUCCESS,
            status: status.OK,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const findProductByID = async (id: string) => {
    try {
        return await dbClient.masterProduct.findUnique({
            where: { id },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateProductByID = async (
    productData: Omit<
        updateAdminProductType,
        'image' | 'mime_type' | 'content_length'
    >,
) => {
    try {
        const {
            product_id,
            product_name,
            barcode,
            brand_id,
            category_id,
            pack_size,
            retailer_details,
            rrp,
            size,
            unit,
            configuration,
            a2c_size,
        } = productData;
        let updateData: any = {};
        let product;

        if (product_name) updateData.product_name = product_name;
        if (barcode) updateData.barcode = barcode;
        if (brand_id) updateData.brand_id = brand_id;
        if (category_id) updateData.category_id = category_id;
        if (pack_size) updateData.pack_size = pack_size;
        if (rrp) updateData.rrp = rrp;
        if (size) updateData.size = size;
        if (unit) updateData.unit = unit;
        if (configuration) updateData.configuration = configuration;
        if (a2c_size) updateData.a2c_size = a2c_size;

        await dbClient.$transaction(async (db) => {
            product = await db.masterProduct.update({
                where: { id: product_id },
                data: updateData,
            });

            const elasticUpdateResponse = await updateRecordInElastic(
                product_id,
                updateData,
            );

            if (!elasticUpdateResponse) {
                logger.error('Failed to update product in Elasticsearch');
            }

            if (retailer_details?.length === 0 || !retailer_details) {
                return {
                    product_id: product.id,
                    product_name: product.product_name,
                };
            }

            const retailerIDs = retailer_details.map((r) => r.retailer_id);
            await db.retailerCurrentPricing.deleteMany({
                where: {
                    product_id,
                    retailer_id: { notIn: retailerIDs },
                },
            });

            const valuesClause = retailer_details
                .map((_, index) => {
                    const base = index * 10;
                    return `($${base + 1}::uuid, $${base + 2}, $${base + 3}::uuid, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}::"PromotionTypeEnum", $${base + 10})`;
                })
                .join(', ');

            const values: any[] = [];
            retailer_details.forEach((retailer) => {
                values.push(
                    product_id,
                    barcode,
                    retailer.retailer_id,
                    retailer.retailer_code,
                    retailer.price,
                    retailer.price,
                    retailer.per_unit_price,
                    retailer.offer_info,
                    retailer.promotion_type,
                    retailer.product_url,
                );
            });

            const query = `
            INSERT INTO "RetailerCurrentPricing"
            ("product_id", "barcode", "retailer_id", "retailer_code", "current_price", "was_price", "per_unit_price", "offer_info", "promotion_type", "product_url")
            VALUES ${valuesClause}
            ON CONFLICT ("barcode", "retailer_id", "retailer_code")
            DO UPDATE SET
                "was_price" = 
                    CASE 
                        WHEN "RetailerCurrentPricing"."current_price" <> EXCLUDED."current_price" 
                        THEN "RetailerCurrentPricing"."current_price" 
                        ELSE "RetailerCurrentPricing"."was_price" 
                    END,
                "current_price" = EXCLUDED."current_price",
                "retailer_code" = EXCLUDED."retailer_code",
                "per_unit_price" = EXCLUDED."per_unit_price",
                "offer_info" = EXCLUDED."offer_info",
                "promotion_type" = EXCLUDED."promotion_type",
                "product_url" = EXCLUDED."product_url";
            `;

            await db.$executeRawUnsafe(query, ...values);

            return {
                product_id: product.id,
                product_name: product.product_name,
            };
        });

        return {
            product_id,
            product_name,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getProductByBarcode = async (barcode: string) => {
    try {
        return await dbClient.masterProduct.findFirst({
            where: { barcode },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getSubCategoryList = async (categoryID: string) => {
    try {
        const subCategories = await dbClient.category.findMany({
            where: { parent_category_id: categoryID },
            select: { id: true, category_name: true },
        });

        if (subCategories.length > 0) {
            return subCategories;
        }

        const category = await dbClient.category.findUnique({
            where: { id: categoryID },
            select: { parent_category_id: true },
        });

        if (!category) {
            return [];
        }

        return await dbClient.category.findMany({
            where: { parent_category_id: category.parent_category_id },
            select: { id: true, category_name: true },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAllBarcode = async () => {
    try {
        const result = await dbClient.masterProduct.findMany({
            select: { barcode: true },
        });

        return result.map((item) => item.barcode);
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getProducts = async (productIDs: string[]) => {
    try {
        return await dbClient.masterProduct.findMany({
            where: { id: { in: productIDs } },
            select: {
                id: true,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getProductGroupProducts = async (
    page: number,
    limit: number,
    keyword?: string,
    brandIDs?: string[],
    categoryIDs?: string[],
    size?: string,
    barcode?: string,
    min_price?: number,
    max_price?: number,
    group_id?: string,
    metadata?: any,
) => {
    try {
        const skip = (page - 1) * limit;

        const whereCondition: any = {
            AND: [],
        };

        if (keyword) {
            whereCondition.AND.push({
                product_name: {
                    contains: keyword,
                    mode: 'insensitive',
                },
            });
        }

        if (brandIDs && brandIDs.length > 0) {
            whereCondition.AND.push({
                brand_id: { in: brandIDs },
            });
        }

        if (categoryIDs && categoryIDs.length > 0) {
            whereCondition.AND.push({
                category_id: { in: categoryIDs },
            });
        }

        if (barcode) {
            whereCondition.AND.push({
                barcode,
            });
        }

        if (size) {
            whereCondition.AND.push({
                pack_size: {
                    contains: size,
                    mode: 'insensitive',
                },
            });
        }

        if (min_price !== undefined && max_price) {
            whereCondition.AND.push({
                rrp: {
                    gte: min_price,
                    lte: max_price,
                },
            });
        }

        if (group_id) {
            const attachedProducts = await getAttachedProductsByGroupID(
                group_id,
                metadata,
            );

            if (attachedProducts.length > 0) {
                whereCondition.AND.push({
                    id: { notIn: attachedProducts },
                });
            }
        }

        const [productList, totalCount] = await Promise.all([
            dbClient.masterProduct.findMany({
                where: whereCondition,
                select: {
                    id: true,
                    product_name: true,
                    barcode: true,
                    pack_size: true,
                    rrp: true,
                    Brand: { select: { id: true, brand_name: true } },
                    Category: { select: { id: true, category_name: true } },
                },
                skip,
                take: limit,
                orderBy: { product_name: 'asc' },
            }),

            dbClient.masterProduct.count({ where: whereCondition }),
        ]);

        const formattedProducts = productList.map((product) => ({
            product_id: product.id,
            product_name: product.product_name,
            barcode: product.barcode,
            pack_size: product.pack_size,
            rrp: Number(product.rrp),
            brand: {
                id: product.Brand.id,
                name: product.Brand.brand_name,
            },
            category: {
                id: product.Category.id,
                name: product.Category.category_name,
            },
        }));

        return { formattedProducts, totalCount };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateBrandByID = async (
    brandID: string,
    data: prismaClient.Prisma.BrandUpdateInput,
) => {
    try {
        return await dbClient.brand.update({ where: { id: brandID }, data });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getBrandByIDs = async (brandIDs: string[]) => {
    try {
        return await dbClient.brand.findMany({
            where: { id: { in: brandIDs } },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getSupplierByName = async (supplier_name: string) => {
    try {
        return await dbClient.supplier.findFirst({
            where: { supplier_name },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const createSupplier = async (
    data: prismaClient.Prisma.SupplierCreateInput,
) => {
    try {
        return await dbClient.supplier.create({ data });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getSupplierByID = async (supplierID: string) => {
    try {
        return await dbClient.supplier.findUnique({
            where: { id: supplierID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateSupplierByID = async (
    supplierID: string,
    data: prismaClient.Prisma.SupplierUpdateInput,
) => {
    try {
        return await dbClient.supplier.update({
            where: { id: supplierID },
            data,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAllSuppliers = async (
    page?: number,
    limit?: number,
    keyword?: string,
    sort_by_order?: string,
) => {
    try {
        const skip = page && limit ? (page - 1) * limit : 0;
        const sortByOrder = sort_by_order || 'asc';
        const whereCondition: prismaClient.Prisma.SupplierWhereInput = {};

        if (keyword) {
            whereCondition['supplier_name'] = {
                contains: keyword,
                mode: 'insensitive',
            };
        }

        const suppliers = await dbClient.supplier.findMany({
            where: whereCondition,
            select: {
                id: true,
                supplier_name: true,
                brands: {
                    select: {
                        id: true,
                        brand_name: true,
                        private_label: true,
                    },
                },
            },
            skip,
            take: limit || undefined,
            orderBy: { supplier_name: sortByOrder as SortByOrder },
        });

        const totalCount = await dbClient.supplier.count({
            where: whereCondition,
        });

        return { suppliers, totalCount };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getSuggestionDetailByID = async (suggestionID: string) => {
    try {
        return await dbClient.suggestionDetails.findUnique({
            where: { id: suggestionID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateSuggestionDetailByID = async (
    suggestionID: string,
    data: prismaClient.Prisma.suggestionDetailsUpdateInput,
) => {
    try {
        return await dbClient.suggestionDetails.update({
            where: { id: suggestionID },
            data,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

export {
    getProductDetails,
    getAllProducts,
    getCategoryList,
    getSubCategories,
    addBrand,
    addCategory,
    getProductList,
    getPotentialMatchList,
    matchProducts,
    addProductBySuggestionList,
    getProductByID,
    updateProductData,
    getProductListWithRetailerCode,
    getRetailerList,
    getBrandList,
    getAllCategoryList,
    getProductsCount,
    getCountOfNewProducts,
    getCountOfUnmatchedProducts,
    getNewProductList,
    getProductByCategoryCount,
    getProductByRetailerCount,
    addRetailer,
    updateRetailer,
    findRetailer,
    findCategory,
    updateCategory,
    createProduct,
    createRetailerPricing,
    updateProductImage,
    getBrandByID,
    getCategoryByID,
    getRetailersByIDs,
    deleteCategory,
    deleteProduct,
    findProductByID,
    updateProductByID,
    getProductByBarcode,
    getSubCategoryList,
    getAllBarcode,
    getProducts,
    getProductGroupProducts,
    updateBrandByID,
    getBrandByIDs,
    getSupplierByName,
    createSupplier,
    getSupplierByID,
    updateSupplierByID,
    getAllSuppliers,
    getSuggestionDetailByID,
    updateSuggestionDetailByID,
};
