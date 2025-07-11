import { GetProductByIDsResponse } from '@atc/proto';
import { productStub } from '../client';
import { logger } from '@atc/logger';

const getProductByIDs = async (productIDs: string[], metadata: any) => {
    try {
        const response: GetProductByIDsResponse = await new Promise(
            (resolve, reject) => {
                productStub.getProductByIDs(
                    { product_ids: productIDs },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        return response.product_ids;
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

export { getProductByIDs };
