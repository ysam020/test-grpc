import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetPriceAlertsRequest__Output,
    GetPriceAlertsResponse,
    GetPriceAlertsResponse__Output,
    ViewBasketResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getPriceAlertsByUserID } from '../services/model.service';
import { getUserBasket } from '../services/client.service';

export const getPriceAlerts = async (
    call: CustomServerUnaryCall<
        GetPriceAlertsRequest__Output,
        GetPriceAlertsResponse
    >,
    callback: sendUnaryData<GetPriceAlertsResponse__Output>,
) => {
    try {
        const { userID } = call.user;
        const { page, limit } = utilFns.removeEmptyFields(call.request);

        const { priceAlerts, total } = await getPriceAlertsByUserID(
            userID,
            page,
            limit,
        );

        const basket = (await getUserBasket(
            call.metadata,
        )) as ViewBasketResponse__Output;
        const basketItems = basket.data?.basket_item || [];

        const priceAlertsData = priceAlerts.map((item) => {
            const retailerPricing = item.MasterProduct.retailerCurrentPricing;
            const rrp = Number(item.MasterProduct.rrp);

            const retailerPrices = retailerPricing
                .map((rcp) => ({
                    retailer_id: rcp.Retailer?.id || '',
                    retailer_name: rcp.Retailer?.retailer_name || '',
                    retailer_price: rcp?.current_price
                        ? parseFloat(rcp.current_price.toString()).toFixed(2)
                        : '0.00',
                    saving_percentage:
                        rcp?.current_price && rrp
                            ? Math.ceil(
                                  ((rrp - Number(rcp.current_price)) * 100) /
                                      rrp,
                              ).toString() + '%'
                            : '0%',
                    per_unit_price: rcp.per_unit_price?.toString() || '',
                    retailer_site_url: rcp.Retailer?.site_url || '',
                    product_url: rcp.product_url || '',
                }))
                .sort(
                    (a, b) =>
                        Number(a.retailer_price) - Number(b.retailer_price),
                );

            const bestDeal = retailerPrices[0]
                ? {
                      retailer_id: retailerPrices[0].retailer_id || '',
                      retailer_name: retailerPrices[0].retailer_name || '',
                      retailer_price:
                          retailerPrices[0].retailer_price || '0.00',
                      saving_percentage:
                          retailerPrices[0].saving_percentage || '0%',
                      per_unit_price:
                          retailerPrices[0].per_unit_price?.toString() || '',
                      product_url: retailerPrices[0].product_url || '',
                  }
                : {
                      retailer_id: '',
                      retailer_name: '',
                      retailer_price: '0.00',
                      saving_percentage: '0%',
                      per_unit_price: '',
                      product_url: '',
                  };

            const basketItem = basketItems.find(
                (basketItem) => basketItem.product_data?.id === item.product_id,
            );

            const productDetail = {
                retailer_prices: retailerPrices,
                product_data: {
                    id: item.product_id,
                    product_name: item.MasterProduct.product_name,
                    image_url: item.MasterProduct.image_url || '',
                    basket_quantity:
                        basketItem?.product_data?.basket_quantity ?? 0,
                    is_in_basket: basketItem ? true : false,
                    is_price_alert_active: true,
                    category_id: item.MasterProduct.category_id || '',
                },
                best_deal: bestDeal,
                recommended_retailer_prices:
                    parseFloat(
                        (item.MasterProduct.rrp || 0)?.toString(),
                    ).toFixed(2) || '0.00',
            };

            return {
                price_alert_id: item.id,
                user_id: item.user_id,
                product_detail: productDetail,
                target_price: Number(item.target_price),
                createdAt: item.createdAt.toISOString(),
                updatedAt: item.updatedAt.toISOString(),
            };
        });

        return callback(null, {
            message: responseMessage.PRICE_ALERT.RETRIEVED,
            status: status.OK,
            data: {
                price_alerts: priceAlertsData,
                total_count: total,
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
