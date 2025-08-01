import {
    deleteProductRequest__Output,
    deleteProductResponse,
    deleteProductResponse__Output,
} from '@atc/proto';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    errorMessage,
    constants,
    deleteS3Object,
    redisService,
    KeyPrefixEnum,
} from '@atc/common';
import { sendUnaryData } from '@grpc/grpc-js';
import { deleteProduct, findProductByID } from '../services/model-services';

export const deleteProductHandler = async (
    call: CustomServerUnaryCall<
        deleteProductRequest__Output,
        deleteProductResponse
    >,
    callback: sendUnaryData<deleteProductResponse__Output>,
) => {
    const { id } = call.request;
    try {
        const product = await findProductByID(id);

        if (!product) {
            return callback(null, {
                message: errorMessage.PRODUCT.PRODUCT_NOT_FOUND,
                status: 404,
            });
        }
        const { message, status } = await deleteProduct(id);

        if (product.image_url) {
            const url = product.image_url;
            const parts = url.split('/');
            const lastPart = parts[parts.length - 1];

            if (lastPart === product.id) {
                await deleteS3Object(constants.PRODUCT_IMAGE_FOLDER, id);
            }
        }

        await redisService.removeMembersFromSet(KeyPrefixEnum.BARCODE_LIST, [
            product.barcode,
        ]);

        return callback(null, {
            message,
            status,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: 500,
        });
    }
};
