import { logger } from '@atc/logger';
import { userStub } from '../client';

const getUserBasket = async (metadata: any) => {
    try {
        return await new Promise((resolve, reject) => {
            userStub.ViewBasket({}, metadata, (err: any, response: any) => {
                if (err) reject(err);
                else resolve(response);
            });
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

export { getUserBasket };
