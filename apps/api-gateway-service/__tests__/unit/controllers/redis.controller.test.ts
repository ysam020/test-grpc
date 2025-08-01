import * as RedisController from '../../../src/controllers/redis.controller';
import { logger } from '@atc/logger';

jest.mock('@atc/common', () => ({
    apiResponse: jest.fn((res, status, data) =>
        res.status(status).json({ success: true, data }),
    ),
    asyncHandler: (fn) => fn,
    RESPONSE_STATUS: {
        SUCCESS: 200,
        INTERNAL_SERVER_ERROR: 500,
    },
    responseMessage: {
        REDIS: {
            CACHE_CLEARED: 'Cache cleared successfully',
        },
    },
    errorMessage: {
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    redisService: {
        clearPattern: jest.fn(),
        clearAll: jest.fn(),
    },
}));

jest.mock('@atc/logger', () => ({
    logger: { error: jest.fn() },
}));

const mockRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('Redis Controller', () => {
    const { redisService } = require('@atc/common');

    afterEach(() => jest.clearAllMocks());

    it('clearCache should call redisService.clearPattern and respond', async () => {
        const res = mockRes();
        const req: any = {
            query: { pattern: 'test:*' },
        };

        redisService.clearPattern.mockResolvedValue(true);

        await RedisController.clearCache(req, res);

        expect(redisService.clearPattern).toHaveBeenCalledWith('test:*');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: { message: 'Cache cleared successfully' },
        });
    });

    it('clearAllCache should call redisService.clearAll and respond', async () => {
        const res = mockRes();
        const req: any = {};

        redisService.clearAll.mockResolvedValue(true);

        await RedisController.clearAllCache(req, res);

        expect(redisService.clearAll).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: { message: 'Cache cleared successfully' },
        });
    });

    it('should handle errors in clearCache', async () => {
        const res = mockRes();
        const req: any = {
            query: { pattern: 'test:*' },
        };

        const error = new Error('Redis error');
        redisService.clearPattern.mockRejectedValue(error);

        await RedisController.clearCache(req, res);

        expect(logger.error).toHaveBeenCalledWith(error);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors in clearAllCache', async () => {
        const res = mockRes();
        const req: any = {};

        const error = new Error('Redis error');
        redisService.clearAll.mockRejectedValue(error);

        await RedisController.clearAllCache(req, res);

        expect(logger.error).toHaveBeenCalledWith(error);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
