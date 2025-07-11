import {
    addBrandRequest__Output,
    addBrandResponse,
    addBrandResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { addBrand, getSupplierByID } from '../services/model-services';
import { addBrandType } from '../validations';

export const addBrandHandler = async (
    call: ServerUnaryCall<addBrandRequest__Output, addBrandResponse>,
    callback: sendUnaryData<addBrandResponse__Output>,
) => {
    try {
        const {
            brand_name,
            private_label,
            image,
            mime_type,
            content_length,
            supplier_id,
        } = utilFns.removeEmptyFields(call.request) as addBrandType;

        if (supplier_id) {
            const supplier = await getSupplierByID(supplier_id);
            if (!supplier) {
                return callback(null, {
                    message: errorMessage.SUPPLIER.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }
        }

        const { message, insert_status, data } = await addBrand(
            brand_name,
            private_label,
            image,
            mime_type,
            content_length,
            supplier_id,
        );

        return callback(null, {
            message,
            status: insert_status,
            data,
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
