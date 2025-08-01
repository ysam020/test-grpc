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
    AddSupplierResponse,
    AddSupplierResponse__Output,
    UpdateSupplierRequest__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { updateSupplierType } from '../validations';
import {
    getBrandByIDs,
    getSupplierByID,
    getSupplierByName,
    updateSupplierByID,
} from '../services/model-services';
import { prismaClient } from '@atc/db';

export const updateSupplier = async (
    call: ServerUnaryCall<UpdateSupplierRequest__Output, AddSupplierResponse>,
    callback: sendUnaryData<AddSupplierResponse__Output>,
) => {
    try {
        const {
            supplier_id,
            supplier_name,
            brand_ids,
            image,
            mime_type,
            content_length,
        } = utilFns.removeEmptyFields(call.request) as updateSupplierType;
        const updateData: prismaClient.Prisma.SupplierUpdateInput = {};

        let supplier = await getSupplierByID(supplier_id);
        if (!supplier) {
            return callback(null, {
                message: errorMessage.SUPPLIER.NOT_FOUND,
                data: null,
                status: status.NOT_FOUND,
            });
        }

        if (supplier_name && supplier_name !== supplier.supplier_name) {
            const existingSupplier = await getSupplierByName(supplier_name);
            if (existingSupplier) {
                return callback(null, {
                    message: errorMessage.SUPPLIER.ALREADY_EXISTS,
                    data: null,
                    status: status.ALREADY_EXISTS,
                });
            }

            updateData.supplier_name = supplier_name;
        }

        if (brand_ids && brand_ids.length > 0) {
            const brands = await getBrandByIDs(brand_ids);

            if (brands.length !== brand_ids.length) {
                return callback(null, {
                    message: errorMessage.BRAND.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }

            if (
                brands.find(
                    (brand) =>
                        brand.supplier_id && brand.supplier_id !== supplier_id,
                )
            ) {
                return callback(null, {
                    message: errorMessage.SUPPLIER.BRAND_ALREADY_ASSOCIATED,
                    data: null,
                    status: status.ALREADY_EXISTS,
                });
            }

            updateData.brands = {
                set: brand_ids?.map((id) => ({ id })),
            };
        }

        const updatedSupplier = await updateSupplierByID(
            supplier_id,
            updateData,
        );

        if (image) {
            await invalidateCloudFrontCache(
                `${constants.SUPPLIER_IMAGE_FOLDER}/${supplier.id}`,
            );

            await putS3Object(
                constants.SUPPLIER_IMAGE_FOLDER,
                image,
                updatedSupplier.id,
                mime_type,
                content_length,
            );
        }

        return callback(null, {
            message: responseMessage.SUPPLIER.UPDATED,
            status: status.OK,
            data: {
                id: updatedSupplier.id,
                supplier_name: updatedSupplier.supplier_name,
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
