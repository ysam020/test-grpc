import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    AddWidgetSurveyRequest__Output,
    AddWidgetSurveyResponse,
    AddWidgetSurveyResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { addWidgetSurveyType } from '../validations';
import {
    getWidgetByID,
    upsertWidgetComponent,
} from '../services/model.service';
import { prismaClient } from '@atc/db';
import { activateSurveys, getSurveyByID } from '../services/client.service';

export const addWidgetSurvey = async (
    call: CustomServerUnaryCall<
        AddWidgetSurveyRequest__Output,
        AddWidgetSurveyResponse
    >,
    callback: sendUnaryData<AddWidgetSurveyResponse__Output>,
) => {
    try {
        const { widget_id, survey_id, order } = utilFns.removeEmptyFields(
            call.request,
        ) as addWidgetSurveyType;

        const widget = await getWidgetByID(widget_id);
        if (!widget) {
            return callback(null, {
                message: errorMessage.WIDGET.NOT_FOUND,
                data: null,
                status: status.NOT_FOUND,
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

        const widgetComponentData = {
            component_type: prismaClient.WidgetComponentType.SURVEY,
            order,
            reference_model_id: survey_id,
            reference_model: prismaClient.ReferenceModelType.SURVEY,
            widget: { connect: { id: widget_id } },
        };
        const widgetComponent =
            await upsertWidgetComponent(widgetComponentData);

        if (widget.status === prismaClient.WidgetStatusEnum.ACTIVE) {
            await activateSurveys([survey_id], call.metadata);
        }

        return callback(null, {
            message: responseMessage.SURVEY.ADDED,
            status: status.OK,
            data: {
                survey_id: survey_id,
                widget_id: widget.id,
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
