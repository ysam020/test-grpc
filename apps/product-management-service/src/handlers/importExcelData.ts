import { errorMessage, importExcelToDB } from '@atc/common';
import { logger } from '@atc/logger';
import {
    DefaultResponse,
    DefaultResponse__Output,
    ImportExcelDataRequest__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { importExcelDataType } from '../validations';

export const importExcelData = async (
    call: ServerUnaryCall<ImportExcelDataRequest__Output, DefaultResponse>,
    callback: sendUnaryData<DefaultResponse__Output>,
) => {
    try {
        const { file, model } = call.request as importExcelDataType;

        const { status, message } = await importExcelToDB(model, file);

        return callback(null, { message, status });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
