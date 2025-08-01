import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    UpdateProductGroupRequest__Output,
    UpdateProductGroupResponse,
    UpdateProductGroupResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { updateProductGroupType } from '../validations';
import {
    getBrandByIDs,
    getGroupByID,
    updateGroup,
} from '../services/model.service';
import { prismaClient } from '@atc/db';

export const updateProductGroup = async (
    call: CustomServerUnaryCall<    
        UpdateProductGroupRequest__Output,
        UpdateProductGroupResponse
    >,
    callback: sendUnaryData<UpdateProductGroupResponse__Output>,
) => {
    try {
        const { group_id, group_name, brand_ids, type } =
            utilFns.removeEmptyFields(call.request) as updateProductGroupType;
        const updateData: prismaClient.Prisma.ProductGroupUpdateInput = {};

        const productGroup = await getGroupByID(group_id);
        if (!productGroup) {
            return callback(null, {
                message: errorMessage.PRODUCT_GROUP.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        if (group_name) {
            updateData.group_name = group_name;
        }
        if (brand_ids) {
            const brands = await getBrandByIDs(brand_ids);
            if (brands.length !== brand_ids.length) {
                return callback(null, {
                    message: errorMessage.BRAND.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }

            updateData.brands = {
                set: brand_ids.map((id) => ({ id })),
            };
        }
        if (type) {
            updateData.type = type;
        }

        const updatedProductGroup = await updateGroup(group_id, updateData);

        return callback(null, {
            message: responseMessage.PRODUCT_GROUP.UPDATED,
            status: status.OK,
            data: updatedProductGroup,
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
