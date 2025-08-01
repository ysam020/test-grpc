import { errorMessage } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    addProductBySuggestionListRequest__Output,
    addProductBySuggestionListResponse,
    addProductBySuggestionListResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { addProductBySuggestionList } from '../services/model-services';
import { prismaClient } from '@atc/db';

export const addProductBySuggestionListHandler = async (
    call: CustomServerUnaryCall<
        addProductBySuggestionListRequest__Output,
        addProductBySuggestionListResponse
    >,
    callback: sendUnaryData<addProductBySuggestionListResponse__Output>,
) => {
    try {
        const {
            product_id,
            product_name,
            barcode,
            retailer_id,
            category_id,
            brand_name,
            pack_size,
            image_url,
            retailer_code,
            price,
            per_unit_price,
            offer_info,
            promotion_type,
            product_url,
            rrp,
            image,
            mime_type,
            content_length,
            size,
            unit,
            configuration,
            a2c_size,
        } = call.request;

        if (
            !product_id ||
            !product_name ||
            !barcode ||
            !retailer_id ||
            !category_id ||
            !brand_name ||
            !price ||
            !pack_size
        ) {
            return callback(null, {
                message: errorMessage.PRODUCT.PROVIDE_VALID_PARAMETER_VALUE,
                status: status.CANCELLED,
            });
        }

        let validatedPromoType: keyof typeof prismaClient.PromotionTypeEnum =
            prismaClient.PromotionTypeEnum.RETAILER;
        if (
            promotion_type &&
            Object.values(prismaClient.PromotionTypeEnum).includes(
                promotion_type as prismaClient.PromotionTypeEnum,
            )
        ) {
            validatedPromoType =
                promotion_type as prismaClient.PromotionTypeEnum;
        }

        const { message, insertion_status } = await addProductBySuggestionList(
            product_id,
            product_name,
            barcode,
            retailer_id,
            category_id,
            brand_name,
            pack_size,
            image_url,
            retailer_code,
            price,
            per_unit_price,
            offer_info,
            validatedPromoType,
            product_url,
            rrp,
            size,
            unit as prismaClient.UnitEnum,
            a2c_size,
            configuration,
            image,
            mime_type,
            content_length,
        );

        return callback(null, {
            message,
            status: insertion_status,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
