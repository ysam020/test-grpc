import {
    errorMessage,
    eventBridge,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    PublishWidgetRequest__Output,
    PublishWidgetResponse,
    PublishWidgetResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getWidgetByID, updateWidgetByID } from '../services/model.service';
import { publishWidgetType } from '../validations';
import { prismaClient } from '@atc/db';
import { deactivateSurveys } from '../services/client.service';

export const publishWidget = async (
    call: CustomServerUnaryCall<
        PublishWidgetRequest__Output,
        PublishWidgetResponse
    >,
    callback: sendUnaryData<PublishWidgetResponse__Output>,
) => {
    try {
        const { widget_id, deploy_date, deploy_hour, deploy_minute } =
            utilFns.removeEmptyFields(call.request) as publishWidgetType;

        const deployDate = new Date(deploy_date);
        deployDate.setHours(deploy_hour, deploy_minute);

        const widget = await getWidgetByID(widget_id);
        if (!widget) {
            return callback(null, {
                message: errorMessage.WIDGET.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        if (widget.status === prismaClient.WidgetStatusEnum.ACTIVE) {
            return callback(null, {
                message: responseMessage.WIDGET.PUBLISHED,
                status: status.OK,
            });
        }

        if (!widget.WidgetComponent || widget.WidgetComponent.length === 0) {
            return callback(null, {
                message: errorMessage.WIDGET.NO_COMPONENTS,
                status: status.NOT_FOUND,
            });
        }

        await updateWidgetByID(widget_id, {
            deploy_date: deployDate,
            status: prismaClient.WidgetStatusEnum.PUBLISH,
        });

        const scheduleName = `widget-deploy-${widget.id}`;
        const scheduleParams = {
            scheduleName,
            scheduleDate: deployDate,
            targetArn: process.env.PUBLISH_WIDGET_ARN!,
            inputPayload: { widgetID: widget.id },
        };

        const scheduleExists =
            await eventBridge.checkScheduleExists(scheduleName);

        if (scheduleExists) {
            await eventBridge.updateEventBridgeSchedule(scheduleParams);
        } else {
            await eventBridge.createEventBridgeSchedule(scheduleParams);
        }

        if (widget.WidgetComponent && widget.WidgetComponent.length > 0) {
            const surveyIDs = widget.WidgetComponent.filter(
                (component) =>
                    component.reference_model ===
                    prismaClient.ReferenceModelType.SURVEY,
            ).map((component) => component.reference_model_id);

            if (surveyIDs.length > 0) {
                await deactivateSurveys(surveyIDs, call.metadata);
            }
        }

        return callback(null, {
            message: responseMessage.WIDGET.PUBLISHED,
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
