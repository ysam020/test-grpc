import { dbClient, prismaClient } from '@atc/db';
import { Worker, Job } from 'bullmq';
import { putS3Object } from '../../aws/s3-handler';
import { matchProductsQueue, redisConnection } from '../queues';
import { constants } from '../..';
import { logger } from '@atc/logger';
import { ensureBuffer } from '../helper';

export const storeS3Worker = () => {
    new Worker(
        process.env.STORE_S3_QUEUE!,
        async (job: Job<any>) => {
            try {
                const { advertisement_id } = job.data;

                const folder = `${constants.ADVERTISEMENT_IMAGE_FOLDER}/${advertisement_id}`;

                if (job.data.pdf) {
                    const { pdf } = job.data;

                    await putS3Object(
                        folder,
                        ensureBuffer(pdf.buffer),
                        advertisement_id,
                        pdf.mime_type,
                        pdf.content_length,
                    );

                    console.log('PDF stored in S3');

                    return {};
                }

                if (job.data.image && job.data.ai_data) {
                    const { image, index, ai_data } = job.data;

                    const adImg = await dbClient.advertisementImage.create({
                        data: {
                            Advertisement: {
                                connect: { id: advertisement_id },
                            },
                            page_number: index + 1,
                            ai_data: ai_data,
                        },
                    });

                    await putS3Object(
                        `${folder}/images`,
                        ensureBuffer(image.buffer),
                        adImg.id,
                        image.mime_type,
                        image.content_length,
                    );

                    const now = new Date().toISOString();

                    const values = ai_data
                        .map((item: any) => {
                            const price = isNaN(parseFloat(item.price))
                                ? 0.0
                                : parseFloat(item.price);
                            const productName = item.product_name.replace(
                                /'/g,
                                "''",
                            );

                            return `('${adImg.id}', '${productName}', ${price}, ${price}, '${now}', '${now}')`;
                        })
                        .join(',');

                    const insertedItems: { id: string }[] =
                        await dbClient.$queryRawUnsafe(`
                         INSERT INTO "AdvertisementItem"
                         ("ad_image_id", "advertisement_text", "retail_price", "promotional_price", "createdAt", "updatedAt")
                         VALUES ${values}
                         RETURNING id
                     `);

                    await Promise.all(
                        insertedItems.map((item) =>
                            matchProductsQueue.add(
                                `match:${item.id}`,
                                { ad_item_id: item.id },
                                {
                                    attempts: 3,
                                    backoff: {
                                        type: 'exponential',
                                        delay: 3000,
                                    },
                                },
                            ),
                        ),
                    );

                    const advertisement =
                        await dbClient.advertisement.findUnique({
                            where: { id: advertisement_id },
                            include: {
                                _count: {
                                    select: { AdvertisementImage: true },
                                },
                            },
                        });

                    if (
                        advertisement &&
                        advertisement._count.AdvertisementImage ===
                            advertisement.total_pages
                    ) {
                        await dbClient.advertisement.update({
                            where: { id: advertisement_id },
                            data: {
                                advertisement_status:
                                    prismaClient.AdvertisementStatus
                                        .NEEDS_REVIEW,
                            },
                        });
                    }

                    return {};
                }

                console.log('File stored in S3');

                return {};
            } catch (error) {
                logger.error(`Failed to store file in S3: ${error}`);
            }
        },
        {
            connection: redisConnection,
            concurrency: 5,
            removeOnComplete: { count: 1 },
        },
    );
};
