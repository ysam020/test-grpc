import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getBannerByID } from '../services/model.service';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import {
    GetBannerRequest__Output,
    GetBannerResponse,
    GetBannerResponse__Output,
} from '@atc/proto';

export const getBanner = async (
    call: CustomServerUnaryCall<GetBannerRequest__Output, GetBannerResponse>,
    callback: sendUnaryData<GetBannerResponse__Output>,
) => {
    try {
        const { banner_id } = utilFns.removeEmptyFields(call.request);

        const banner = await getBannerByID(banner_id);
        if (!banner) {
            return callback(null, {
                message: errorMessage.BANNER.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        return callback(null, {
            message: responseMessage.BANNER.RETRIEVED,
            status: status.OK,
            data: {
                banner_id: banner.id,
                banner_name: banner.banner_name,
                link_type: banner.link_type,
                link: banner.link || '',
                image: banner.image || '',
                internal_link_type: banner?.internal_link_type || '',
                sample_id: banner?.sample_id || '',
                sample_name:
                    banner.Sample?.product?.product?.product_name || '',
                promotion_type: banner?.promotion_type || '',
                brands:
                    banner?.brands.map((brand) => ({
                        id: brand.id,
                        name: brand.brand_name,
                    })) || [],
                retailers:
                    banner?.retailers.map((retailer) => ({
                        id: retailer.id,
                        name: retailer.retailer_name,
                    })) || [],
                categories:
                    banner?.categories.map((category) => ({
                        id: category.id,
                        name: category.category_name,
                    })) || [],
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
