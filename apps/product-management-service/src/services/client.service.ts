import { GetAttachedProductsResponse } from '@atc/proto';
import { logger } from '@atc/logger';
import { catalogueStub } from '../client';

const getAttachedProductsByGroupID = async (groupID: string, metadata: any) => {
    try {
        const response: GetAttachedProductsResponse = await new Promise(
            (resolve, reject) => {
                catalogueStub.GetAttachedProducts(
                    { group_id: groupID },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        return (
            response.data?.products?.map((product) => product.product_id) || []
        );
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

export { getAttachedProductsByGroupID };
