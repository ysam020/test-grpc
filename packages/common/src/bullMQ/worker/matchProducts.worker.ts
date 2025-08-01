import { Job, Worker } from 'bullmq';
import { redisConnection } from '../queues';
import { dbClient } from '@atc/db';
import { logger } from '@atc/logger';

const MAX_SUGGESTIONS = 3;

export const matchProductsWorker = () => {
    new Worker(
        process.env.MATCH_PRODUCTS_QUEUE!,
        async (job: Job<{ ad_item_id: string }>) => {
            const { ad_item_id } = job.data;
            try {
                const item = await dbClient.advertisementItem.findUnique({
                    where: { id: ad_item_id },
                    include: {
                        AdvertisementImage: {
                            include: {
                                Advertisement: true,
                            },
                        },
                    },
                });

                if (!item)
                    throw new Error(
                        `AdvertisementItem ${ad_item_id} not found`,
                    );

                const text = item.advertisement_text;

                // Fetch top matching Product Groups
                const groupMatches: {
                    product_group_id: string;
                    similarity: number;
                }[] = await dbClient.$queryRaw`
                        SELECT id AS product_group_id,
                            similarity(group_name, ${text}) AS similarity
                        FROM "ProductGroup"
                        ORDER BY similarity DESC
                        LIMIT ${MAX_SUGGESTIONS};
                    `;

                // Fetch top matching Master Products using fuzzy match + size/unit extraction
                const productMatches: {
                    product_id: string;
                    similarity: number;
                }[] = await dbClient.$queryRaw`
                        SELECT id AS product_id,
                            similarity(product_name, ${text}) AS similarity
                        FROM "MasterProduct"
                        ORDER BY similarity DESC
                        LIMIT ${MAX_SUGGESTIONS};
                    `;

                const brandMatches: {
                    brand_id: string;
                    similarity: number;
                }[] = await dbClient.$queryRaw`
                        SELECT id AS brand_id,
                            similarity(brand_name, ${text}) AS similarity
                        FROM "Brand"
                        ORDER BY similarity DESC
                        LIMIT ${MAX_SUGGESTIONS};
                    `;

                // Store Group Suggestions
                await dbClient.adSuggestedGroup.createMany({
                    data: groupMatches.map((g) => ({
                        ad_item_id,
                        product_group_id: g.product_group_id,
                        match_score: Number(g.similarity.toFixed(2)),
                    })),
                    skipDuplicates: true,
                });

                // Store Product Suggestions
                await dbClient.adSuggestedProduct.createMany({
                    data: productMatches.map((p) => ({
                        ad_item_id,
                        product_id: p.product_id,
                        match_score: Number(p.similarity.toFixed(2)),
                    })),
                    skipDuplicates: true,
                });

                await dbClient.adSuggestedBrand.createMany({
                    data: brandMatches.map((b) => ({
                        ad_item_id,
                        brand_id: b.brand_id,
                        match_score: Number(b.similarity.toFixed(2)),
                    })),
                    skipDuplicates: true,
                });

                logger.info(`Matched product + group for item ${ad_item_id}`);
                return {
                    ad_item_id,
                    groupMatches: groupMatches.length,
                    productMatches: productMatches.length,
                    brandMatches: brandMatches.length,
                };
            } catch (error) {
                logger.error(
                    `Failed to match products for item ${ad_item_id}: ${error}`,
                );
                return { ad_item_id, groupMatches: 0, productMatches: 0 };
            }
        },
        {
            connection: redisConnection,
            concurrency: 5,
            removeOnComplete: { count: 0 },
        },
    );
};
