import {
    ProductDetailsRequest__Output,
    ProductDetailsResponse,
    ProductDetailsResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { errorMessage, responseMessage } from '@atc/common';
import { logger } from '@atc/logger';
import { getProductDetails } from '../services/model-services';
import { CustomServerUnaryCall } from '@atc/grpc-server';

export const productDetails = async (
    call: CustomServerUnaryCall<
        ProductDetailsRequest__Output,
        ProductDetailsResponse
    >,
    callback: sendUnaryData<ProductDetailsResponse__Output>,
) => {
    try {
        const { id, barcode } = call.request;

        const userData = call.user;
        let userID;

        if (userData && userData.userID) {
            userID = userData.userID;
        }

        if (!id && !barcode) {
            return callback(null, {
                data: null,
                message: errorMessage.PRODUCT.ID_OR_BARCODE_REQUIRED,
                status: status.CANCELLED,
            });
        }

        const identifier = id || barcode;
        const isID = Boolean(id);

        const productDetails = await getProductDetails(
            identifier,
            isID,
            userID,
        );

        if (!productDetails) {
            return callback(null, {
                data: null,
                message: errorMessage.PRODUCT.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const rrp = Number(productDetails.rrp);

        if (productDetails.retailerCurrentPricing?.length) {
            const retailerPricing = productDetails.retailerCurrentPricing;

            const bestDeal = retailerPricing[0]?.Retailer
                ? {
                      retailer_id: retailerPricing[0].Retailer.id || '',
                      retailer_name:
                          retailerPricing[0].Retailer.retailer_name || '',
                      retailer_price:
                          parseFloat(
                              retailerPricing[0].current_price?.toString(),
                          ).toFixed(2) || '0.00',
                      saving_percentage:
                          rrp && retailerPricing[0].current_price
                              ? Math.ceil(
                                    ((rrp -
                                        Number(
                                            retailerPricing[0].current_price,
                                        )) *
                                        100) /
                                        rrp,
                                ).toString() + '%'
                              : '0%',
                      per_unit_price:
                          retailerPricing[0].per_unit_price?.toString() || '',
                      retailer_site_url:
                          retailerPricing[0].Retailer.site_url || '',
                      product_url: retailerPricing[0].product_url || '',
                  }
                : {
                      retailer_id: '',
                      retailer_name: '',
                      retailer_price: '0.00',
                      saving_percentage: '0',
                      per_unit_price: '',
                      retailer_site_url: '',
                      product_url: '',
                  };

            const retailerPrices = retailerPricing.map((rcp) => ({
                retailer_id: rcp.Retailer?.id || '',
                retailer_name: rcp.Retailer?.retailer_name || '',
                retailer_price: rcp?.current_price
                    ? parseFloat(rcp.current_price.toString()).toFixed(2)
                    : '0.00',
                saving_percentage:
                    rcp?.current_price && rrp
                        ? Math.ceil(
                              ((rrp - Number(rcp.current_price)) * 100) / rrp,
                          ).toString() + '%'
                        : '0%',
                per_unit_price: rcp.per_unit_price?.toString() || '',
                retailer_site_url: rcp.Retailer?.site_url || '',
                product_url: rcp.product_url || '',
                retailer_code: rcp.retailer_code,
                offer_info: rcp.offer_info || '',
                promotion_type: rcp.promotion_type,
            }));

            return callback(null, {
                data: {
                    product_data: {
                        id: productDetails.id,
                        product_name: productDetails.product_name,
                        image_url: productDetails.image_url || '',
                        basket_quantity:
                            productDetails?.BasketItem?.[0]?.quantity ?? 0,
                        is_in_basket:
                            Boolean(productDetails?.BasketItem?.length) ||
                            false,
                        is_price_alert_active:
                            Boolean(productDetails?.PriceAlert?.length) ||
                            false,
                        category_id: productDetails.category_id,
                        category_name: productDetails.Category.category_name,
                        pack_size: productDetails.pack_size,
                        barcode: productDetails.barcode,
                        brand_id: productDetails.brand_id,
                        brand_name: productDetails.Brand.brand_name,
                        private_label: productDetails.Brand.private_label,
                        size: Number(productDetails.size) || 0,
                        unit: productDetails.unit || '',
                        configuration: productDetails.configuration || '',
                        a2c_size: productDetails.a2c_size || '',
                    },
                    best_deal: bestDeal,
                    retailer_prices: retailerPrices,
                    recommended_retailer_prices:
                        parseFloat(
                            (productDetails.rrp || 0)?.toString(),
                        ).toFixed(2) || '0.00',
                },
                message: responseMessage.PRODUCT.SUCCESS,
                status: status.OK,
            });
        }

        return callback(null, {
            data: {
                product_data: {
                    id: productDetails.id,
                    product_name: productDetails.product_name,
                    image_url: productDetails.image_url || '',
                    basket_quantity: 0,
                    is_in_basket: false,
                    is_price_alert_active: false,
                    category_id: productDetails.category_id,
                    category_name: productDetails.Category.category_name,
                    pack_size: productDetails.pack_size,
                    barcode: productDetails.barcode,
                    brand_id: productDetails.brand_id,
                    brand_name: productDetails.Brand.brand_name,
                    private_label: productDetails.Brand.private_label,
                    size: Number(productDetails.size) || 0,
                    unit: productDetails.unit || '',
                    configuration: productDetails.configuration || '',
                    a2c_size: productDetails.a2c_size || '',
                },
                best_deal: null,
                retailer_prices: [],
                recommended_retailer_prices: '0.00',
            },
            message: errorMessage.PRODUCT.NO_PRICING_DATA,
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
