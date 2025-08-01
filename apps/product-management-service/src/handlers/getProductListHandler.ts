import {
    getProductListRequest__Output,
    getProductListResponse,
    getProductListResponse__Output,
    ProductListData__Output,
    ProductWithImage__Output,
    RetailerPriceWithDetails__Output,
    ProductBestDeal__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, responseMessage } from '@atc/common';
import { logger } from '@atc/logger';
import { getAllProducts } from '../services/model-services';

export const getProductListHandler = async (
    call: ServerUnaryCall<
        getProductListRequest__Output,
        getProductListResponse
    >,
    callback: sendUnaryData<getProductListResponse__Output>,
) => {
    try {
        const {
            user_id,
            product_ids,
            brand_ids,
            promotion_type,
            retailer_ids,
            category_id,
            sort_by_field,
            sort_by_order,
            page,
            limit,
        } = call.request;

        const userID = user_id || '';
        const productIDs = product_ids || [];
        const brandIDs = brand_ids || [];
        const promotionType = promotion_type || '';
        const retailerIDs = retailer_ids || [];
        const categoryID = category_id || '';
        const sortByField = sort_by_field || '';
        const sortByOrder = sort_by_order || 'asc';

        if (
            !userID &&
            !productIDs &&
            !brandIDs &&
            !promotionType &&
            !retailerIDs &&
            !categoryID &&
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

        const categoryIDs = category_id ? [category_id] : [];

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
                data: {
                    products: [],
                    total_count: 0,
                },
                message: errorMessage.PRODUCT.NOT_FOUND,
                status: status.OK,
            });
        }

        const productData: ProductListData__Output[] = products.map(
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
                    recommended_retailer_prices:
                        product?.recommended_retailer_prices
                            ? parseFloat(
                                  product.recommended_retailer_prices,
                              ).toFixed(2)
                            : '0.00',
                    is_price_alert_enabled:
                        Boolean(product?.price_alert) || false,
                    product_added_to_basket:
                        Boolean(product?.basket_quantity) || false,
                    quantity_in_basket:
                        Math.round(Number(product?.basket_quantity || 0)) || 0,
                };
            },
        );

        return callback(null, {
            data: { products: productData, total_count: totalCount },
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
