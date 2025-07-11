import { Worker, Job } from 'bullmq';
import { imagesToPdf, mergePdf, pdfToImages } from '../helper';
import { imageScanQueue, redisConnection, storeS3Queue } from '../queues';
import { logger } from '@atc/logger';
import { dbClient } from '@atc/db';

export type FileMeta = {
    buffer: Buffer;
    mime_type: string;
    content_length: number;
};

export const processFilesWorker = () => {
    new Worker(
        process.env.PROCESS_FILES_QUEUE!,
        async (
            job: Job<{
                advertisement_id: string;
                files: FileMeta[];
            }>,
        ) => {
            try {
                const { advertisement_id, files } = job.data;

                // Detect input type
                const allPdf = files.every(
                    (f) => f.mime_type === 'application/pdf',
                );
                const allImg = files.every((f) =>
                    f.mime_type.startsWith('image/'),
                );

                console.log({ allPdf, allImg });

                let pdfMeta: FileMeta;
                let imagesMeta: FileMeta[];

                if (allPdf && files.length > 1) {
                    const merged = await mergePdf(files.map((f) => f.buffer));
                    pdfMeta = {
                        buffer: merged,
                        mime_type: 'application/pdf',
                        content_length: merged.byteLength,
                    };

                    const imgs = await pdfToImages(merged);
                    imagesMeta = imgs.map((buf) => ({
                        buffer: buf,
                        mime_type: 'image/jpeg',
                        content_length: buf.byteLength,
                    }));
                } else if (allImg) {
                    // build PDF & keep originals
                    const pdfBuf = await imagesToPdf(
                        files.map((f) => f.buffer),
                    );
                    pdfMeta = {
                        buffer: pdfBuf,
                        mime_type: 'application/pdf',
                        content_length: pdfBuf.byteLength,
                    };
                    imagesMeta = files.map((f) => ({
                        buffer: f.buffer,
                        mime_type: f.mime_type,
                        content_length: f.content_length,
                    }));
                } else {
                    // single multi-page PDF
                    const single = files[0];
                    pdfMeta = {
                        buffer: single!.buffer,
                        mime_type: single!.mime_type,
                        content_length: single!.content_length,
                    };
                    const imgs = await pdfToImages(single!.buffer);
                    imagesMeta = imgs.map((buf) => ({
                        buffer: buf,
                        mime_type: 'image/jpeg',
                        content_length: buf.byteLength,
                    }));
                }

                await dbClient.advertisement.update({
                    where: { id: advertisement_id },
                    data: { total_pages: imagesMeta.length },
                });

                await storeS3Queue.add(
                    `store:s3:pdf:${advertisement_id}`,
                    {
                        advertisement_id,
                        pdf: pdfMeta,
                    },
                    {
                        attempts: 2,
                        backoff: { type: 'exponential', delay: 1000 },
                        removeOnComplete: true,
                    },
                );

                await Promise.all(
                    imagesMeta.map((img, idx) =>
                        imageScanQueue.add(
                            `image:scan:${advertisement_id}:${idx}`,
                            {
                                advertisement_id,
                                image: img,
                                index: idx,
                            },
                            {
                                attempts: 3,
                                backoff: { type: 'exponential', delay: 3000 },
                                removeOnComplete: true,
                            },
                        ),
                    ),
                );

                console.log('Files processed');

                return {};
            } catch (error) {
                logger.error(`Failed to process files: ${error}`);
            }
        },
        {
            connection: redisConnection,
            concurrency: 5,
            removeOnComplete: { count: 0 },
        },
    );
};
