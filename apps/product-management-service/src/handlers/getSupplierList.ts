import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import {
    GetSupplierListRequest__Output,
    GetSupplierListResponse,
    GetSupplierListResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { getSupplierListType } from '../validations';
import { getAllSuppliers } from '../services/model-services';

export const getSupplierList = async (
    call: ServerUnaryCall<
        GetSupplierListRequest__Output,
        GetSupplierListResponse
    >,
    callback: sendUnaryData<GetSupplierListResponse__Output>,
) => {
    try {
        const { page, limit, keyword, sort_by_order } =
            utilFns.removeEmptyFields(call.request) as getSupplierListType;

        const { suppliers, totalCount } = await getAllSuppliers(
            page,
            limit,
            keyword,
            sort_by_order,
        );

        return callback(null, {
            message: responseMessage.SUPPLIER.RETRIEVED,
            status: status.OK,
            data: { suppliers, total_count: totalCount },
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
