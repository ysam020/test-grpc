import { logger } from '@atc/logger';
import Redis from 'ioredis';

class RedisService {
    private static instance: RedisService;

    private static client: Redis;
    private readonly defaultTTL: number;

    private constructor(defaultTTL: number) {
        this.defaultTTL = defaultTTL;
    }

    static getInstance(defaultTTL: number): RedisService {
        if (!RedisService.instance) {
            RedisService.client = new Redis({
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT!),
                password: process.env.REDIS_PASSWORD,
            });

            RedisService.instance = new RedisService(defaultTTL);
        }
        return RedisService.instance;
    }

    async get(key: string) {
        try {
            const data = await RedisService.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async set(key: string, value: string, ttl?: number) {
        try {
            return await RedisService.client.set(
                key,
                value,
                'EX',
                ttl || this.defaultTTL,
            );
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async delete(key: string) {
        try {
            return await RedisService.client.del(key);
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async clearPattern(pattern: string) {
        try {
            const keys = await RedisService.client.keys(pattern);
            if (keys.length > 0) {
                return await RedisService.client.del(...keys);
            }
            return 0;
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async clearAll() {
        try {
            return await RedisService.client.flushall();
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    createKey(key: KeyPrefixEnum, params: Record<string, any>) {
        const processedParams = Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([_, value]) => String(value))
            .filter(Boolean)
            .join(':');

        return `${key}:${processedParams}`;
    }

    async addMembersToSet(key: string, value: string[]) {
        try {
            return await RedisService.client.sadd(key, ...value);
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async isMemberOfSet(key: string, value: string) {
        try {
            const exists = await RedisService.client.sismember(key, value);
            return exists === 1;
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async checkKeyExists(key: string) {
        try {
            return await RedisService.client.exists(key);
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async removeMembersFromSet(key: string, value: string[]) {
        try {
            return await RedisService.client.srem(key, ...value);
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }
}

const redisService = RedisService.getInstance(
    parseInt(process.env.REDIS_TTL!) || 86400, // 24hrs
);

enum KeyPrefixEnum {
    BRAND_LIST = 'BRAND_LIST',
    CATEGORY_LIST = 'CATEGORY_LIST',
    SUB_CATEGORY_LIST = 'SUB_CATEGORY_LIST',
    ALL_CATEGORY_LIST = 'ALL_CATEGORY_LIST',
    RETAILER_LIST = 'RETAILER_LIST',
    BARCODE_LIST = 'BARCODE_LIST',
    PRODUCTS = 'PRODUCTS',
}

export { redisService, KeyPrefixEnum };
