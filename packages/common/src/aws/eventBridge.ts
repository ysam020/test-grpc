import { logger } from '@atc/logger';
import {
    CreateScheduleCommand,
    ListSchedulesCommand,
    SchedulerClient,
    UpdateScheduleCommand,
} from '@aws-sdk/client-scheduler';

const eventBridgeSchedulerClient = new SchedulerClient({
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
});

interface ScheduleParams {
    scheduleName: string;
    scheduleDate: Date;
    targetArn: string;
    inputPayload: Record<string, any>;
}

const createEventBridgeSchedule = async (scheduleParams: ScheduleParams) => {
    try {
        const { scheduleName, scheduleDate, targetArn, inputPayload } =
            scheduleParams;

        const scheduleExpression = `at(${scheduleDate.toISOString().split('.')[0]})`;

        // Create a schedule using EventBridge Scheduler
        const createScheduleCommand = new CreateScheduleCommand({
            Name: scheduleName,
            ScheduleExpression: scheduleExpression,
            Target: {
                Arn: targetArn,
                Input: JSON.stringify(inputPayload),
                RoleArn: process.env.EVENTBRIDGE_ROLE_ARN,
            },
            FlexibleTimeWindow: {
                Mode: 'OFF',
            },
            ActionAfterCompletion: 'DELETE',
        });

        return await eventBridgeSchedulerClient.send(createScheduleCommand);
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const checkScheduleExists = async (scheduleName: string) => {
    try {
        const { Schedules } = await eventBridgeSchedulerClient.send(
            new ListSchedulesCommand(),
        );

        return Schedules?.some((schedule) => schedule.Name === scheduleName);
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateEventBridgeSchedule = async (scheduleParams: ScheduleParams) => {
    try {
        const { scheduleName, scheduleDate, targetArn, inputPayload } =
            scheduleParams;

        const scheduleExpression = `at(${scheduleDate.toISOString().split('.')[0]})`;

        const updateScheduleCommand = new UpdateScheduleCommand({
            Name: scheduleName,
            ScheduleExpression: scheduleExpression,
            Target: {
                Arn: targetArn,
                Input: JSON.stringify(inputPayload),
                RoleArn: process.env.EVENTBRIDGE_ROLE_ARN,
            },
            FlexibleTimeWindow: {
                Mode: 'OFF',
            },
            ActionAfterCompletion: 'DELETE',
        });

        return await eventBridgeSchedulerClient.send(updateScheduleCommand);
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

export {
    createEventBridgeSchedule,
    checkScheduleExists,
    updateEventBridgeSchedule,
};
