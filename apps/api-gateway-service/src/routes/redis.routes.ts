import { redisValidation } from '@atc/common';
import { Router } from 'express';
import { clearAllCache, clearCache } from '../controllers/redis.controller';
import { validateData } from '../middlewares/validation.middleware';

const redisRouter = Router();

redisRouter.delete(
    '/',
    validateData(undefined, redisValidation.clearCacheSchema),
    clearCache,
);

redisRouter.delete('/all', clearAllCache);

export { redisRouter };
