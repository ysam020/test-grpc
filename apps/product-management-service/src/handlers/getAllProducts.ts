import {
    getAllProductsRequest__Output,
    getAllProductsResponse,
    getAllProductsResponse__Output,
    ProductData__Output,
    ProductWithImage__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { errorMessage, responseMessage } from '@atc/common';
import { logger } from '@atc/logger';
import { getAllProducts, getSubCategoryList } from '../services/model-services';
import { CustomServerUnaryCall } from '@atc/grpc-server';

export const getAllProductsHandler = async (
    call: CustomServerUnaryCall<
        getAllProductsRequest__Output,
        getAllProductsResponse
    >,
    callback: sendUnaryData<getAllProductsResponse__Output>,
) => {
    try {
        const {
            product_ids,
            brand_ids,
            promotion_type,
            retailer_ids,
            category_ids,
            sort_by_field,
            sort_by_order,
            page,
            limit,
        } = call.request;

        const userData = call.user;
        let userID;

        if (userData && userData.userID) {
            userID = userData.userID;
        }

        const productIDs = product_ids || [];
        const brandIDs = brand_ids || [];
        const promotionType = promotion_type || '';
        const retailerIDs = retailer_ids || [];
        const categoryIDs = category_ids || [];
        const sortByField = sort_by_field || '';
        const sortByOrder = sort_by_order || 'asc';

        if (
            !productIDs &&
            !brandIDs &&
            !promotionType &&
            !retailerIDs &&
            !categoryIDs &&
            !sortByField &&
            !sortByOrder &&
            !page &&
            !limit
        ) {
            return callback(null, {
                data: null,
                message: errorMessage.PRODUCT.PROVIDE_AT_LEAST_ONE_PARAMETER,
                status: status.CANCELLED,
            });
        }

        const { products, totalCount } = await getAllProducts(
            productIDs,
            brandIDs,
            promotionType,
            retailerIDs,
            categoryIDs,
            userID,
            sortByField,
            sortByOrder,
            page,
            limit,
        );

        if (!products || !products.length) {
            return callback(null, {
                data: null,
                message: errorMessage.PRODUCT.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const productData: ProductData__Output[] = products.map(
            (product: any) => {
                const productWithImage: ProductWithImage__Output = {
                    id: product.id?.toString() || '',
                    product_name:
                        (product.product_name as unknown as string) || '',
                    image_url: (product.image_url as unknown as string) || '',
                    basket_quantity:
                        Math.round(Number(product?.basket_quantity || 0)) || 0,
                    is_in_basket: Boolean(product?.basket_quantity) || false,
                    category_id: product?.category_id?.toString() || '',
                    is_price_alert_active:
                        Boolean(product?.price_alert) || false,
                };

                return {
                    product_data: productWithImage,
                    best_deal: product?.retailerCurrentPricing?.[0] || {},
                    retailer_prices: product?.retailerCurrentPricing || [],
                    recommended_retailer_prices: String(
                        product.recommended_retailer_prices,
                    ),
                };
            },
        );

        const categoryList =
            categoryIDs.length === 1 && categoryIDs[0]
                ? await getSubCategoryList(categoryIDs[0])
                : [];

        return callback(null, {
            data: {
                products: productData,
                total_count: totalCount,
                categories: categoryList,
            },
            message: responseMessage.PRODUCT.SUCCESS,
            status: status.OK,
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
