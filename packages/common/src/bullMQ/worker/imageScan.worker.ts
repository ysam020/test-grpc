import { Worker, Job } from 'bullmq';
import { redisConnection, storeS3Queue } from '../queues';
import { imageScan } from '../ai_agent';
import { FileMeta } from './processFiles.worker';
import { logger } from '@atc/logger';
import { ensureBuffer } from '../helper';

export const imageScanWorker = () => {
    new Worker(
        process.env.IMAGE_SCAN_QUEUE!,
        async (
            job: Job<{
                advertisement_id: string;
                image: FileMeta;
                index: number;
            }>,
        ) => {
            try {
                const { advertisement_id, image, index } = job.data;

                const res = await imageScan({
                    imageBuffer: ensureBuffer(image.buffer),
                });

                await storeS3Queue.add(
                    `store:s3:img:${advertisement_id}:${index}`,
                    { advertisement_id, image, index, ai_data: res },
                    {
                        attempts: 2,
                        backoff: { type: 'exponential', delay: 1000 },
                        removeOnComplete: true,
                    },
                );

                return {};
            } catch (error) {
                logger.error(`Failed to scan image: ${error}`);
            }
        },
        {
            connection: redisConnection,
            concurrency: 10,
            removeOnComplete: { count: 1 },
        },
    );
};
