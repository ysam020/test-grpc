import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    UpdateWidgetSurveyRequest__Output,
    UpdateWidgetSurveyResponse,
    UpdateWidgetSurveyResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getWidgetByID,
    getWidgetComponentByID,
    updateWidgetSurveyByWidgetComponentID,
} from '../services/model.service';
import { prismaClient } from '@atc/db';
import { updateWidgetType } from '../validations';
import { getSurveyByID } from '../services/client.service';

export const updateWidgetSurvey = async (
    call: CustomServerUnaryCall<
        UpdateWidgetSurveyRequest__Output,
        UpdateWidgetSurveyResponse
    >,
    callback: sendUnaryData<UpdateWidgetSurveyResponse__Output>,
) => {
    try {
        const { widget_component_id, survey_id } = utilFns.removeEmptyFields(
            call.request,
        ) as updateWidgetType;

        const widgetComponent =
            await getWidgetComponentByID(widget_component_id);
        if (!widgetComponent) {
            return callback(null, {
                message: errorMessage.WIDGET_COMPONENT.NOT_FOUND,
                data: null,
                status: status.NOT_FOUND,
            });
        }

        if (
            widgetComponent.reference_model !==
            prismaClient.WidgetComponentType.SURVEY
        ) {
            return callback(null, {
                message: errorMessage.WIDGET_COMPONENT.NOT_FOR_SURVEY,
                data: null,
                status: status.INVALID_ARGUMENT,
            });
        }

        const widget = await getWidgetByID(widgetComponent.widget_id);
        if (!widget) {
            return callback(null, {
                message: errorMessage.WIDGET.NOT_FOUND,
                data: null,
                status: status.NOT_FOUND,
            });
        }

        const existingSurveyInWidget = widget.WidgetComponent.some(
            (component) =>
                component.reference_model_id === survey_id &&
                component.reference_model ===
                    prismaClient.ReferenceModelType.SURVEY,
        );
        if (existingSurveyInWidget) {
            return callback(null, {
                message: errorMessage.WIDGET.SURVEY_ALREADY_ADDED,
                data: null,
                status: status.ALREADY_EXISTS,
            });
        }

        const survey = await getSurveyByID(survey_id, call.metadata);
        if (!survey) {
            return callback(null, {
                message: errorMessage.SURVEY.NOT_FOUND,
                data: null,
                status: status.NOT_FOUND,
            });
        }

        await updateWidgetSurveyByWidgetComponentID(
            widget_component_id,
            survey_id,
        );

        return callback(null, {
            message: responseMessage.SURVEY.UPDATED,
            status: status.OK,
            data: {
                survey_id: survey.id!,
                widget_id: widgetComponent.widget_id,
                widget_component_id: widgetComponent.id,
                survey_name: survey.name || '',
            },
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            data: null,
            status: status.INTERNAL,
        });
    }
};
