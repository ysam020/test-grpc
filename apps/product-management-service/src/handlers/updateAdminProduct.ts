import {
    constants,
    errorMessage,
    invalidateCloudFrontCache,
    KeyPrefixEnum,
    putS3Object,
    redisService,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    UpdateAdminProductRequest__Output,
    UpdateAdminProductResponse,
    UpdateAdminProductResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { updateAdminProductType } from '../validations';
import {
    getBrandByID,
    getCategoryByID,
    getProductByBarcode,
    getProductByID,
    getRetailersByIDs,
    updateProductByID,
} from '../services/model-services';

export const updateAdminProduct = async (
    call: CustomServerUnaryCall<
        UpdateAdminProductRequest__Output,
        UpdateAdminProductResponse
    >,
    callback: sendUnaryData<UpdateAdminProductResponse__Output>,
) => {
    try {
        const {
            product_id,
            product_name,
            image,
            mime_type,
            content_length,
            barcode,
            brand_id,
            category_id,
            pack_size,
            retailer_details,
            rrp,
            size,
            unit,
            configuration,
            a2c_size,
        } = utilFns.removeEmptyFields(call.request) as updateAdminProductType;

        const product = await getProductByID(product_id);
        if (!product) {
            return callback(null, {
                data: null,
                message: errorMessage.PRODUCT.PRODUCT_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        if (barcode && product.barcode !== barcode) {
            const existingProduct = await getProductByBarcode(barcode);
            if (existingProduct) {
                return callback(null, {
                    data: null,
                    message: errorMessage.PRODUCT.BARCODE_ALREADY_EXISTS,
                    status: status.ALREADY_EXISTS,
                });
            }

            await redisService.removeMembersFromSet(
                KeyPrefixEnum.BARCODE_LIST,
                [product.barcode],
            );
            await redisService.addMembersToSet(KeyPrefixEnum.BARCODE_LIST, [
                barcode,
            ]);
        }

        if (brand_id) {
            const brand = await getBrandByID(brand_id);
            if (!brand) {
                return callback(null, {
                    data: null,
                    message: errorMessage.PRODUCT.BRAND_NOT_FOUND,
                    status: status.NOT_FOUND,
                });
            }
        }

        if (category_id) {
            const category = await getCategoryByID(category_id);
            if (!category) {
                return callback(null, {
                    data: null,
                    message: errorMessage.PRODUCT.CATEGORY_NOT_FOUND,
                    status: status.NOT_FOUND,
                });
            }
        }

        if (retailer_details && retailer_details.length > 0) {
            const retailerIDs = retailer_details.map(
                (retailer) => retailer.retailer_id,
            );
            const retailers = await getRetailersByIDs(retailerIDs);
            if (retailers.length !== retailerIDs.length) {
                return callback(null, {
                    data: null,
                    message: errorMessage.PRODUCT.RETAILER_NOT_FOUND,
                    status: status.NOT_FOUND,
                });
            }
        }

        if (image) {
            await invalidateCloudFrontCache(
                `${constants.PRODUCT_IMAGE_FOLDER}/${product.id}`,
            );

            await putS3Object(
                constants.PRODUCT_IMAGE_FOLDER,
                image,
                product.id,
                mime_type,
                content_length,
            );
        }

        const result = await updateProductByID({
            product_id,
            product_name,
            barcode: barcode || product.barcode,
            brand_id,
            category_id,
            pack_size,
            retailer_details,
            rrp,
            size,
            unit,
            configuration,
            a2c_size,
        });

        return callback(null, {
            message: errorMessage.PRODUCT.UPDATED,
            status: status.OK,
            data: {
                product_id: result.product_id,
                product_name: result.product_name || '',
            },
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            data: null,
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
