jest.mock('@atc/common', () => ({
    errorMessage: {
        WIDGET: {
            INVALID_DATE_FORMAT: 'Invalid date format',
            BAD_REQUEST: 'Bad request',
        },
        OTHER: {
            BAD_REQUEST: 'Bad request',
            INTERNAL_ERROR: 'Internal error',
            INVALID_INPUT: 'Invalid input',
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
        ADMIN_NOTIFICATION: {
            NOT_FOUND: 'Admin notification not found',
            CREATION_FAILED: 'Failed to create admin notification',
            UPDATE_FAILED: 'Failed to update admin notification',
            DELETE_FAILED: 'Failed to delete admin notification',
        },
        NOTIFICATION: {
            NOT_FOUND: 'Notification not found',
            CREATION_FAILED: 'Failed to create notification',
        },
        PRICE_ALERT: {
            NOT_FOUND: 'Price alert not found',
            ALREADY_EXISTS: 'Price alert already exists',
        },
        USER: {
            NOT_FOUND: 'User not found',
        },
        PRODUCT: {
            NOT_FOUND: 'Product not found',
        },
    },
    responseMessage: {
        ADMIN_NOTIFICATION: {
            CREATED: 'Admin notification created successfully',
            UPDATED: 'Admin notification updated successfully',
            DELETED: 'Admin notification deleted successfully',
            NOT_FOUND: 'Admin notification not found',
            RETRIEVED: 'Admin notifications retrieved successfully',
        },
        NOTIFICATION: {
            CREATED: 'Notification created successfully',
            RETRIEVED: 'Notifications retrieved successfully',
        },
        PRICE_ALERT: {
            CREATED: 'Price alert created successfully',
            DELETED: 'Price alert deleted successfully',
            RETRIEVED: 'Price alerts retrieved successfully',
            ADDED: 'Price alert added successfully',
        },
    },
    status: {
        OK: 0,
        NOT_FOUND: 5,
        INTERNAL: 13,
        INVALID_ARGUMENT: 3,
        ALREADY_EXISTS: 6,
        PERMISSION_DENIED: 7,
    },
    utilFns: {
        removeEmptyFields: jest.fn((obj) => obj),
        validateEmail: jest.fn(() => true),
        validateDate: jest.fn(() => true),
        formatScheduleDate: jest.fn((date, hour, minute) => new Date()),
        generatePaginationMeta: jest.fn(() => ({
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
        })),
    },
    eventBridge: {
        createEventBridgeSchedule: jest.fn().mockResolvedValue(true),
        deleteEventBridgeSchedule: jest.fn().mockResolvedValue(true),
        updateEventBridgeSchedule: jest.fn().mockResolvedValue(true),
        getEventBridgeSchedule: jest.fn().mockResolvedValue({}),
    },
    NotificationTypeEnum: {
        REGISTRATION: 'REGISTRATION',
        PRICE_ALERT: 'PRICE_ALERT',
        PROMOTION: 'PROMOTION',
        SYSTEM: 'SYSTEM',
        ORDER: 'ORDER',
        PAYMENT: 'PAYMENT',
    },
    AdminNotificationStatusEnum: {
        SCHEDULED: 'SCHEDULED',
        SENT: 'SENT',
        FAILED: 'FAILED',
        CANCELLED: 'CANCELLED',
        PENDING: 'PENDING',
    },
    ChannelEnum: {
        EMAIL: 'EMAIL',
        SMS: 'SMS',
        PUSH: 'PUSH',
        IN_APP: 'IN_APP',
    },
    UserRoleEnum: {
        ADMIN: 'ADMIN',
        USER: 'USER',
        MODERATOR: 'MODERATOR',
    },
}));

// Mock @atc/db BEFORE any imports
jest.mock('@atc/db', () => ({
    dbClient: {
        priceAlert: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        masterProduct: {
            findUnique: jest.fn(),
        },
    },
    prismaClient: {
        AdminNotificationStatus: {
            SCHEDULED: 'SCHEDULED',
            SENT: 'SENT',
            FAILED: 'FAILED',
            CANCELLED: 'CANCELLED',
            PENDING: 'PENDING',
        },
        NotificationType: {
            REGISTRATION: 'REGISTRATION',
            PRICE_ALERT: 'PRICE_ALERT',
            PROMOTION: 'PROMOTION',
            SYSTEM: 'SYSTEM',
            ORDER: 'ORDER',
            PAYMENT: 'PAYMENT',
        },
        Channel: {
            EMAIL: 'EMAIL',
            SMS: 'SMS',
            PUSH: 'PUSH',
            IN_APP: 'IN_APP',
        },
    },
}));

// Mock @atc/logger BEFORE any imports
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

// Mock the model service
jest.mock('../../../src/services/model.service', () => ({
    getPriceAlertsByUserID: jest.fn(),
}));

// Mock the client service (for getUserBasket)
jest.mock('../../../src/services/client.service', () => ({
    getUserBasket: jest.fn(),
}));

// NOW import everything AFTER the mocks
import { status } from '@grpc/grpc-js';
import { getPriceAlerts } from '../../../src/handlers/getPriceAlerts';
import { getPriceAlertsByUserID } from '../../../src/services/model.service';
import { getUserBasket } from '../../../src/services/client.service';

const { responseMessage, errorMessage, utilFns } = require('@atc/common');

describe('getPriceAlerts Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        mockCall = {
            request: {
                page: 1,
                limit: 10,
            },
            user: {
                userID: 'user-123',
                role: 'USER',
            },
            metadata: {
                get: jest.fn().mockReturnValue(['auth-token']),
            },
        };
    });

    describe('successful price alerts retrieval', () => {
        it('should get price alerts successfully with data transformation', async () => {
            const mockPriceAlertsResponse = {
                priceAlerts: [
                    {
                        id: 'alert-1',
                        target_price: 100.0,
                        product_id: 'product-1',
                        user_id: 'user-123',
                        createdAt: new Date('2024-01-01'),
                        updatedAt: new Date('2024-01-02'),
                        MasterProduct: {
                            id: 'product-1',
                            product_name: 'Test Product 1',
                            image_url: 'https://example.com/image1.jpg',
                            category_id: 'cat-1',
                            rrp: 120.0,
                            retailerCurrentPricing: [
                                {
                                    current_price: 95.0,
                                    per_unit_price: 1.5,
                                    product_url: 'https://retailer.com/product1',
                                    Retailer: {
                                        id: 'retailer-1',
                                        retailer_name: 'Test Retailer',
                                        site_url: 'https://retailer.com',
                                    },
                                },
                            ],
                        },
                    },
                ],
                total: 1,
            };

            const mockBasketResponse = {
                data: {
                    basket_item: [
                        {
                            product_data: {
                                id: 'product-1',
                                basket_quantity: 2,
                            },
                        },
                    ],
                },
            };

            (getPriceAlertsByUserID as jest.Mock).mockResolvedValue(mockPriceAlertsResponse);
            (getUserBasket as jest.Mock).mockResolvedValue(mockBasketResponse);

            await getPriceAlerts(mockCall, mockCallback);

            expect(getPriceAlertsByUserID).toHaveBeenCalledWith('user-123', 1, 10);
            expect(getUserBasket).toHaveBeenCalledWith(mockCall.metadata);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    status: status.OK,
                    message: responseMessage.PRICE_ALERT.RETRIEVED,
                    data: expect.objectContaining({
                        price_alerts: expect.arrayContaining([
                            expect.objectContaining({
                                price_alert_id: 'alert-1',
                                user_id: 'user-123',
                                target_price: 100.0,
                                product_detail: expect.objectContaining({
                                    product_data: expect.objectContaining({
                                        id: 'product-1',
                                        product_name: 'Test Product 1',
                                        basket_quantity: 2,
                                        is_in_basket: true,
                                        is_price_alert_active: true,
                                    }),
                                    retailer_prices: expect.arrayContaining([
                                        expect.objectContaining({
                                            retailer_id: 'retailer-1',
                                            retailer_name: 'Test Retailer',
                                            retailer_price: '95.00',
                                            saving_percentage: '21%',
                                        }),
                                    ]),
                                    best_deal: expect.objectContaining({
                                        retailer_id: 'retailer-1',
                                        retailer_name: 'Test Retailer',
                                        retailer_price: '95.00',
                                    }),
                                }),
                            }),
                        ]),
                        total_count: 1,
                    }),
                }),
            );
        });

        it('should handle empty price alerts list', async () => {
            const mockEmptyResponse = {
                priceAlerts: [],
                total: 0,
            };

            const mockBasketResponse = {
                data: {
                    basket_item: [],
                },
            };

            (getPriceAlertsByUserID as jest.Mock).mockResolvedValue(mockEmptyResponse);
            (getUserBasket as jest.Mock).mockResolvedValue(mockBasketResponse);

            await getPriceAlerts(mockCall, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    status: status.OK,
                    message: responseMessage.PRICE_ALERT.RETRIEVED,
                    data: expect.objectContaining({
                        price_alerts: [],
                        total_count: 0,
                    }),
                }),
            );
        });

        it('should handle price alerts with no retailer pricing', async () => {
            const mockPriceAlertsResponse = {
                priceAlerts: [
                    {
                        id: 'alert-1',
                        target_price: 100.0,
                        product_id: 'product-1',
                        user_id: 'user-123',
                        createdAt: new Date('2024-01-01'),
                        updatedAt: new Date('2024-01-02'),
                        MasterProduct: {
                            id: 'product-1',
                            product_name: 'Test Product 1',
                            image_url: 'https://example.com/image1.jpg',
                            category_id: 'cat-1',
                            rrp: 120.0,
                            retailerCurrentPricing: [], // No pricing data
                        },
                    },
                ],
                total: 1,
            };

            const mockBasketResponse = {
                data: {
                    basket_item: [],
                },
            };

            (getPriceAlertsByUserID as jest.Mock).mockResolvedValue(mockPriceAlertsResponse);
            (getUserBasket as jest.Mock).mockResolvedValue(mockBasketResponse);

            await getPriceAlerts(mockCall, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    status: status.OK,
                    message: responseMessage.PRICE_ALERT.RETRIEVED,
                    data: expect.objectContaining({
                        price_alerts: expect.arrayContaining([
                            expect.objectContaining({
                                product_detail: expect.objectContaining({
                                    retailer_prices: [],
                                    best_deal: expect.objectContaining({
                                        retailer_id: '',
                                        retailer_name: '',
                                        retailer_price: '0.00',
                                    }),
                                }),
                            }),
                        ]),
                        total_count: 1,
                    }),
                }),
            );
        });
    });

    describe('pagination handling', () => {
        it('should handle custom pagination parameters', async () => {
            const mockCallWithPagination = {
                ...mockCall,
                request: {
                    page: 2,
                    limit: 5,
                },
            };

            const mockResponse = {
                priceAlerts: [],
                total: 10,
            };

            const mockBasketResponse = {
                data: {
                    basket_item: [],
                },
            };

            (getPriceAlertsByUserID as jest.Mock).mockResolvedValue(mockResponse);
            (getUserBasket as jest.Mock).mockResolvedValue(mockBasketResponse);

            await getPriceAlerts(mockCallWithPagination, mockCallback);

            expect(getPriceAlertsByUserID).toHaveBeenCalledWith('user-123', 2, 5);
        });

        it('should handle default pagination when not provided', async () => {
            const mockCallWithoutPagination = {
                ...mockCall,
                request: {}, // No pagination parameters
            };

            const mockResponse = {
                priceAlerts: [],
                total: 0,
            };

            const mockBasketResponse = {
                data: {
                    basket_item: [],
                },
            };

            (getPriceAlertsByUserID as jest.Mock).mockResolvedValue(mockResponse);
            (getUserBasket as jest.Mock).mockResolvedValue(mockBasketResponse);

            await getPriceAlerts(mockCallWithoutPagination, mockCallback);

            expect(getPriceAlertsByUserID).toHaveBeenCalledWith('user-123', undefined, undefined);
        });
    });

    describe('error handling', () => {
        it('should handle database errors gracefully', async () => {
            const mockError = new Error('Database connection failed');
            (getPriceAlertsByUserID as jest.Mock).mockRejectedValue(mockError);

            await getPriceAlerts(mockCall, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                    status: status.INTERNAL,
                    data: null,
                }),
            );

            const { logger } = require('@atc/logger');
            expect(logger.error).toHaveBeenCalledWith(mockError);
        });

        it('should handle basket service errors gracefully', async () => {
            const mockPriceAlertsResponse = {
                priceAlerts: [],
                total: 0,
            };

            (getPriceAlertsByUserID as jest.Mock).mockResolvedValue(mockPriceAlertsResponse);
            (getUserBasket as jest.Mock).mockRejectedValue(new Error('Basket service failed'));

            await getPriceAlerts(mockCall, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                    status: status.INTERNAL,
                    data: null,
                }),
            );
        });

        it('should handle missing user information', async () => {
            const mockCallWithoutUser = {
                ...mockCall,
                user: {}, // No userID
            };

            await getPriceAlerts(mockCallWithoutUser, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                    status: status.INTERNAL,
                    data: null,
                }),
            );
        });
    });

    describe('data transformation', () => {
        it('should correctly calculate saving percentages', async () => {
            const mockPriceAlertsResponse = {
                priceAlerts: [
                    {
                        id: 'alert-1',
                        target_price: 100.0,
                        product_id: 'product-1',
                        user_id: 'user-123',
                        createdAt: new Date('2024-01-01'),
                        updatedAt: new Date('2024-01-02'),
                        MasterProduct: {
                            id: 'product-1',
                            product_name: 'Test Product 1',
                            rrp: 100.0, // RRP of 100
                            retailerCurrentPricing: [
                                {
                                    current_price: 80.0, // 20% savings
                                    Retailer: {
                                        id: 'retailer-1',
                                        retailer_name: 'Test Retailer',
                                    },
                                },
                            ],
                        },
                    },
                ],
                total: 1,
            };

            const mockBasketResponse = {
                data: {
                    basket_item: [],
                },
            };

            (getPriceAlertsByUserID as jest.Mock).mockResolvedValue(mockPriceAlertsResponse);
            (getUserBasket as jest.Mock).mockResolvedValue(mockBasketResponse);

            await getPriceAlerts(mockCall, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                null,
                expect.objectContaining({
                    data: expect.objectContaining({
                        price_alerts: expect.arrayContaining([
                            expect.objectContaining({
                                product_detail: expect.objectContaining({
                                    retailer_prices: expect.arrayContaining([
                                        expect.objectContaining({
                                            saving_percentage: '20%',
                                        }),
                                    ]),
                                }),
                            }),
                        ]),
                    }),
                }),
            );
        });

        it('should sort retailer prices by lowest price first', async () => {
            const mockPriceAlertsResponse = {
                priceAlerts: [
                    {
                        id: 'alert-1',
                        target_price: 100.0,
                        product_id: 'product-1',
                        user_id: 'user-123',
                        createdAt: new Date('2024-01-01'),
                        updatedAt: new Date('2024-01-02'),
                        MasterProduct: {
                            id: 'product-1',
                            product_name: 'Test Product 1',
                            rrp: 100.0,
                            retailerCurrentPricing: [
                                {
                                    current_price: 95.0,
                                    Retailer: {
                                        id: 'retailer-1',
                                        retailer_name: 'Expensive Retailer',
                                    },
                                },
                                {
                                    current_price: 85.0,
                                    Retailer: {
                                        id: 'retailer-2',
                                        retailer_name: 'Cheap Retailer',
                                    },
                                },
                            ],
                        },
                    },
                ],
                total: 1,
            };

            const mockBasketResponse = {
                data: {
                    basket_item: [],
                },
            };

            (getPriceAlertsByUserID as jest.Mock).mockResolvedValue(mockPriceAlertsResponse);
            (getUserBasket as jest.Mock).mockResolvedValue(mockBasketResponse);

            await getPriceAlerts(mockCall, mockCallback);

            const callbackArgs = mockCallback.mock.calls[0][1];
            const priceAlerts = callbackArgs.data.price_alerts;
            const retailerPrices = priceAlerts[0].product_detail.retailer_prices;

            // First item should be the cheapest
            expect(retailerPrices[0].retailer_name).toBe('Cheap Retailer');
            expect(retailerPrices[0].retailer_price).toBe('85.00');
            
            // Best deal should also be the cheapest
            expect(priceAlerts[0].product_detail.best_deal.retailer_name).toBe('Cheap Retailer');
        });
    });
});