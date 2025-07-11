import {
    updateProductRequest__Output,
    updateProductResponse,
    updateProductResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { getProductByID, updateProductData } from '../services/model-services';
import { updateProductType } from '../validations';

export const updateProductHandler = async (
    call: ServerUnaryCall<updateProductRequest__Output, updateProductResponse>,
    callback: sendUnaryData<updateProductResponse__Output>,
) => {
    try {
        const {
            product_id,
            product_name,
            barcode,
            category_id,
            brand_id,
            pack_size,
            promotion_type,
            size,
            unit,
            configuration,
            a2c_size,
        } = utilFns.removeEmptyFields(call.request) as updateProductType;

        if (!product_id) {
            return callback(null, {
                message: errorMessage.PRODUCT.PRODUCT_ID_REQUIRED,
                status: status.INVALID_ARGUMENT,
            });
        }

        const { message, update_status } = await updateProductData(
            product_id,
            product_name,
            barcode,
            category_id,
            brand_id,
            pack_size,
            promotion_type,
            size,
            unit,
            configuration,
            a2c_size,
        );
        return callback(null, {
            message,
            status: update_status,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
