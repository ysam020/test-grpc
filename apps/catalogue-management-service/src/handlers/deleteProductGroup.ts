import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DefaultResponse,
    DefaultResponse__Output,
    DeleteProductGroupRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { deleteGroupByID, getGroupByID } from '../services/model.service';

export const deleteProductGroup = async (
    call: CustomServerUnaryCall<
        DeleteProductGroupRequest__Output,
        DefaultResponse
    >,
    callback: sendUnaryData<DefaultResponse__Output>,
) => {
    try {
        const { group_id } = utilFns.removeEmptyFields(call.request);

        const productGroup = await getGroupByID(group_id);
        if (!productGroup) {
            return callback(null, {
                message: errorMessage.PRODUCT_GROUP.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        await deleteGroupByID(group_id);

        return callback(null, {
            message: responseMessage.PRODUCT_GROUP.DELETED,
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
