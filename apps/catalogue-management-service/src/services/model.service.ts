import { AdItemMatchType, ProductMatch } from '@atc/common';
import { dbClient, prismaClient } from '@atc/db';
import { logger } from '@atc/logger';
import { createAdvertisement } from '../handlers/createAdvertisement';

const createGroup = async (
    data: prismaClient.Prisma.ProductGroupCreateInput,
) => {
    try {
        return await dbClient.productGroup.create({
            data,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getGroupByID = async (groupID: string) => {
    try {
        return await dbClient.productGroup.findUnique({
            where: { id: groupID },
            include: {
                brands: {
                    select: {
                        id: true,
                        brand_name: true,
                    },
                },
                ProductGroupProduct: { select: { product_id: true } },
            },
        });
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

const updateGroup = async (
    groupID: string,
    data: prismaClient.Prisma.ProductGroupUpdateInput,
) => {
    try {
        return await dbClient.productGroup.update({
            where: { id: groupID },
            data,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const createProductGroupProducts = async (
    groupID: string,
    product_ids: string[],
) => {
    try {
        return await dbClient.productGroupProduct.createMany({
            data: product_ids.map((product_id) => ({
                group_id: groupID,
                product_id,
            })),
            skipDuplicates: true,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAllGroups = async (
    page: number,
    limit: number,
    keyword?: string,
    brand_id?: string,
) => {
    try {
        const skip = (page - 1) * limit;
        const whereClause: any = {};

        if (keyword) {
            whereClause['group_name'] = {
                contains: keyword,
                mode: 'insensitive',
            };
        }

        if (brand_id) {
            whereClause['brands'] = {
                some: {
                    id: brand_id,
                },
            };
        }

        const groups = await dbClient.productGroup.findMany({
            where: whereClause,
            include: {
                brands: {
                    select: {
                        id: true,
                        brand_name: true,
                    },
                },
                _count: {
                    select: { ProductGroupProduct: true },
                },
            },
            skip,
            take: limit,
            orderBy: {
                group_name: 'asc',
            },
        });

        const totalCount = await dbClient.productGroup.count({
            where: whereClause,
        });

        return { groups, totalCount };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getProductsByGroupID = async (
    groupID: string,
    page?: number,
    limit?: number,
) => {
    try {
        const skip = page && limit ? (page - 1) * limit : 0;

        const products = await dbClient.productGroupProduct.findMany({
            where: { group_id: groupID },
            include: {
                MasterProduct: {
                    select: {
                        id: true,
                        product_name: true,
                        barcode: true,
                        pack_size: true,
                        rrp: true,
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
                },
            },
            skip,
            take: limit || undefined,
            orderBy: {
                MasterProduct: {
                    product_name: 'asc',
                },
            },
        });

        const totalCount = await dbClient.productGroupProduct.count({
            where: { group_id: groupID },
        });

        return { products, totalCount };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const deleteGroupByID = async (groupID: string) => {
    try {
        return await dbClient.productGroup.delete({
            where: { id: groupID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const removeProductsByGroupID = async (
    groupID: string,
    productIDs: string[],
) => {
    try {
        return await dbClient.productGroupProduct.deleteMany({
            where: {
                group_id: groupID,
                product_id: { in: productIDs },
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getRetailerByID = async (retailerID: string) => {
    try {
        return await dbClient.retailer.findUnique({
            where: { id: retailerID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const addAdvertisement = async (
    data: prismaClient.Prisma.AdvertisementCreateInput,
) => {
    try {
        return await dbClient.advertisement.create({
            data,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAdvertisementByID = async (
    advertisement_id: string,
    page?: number,
) => {
    try {
        const advertisement = await dbClient.advertisement.findUnique({
            where: { id: advertisement_id },
            include: {
                AdvertisementImage: {
                    where: { page_number: page },
                },
                Retailer: {
                    select: {
                        id: true,
                        retailer_name: true,
                    },
                },
            },
        });

        const [matchSummary] = await dbClient.$queryRawUnsafe<
            { total_items: number; matched_items: number }[]
        >(
            `
                SELECT
                COUNT(*) AS total_items,
                COUNT(*) FILTER (WHERE ad.is_matched = true) AS matched_items
                FROM "AdvertisementItem" ad
                JOIN "AdvertisementImage" adimg ON adimg.id = ad.ad_image_id
                WHERE adimg.advertisement_id = $1::uuid
            `,
            advertisement_id,
        );

        return { advertisement, matchSummary };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getDetailedAdvertisementByID = async (
    advertisement_id: string,
    page?: number,
) => {
    try {
        const rows = await dbClient.$queryRawUnsafe<any[]>(
            `
                SELECT
                    adv.id AS advertisement_id,
                    adv.title,
                    adv.advertisement_type,
                    adv.start_date,
                    adv.end_date,
                    adv.keyword,
                    adv.advertisement_status,
                    r.id AS retailer_id,
                    r.retailer_name,

                    ai.id AS image_id,
                    ai.page_number,

                    aitem.id AS ad_item_id,
                    aitem.advertisement_text,
                    aitem.retail_price AS ad_item_retail_price,
                    aitem.promotional_price AS ad_item_promo_price,
                    aitem.is_matched AS ad_item_is_matched,

                    -- Products
                    sp.id AS sp_id,
                    sp.match_score AS sp_match_score,
                    sp.is_matched AS sp_is_matched,
                    mp.id AS mp_id,
                    mp.product_name,

                    -- Groups
                    sgroup.id AS sgroup_id,
                    sgroup.match_score AS group_match_score,
                    sgroup.is_matched AS group_is_matched,
                    grp.group_name,
                    best_prod.product_id AS grp_best_product_id,
                    best_prod.product_name AS grp_best_product_name,
                    grp_ph.rrp AS grp_rrp,
                    grp_ph.current_price AS grp_current_price,

                    -- Brands
                    sbrand.id AS sbrand_id,
                    sbrand.match_score AS brand_match_score,
                    sbrand.is_matched AS brand_is_matched,
                    br.brand_name,

                    -- Price for individual suggested product
                    ph.rrp AS price_history_rrp,
                    ph.current_price AS price_history_current_price

                FROM "Advertisement" adv
                JOIN "Retailer" r ON r.id = adv.retailer_id
                JOIN "AdvertisementImage" ai ON ai.advertisement_id = adv.id
                JOIN "AdvertisementItem" aitem ON aitem.ad_image_id = ai.id

                -- Suggested products
                LEFT JOIN "AdSuggestedProduct" sp ON sp.ad_item_id = aitem.id
                LEFT JOIN "MasterProduct" mp ON mp.id = sp.product_id

                -- Suggested groups
                LEFT JOIN "AdSuggestedGroup" sgroup ON sgroup.ad_item_id = aitem.id
                LEFT JOIN "ProductGroup" grp ON grp.id = sgroup.product_group_id

                -- Best product in that group
                LEFT JOIN LATERAL (
                    SELECT pgp.product_id, mp_inner.product_name
                    FROM "ProductGroupProduct" pgp
                    JOIN "MasterProduct" mp_inner ON mp_inner.id = pgp.product_id
                    WHERE pgp.group_id = grp.id
                    ORDER BY similarity(mp_inner.product_name, aitem.advertisement_text) DESC
                    LIMIT 1
                ) best_prod ON true

                -- Pricing for that best group product
                LEFT JOIN LATERAL (
                    SELECT ph.*
                    FROM "RetailerCurrentPricing" rcp
                    JOIN "PriceHistory" ph ON ph.retailer_current_pricing_id = rcp.id
                    WHERE rcp.product_id = best_prod.product_id
                    AND rcp.retailer_id = adv.retailer_id
                    AND ph.date BETWEEN adv.start_date AND adv.end_date
                    ORDER BY ph.date ASC
                    LIMIT 1
                ) grp_ph ON true

                -- Suggested brands
                LEFT JOIN "AdSuggestedBrand" sbrand ON sbrand.ad_item_id = aitem.id
                LEFT JOIN "Brand" br ON br.id = sbrand.brand_id

                -- Pricing for individual suggested product
                LEFT JOIN LATERAL (
                    SELECT ph.*
                    FROM "RetailerCurrentPricing" rcp
                    JOIN "PriceHistory" ph ON ph.retailer_current_pricing_id = rcp.id
                    WHERE rcp.product_id = mp.id
                    AND rcp.retailer_id = adv.retailer_id
                    AND ph.date BETWEEN adv.start_date AND adv.end_date
                    ORDER BY ph.date ASC
                    LIMIT 1
                ) ph ON true

                WHERE adv.id = $1::uuid
                    ${page ? 'AND ai.page_number = $2' : ''}
                ORDER BY aitem.advertisement_text ASC
                `,
            ...(page ? [advertisement_id, page] : [advertisement_id]),
        );

        if (!rows.length) return null;

        const base = rows[0];
        const itemsMap = new Map<string, any>();

        for (const row of rows) {
            if (!itemsMap.has(row.ad_item_id)) {
                itemsMap.set(row.ad_item_id, {
                    id: row.ad_item_id,
                    advertisement_text: row.advertisement_text,
                    retail_price: Number(row.ad_item_retail_price || 0),
                    promotional_price: Number(row.ad_item_promo_price || 0),
                    is_matched: row.ad_item_is_matched,
                    promotional_matches: [],
                    brand_matches: [],
                    product_matches: [],
                });
            }

            const item = itemsMap.get(row.ad_item_id);

            // Product matches
            if (
                row.sp_id &&
                !item.product_matches.find((p: any) => p.id === row.sp_id)
            ) {
                item.product_matches.push({
                    id: row.sp_id,
                    product_name: row.product_name,
                    retail_price: Number(row.price_history_rrp || 0),
                    promotional_price: Number(
                        row.price_history_current_price || 0,
                    ),
                    match_percentage: Math.round(
                        Number(row.sp_match_score || 0) * 100,
                    ),
                    is_matched: row.sp_is_matched,
                    type: AdItemMatchType.PRODUCT,
                });
            }

            // Promotional (group) matches
            if (
                row.sgroup_id &&
                !item.promotional_matches.find(
                    (g: any) => g.id === row.sgroup_id,
                )
            ) {
                item.promotional_matches.push({
                    id: row.sgroup_id,
                    group_name: row.group_name,
                    retail_price: Number(row.grp_rrp || 0),
                    promotional_price: Number(row.grp_current_price || 0),
                    match_percentage: Math.round(
                        Number(row.group_match_score || 0) * 100,
                    ),
                    is_matched: row.group_is_matched,
                    type: AdItemMatchType.PRODUCT_GROUP,
                });
            }

            // Brand matches
            if (
                row.sbrand_id &&
                !item.brand_matches.find((b: any) => b.id === row.sbrand_id)
            ) {
                item.brand_matches.push({
                    id: row.sbrand_id,
                    brand_name: row.brand_name,
                    match_percentage: Math.round(
                        Number(row.brand_match_score || 0) * 100,
                    ),
                    is_matched: row.brand_is_matched,
                    type: AdItemMatchType.BRAND,
                });
            }
        }

        // Sort and finalize
        const sortedItems = Array.from(itemsMap.values()).sort((a, b) =>
            a.advertisement_text.localeCompare(b.advertisement_text),
        );

        sortedItems.forEach((item: any) => {
            item.product_matches.sort(
                (a: any, b: any) =>
                    b.match_percentage - a.match_percentage ||
                    a.product_name.localeCompare(b.product_name),
            );
            item.promotional_matches.sort(
                (a: any, b: any) =>
                    b.match_percentage - a.match_percentage ||
                    a.group_name.localeCompare(b.group_name),
            );
            item.brand_matches.sort(
                (a: any, b: any) =>
                    b.match_percentage - a.match_percentage ||
                    a.brand_name.localeCompare(b.brand_name),
            );
        });

        const totalPages = await dbClient.advertisementImage.count({
            where: { advertisement_id },
        });

        const [matchSummary] = await dbClient.$queryRawUnsafe<
            { total_items: number; matched_items: number }[]
        >(
            `
            SELECT
                COUNT(*) AS total_items,
                COUNT(*) FILTER (WHERE ad.is_matched) AS matched_items
            FROM "AdvertisementItem" ad
            JOIN "AdvertisementImage" ai ON ai.id = ad.ad_image_id
            WHERE ai.advertisement_id = $1::uuid
            `,
            advertisement_id,
        );

        return {
            mappedAdvertisement: {
                advertisement_details: {
                    id: base.advertisement_id,
                    title: base.title,
                    retailer: {
                        id: base.retailer_id,
                        name: base.retailer_name,
                    },
                    advertisement_type: base.advertisement_type,
                    start_date: base.start_date.toISOString(),
                    end_date: base.end_date.toISOString(),
                    keyword: base.keyword || '',
                    status: base.advertisement_status,
                },
                image: base.image_id,
                promotional_groups: sortedItems,
                total_count: totalPages,
                total_matches: Number(matchSummary?.total_items ?? 0),
                matched_items: Number(matchSummary?.matched_items ?? 0),
            },
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const deleteAdvertisementByID = async (advertisement_id: string) => {
    try {
        return await dbClient.advertisement.delete({
            where: { id: advertisement_id },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAllAdvertisements = async (
    page?: number,
    limit?: number,
    retailer_id?: string,
    advertisement_type?: prismaClient.AdvertisementType,
    year?: number,
    month?: number,
    product_match?: ProductMatch,
    keyword?: string,
) => {
    try {
        const skip = page && limit ? (page - 1) * limit : 0;
        const whereConditions: prismaClient.Prisma.AdvertisementWhereInput = {};

        if (retailer_id) {
            whereConditions.retailer_id = retailer_id;
        }

        if (advertisement_type) {
            whereConditions.advertisement_type = advertisement_type;
        }

        if (year && month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 1);
            whereConditions.createdAt = { gte: startDate, lt: endDate };
        } else if (year) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year + 1, 0, 1);
            whereConditions.createdAt = { gte: startDate, lt: endDate };
        } else if (month) {
            const currYear = new Date().getFullYear();
            const startDate = new Date(currYear, month - 1, 1);
            const endDate = new Date(currYear, month, 1);
            whereConditions.createdAt = { gte: startDate, lt: endDate };
        }

        if (keyword) {
            whereConditions.title = {
                contains: keyword,
                mode: 'insensitive',
            };
        }

        switch (product_match) {
            case ProductMatch.MATCHED:
                whereConditions.match_percentage = 100;
                break;
            case ProductMatch.NOT_MATCHED:
                whereConditions.match_percentage = 0;
                break;
            case ProductMatch.IN_PROGRESS:
                whereConditions.match_percentage = { gt: 0, lt: 100 };
                break;
        }

        const advertisements = await dbClient.advertisement.findMany({
            where: whereConditions,
            include: {
                Retailer: {
                    select: {
                        id: true,
                        retailer_name: true,
                    },
                },
                AdvertisementImage: {
                    where: { page_number: 1 },
                    select: { id: true },
                },
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
        });

        const totalCount = await dbClient.advertisement.count({
            where: whereConditions,
        });

        return { advertisements, totalCount };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateAdvertisementByID = async (
    advertisement_id: string,
    data: prismaClient.Prisma.AdvertisementUpdateInput,
) => {
    try {
        return await dbClient.advertisement.update({
            where: { id: advertisement_id },
            data,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAdvertisementItemByID = async (ad_item_id: string) => {
    try {
        return await dbClient.advertisementItem.findUnique({
            where: { id: ad_item_id },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateAdvertisementItemByID = async (
    ad_item_id: string,
    data: prismaClient.Prisma.AdvertisementItemUpdateInput,
) => {
    try {
        return await dbClient.advertisementItem.update({
            where: { id: ad_item_id },
            data,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAdImageByID = async (ad_image_id: string) => {
    try {
        return await dbClient.advertisementImage.findUnique({
            where: { id: ad_image_id },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const createAdvertisementItem = async (
    data: prismaClient.Prisma.AdvertisementItemCreateInput,
) => {
    try {
        return await dbClient.advertisementItem.create({
            data,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAdSuggestedProductByID = async (id: string) => {
    try {
        return await dbClient.adSuggestedProduct.findUnique({
            where: { id },
            include: {
                MasterProduct: {
                    select: {
                        id: true,
                        product_name: true,
                    },
                },
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAdSuggestedGroupByID = async (id: string) => {
    try {
        return await dbClient.adSuggestedGroup.findUnique({
            where: { id },
            include: {
                ProductGroup: {
                    select: {
                        id: true,
                        group_name: true,
                    },
                },
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAdSuggestedBrandByID = async (id: string) => {
    try {
        return await dbClient.adSuggestedBrand.findUnique({
            where: { id },
            include: {
                Brand: {
                    select: {
                        id: true,
                        brand_name: true,
                    },
                },
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateAdSuggestedProductByID = async (
    id: string,
    data: prismaClient.Prisma.AdSuggestedProductUpdateInput,
) => {
    try {
        return await dbClient.adSuggestedProduct.update({
            where: { id },
            data,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateAdSuggestedGroupByID = async (
    id: string,
    data: prismaClient.Prisma.AdSuggestedGroupUpdateInput,
) => {
    try {
        return await dbClient.adSuggestedGroup.update({
            where: { id },
            data,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateAdSuggestedBrandByID = async (
    id: string,
    data: prismaClient.Prisma.AdSuggestedBrandUpdateInput,
) => {
    try {
        return await dbClient.adSuggestedBrand.update({
            where: { id },
            data,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const setIsMatchedToFalse = async (ad_item_id: string) => {
    try {
        await dbClient.$transaction([
            dbClient.advertisementItem.update({
                where: { id: ad_item_id },
                data: {
                    is_matched: false,
                    MasterProduct: { disconnect: true },
                    ProductGroup: { disconnect: true },
                    Brand: { disconnect: true },
                },
            }),
            dbClient.adSuggestedProduct.updateMany({
                where: { ad_item_id },
                data: { is_matched: false },
            }),
            dbClient.adSuggestedGroup.updateMany({
                where: { ad_item_id },
                data: { is_matched: false },
            }),
            dbClient.adSuggestedBrand.updateMany({
                where: { ad_item_id },
                data: { is_matched: false },
            }),
        ]);
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

export {
    createGroup,
    getGroupByID,
    getBrandByIDs,
    updateGroup,
    createProductGroupProducts,
    getAllGroups,
    getProductsByGroupID,
    deleteGroupByID,
    removeProductsByGroupID,
    getRetailerByID,
    addAdvertisement,
    getAdvertisementByID,
    getDetailedAdvertisementByID,
    deleteAdvertisementByID,
    getAllAdvertisements,
    updateAdvertisementByID,
    getAdvertisementItemByID,
    updateAdvertisementItemByID,
    getAdImageByID,
    createAdvertisementItem,
    getAdSuggestedProductByID,
    getAdSuggestedGroupByID,
    getAdSuggestedBrandByID,
    updateAdSuggestedProductByID,
    updateAdSuggestedGroupByID,
    updateAdSuggestedBrandByID,
    setIsMatchedToFalse,
};
