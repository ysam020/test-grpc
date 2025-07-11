import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    CreateProductGroupRequest__Output,
    CreateProductGroupResponse,
    CreateProductGroupResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { createProductGroupType } from '../validations';
import { createGroup, getBrandByIDs } from '../services/model.service';
import { prismaClient } from '@atc/db';

export const createProductGroup = async (
    call: CustomServerUnaryCall<
        CreateProductGroupRequest__Output,
        CreateProductGroupResponse
    >,
    callback: sendUnaryData<CreateProductGroupResponse__Output>,
) => {
    try {
        const { group_name, brand_ids, type } = utilFns.removeEmptyFields(
            call.request,
        ) as createProductGroupType;

        if (brand_ids && brand_ids.length > 0) {
            const brands = await getBrandByIDs(brand_ids);

            if (brands.length !== brand_ids.length) {
                return callback(null, {
                    message: errorMessage.BRAND.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }
        }

        const data: prismaClient.Prisma.ProductGroupCreateInput = {
            group_name,
            brands: {
                connect: brand_ids?.map((id) => ({ id })),
            },
            type,
        };

        const productGroup = await createGroup(data);

        return callback(null, {
            message: responseMessage.PRODUCT_GROUP.CREATED,
            data: {
                id: productGroup.id,
                group_name: productGroup.group_name,
            },
            status: status.OK,
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
