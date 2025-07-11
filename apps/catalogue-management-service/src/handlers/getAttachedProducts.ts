import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetAttachedProductsRequest__Output,
    GetAttachedProductsResponse,
    GetAttachedProductsResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getGroupByID, getProductsByGroupID } from '../services/model.service';
import { getAttachedProductsType } from '../validations';

export const getAttachedProducts = async (
    call: CustomServerUnaryCall<
        GetAttachedProductsRequest__Output,
        GetAttachedProductsResponse
    >,
    callback: sendUnaryData<GetAttachedProductsResponse__Output>,
) => {
    try {
        const { group_id, page, limit } = utilFns.removeEmptyFields(
            call.request,
        ) as getAttachedProductsType;

        const productGroup = await getGroupByID(group_id);
        if (!productGroup) {
            return callback(null, {
                message: errorMessage.PRODUCT_GROUP.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        const { products, totalCount } = await getProductsByGroupID(
            group_id,
            page,
            limit,
        );

        return callback(null, {
            message: responseMessage.PRODUCT_GROUP.PRODUCTS_RETRIEVED,
            status: status.OK,
            data: {
                group_id: productGroup.id,
                products: products.map((product) => ({
                    product_id: product.product_id,
                    product_name: product.MasterProduct.product_name,
                    barcode: product.MasterProduct.barcode,
                    pack_size: product.MasterProduct.pack_size,
                    rrp: Number(product.MasterProduct.rrp),
                    brand: {
                        id: product.MasterProduct.Brand.id,
                        name: product.MasterProduct.Brand.brand_name,
                    },
                    category: {
                        id: product.MasterProduct.Category.id,
                        name: product.MasterProduct.Category.category_name,
                    },
                })),
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
