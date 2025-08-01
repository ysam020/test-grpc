import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    AttachProductToGroupRequest__Output,
    DefaultResponse,
    DefaultResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getProductByIDs } from '../services/client.service';
import {
    createProductGroupProducts,
    getGroupByID,
    removeProductsByGroupID,
} from '../services/model.service';
import { attachProductsToGroupType } from '../validations';

export const attachProductsToGroup = async (
    call: CustomServerUnaryCall<
        AttachProductToGroupRequest__Output,
        DefaultResponse
    >,
    callback: sendUnaryData<DefaultResponse__Output>,
) => {
    try {
        const { group_id, product_ids } = utilFns.removeEmptyFields(
            call.request,
        ) as attachProductsToGroupType;

        const group = await getGroupByID(group_id);
        if (!group) {
            return callback(null, {
                message: errorMessage.PRODUCT_GROUP.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const products = await getProductByIDs(product_ids, call.metadata);
        if (!products || product_ids.length !== products.length) {
            return callback(null, {
                message: errorMessage.PRODUCT.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const existingProducts = group.ProductGroupProduct.map(
            (product) => product.product_id,
        );

        const productsToRemove = existingProducts.filter(
            (product) => !product_ids.includes(product),
        );
        if (productsToRemove.length > 0) {
            await removeProductsByGroupID(group_id, productsToRemove);
        }

        await createProductGroupProducts(group_id, product_ids);

        return callback(null, {
            message: responseMessage.PRODUCT_GROUP.PRODUCTS_ATTACHED,
            status: status.OK,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
