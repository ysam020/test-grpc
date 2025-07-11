import {
    errorMessage,
    KeyPrefixEnum,
    redisService,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    CheckBarcodeExistenceRequest__Output,
    CheckBarcodeExistenceResponse,
    CheckBarcodeExistenceResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { CheckBarcodeExistenceType } from '../validations';
import { getProductByBarcode } from '../services/model-services';

export const checkBarcodeExistence = async (
    call: CustomServerUnaryCall<
        CheckBarcodeExistenceRequest__Output,
        CheckBarcodeExistenceResponse
    >,
    callback: sendUnaryData<CheckBarcodeExistenceResponse__Output>,
) => {
    try {
        const { barcode } = utilFns.removeEmptyFields(
            call.request,
        ) as CheckBarcodeExistenceType;

        const keyExists = await redisService.checkKeyExists(
            KeyPrefixEnum.BARCODE_LIST,
        );

        if (keyExists) {
            const isMember = await redisService.isMemberOfSet(
                KeyPrefixEnum.BARCODE_LIST,
                barcode,
            );
            return callback(null, {
                message: isMember
                    ? responseMessage.PRODUCT.BARCODE_EXISTS
                    : responseMessage.PRODUCT.BARCODE_NOT_EXISTS,
                status: status.OK,
                data: {
                    barcode_exists: isMember,
                },
            });
        }

        const product = await getProductByBarcode(barcode);
        if (product) {
            await redisService.addMembersToSet(KeyPrefixEnum.BARCODE_LIST, [
                product.barcode,
            ]);
        }

        return callback(null, {
            message: product
                ? responseMessage.PRODUCT.BARCODE_EXISTS
                : responseMessage.PRODUCT.BARCODE_NOT_EXISTS,
            status: status.OK,
            data: {
                barcode_exists: Boolean(product),
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
