import {
    addBrandResponse,
    addBrandResponse__Output,
    UpdateBrandRequest__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { updateBrandType } from '../validations';
import {
    constants,
    errorMessage,
    invalidateCloudFrontCache,
    putS3Object,
    responseMessage,
    utilFns,
} from '@atc/common';
import { logger } from '@atc/logger';
import {
    getBrandByID,
    getSupplierByID,
    updateBrandByID,
} from '../services/model-services';
import { prismaClient } from '@atc/db';

export const updateBrandHandler = async (
    call: ServerUnaryCall<UpdateBrandRequest__Output, addBrandResponse>,
    callback: sendUnaryData<addBrandResponse__Output>,
) => {
    try {
        const {
            brand_id,
            brand_name,
            private_label,
            image,
            mime_type,
            content_length,
            supplier_id,
        } = utilFns.removeEmptyFields(call.request) as updateBrandType;

        const updateData: prismaClient.Prisma.BrandUpdateInput = {};

        if (supplier_id) {
            const supplier = await getSupplierByID(supplier_id);
            if (!supplier) {
                return callback(null, {
                    message: errorMessage.SUPPLIER.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }
            updateData.Supplier = {
                connect: {
                    id: supplier_id,
                },
            };
        } else {
            updateData.Supplier = {
                disconnect: true,
            };
        }

        const brand = await getBrandByID(brand_id);
        if (!brand) {
            return callback(null, {
                message: errorMessage.PRODUCT.BRAND_NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        if (brand_name) {
            updateData.brand_name = brand_name;
        }
        if (private_label !== undefined) {
            updateData.private_label = private_label;
        }

        const result = await updateBrandByID(brand_id, updateData);

        if (image) {
            await invalidateCloudFrontCache(
                `${constants.BRAND_IMAGE_FOLDER}/${brand_id}`,
            );

            await putS3Object(
                constants.BRAND_IMAGE_FOLDER,
                image,
                brand_id,
                mime_type,
                content_length,
            );
        }

        return callback(null, {
            message: responseMessage.PRODUCT.BRAND_UPDATED,
            status: status.OK,
            data: result,
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
