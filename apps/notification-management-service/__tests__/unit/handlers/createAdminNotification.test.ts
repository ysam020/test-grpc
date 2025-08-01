import { createAdminNotification } from '../../../src/handlers/createAdminNotification';
import { addAdminNotification } from '../../../src/services/model.service';
import { logger } from '@atc/logger';
import { errorMessage, responseMessage, eventBridge } from '@atc/common';
import { status } from '@grpc/grpc-js';

jest.mock('../../../src/services/model.service');
jest.mock('@atc/logger');
jest.mock('@atc/common', () => ({
    errorMessage: {
        WIDGET: {
            INVALID_DATE_FORMAT: 'Invalid date format',
        },
        ADMIN_NOTIFICATION: {},
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        ADMIN_NOTIFICATION: {
            CREATED: 'Notification created successfully',
        },
    },
    utilFns: {
        removeEmptyFields: jest.fn((data) => data),
    },
    eventBridge: {
        createEventBridgeSchedule: jest.fn(),
    },
}));

jest.mock('@atc/db', () => ({
    prismaClient: {
        AdminNotificationStatus: {
            PENDING: 'PENDING',
        },
    },
}));

describe('createAdminNotification', () => {
    const callback = jest.fn();

    const baseRequest = {
        title: 'Test Title',
        description: 'Test Description',
        schedule_date: '2025-07-22',
        schedule_hour: 10,
        schedule_minute: 15,
        channels: ['EMAIL'],
        target_users: { roles: ['ADMIN'], user_ids: [] },
    };

    const mockNotification = {
        id: 'notif-001',
        title: 'Test Title',
        description: 'Test Description',
        scheduled_at: new Date('2025-07-22T10:15:00Z'),
        channels: ['EMAIL'],
        target_users: baseRequest.target_users,
        status: 'PENDING',
        createdAt: new Date('2025-07-18T10:00:00Z'),
        updatedAt: new Date('2025-07-18T10:00:00Z'),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.ADMIN_NOTIFICATION_ARN =
            'arn:aws:events:region::admin-notification';
    });

    it('should create the admin notification successfully', async () => {
        (addAdminNotification as jest.Mock).mockResolvedValue(mockNotification);

        await createAdminNotification(
            { request: baseRequest } as any,
            callback,
        );

        expect(addAdminNotification).toHaveBeenCalledWith({
            title: baseRequest.title,
            description: baseRequest.description,
            scheduled_at: expect.any(Date),
            channels: baseRequest.channels,
            target_users: baseRequest.target_users,
        });

        expect(eventBridge.createEventBridgeSchedule).toHaveBeenCalledWith({
            scheduleName: `admin-notification-${mockNotification.id}`,
            scheduleDate: expect.any(Date),
            targetArn: process.env.ADMIN_NOTIFICATION_ARN,
            inputPayload: { adminNotificationID: mockNotification.id },
        });

        expect(callback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: responseMessage.ADMIN_NOTIFICATION.CREATED,
                status: status.OK,
                data: expect.objectContaining({
                    admin_notification_id: mockNotification.id,
                    title: mockNotification.title,
                }),
            }),
        );
    });

    it('should return INTERNAL if DB insert fails', async () => {
        const error = new Error('DB error');
        (addAdminNotification as jest.Mock).mockRejectedValue(error);

        await createAdminNotification(
            { request: baseRequest } as any,
            callback,
        );

        expect(logger.error).toHaveBeenCalledWith(error);

        expect(callback).toHaveBeenCalledWith(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
            data: null,
        });
    });
});
