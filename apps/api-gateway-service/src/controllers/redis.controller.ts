import {
    apiResponse,
    asyncHandler,
    errorMessage,
    redisService,
    redisValidation,
    RESPONSE_STATUS,
    responseMessage,
} from '@atc/common';
import { logger } from '@atc/logger';

export const clearCache = asyncHandler(async (req, res) => {
    try {
        const { pattern } = req.query as redisValidation.clearCacheType;

        await redisService.clearPattern(pattern);

        return apiResponse(res, RESPONSE_STATUS.SUCCESS, {
            message: responseMessage.REDIS.CACHE_CLEARED,
        });
    } catch (error) {
        logger.error(error);
        return apiResponse(res, RESPONSE_STATUS.INTERNAL_SERVER_ERROR, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
        });
    }
});

export const clearAllCache = asyncHandler(async (req, res) => {
    try {
        await redisService.clearAll();

        return apiResponse(res, RESPONSE_STATUS.SUCCESS, {
            message: responseMessage.REDIS.CACHE_CLEARED,
        });
    } catch (error) {
        logger.error(error);
        return apiResponse(res, RESPONSE_STATUS.INTERNAL_SERVER_ERROR, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
        });
    }
});
