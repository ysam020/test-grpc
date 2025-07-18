import { getNotifications } from '../../../src/handlers/getNotifications';
import { prismaClient } from '@atc/db';
import { getAllNotificationsByUserID } from '../../../src/services/model.service';
import { logger } from '@atc/logger';
import { status } from '@grpc/grpc-js';
import { responseMessage, errorMessage } from '@atc/common';

jest.mock('../../../src/services/model.service');
jest.mock('@atc/logger');

describe('getNotifications', () => {
    const mockCallback = jest.fn();
    const mockUser = { userID: 'user123' };
    const mockRequest = {
        page: 1,
        limit: 10,
    };

    const call: any = {
        request: mockRequest,
        user: mockUser,
    };

    const mockNotifications = [
        {
            id: 'notif-1',
            title: 'Test Title 1',
            description: 'Test Description 1',
            createdAt: new Date('2024-07-15T10:00:00Z'),
        },
        {
            id: 'notif-2',
            title: 'Test Title 2',
            description: 'Test Description 2',
            createdAt: new Date('2024-07-16T12:30:00Z'),
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return notifications successfully', async () => {
        (getAllNotificationsByUserID as jest.Mock).mockResolvedValue({
            notifications: mockNotifications,
            total: 2,
        });

        await getNotifications(call, mockCallback);

        expect(getAllNotificationsByUserID).toHaveBeenCalledWith(
            1,
            10,
            'user123',
            prismaClient.NotificationType.REGISTRATION,
        );

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: responseMessage.NOTIFICATION.RETRIEVED,
            status: status.OK,
            data: {
                notifications: [
                    {
                        notification_id: 'notif-1',
                        title: 'Test Title 1',
                        description: 'Test Description 1',
                        createdAt: '2024-07-15T10:00:00.000Z',
                    },
                    {
                        notification_id: 'notif-2',
                        title: 'Test Title 2',
                        description: 'Test Description 2',
                        createdAt: '2024-07-16T12:30:00.000Z',
                    },
                ],
                total_count: 2,
            },
        });
    });

    it('should handle errors and return fallback response', async () => {
        const error = new Error('DB error');
        (getAllNotificationsByUserID as jest.Mock).mockRejectedValue(error);

        await getNotifications(call, mockCallback);

        expect(logger.error).toHaveBeenCalledWith(error);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
            data: {
                notifications: [],
                total_count: 0,
            },
        });
    });
});
