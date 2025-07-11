import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetProductsForProductGroupRequest__Output,
    GetProductsForProductGroupResponse,
    GetProductsForProductGroupResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getProductsForProductGroupType } from '../validations';
import { getProductGroupProducts } from '../services/model-services';

export const getProductsForProductGroup = async (
    call: CustomServerUnaryCall<
        GetProductsForProductGroupRequest__Output,
        GetProductsForProductGroupResponse
    >,
    callback: sendUnaryData<GetProductsForProductGroupResponse__Output>,
) => {
    try {
        const {
            page,
            limit,
            keyword,
            brand_ids,
            category_ids,
            barcode,
            size,
            min_price,
            max_price,
            group_id,
        } = utilFns.removeEmptyFields(
            call.request,
        ) as getProductsForProductGroupType;

        const { formattedProducts, totalCount } = await getProductGroupProducts(
            page,
            limit,
            keyword,
            brand_ids,
            category_ids,
            size,
            barcode,
            min_price,
            max_price,
            group_id,
            call.metadata,
        );

        return callback(null, {
            message: responseMessage.PRODUCT_GROUP.PRODUCTS_RETRIEVED,
            status: status.OK,
            data: {
                products: formattedProducts,
                total_count: totalCount,
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
