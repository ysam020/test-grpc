import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetProductGroupRequest__Output,
    GetProductGroupResponse,
    GetProductGroupResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getGroupByID } from '../services/model.service';

export const getProductGroup = async (
    call: CustomServerUnaryCall<
        GetProductGroupRequest__Output,
        GetProductGroupResponse
    >,
    callback: sendUnaryData<GetProductGroupResponse__Output>,
) => {
    try {
        const { group_id } = utilFns.removeEmptyFields(call.request);

        const productGroup = await getGroupByID(group_id);
        if (!productGroup) {
            return callback(null, {
                message: errorMessage.PRODUCT_GROUP.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        return callback(null, {
            message: responseMessage.PRODUCT_GROUP.RETRIEVED,
            status: status.OK,
            data: {
                id: productGroup.id,
                group_name: productGroup.group_name,
                type: productGroup.type,
                brands: productGroup.brands.map((brand) => ({
                    id: brand.id,
                    name: brand.brand_name,
                })),
            },
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
            data: null,
        });
    }
};
