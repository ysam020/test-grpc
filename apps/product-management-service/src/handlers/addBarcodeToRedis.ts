import {
    errorMessage,
    KeyPrefixEnum,
    redisService,
    responseMessage,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    AddBarcodeToRedisResponse,
    AddBarcodeToRedisResponse__Output,
    Empty__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getAllBarcode } from '../services/model-services';

export const addBarcodeToRedis = async (
    call: CustomServerUnaryCall<
        Empty__Output,
        AddBarcodeToRedisResponse__Output
    >,
    callback: sendUnaryData<AddBarcodeToRedisResponse>,
) => {
    try {
        const barcodeList = await getAllBarcode();

        if (barcodeList.length > 0) {
            await redisService.addMembersToSet(
                KeyPrefixEnum.BARCODE_LIST,
                barcodeList,
            );
        }

        return callback(null, {
            message: responseMessage.PRODUCT.BARCODE_ADDED,
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
