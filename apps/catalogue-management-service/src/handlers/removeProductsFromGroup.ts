import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DefaultResponse,
    DefaultResponse__Output,
    RemoveProductsFromGroupRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getGroupByID,
    removeProductsByGroupID,
} from '../services/model.service';
import { removeProductsFromGroupType } from '../validations';

export const removeProductsFromGroup = async (
    call: CustomServerUnaryCall<
        RemoveProductsFromGroupRequest__Output,
        DefaultResponse
    >,
    callback: sendUnaryData<DefaultResponse__Output>,
) => {
    try {
        const { group_id, product_ids } = utilFns.removeEmptyFields(
            call.request,
        ) as removeProductsFromGroupType;

        const productGroup = await getGroupByID(group_id);
        if (!productGroup) {
            return callback(null, {
                message: errorMessage.PRODUCT_GROUP.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        await removeProductsByGroupID(group_id, product_ids);

        return callback(null, {
            message: responseMessage.PRODUCT_GROUP.PRODUCTS_REMOVED,
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
