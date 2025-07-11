import {
    constants,
    deleteS3Object,
    errorMessage,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DeleteBannerRequest__Output,
    DeleteBannerResponse,
    DeleteBannerResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    deleteBannerByID,
    deleteWidgetComponentByID,
    getBannerByID,
    getWidgetComponentByRefID,
} from '../services/model.service';
import { prismaClient } from '@atc/db';

export const deleteBanner = async (
    call: CustomServerUnaryCall<
        DeleteBannerRequest__Output,
        DeleteBannerResponse
    >,
    callback: sendUnaryData<DeleteBannerResponse__Output>,
) => {
    try {
        const { id } = utilFns.removeEmptyFields(call.request);

        const banner = await getBannerByID(id);
        if (!banner) {
            return callback(null, {
                message: errorMessage.BANNER.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        await deleteS3Object(constants.BANNER_FOLDER, banner.image!);

        const widgetComponent = await getWidgetComponentByRefID(
            banner.id,
            prismaClient.WidgetComponentType.BANNER,
        );

        await deleteWidgetComponentByID(widgetComponent!.id);

        await deleteBannerByID(id);

        return callback(null, {
            message: responseMessage.BANNER.DELETED,
            status: status.OK,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
