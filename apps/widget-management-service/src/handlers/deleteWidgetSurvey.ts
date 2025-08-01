import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DeleteWidgetSurveyRequest__Output,
    DeleteWidgetSurveyResponse,
    DeleteWidgetSurveyResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { deleteWidgetSurveyType } from '../validations';
import {
    deleteWidgetComponentByID,
    getWidgetByID,
    getWidgetComponentByRefID,
} from '../services/model.service';
import { prismaClient } from '@atc/db';
import { surveyStub } from '../client';

export const deleteWidgetSurvey = async (
    call: CustomServerUnaryCall<
        DeleteWidgetSurveyRequest__Output,
        DeleteWidgetSurveyResponse
    >,
    callback: sendUnaryData<DeleteWidgetSurveyResponse__Output>,
) => {
    try {
        const { widget_id, survey_id } = utilFns.removeEmptyFields(
            call.request,
        ) as deleteWidgetSurveyType;

        const widget = await getWidgetByID(widget_id);
        if (!widget) {
            return callback(null, {
                message: errorMessage.WIDGET.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const widgetComponent = await getWidgetComponentByRefID(
            survey_id,
            prismaClient.WidgetComponentType.SURVEY,
            widget_id,
        );

        await deleteWidgetComponentByID(widgetComponent!.id);

        const deactivateSurvey = new Promise((resolve, reject) => {
            surveyStub.DeactivateSurvey(
                { id: survey_id },
                call.metadata,
                (err: any, response: any) => {
                    if (err) reject(err);
                    else resolve(response);
                },
            );
        });

        await deactivateSurvey;

        return callback(null, {
            message: responseMessage.SURVEY.REMOVED,
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
