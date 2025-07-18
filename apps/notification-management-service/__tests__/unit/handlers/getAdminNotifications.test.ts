import { status } from '@grpc/grpc-js';
import { getAdminNotifications } from '../../../src/handlers/getAdminNotifications';
import { getAllAdminNotifications } from '../../../src/services/model.service';
import { logger } from '@atc/logger';
import { responseMessage, errorMessage, utilFns } from '@atc/common';
import { GetAdminNotificationsRequest__Output } from '@atc/proto';

jest.mock('../../../src/services/model.service', () => ({
    getAllAdminNotifications: jest.fn(),
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

jest.mock('@atc/common', () => ({
    responseMessage: {
        OTHER: {
            DATA_FOUND: 'Data found successfully',
            INTERNAL_SERVER_ERROR: 'Internal server error',
        },
        ADMIN_NOTIFICATION: {
            RETRIEVED: 'Admin notifications retrieved',
        },
    },
    errorMessage: {
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
}));

jest.mock('@atc/db', () => ({
    prismaClient: {
        PromotionTypeEnum: {
            RETAILER: 'RETAILER',
            DISTRIBUTOR: 'DISTRIBUTOR',
        },
    },
}));

describe('getAdminNotifications', () => {
    const mockCallback = jest.fn();
    const mockCall = {
        request: {
            page: 1,
            limit: 10,
            status: 'SCHEDULED',
            start_date: '2024-01-01',
            end_date: '2024-12-31',
        },
    } as unknown as {
        request: GetAdminNotificationsRequest__Output;
    };

    const sampleNotification = {
        admin_notification_id: 'notif123',
        title: 'Test Title',
        description: 'Test Desc',
        scheduled_at: new Date('2024-07-17T10:00:00Z'),
        channels: ['EMAIL', 'SMS'],
        status: 'SCHEDULED',
        target_users: { user_type: 'ALL' },
        createdAt: new Date('2024-07-10T12:00:00Z'),
        updatedAt: new Date('2024-07-11T12:00:00Z'),
        no_of_users: 50,
        sent_count: 30,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return notifications with status OK', async () => {
        (utilFns.removeEmptyFields as jest.Mock).mockReturnValue({
            page: 1,
            limit: 10,
            status: 'SCHEDULED',
            start_date: '2024-01-01',
            end_date: '2024-12-31',
        });

        (getAllAdminNotifications as jest.Mock).mockResolvedValue({
            adminNotifications: [sampleNotification],
            total: 1,
        });

        await getAdminNotifications(mockCall as any, mockCallback as any);

        expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(
            mockCall.request,
        );
        expect(getAllAdminNotifications).toHaveBeenCalledWith(
            1,
            10,
            'SCHEDULED',
            '2024-01-01',
            '2024-12-31',
        );

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: responseMessage.ADMIN_NOTIFICATION.RETRIEVED,
            status: status.OK,
            data: {
                admin_notifications: [
                    {
                        admin_notification_id: 'notif123',
                        title: 'Test Title',
                        description: 'Test Desc',
                        schedule_at: '2024-07-17T10:00:00.000Z',
                        channels: ['EMAIL', 'SMS'],
                        status: 'SCHEDULED',
                        target_users: { user_type: 'ALL' },
                        createdAt: '2024-07-10T12:00:00.000Z',
                        updatedAt: '2024-07-11T12:00:00.000Z',
                        no_of_users: 50,
                        sent_count: 30,
                    },
                ],
                total_count: 1,
            },
        });
    });

    it('should return INTERNAL error on failure', async () => {
        const mockError = new Error('DB failure');
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation(
            () => mockCall.request,
        );
        (getAllAdminNotifications as jest.Mock).mockRejectedValue(mockError);

        await getAdminNotifications(mockCall as any, mockCallback as any);

        expect(logger.error).toHaveBeenCalledWith(mockError);
        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
            data: null,
        });
    });
});
