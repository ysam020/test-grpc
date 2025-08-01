import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    ViewBasketRequest__Output,
    ViewBasketResponse,
    ViewBasketResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getDetailedBasketByUserID,
    getPaginatedBasketByUserID,
    getPriceAlertsByUserID,
} from '../services/model.service';
import { viewBasketType } from '../validations';

export const viewBasket = async (
    call: CustomServerUnaryCall<ViewBasketRequest__Output, ViewBasketResponse>,
    callback: sendUnaryData<ViewBasketResponse__Output>,
) => {
    try {
        const { userID } = call.user;
        const { page, limit, retailer_id } = utilFns.removeEmptyFields(
            call.request,
        ) as viewBasketType;

        const basket = await getDetailedBasketByUserID(userID, retailer_id);
        if (!basket) {
            return callback(null, {
                message: errorMessage.BASKET.BASKET_NOT_FOUND,
                status: status.NOT_FOUND,
                data: {
                    basket_id: '',
                    best_total: 0,
                    basket_item: [],
                    retailer_totals: [],
                    total_count: 0,
                },
            });
        }

        const paginatedBasket = await getPaginatedBasketByUserID(
            userID,
            page,
            limit,
            retailer_id,
        );
        if (!paginatedBasket) {
            return callback(null, {
                message: errorMessage.BASKET.BASKET_NOT_FOUND,
                status: status.NOT_FOUND,
                data: {
                    basket_id: '',
                    best_total: 0,
                    basket_item: [],
                    retailer_totals: [],
                    total_count: 0,
                },
            });
        }

        const priceAlerts = await getPriceAlertsByUserID(userID);

        const priceAlertProductIDs = new Set(
            priceAlerts.map((alert) => alert.product_id),
        );

        // Map basket items to the expected structure
        const basketItems = paginatedBasket.BasketItem.filter(
            (item) => item.master_product.retailerCurrentPricing.length > 0,
        ).map((item) => {
            const retailerPricing = item.master_product.retailerCurrentPricing;
            const rrp = Number(item.master_product.rrp);

            const retailerPrices = retailerPricing
                .map((rcp) => ({
                    retailer_id: rcp.Retailer?.id || '',
                    retailer_name: rcp.Retailer?.retailer_name || '',
                    retailer_price: rcp.current_price
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

            return {
                product_data: {
                    id: item.master_product_id,
                    product_name: item.master_product.product_name,
                    image_url: item.master_product.image_url || '',
                    basket_quantity: item.quantity,
                    is_in_basket: true,
                    is_price_alert_active: priceAlertProductIDs.has(
                        item.master_product_id,
                    ),
                    category_id: item.master_product.category_id || '',
                },
                best_deal: bestDeal,
                retailer_prices: retailerPrices,
                recommended_retailer_prices:
                    parseFloat(
                        (item.master_product.rrp || 0)?.toString(),
                    ).toFixed(2) || '0.00',
            };
        });

        // Calculate retailer totals
        const retailerTotals: { [key: string]: number } = {};

        const filteredBasketItems = basket.BasketItem.filter((item) => {
            const retailerPricing = item.master_product.retailerCurrentPricing;
            const filteredRetailerPricing = retailer_id
                ? retailerPricing.filter(
                      (rcp) => rcp.retailer_id === retailer_id,
                  )
                : retailerPricing;
            return filteredRetailerPricing.length > 0;
        });

        filteredBasketItems.forEach((item) => {
            item.master_product.retailerCurrentPricing.forEach((rcp) => {
                const retailerName = rcp.Retailer?.retailer_name || '';
                if (!retailerTotals[retailerName]) {
                    retailerTotals[retailerName] = 0;
                }
                retailerTotals[retailerName] +=
                    Number(rcp.current_price || 0) * item.quantity;
            });
        });

        const retailerTotalsList = Object.keys(retailerTotals).map(
            (retailerName) => ({
                retailer_name: retailerName,
                total_price:
                    Number(retailerTotals[retailerName]?.toFixed(2)) ?? 0.0,
            }),
        );

        const bestTotal = basket.BasketItem.map((item) => {
            const pricing = retailer_id
                ? item.master_product.retailerCurrentPricing.find(
                      (rcp) => rcp.retailer_id === retailer_id,
                  )
                : item.master_product.retailerCurrentPricing[0];

            return pricing
                ? Number(pricing.current_price || 0) * item.quantity
                : 0;
        }).reduce((acc, price) => acc + price, 0);

        return callback(null, {
            message: responseMessage.BASKET.VIEW_BASKET_SUCCESS,
            status: status.OK,
            data: {
                basket_id: basket.id,
                best_total: Number(bestTotal.toFixed(2)),
                basket_item: basketItems,
                retailer_totals: retailerTotalsList,
                total_count: filteredBasketItems.length,
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
