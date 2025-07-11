import {
    errorMessage,
    utilFns,
    putS3Object,
    constants,
    responseMessage,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    AddProductRequest__Output,
    AddProductResponse,
    AddProductResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { addProductType } from '../validations';
import {
    createProduct,
    createRetailerPricing,
    getBrandByID,
    getCategoryByID,
    getProductByBarcode,
    getRetailersByIDs,
    updateProductImage,
} from '../services/model-services';
import { prismaClient } from '@atc/db';

export const addProduct = async (
    call: CustomServerUnaryCall<AddProductRequest__Output, AddProductResponse>,
    callback: sendUnaryData<AddProductResponse__Output>,
) => {
    try {
        const {
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
        } = utilFns.removeEmptyFields(call.request) as addProductType;

        const existingProduct = await getProductByBarcode(barcode);
        if (existingProduct) {
            return callback(null, {
                data: null,
                message: errorMessage.PRODUCT.BARCODE_ALREADY_EXISTS,
                status: status.ALREADY_EXISTS,
            });
        }

        const brand = await getBrandByID(brand_id);
        if (!brand) {
            return callback(null, {
                data: null,
                message: errorMessage.PRODUCT.BRAND_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const category = await getCategoryByID(category_id);
        if (!category) {
            return callback(null, {
                data: null,
                message: errorMessage.PRODUCT.CATEGORY_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

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

        const product = await createProduct(
            product_name,
            barcode,
            pack_size,
            brand_id,
            category_id,
            rrp,
            size,
            unit,
            a2c_size,
            configuration,
        );

        await putS3Object(
            constants.PRODUCT_IMAGE_FOLDER,
            image,
            product.id,
            mime_type,
            content_length,
        );

        await updateProductImage(
            product.id,
            `${process.env.S3_BUCKET_URL}/${constants.PRODUCT_IMAGE_FOLDER}/${product.id}`,
        );

        const retailerData: prismaClient.Prisma.RetailerCurrentPricingCreateManyInput[] =
            retailer_details.map((retailer) => ({
                product_id: product.id,
                barcode: barcode,
                retailer_id: retailer.retailer_id,
                retailer_code: retailer.retailer_code,
                current_price: retailer.price,
                was_price: retailer.price,
                per_unit_price: retailer.per_unit_price,
                offer_info: retailer.offer_info,
                promotion_type: retailer.promotion_type,
                product_url: retailer.product_url,
            }));

        await createRetailerPricing(retailerData);

        return callback(null, {
            message: responseMessage.PRODUCT.ADDED,
            status: status.OK,
            data: {
                product_id: product.id,
                product_name: product.product_name,
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
