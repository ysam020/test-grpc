import { Queue } from 'bullmq';
import Redis from 'ioredis';

import 'dotenv/config';

class RedisClient {
    private static instance: Redis;

    static getInstance(): Redis {
        if (!RedisClient.instance) {
            RedisClient.instance = new Redis({
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT!),
                password: process.env.REDIS_PASSWORD,
                maxRetriesPerRequest: null,
            });
        }

        return RedisClient.instance;
    }
}

const redisConnection = RedisClient.getInstance();

const processFilesQueue = new Queue(process.env.PROCESS_FILES_QUEUE!, {
    connection: redisConnection,
});

const imageScanQueue = new Queue(process.env.IMAGE_SCAN_QUEUE!, {
    connection: redisConnection,
});

const storeS3Queue = new Queue(process.env.STORE_S3_QUEUE!, {
    connection: redisConnection,
});

const matchProductsQueue = new Queue(process.env.MATCH_PRODUCTS_QUEUE!, {
    connection: redisConnection,
});

export {
    redisConnection,
    processFilesQueue,
    imageScanQueue,
    storeS3Queue,
    matchProductsQueue,
};
