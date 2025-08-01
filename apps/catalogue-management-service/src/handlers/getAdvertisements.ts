import {
    errorMessage,
    ProductMatch,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    GetAdvertisementsRequest__Output,
    GetAdvertisementsResponse,
    GetAdvertisementsResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getAdvertisementsType } from '../validations';
import { prismaClient } from '@atc/db';
import {
    getRetailerByID,
    getAllAdvertisements,
} from '../services/model.service';

export const getAdvertisements = async (
    call: CustomServerUnaryCall<
        GetAdvertisementsRequest__Output,
        GetAdvertisementsResponse
    >,
    callback: sendUnaryData<GetAdvertisementsResponse__Output>,
) => {
    try {
        const {
            page,
            limit,
            retailer_id,
            advertisement_type,
            year,
            month,
            product_match,
            keyword,
        } = utilFns.removeEmptyFields(call.request) as getAdvertisementsType;

        if (retailer_id) {
            const retailer = await getRetailerByID(retailer_id);
            if (!retailer) {
                return callback(null, {
                    message: errorMessage.RETAILER.NOT_FOUND,
                    status: status.NOT_FOUND,
                    data: null,
                });
            }
        }

        const { advertisements, totalCount } = await getAllAdvertisements(
            page,
            limit,
            retailer_id,
            advertisement_type,
            year,
            month,
            product_match,
            keyword,
        );

        let filteredAdvertisements = advertisements.map((ad) => {
            return {
                id: ad.id,
                title: ad.title,
                retailer: {
                    id: ad.Retailer.id,
                    name: ad.Retailer.retailer_name,
                },
                advertisement_type: ad.advertisement_type,
                start_date: ad.start_date.toISOString(),
                end_date: ad.end_date.toISOString(),
                status: ad.advertisement_status,
                product_match: utilFns.getProductMatchStatus(
                    ad.match_percentage,
                ),
                match_percentage: ad.match_percentage,
                image: ad.AdvertisementImage[0]?.id || '',
                keyword: ad.keyword || '',
            };
        });

        return callback(null, {
            message: responseMessage.ADVERTISEMENT.RETRIEVED,
            status: status.OK,
            data: {
                advertisements: filteredAdvertisements,
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
