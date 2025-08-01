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
    DeleteProductSliderRequest__Output,
    DeleteProductSliderResponse,
    DeleteProductSliderResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { productSliderIDType } from '../validations';
import {
    deleteProductSliderByID,
    deleteWidgetComponentByID,
    getProductSliderByID,
    getWidgetComponentByRefID,
} from '../services/model.service';
import { prismaClient } from '@atc/db';

export const deleteProductSlider = async (
    call: CustomServerUnaryCall<
        DeleteProductSliderRequest__Output,
        DeleteProductSliderResponse
    >,
    callback: sendUnaryData<DeleteProductSliderResponse__Output>,
) => {
    try {
        const { product_slider_id } = utilFns.removeEmptyFields(
            call.request,
        ) as productSliderIDType;

        const productSlider = await getProductSliderByID(product_slider_id);
        if (!productSlider) {
            return callback(null, {
                message: errorMessage.PRODUCT_SLIDER.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const widgetComponent = await getWidgetComponentByRefID(
            product_slider_id,
            prismaClient.WidgetComponentType.PRODUCT_SLIDER,
        );
        if (!widgetComponent) {
            return callback(null, {
                message: errorMessage.WIDGET_COMPONENT.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        await deleteWidgetComponentByID(widgetComponent.id);

        if (productSlider.brand_logo) {
            await deleteS3Object(
                constants.PRODUCT_SLIDER_LOGO_FOLDER,
                productSlider.brand_logo,
            );
        }

        await deleteProductSliderByID(productSlider.id);

        return callback(null, {
            message: responseMessage.PRODUCT_SLIDER.REMOVED,
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
