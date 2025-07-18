import {
    addAdminNotification,
    getAdminNotificationByID,
    updateAdminNotificationByID,
    getAllAdminNotifications,
    deleteAdminNotificationByID,
    getProductByID,
    upsertPriceAlert,
    getPriceAlertByProductID,
    deletePriceAlertByID,
    getPriceAlertsByUserID,
    getAllNotificationsByUserID,
    addNewNotification,
    getFailedNotifications,
    markNotificationsAsSent,
    avgNotificationCount,
} from '../../../src/services/model.service';

import { dbClient, prismaClient } from '@atc/db';

jest.mock('@atc/db');

const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockFindMany = jest.fn();
const mockCount = jest.fn();
const mockUpsert = jest.fn();
const mockUpdateMany = jest.fn();
const mockQueryRawUnsafe = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();

    dbClient.adminNotification = {
        create: mockCreate,
        findUnique: mockFindUnique,
        update: mockUpdate,
        delete: mockDelete,
        count: mockCount,
    };

    dbClient.notification = {
        findMany: mockFindMany,
        count: mockCount,
        create: mockCreate,
        updateMany: mockUpdateMany,
    };

    dbClient.priceAlert = {
        upsert: mockUpsert,
        findUnique: mockFindUnique,
        delete: mockDelete,
        findMany: mockFindMany,
        count: mockCount,
    };

    dbClient.masterProduct = {
        findUnique: mockFindUnique,
    };

    dbClient.$queryRawUnsafe = mockQueryRawUnsafe;
});

describe('Notification Management Functions', () => {
    it('should add admin notification', async () => {
        const data = { title: 'Test' };
        mockCreate.mockResolvedValue(data);
        const result = await addAdminNotification(data);
        expect(mockCreate).toHaveBeenCalledWith({ data });
        expect(result).toEqual(data);
    });

    it('should get admin notification by ID', async () => {
        const mockResult = { id: '123' };
        mockFindUnique.mockResolvedValue(mockResult);
        const result = await getAdminNotificationByID('123');
        expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: '123' } });
        expect(result).toEqual(mockResult);
    });

    it('should update admin notification by ID', async () => {
        const data = { title: 'Updated' };
        mockUpdate.mockResolvedValue(data);
        const result = await updateAdminNotificationByID('123', data);
        expect(mockUpdate).toHaveBeenCalledWith({ where: { id: '123' }, data });
        expect(result).toEqual(data);
    });

    it('should delete admin notification by ID', async () => {
        const deleted = { id: '123' };
        mockDelete.mockResolvedValue(deleted);
        const result = await deleteAdminNotificationByID('123');
        expect(mockDelete).toHaveBeenCalledWith({ where: { id: '123' } });
        expect(result).toEqual(deleted);
    });

    it('should get product by ID', async () => {
        const mockProduct = { id: 'prod123' };
        mockFindUnique.mockResolvedValue(mockProduct);
        const result = await getProductByID('prod123');
        expect(mockFindUnique).toHaveBeenCalledWith({
            where: { id: 'prod123' },
        });
        expect(result).toEqual(mockProduct);
    });

    it('should upsert price alert', async () => {
        const input = {
            User: { connect: { id: 'user1' } },
            MasterProduct: { connect: { id: 'prod1' } },
            target_price: 99,
        };
        const upserted = { ...input, id: 'pa1' };
        mockUpsert.mockResolvedValue(upserted);
        const result = await upsertPriceAlert(input);
        expect(mockUpsert).toHaveBeenCalledWith({
            where: {
                pricealertmatched_unique: {
                    user_id: 'user1',
                    product_id: 'prod1',
                },
            },
            update: { target_price: 99 },
            create: input,
        });
        expect(result).toEqual(upserted);
    });

    it('should get price alert by product ID and user ID', async () => {
        const alert = { id: 'alert123' };
        mockFindUnique.mockResolvedValue(alert);
        const result = await getPriceAlertByProductID('prod1', 'user1');
        expect(mockFindUnique).toHaveBeenCalledWith({
            where: {
                pricealertmatched_unique: {
                    product_id: 'prod1',
                    user_id: 'user1',
                },
            },
        });
        expect(result).toEqual(alert);
    });

    it('should delete price alert by ID', async () => {
        const deleted = { id: 'alert123' };
        mockDelete.mockResolvedValue(deleted);
        const result = await deletePriceAlertByID('alert123');
        expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'alert123' } });
        expect(result).toEqual(deleted);
    });

    it('should get price alerts by user ID', async () => {
        mockFindMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
        mockCount.mockResolvedValue(2);
        const result = await getPriceAlertsByUserID('user1', 1, 10);
        expect(result.priceAlerts.length).toBe(2);
        expect(result.total).toBe(2);
    });

    it('should add new notification', async () => {
        const input = { title: 'Notify!' };
        mockCreate.mockResolvedValue(input);
        const result = await addNewNotification(input);
        expect(mockCreate).toHaveBeenCalledWith({ data: input });
        expect(result).toEqual(input);
    });

    it('should get all notifications by user ID and type', async () => {
        mockFindMany.mockResolvedValue([{ id: 'n1' }]);
        mockCount.mockResolvedValue(1);
        const result = await getAllNotificationsByUserID(
            1,
            10,
            'user1',
            'PRICE_ALERT',
        );
        expect(result.notifications.length).toBe(1);
        expect(result.total).toBe(1);
    });

    it('should get failed notifications', async () => {
        const failed = [{ id: 'n1' }];
        mockFindMany.mockResolvedValue(failed);
        const result = await getFailedNotifications('admin1');
        expect(mockFindMany).toHaveBeenCalled();
        expect(result).toEqual(failed);
    });

    it('should mark notifications as sent', async () => {
        const updated = { count: 2 };
        mockUpdateMany.mockResolvedValue(updated);
        const result = await markNotificationsAsSent(['n1', 'n2']);
        expect(result).toEqual(updated);
    });

    it('should calculate avg notification count', async () => {
        mockCount.mockResolvedValueOnce(8).mockResolvedValueOnce(2);
        const result = await avgNotificationCount();
        expect(result).toBe(0.8);
    });
});
