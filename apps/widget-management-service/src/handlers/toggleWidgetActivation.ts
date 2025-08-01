import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    ToggleWidgetActivationRequest__Output,
    ToggleWidgetActivationResponse,
    ToggleWidgetActivationResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { widgetIDType } from '../validations';
import {
    getOnlyActiveWidget,
    getWidgetByID,
    updateWidgetByID,
} from '../services/model.service';
import { prismaClient } from '@atc/db';
import { activateSurveys, deactivateSurveys } from '../services/client.service';

export const toggleWidgetActivation = async (
    call: CustomServerUnaryCall<
        ToggleWidgetActivationRequest__Output,
        ToggleWidgetActivationResponse
    >,
    callback: sendUnaryData<ToggleWidgetActivationResponse__Output>,
) => {
    try {
        const { widget_id } = utilFns.removeEmptyFields(
            call.request,
        ) as widgetIDType;

        const widget = await getWidgetByID(widget_id);
        if (!widget) {
            return callback(null, {
                message: errorMessage.WIDGET.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        if (!widget.WidgetComponent || widget.WidgetComponent.length === 0) {
            return callback(null, {
                message: errorMessage.WIDGET.NO_COMPONENTS,
                status: status.NOT_FOUND,
            });
        }

        const activeWidget = await getOnlyActiveWidget();

        if (activeWidget) {
            await updateWidgetByID(activeWidget.id, {
                status: prismaClient.WidgetStatusEnum.PUBLISH,
            });

            if (
                activeWidget.WidgetComponent &&
                activeWidget.WidgetComponent.length > 0
            ) {
                const surveyIDs = activeWidget.WidgetComponent.filter(
                    (component) =>
                        component.reference_model ===
                        prismaClient.ReferenceModelType.SURVEY,
                ).map((component) => component.reference_model_id);

                if (surveyIDs.length > 0) {
                    await deactivateSurveys(surveyIDs, call.metadata);
                }
            }
        }

        await updateWidgetByID(widget.id, {
            status: prismaClient.WidgetStatusEnum.ACTIVE,
        });

        const newSurveyIDs = widget.WidgetComponent.filter(
            (component) =>
                component.reference_model ===
                prismaClient.ReferenceModelType.SURVEY,
        ).map((component) => component.reference_model_id);

        if (newSurveyIDs.length > 0) {
            await activateSurveys(newSurveyIDs, call.metadata);
        }

        return callback(null, {
            message: responseMessage.WIDGET.ACTIVATION_UPDATED,
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
