// apps/notification-management-service/__tests__/unit/services/modelServiceExtended.test.ts
import {
    getPriceAlertsWithPagination,
    deletePriceAlertByID,
    getFailedNotifications,
    markNotificationsAsSent,
    getNotificationsWithPagination,
    addNewNotification,
} from '../../../src/services/model.service';

jest.mock('@atc/db', () => ({
    prismaClient: {
        priceAlert: {
            findMany: jest.fn(),
            count: jest.fn(),
            delete: jest.fn(),
        },
        notification: {
            findMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            updateMany: jest.fn(),
        },
        $queryRaw: jest.fn(),
    },
}));

jest.mock('@atc/logger', () => ({
    logger: { {
            upsert: jest.fn(),
            findMany: jest.fn(),
            delete: jest.fn(),
        },
        notification: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        masterProduct: {
            findUnique: jest.fn(),
        },
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

const { prismaClient } = require('@atc/db');

describe('Model Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('addAdminNotification', () => {
        it('should create admin notification successfully', async () => {
            const mockData = {
                title: 'Test Notification',
                description: 'Test Description',
                scheduled_at: new Date(),
                channels: ['EMAIL'],
                target_users: {},
            };

            const mockResult = { id: 'test-id', ...mockData };
            prismaClient.adminNotification.create.mockResolvedValue(mockResult);

            const result = await addAdminNotification(mockData);

            expect(prismaClient.adminNotification.create).toHaveBeenCalledWith({
                data: mockData,
            });
            expect(result).toEqual(mockResult);
        });

        it('should handle database errors', async () => {
            const mockData = {
                title: 'Test Notification',
                description: 'Test Description',
                scheduled_at: new Date(),
                channels: ['EMAIL'],
                target_users: {},
            };

            prismaClient.adminNotification.create.mockRejectedValue(new Error('Database error'));

            await expect(addAdminNotification(mockData)).rejects.toThrow('Database error');
        });
    });

    describe('getAdminNotificationByID', () => {
        it('should return admin notification by ID', async () => {
            const mockResult = { id: 'test-id', title: 'Test' };
            prismaClient.adminNotification.findUnique.mockResolvedValue(mockResult);

            const result = await getAdminNotificationByID('test-id');

            expect(prismaClient.adminNotification.findUnique).toHaveBeenCalledWith({
                where: { id: 'test-id' },
            });
            expect(result).toEqual(mockResult);
        });

        it('should return null when notification not found', async () => {
            prismaClient.adminNotification.findUnique.mockResolvedValue(null);

            const result = await getAdminNotificationByID('non-existent-id');

            expect(result).toBeNull();
        });
    });

    describe('updateAdminNotificationByID', () => {
        it('should update admin notification successfully', async () => {
            const updateData = { title: 'Updated Title' };
            const mockResult = { id: 'test-id', title: 'Updated Title' };
            
            prismaClient.adminNotification.update.mockResolvedValue(mockResult);

            const result = await updateAdminNotificationByID('test-id', updateData);

            expect(prismaClient.adminNotification.update).toHaveBeenCalledWith({
                where: { id: 'test-id' },
                data: updateData,
            });
            expect(result).toEqual(mockResult);
        });
    });
});