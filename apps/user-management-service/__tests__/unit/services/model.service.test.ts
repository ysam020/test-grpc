// Mock everything BEFORE any imports to ensure proper setup
jest.mock('@atc/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        fatal: jest.fn(),
    },
}));

jest.mock('@atc/db', () => ({
    dbClient: {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        preference: {
            upsert: jest.fn(),
        },
        basket: {
            findUnique: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        },
        basketItem: {
            upsert: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
        },
        masterProduct: {
            findUnique: jest.fn(),
        },
        postcode: {
            findFirst: jest.fn(),
        },
        priceAlert: {
            findMany: jest.fn(),
        },
        $queryRawUnsafe: jest.fn(),
    },
    prismaClient: {
        Prisma: {
            UserUpdateInput: {},
            BasketCreateInput: {},
            BasketItemCreateInput: {},
            BasketWhereUniqueInput: {},
            BasketItemWhereUniqueInput: {},
            PostcodeWhereUniqueInput: {},
        },
    },
}));

// Import AFTER all mocks are set up
import {
    getUserByID,
    updateUserByID,
    deleteUserByID,
    getAllUsers,
    updateUserPreference,
    getBasketByUserID,
    createBasket,
    upsertBasketItem,
    getDetailedBasketByUserID,
    deleteBasketByID,
    deleteBasketItemByID,
    getProductByID,
    getPostcodeData,
    getPriceAlertsByUserID,
    getPaginatedBasketByUserID,
    monthlyActiveUsersCount,
} from '../../../src/services/model.service';

import { dbClient } from '@atc/db';
import { logger } from '@atc/logger';

describe('User Model Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserByID', () => {
        it('should successfully get user by ID with preferences', async () => {
            // Arrange
            const userId = 'user-123';
            const mockUser = {
                id: userId,
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Doe',
                is_deleted: false,
                Preference: {
                    id: 'pref-123',
                    retailers: [
                        { id: 'retailer-1', retailer_name: 'Test Retailer' }
                    ]
                }
            };

            (dbClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            // Act
            const result = await getUserByID(userId);

            // Assert
            expect(dbClient.user.findUnique).toHaveBeenCalledWith({
                where: { id: userId, is_deleted: false },
                include: {
                    Preference: {
                        include: {
                            retailers: {
                                select: { id: true, retailer_name: true },
                            },
                        },
                    },
                },
            });
            expect(result).toEqual(mockUser);
        });

        it('should return null when user not found', async () => {
            // Arrange
            const userId = 'non-existent-user';
            (dbClient.user.findUnique as jest.Mock).mockResolvedValue(null);

            // Act
            const result = await getUserByID(userId);

            // Assert
            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            // Arrange
            const userId = 'user-123';
            const dbError = new Error('Database connection failed');
            (dbClient.user.findUnique as jest.Mock).mockRejectedValue(dbError);

            // Act & Assert
            await expect(getUserByID(userId)).rejects.toThrow('Database connection failed');
            expect(logger.error).toHaveBeenCalledWith(dbError);
        });
    });

    describe('updateUserByID', () => {
        it('should successfully update user', async () => {
            // Arrange
            const userId = 'user-123';
            const updateData = {
                first_name: 'Updated John',
                last_name: 'Updated Doe',
            };
            const mockUpdatedUser = {
                id: userId,
                ...updateData,
                email: 'test@example.com',
            };

            (dbClient.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

            // Act
            const result = await updateUserByID(userId, updateData);

            // Assert
            expect(dbClient.user.update).toHaveBeenCalledWith({
                where: { id: userId, is_deleted: false },
                data: updateData,
            });
            expect(result).toEqual(mockUpdatedUser);
        });

        it('should handle update errors', async () => {
            // Arrange
            const userId = 'user-123';
            const updateData = { first_name: 'John' };
            const dbError = new Error('Update failed');
            (dbClient.user.update as jest.Mock).mockRejectedValue(dbError);

            // Act & Assert
            await expect(updateUserByID(userId, updateData)).rejects.toThrow('Update failed');
            expect(logger.error).toHaveBeenCalledWith(dbError);
        });
    });

    describe('deleteUserByID', () => {
        it('should successfully soft delete user', async () => {
            // Arrange
            const userId = 'user-123';
            const mockDeletedUser = {
                id: userId,
                is_deleted: true,
            };

            (dbClient.user.update as jest.Mock).mockResolvedValue(mockDeletedUser);

            // Act
            const result = await deleteUserByID(userId);

            // Assert
            expect(dbClient.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { is_deleted: true },
            });
            expect(result).toEqual(mockDeletedUser);
        });

        it('should handle delete errors', async () => {
            // Arrange
            const userId = 'user-123';
            const dbError = new Error('Delete failed');
            (dbClient.user.update as jest.Mock).mockRejectedValue(dbError);

            // Act & Assert
            await expect(deleteUserByID(userId)).rejects.toThrow('Delete failed');
            expect(logger.error).toHaveBeenCalledWith(dbError);
        });
    });

    describe('getAllUsers', () => {
        it('should successfully get paginated users', async () => {
            // Arrange
            const page = 1;
            const limit = 10;
            const mockUsers = [
                { id: 'user-1', email: 'user1@example.com', role: 'user' },
                { id: 'user-2', email: 'user2@example.com', role: 'user' },
            ];
            const totalCount = 25;

            (dbClient.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
            (dbClient.user.count as jest.Mock).mockResolvedValue(totalCount);

            // Act
            const result = await getAllUsers(page, limit);

            // Assert
            expect(dbClient.user.findMany).toHaveBeenCalledWith({
                where: { is_deleted: false, role: 'user' },
                skip: 0, // (1-1) * 10
                take: 10,
            });
            expect(dbClient.user.count).toHaveBeenCalledWith({
                where: { is_deleted: false, role: 'user' },
            });
            expect(result).toEqual({ users: mockUsers, totalCount });
        });

        it('should calculate correct skip for different pages', async () => {
            // Arrange
            const page = 3;
            const limit = 5;
            const mockUsers = [];
            const totalCount = 0;

            (dbClient.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
            (dbClient.user.count as jest.Mock).mockResolvedValue(totalCount);

            // Act
            await getAllUsers(page, limit);

            // Assert
            expect(dbClient.user.findMany).toHaveBeenCalledWith({
                where: { is_deleted: false, role: 'user' },
                skip: 10, // (3-1) * 5
                take: 5,
            });
        });

        it('should handle database errors', async () => {
            // Arrange
            const page = 1;
            const limit = 10;
            const dbError = new Error('Query failed');
            (dbClient.user.findMany as jest.Mock).mockRejectedValue(dbError);

            // Act & Assert
            await expect(getAllUsers(page, limit)).rejects.toThrow('Query failed');
            expect(logger.error).toHaveBeenCalledWith(dbError);
        });
    });

    describe('updateUserPreference', () => {
        it('should successfully update existing user preferences', async () => {
            // Arrange
            const userID = 'user-123';
            const retailer_ids = ['retailer-1', 'retailer-2'];
            const mockPreference = {
                id: 'pref-123',
                user_id: userID,
            };

            (dbClient.preference.upsert as jest.Mock).mockResolvedValue(mockPreference);

            // Act
            const result = await updateUserPreference(userID, retailer_ids);

            // Assert
            expect(dbClient.preference.upsert).toHaveBeenCalledWith({
                where: { user_id: userID },
                update: {
                    retailers: {
                        set: [
                            { id: 'retailer-1' },
                            { id: 'retailer-2' },
                        ],
                    },
                },
                create: {
                    user_id: userID,
                    retailers: {
                        connect: [
                            { id: 'retailer-1' },
                            { id: 'retailer-2' },
                        ],
                    },
                },
            });
            expect(result).toEqual(mockPreference);
        });

        it('should handle empty retailer IDs array', async () => {
            // Arrange
            const userID = 'user-123';
            const retailer_ids: string[] = [];
            const mockPreference = { id: 'pref-123', user_id: userID };

            (dbClient.preference.upsert as jest.Mock).mockResolvedValue(mockPreference);

            // Act
            const result = await updateUserPreference(userID, retailer_ids);

            // Assert
            expect(dbClient.preference.upsert).toHaveBeenCalledWith({
                where: { user_id: userID },
                update: {
                    retailers: {
                        set: [],
                    },
                },
                create: {
                    user_id: userID,
                    retailers: {
                        connect: [],
                    },
                },
            });
            expect(result).toEqual(mockPreference);
        });

        it('should handle preference update errors', async () => {
            // Arrange
            const userID = 'user-123';
            const retailer_ids = ['retailer-1'];
            const dbError = new Error('Preference update failed');
            (dbClient.preference.upsert as jest.Mock).mockRejectedValue(dbError);

            // Act & Assert
            await expect(updateUserPreference(userID, retailer_ids)).rejects.toThrow('Preference update failed');
            expect(logger.error).toHaveBeenCalledWith(dbError);
        });
    });

    describe('getBasketByUserID', () => {
        it('should successfully get basket by user ID', async () => {
            // Arrange
            const userID = 'user-123';
            const mockBasket = {
                id: 'basket-123',
                user_id: userID,
            };

            (dbClient.basket.findUnique as jest.Mock).mockResolvedValue(mockBasket);

            // Act
            const result = await getBasketByUserID(userID);

            // Assert
            expect(dbClient.basket.findUnique).toHaveBeenCalledWith({
                where: { user_id: userID },
            });
            expect(result).toEqual(mockBasket);
        });

        it('should return null when basket not found', async () => {
            // Arrange
            const userID = 'user-123';
            (dbClient.basket.findUnique as jest.Mock).mockResolvedValue(null);

            // Act
            const result = await getBasketByUserID(userID);

            // Assert
            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            // Arrange
            const userID = 'user-123';
            const dbError = new Error('Basket query failed');
            (dbClient.basket.findUnique as jest.Mock).mockRejectedValue(dbError);

            // Act & Assert
            await expect(getBasketByUserID(userID)).rejects.toThrow('Basket query failed');
            expect(logger.error).toHaveBeenCalledWith(dbError);
        });
    });

    describe('createBasket', () => {
        it('should successfully create a new basket', async () => {
            // Arrange
            const basketData = {
                user: { connect: { id: 'user-123' } },
            };
            const mockBasket = {
                id: 'basket-123',
                user_id: 'user-123',
            };

            (dbClient.basket.create as jest.Mock).mockResolvedValue(mockBasket);

            // Act
            const result = await createBasket(basketData);

            // Assert
            expect(dbClient.basket.create).toHaveBeenCalledWith({
                data: basketData,
            });
            expect(result).toEqual(mockBasket);
        });

        it('should handle basket creation errors', async () => {
            // Arrange
            const basketData = {
                user: { connect: { id: 'user-123' } },
            };
            const dbError = new Error('Basket creation failed');
            (dbClient.basket.create as jest.Mock).mockRejectedValue(dbError);

            // Act & Assert
            await expect(createBasket(basketData)).rejects.toThrow('Basket creation failed');
            expect(logger.error).toHaveBeenCalledWith(dbError);
        });
    });

    describe('upsertBasketItem', () => {
        it('should successfully upsert basket item', async () => {
            // Arrange
            const basketItem = {
                master_product: { connect: { id: 'product-123' } },
                basket: { connect: { id: 'basket-123' } },
                quantity: 2,
            };
            const mockBasketItem = {
                id: 'basket-item-123',
                master_product_id: 'product-123',
                basket_id: 'basket-123',
                quantity: 2,
            };

            (dbClient.basketItem.upsert as jest.Mock).mockResolvedValue(mockBasketItem);

            // Act
            const result = await upsertBasketItem(basketItem);

            // Assert
            expect(dbClient.basketItem.upsert).toHaveBeenCalledWith({
                where: {
                    basketitemmatched_unique: {
                        basket_id: 'basket-123',
                        master_product_id: 'product-123',
                    },
                },
                update: { quantity: 2 },
                create: basketItem,
            });
            expect(result).toEqual(mockBasketItem);
        });

        it('should handle upsert errors', async () => {
            // Arrange
            const basketItem = {
                master_product: { connect: { id: 'product-123' } },
                basket: { connect: { id: 'basket-123' } },
                quantity: 1,
            };
            const dbError = new Error('Upsert failed');
            (dbClient.basketItem.upsert as jest.Mock).mockRejectedValue(dbError);

            // Act & Assert
            await expect(upsertBasketItem(basketItem)).rejects.toThrow('Upsert failed');
            expect(logger.error).toHaveBeenCalledWith(dbError);
        });
    });

    describe('deleteBasketByID', () => {
        it('should successfully delete basket and all items', async () => {
            // Arrange
            const basketId = 'basket-123';
            const mockDeletedBasket = { id: basketId };

            (dbClient.basketItem.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });
            (dbClient.basket.delete as jest.Mock).mockResolvedValue(mockDeletedBasket);

            // Act
            const result = await deleteBasketByID(basketId);

            // Assert
            expect(dbClient.basketItem.deleteMany).toHaveBeenCalledWith({
                where: { basket_id: basketId },
            });
            expect(dbClient.basket.delete).toHaveBeenCalledWith({
                where: { id: basketId },
            });
            expect(result).toEqual(mockDeletedBasket);
        });

        it('should handle delete errors', async () => {
            // Arrange
            const basketId = 'basket-123';
            const dbError = new Error('Delete failed');
            (dbClient.basketItem.deleteMany as jest.Mock).mockRejectedValue(dbError);

            // Act & Assert
            await expect(deleteBasketByID(basketId)).rejects.toThrow('Delete failed');
            expect(logger.error).toHaveBeenCalledWith(dbError);
        });
    });

    describe('deleteBasketItemByID', () => {
        it('should successfully delete basket item', async () => {
            // Arrange
            const basketItemId = 'basket-item-123';
            const mockDeletedItem = { id: basketItemId };

            (dbClient.basketItem.delete as jest.Mock).mockResolvedValue(mockDeletedItem);

            // Act
            const result = await deleteBasketItemByID(basketItemId);

            // Assert
            expect(dbClient.basketItem.delete).toHaveBeenCalledWith({
                where: { id: basketItemId },
            });
            expect(result).toEqual(mockDeletedItem);
        });

        it('should handle delete errors', async () => {
            // Arrange
            const basketItemId = 'basket-item-123';
            const dbError = new Error('Item delete failed');
            (dbClient.basketItem.delete as jest.Mock).mockRejectedValue(dbError);

            // Act & Assert
            await expect(deleteBasketItemByID(basketItemId)).rejects.toThrow('Item delete failed');
            expect(logger.error).toHaveBeenCalledWith(dbError);
        });
    });

    describe('getProductByID', () => {
        it('should successfully get product by ID', async () => {
            // Arrange
            const productID = 'product-123';
            const mockProduct = {
                id: productID,
                product_name: 'Test Product',
                brand_name: 'Test Brand',
            };

            (dbClient.masterProduct.findUnique as jest.Mock).mockResolvedValue(mockProduct);

            // Act
            const result = await getProductByID(productID);

            // Assert
            expect(dbClient.masterProduct.findUnique).toHaveBeenCalledWith({
                where: { id: productID },
            });
            expect(result).toEqual(mockProduct);
        });

        it('should return null when product not found', async () => {
            // Arrange
            const productID = 'non-existent-product';
            (dbClient.masterProduct.findUnique as jest.Mock).mockResolvedValue(null);

            // Act
            const result = await getProductByID(productID);

            // Assert
            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            // Arrange
            const productID = 'product-123';
            const dbError = new Error('Product query failed');
            (dbClient.masterProduct.findUnique as jest.Mock).mockRejectedValue(dbError);

            // Act & Assert
            await expect(getProductByID(productID)).rejects.toThrow('Product query failed');
            expect(logger.error).toHaveBeenCalledWith(dbError);
        });
    });

    describe('getPostcodeData', () => {
        it('should successfully get postcode data', async () => {
            // Arrange
            const postcode = 12345;
            const mockPostcodeData = {
                postcode: 12345,
                electorate_rating: 'A',
                suburb: 'Test Suburb',
            };

            (dbClient.postcode.findFirst as jest.Mock).mockResolvedValue(mockPostcodeData);

            // Act
            const result = await getPostcodeData(postcode);

            // Assert
            expect(dbClient.postcode.findFirst).toHaveBeenCalledWith({
                where: { postcode: postcode },
            });
            expect(result).toEqual(mockPostcodeData);
        });

        it('should return null when postcode not found', async () => {
            // Arrange
            const postcode = 99999;
            (dbClient.postcode.findFirst as jest.Mock).mockResolvedValue(null);

            // Act
            const result = await getPostcodeData(postcode);

            // Assert
            expect(result).toBeNull();
        });

        it('should handle database errors', async () => {
            // Arrange
            const postcode = 12345;
            const dbError = new Error('Postcode query failed');
            (dbClient.postcode.findFirst as jest.Mock).mockRejectedValue(dbError);

            // Act & Assert
            await expect(getPostcodeData(postcode)).rejects.toThrow('Postcode query failed');
            expect(logger.error).toHaveBeenCalledWith(dbError);
        });
    });

    describe('getPriceAlertsByUserID', () => {
        it('should successfully get price alerts by user ID', async () => {
            // Arrange
            const userID = 'user-123';
            const mockPriceAlerts = [
                {
                    id: 'alert-1',
                    user_id: userID,
                    product_id: 'product-1',
                    target_price: 50.0,
                },
                {
                    id: 'alert-2',
                    user_id: userID,
                    product_id: 'product-2',
                    target_price: 75.0,
                },
            ];

            (dbClient.priceAlert.findMany as jest.Mock).mockResolvedValue(mockPriceAlerts);

            // Act
            const result = await getPriceAlertsByUserID(userID);

            // Assert
            expect(dbClient.priceAlert.findMany).toHaveBeenCalledWith({
                where: { user_id: userID },
            });
            expect(result).toEqual(mockPriceAlerts);
        });

        it('should return empty array when no alerts found', async () => {
            // Arrange
            const userID = 'user-123';
            (dbClient.priceAlert.findMany as jest.Mock).mockResolvedValue([]);

            // Act
            const result = await getPriceAlertsByUserID(userID);

            // Assert
            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            // Arrange
            const userID = 'user-123';
            const dbError = new Error('Price alerts query failed');
            (dbClient.priceAlert.findMany as jest.Mock).mockRejectedValue(dbError);

            // Act & Assert
            await expect(getPriceAlertsByUserID(userID)).rejects.toThrow('Price alerts query failed');
            expect(logger.error).toHaveBeenCalledWith(dbError);
        });
    });

    describe('monthlyActiveUsersCount', () => {
        it('should successfully get monthly active users count', async () => {
            // Arrange
            const mockResult = [{ count: 150 }];
            (dbClient.$queryRawUnsafe as jest.Mock).mockResolvedValue(mockResult);

            // Act
            const result = await monthlyActiveUsersCount();

            // Assert
            expect(dbClient.$queryRawUnsafe).toHaveBeenCalledWith(
                expect.stringContaining('SELECT COUNT(DISTINCT user_id) as count'),
                expect.any(Date), // startOfMonth
                expect.any(Date), // endOfMonth
            );
            expect(result).toBe(150);
        });

        it('should handle zero count result', async () => {
            // Arrange
            const mockResult = [{ count: 0 }];
            (dbClient.$queryRawUnsafe as jest.Mock).mockResolvedValue(mockResult);

            // Act
            const result = await monthlyActiveUsersCount();

            // Assert
            expect(result).toBe(0);
        });

        it('should handle empty result array', async () => {
            // Arrange
            const mockResult: any[] = [];
            (dbClient.$queryRawUnsafe as jest.Mock).mockResolvedValue(mockResult);

            // Act
            const result = await monthlyActiveUsersCount();

            // Assert
            expect(result).toBeNaN(); // Number(undefined) returns NaN
        });

        it('should handle database errors', async () => {
            // Arrange
            const dbError = new Error('Raw query failed');
            (dbClient.$queryRawUnsafe as jest.Mock).mockRejectedValue(dbError);

            // Act & Assert
            await expect(monthlyActiveUsersCount()).rejects.toThrow('Raw query failed');
            expect(logger.error).toHaveBeenCalledWith(dbError);
        });

        it('should use correct date range for current month', async () => {
            // Arrange
            const mockResult = [{ count: 100 }];
            (dbClient.$queryRawUnsafe as jest.Mock).mockResolvedValue(mockResult);

            // Mock current date using jest.useFakeTimers
            const mockDate = new Date('2024-03-15T10:30:00Z');
            jest.useFakeTimers();
            jest.setSystemTime(mockDate);

            // Act
            await monthlyActiveUsersCount();

            // Assert
            const callArgs = (dbClient.$queryRawUnsafe as jest.Mock).mock.calls[0];
            const startOfMonth = callArgs[1];
            const endOfMonth = callArgs[2];

            expect(startOfMonth).toEqual(new Date('2024-03-01T00:00:00.000Z'));
            expect(endOfMonth).toEqual(new Date('2024-03-31T23:59:59.999Z'));

            // Restore timers
            jest.useRealTimers();
        });
    });
});