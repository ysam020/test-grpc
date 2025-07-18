import { updateAdminNotification } from '../../../src/handlers/updateAdminNotification';
import {
    getAdminNotificationByID,
    updateAdminNotificationByID,
} from '../../../src/services/model.service';
import { status } from '@grpc/grpc-js';
import { logger } from '@atc/logger';
import {
    errorMessage,
    responseMessage,
    eventBridge,
    utilFns,
} from '@atc/common';

jest.mock('../../../src/services/model.service');
jest.mock('@atc/logger');
jest.mock('@atc/common', () => ({
    errorMessage: {
        WIDGET: {
            INVALID_DATE_FORMAT: 'Invalid date format',
        },
        ADMIN_NOTIFICATION: {
            NO_CHANNEL_SELECTED: 'At least one channel must be selected.',
            NOT_FOUND: 'Notification not found',
            ALREADY_SENT: 'Notification is already sent',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        NOTIFICATION: {
            CREATED: 'Notification created successfully',
        },
        ADMIN_NOTIFICATION: {
            UPDATED: 'Notification updated successfully',
        },
    },
    utilFns: {
        removeEmptyFields: jest.fn((data) => data),
    },
    eventBridge: {
        createEventBridgeSchedule: jest.fn(),
        updateEventBridgeSchedule: jest.fn(),
        checkScheduleExists: jest.fn(() => Promise.resolve(false)), // 👈 Add this line
    },
}));

jest.mock('@atc/db', () => ({
    prismaClient: {
        AdminNotificationStatus: {
            PENDING: 'PENDING',
            SENT: 'SENT',
        },
    },
}));

describe('updateAdminNotification', () => {
    const callback = jest.fn();

    const baseRequest = {
        admin_notification_id: 'notif-001',
        title: 'Updated Title',
        description: 'Updated Description',
        schedule_date: '2025-07-20',
        schedule_hour: 14,
        schedule_minute: 30,
        channels: ['EMAIL'],
        target_users: { roles: ['ADMIN'], user_ids: [] },
    };

    const existingNotification = {
        id: 'notif-001',
        title: 'Old Title',
        description: 'Old Description',
        scheduled_at: new Date('2025-07-19T14:00:00Z'),
        channels: ['SMS'],
        target_users: { roles: ['USER'], user_ids: [] },
        status: 'PENDING',
        createdAt: new Date('2025-07-01T10:00:00Z'),
        updatedAt: new Date('2025-07-01T10:00:00Z'),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.ADMIN_NOTIFICATION_ARN =
            'arn:aws:events:...:admin-notifications';
    });

    it('should update the admin notification successfully', async () => {
        (getAdminNotificationByID as jest.Mock).mockResolvedValue(
            existingNotification,
        );
        (updateAdminNotificationByID as jest.Mock).mockResolvedValue({
            ...existingNotification,
            title: 'Updated Title',
            description: 'Updated Description',
            scheduled_at: new Date('2025-07-20T14:30:00Z'),
            channels: ['EMAIL'],
            target_users: baseRequest.target_users,
            updatedAt: new Date('2025-07-18T11:00:00Z'),
        });

        await updateAdminNotification(
            { request: baseRequest } as any,
            callback,
        );

        expect(eventBridge.createEventBridgeSchedule).toHaveBeenCalled();

        expect(updateAdminNotificationByID).toHaveBeenCalledWith(
            'notif-001',
            expect.objectContaining({
                title: 'Updated Title',
                description: 'Updated Description',
                channels: ['EMAIL'],
            }),
        );

        expect(callback).toHaveBeenCalledWith(
            null,
            expect.objectContaining({
                message: responseMessage.ADMIN_NOTIFICATION.UPDATED,
                status: status.OK,
                data: expect.objectContaining({
                    title: 'Updated Title',
                    channels: ['EMAIL'],
                }),
            }),
        );
    });

    it('should update schedule if schedule already exists', async () => {
        (getAdminNotificationByID as jest.Mock).mockResolvedValue(
            existingNotification,
        );
        (updateAdminNotificationByID as jest.Mock).mockResolvedValue({
            ...existingNotification,
            updatedAt: new Date(),
        });

        eventBridge.checkScheduleExists.mockResolvedValue(true);

        await updateAdminNotification(
            { request: baseRequest } as any,
            callback,
        );

        expect(eventBridge.updateEventBridgeSchedule).toHaveBeenCalled();
        expect(eventBridge.createEventBridgeSchedule).not.toHaveBeenCalled();
    });

    it('should return NOT_FOUND if notification does not exist', async () => {
        (getAdminNotificationByID as jest.Mock).mockResolvedValue(null);

        await updateAdminNotification(
            { request: baseRequest } as any,
            callback,
        );

        expect(callback).toHaveBeenCalledWith(null, {
            message: errorMessage.ADMIN_NOTIFICATION.NOT_FOUND,
            status: status.NOT_FOUND,
            data: null,
        });
    });

    it('should return FAILED_PRECONDITION if notification is already sent', async () => {
        (getAdminNotificationByID as jest.Mock).mockResolvedValue({
            ...existingNotification,
            status: 'SENT',
        });

        await updateAdminNotification(
            { request: baseRequest } as any,
            callback,
        );

        expect(callback).toHaveBeenCalledWith(null, {
            message: errorMessage.ADMIN_NOTIFICATION.ALREADY_SENT,
            status: status.FAILED_PRECONDITION,
            data: null,
        });
    });

    it('should return INTERNAL on unexpected error', async () => {
        const error = new Error('DB error');
        (getAdminNotificationByID as jest.Mock).mockRejectedValue(error);

        await updateAdminNotification(
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
