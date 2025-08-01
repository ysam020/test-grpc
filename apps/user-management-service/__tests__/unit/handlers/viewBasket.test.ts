import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    ViewBasketRequest__Output,
    ViewBasketResponse,
    ViewBasketResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getDetailedBasketByUserID,
    getPaginatedBasketByUserID,
    getPriceAlertsByUserID,
} from '../../../src/services/model.service';
import { viewBasket } from '../../../src/handlers/viewBasket';

// Mock dependencies
jest.mock('@atc/common', () => ({
    errorMessage: {
        BASKET: {
            BASKET_NOT_FOUND: 'Basket not found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        BASKET: {
            VIEW_BASKET_SUCCESS: 'Basket retrieved successfully',
        },
    },
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

jest.mock('../../../src/services/model.service');

const mockGetDetailedBasketByUserID = getDetailedBasketByUserID as jest.Mock;
const mockGetPaginatedBasketByUserID = getPaginatedBasketByUserID as jest.Mock;
const mockGetPriceAlertsByUserID = getPriceAlertsByUserID as jest.Mock;
const mockUtilFns = utilFns as jest.Mocked<typeof utilFns>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('viewBasket Handler', () => {
    let mockCall: jest.Mocked<CustomServerUnaryCall<ViewBasketRequest__Output, ViewBasketResponse>>;
    let mockCallback: jest.MockedFunction<sendUnaryData<ViewBasketResponse__Output>>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        
        // Default mock implementations
        mockUtilFns.removeEmptyFields.mockImplementation((obj) => obj);
    });

    const createMockCall = (request: any, userID: string = 'user-123') => ({
        request,
        user: { userID },
        metadata: {
            get: jest.fn(),
            set: jest.fn(),
            add: jest.fn(),
            remove: jest.fn(),
            clone: jest.fn(),
        },
        cancelled: false,
        deadline: new Date(Date.now() + 30000),
        peer: 'localhost:50053',
    });

    const createMockBasketItem = (overrides = {}) => {
        const defaultItem = {
            id: 'basket-item-1',
            master_product_id: 'product-1',
            quantity: 2,
            master_product: {
                product_name: 'Test Product',
                image_url: 'https://example.com/image.jpg',
                category_id: 'category-1',
                rrp: 100.00,
                retailerCurrentPricing: [
                    {
                        retailer_id: 'retailer-1',
                        current_price: 85.50,
                        per_unit_price: 42.75,
                        product_url: 'https://retailer1.com/product',
                        Retailer: {
                            id: 'retailer-1',
                            retailer_name: 'Test Retailer 1',
                            site_url: 'https://retailer1.com',
                        },
                    },
                    {
                        retailer_id: 'retailer-2',
                        current_price: 90.00,
                        per_unit_price: 45.00,
                        product_url: 'https://retailer2.com/product',
                        Retailer: {
                            id: 'retailer-2',
                            retailer_name: 'Test Retailer 2',
                            site_url: 'https://retailer2.com',
                        },
                    },
                ],
            },
        };

        // Deep merge the overrides
        return {
            ...defaultItem,
            ...overrides,
            master_product: {
                ...defaultItem.master_product,
                ...overrides.master_product,
            },
        };
    };

    const createMockBasket = (basketItems = []) => ({
        id: 'basket-123',
        user_id: 'user-123',
        BasketItem: basketItems,
    });

    const createMockPriceAlerts = () => [
        { product_id: 'product-1' },
        { product_id: 'product-3' },
    ];

    const emptyBasketResponse = {
        basket_id: '',
        best_total: 0,
        basket_item: [],
        retailer_totals: [],
        total_count: 0,
    };

    describe('Successful scenarios', () => {
        it('should return basket with items successfully', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 10 };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockBasketItem = createMockBasketItem();
            const mockBasket = createMockBasket([mockBasketItem]);
            const mockPaginatedBasket = createMockBasket([mockBasketItem]);
            const mockPriceAlerts = createMockPriceAlerts();

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 10 });
            mockGetDetailedBasketByUserID.mockResolvedValue(mockBasket);
            mockGetPaginatedBasketByUserID.mockResolvedValue(mockPaginatedBasket);
            mockGetPriceAlertsByUserID.mockResolvedValue(mockPriceAlerts);

            // Act
            await viewBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockGetDetailedBasketByUserID).toHaveBeenCalledWith('user-123', undefined);
            expect(mockGetPaginatedBasketByUserID).toHaveBeenCalledWith('user-123', 1, 10, undefined);
            expect(mockGetPriceAlertsByUserID).toHaveBeenCalledWith('user-123');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.BASKET.VIEW_BASKET_SUCCESS,
                status: status.OK,
                data: expect.objectContaining({
                    basket_id: 'basket-123',
                    best_total: 171.00, // 85.50 * 2
                    basket_item: expect.arrayContaining([
                        expect.objectContaining({
                            product_data: expect.objectContaining({
                                id: 'product-1',
                                product_name: 'Test Product',
                                basket_quantity: 2,
                                is_in_basket: true,
                                is_price_alert_active: true, // product-1 is in price alerts
                            }),
                            best_deal: expect.objectContaining({
                                retailer_id: 'retailer-1',
                                retailer_name: 'Test Retailer 1',
                                retailer_price: '85.50',
                                saving_percentage: '15%', // (100-85.50)/100 * 100 = 14.5% -> ceil = 15%
                            }),
                        }),
                    ]),
                    retailer_totals: expect.arrayContaining([
                        expect.objectContaining({
                            retailer_name: 'Test Retailer 1',
                            total_price: 171.00, // 85.50 * 2
                        }),
                        expect.objectContaining({
                            retailer_name: 'Test Retailer 2',
                            total_price: 180.00, // 90.00 * 2
                        }),
                    ]),
                    total_count: 1,
                }),
            });
        });

        it('should filter by retailer_id when provided', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 10, retailer_id: 'retailer-1' };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockBasketItem = createMockBasketItem();
            const mockBasket = createMockBasket([mockBasketItem]);
            const mockPaginatedBasket = createMockBasket([mockBasketItem]);
            const mockPriceAlerts = [];

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 10, retailer_id: 'retailer-1' });
            mockGetDetailedBasketByUserID.mockResolvedValue(mockBasket);
            mockGetPaginatedBasketByUserID.mockResolvedValue(mockPaginatedBasket);
            mockGetPriceAlertsByUserID.mockResolvedValue(mockPriceAlerts);

            // Act
            await viewBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockGetDetailedBasketByUserID).toHaveBeenCalledWith('user-123', 'retailer-1');
            expect(mockGetPaginatedBasketByUserID).toHaveBeenCalledWith('user-123', 1, 10, 'retailer-1');
        });

        it('should handle items without retailer pricing correctly', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 10 };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockBasketItemWithoutPricing = createMockBasketItem({
                master_product: {
                    product_name: 'Product Without Pricing',
                    rrp: 50.00,
                    retailerCurrentPricing: [], // No pricing available
                },
            });
            const mockBasket = createMockBasket([mockBasketItemWithoutPricing]);
            const mockPaginatedBasket = createMockBasket([mockBasketItemWithoutPricing]);
            const mockPriceAlerts = [];

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 10 });
            mockGetDetailedBasketByUserID.mockResolvedValue(mockBasket);
            mockGetPaginatedBasketByUserID.mockResolvedValue(mockPaginatedBasket);
            mockGetPriceAlertsByUserID.mockResolvedValue(mockPriceAlerts);

            // Act
            await viewBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.BASKET.VIEW_BASKET_SUCCESS,
                status: status.OK,
                data: expect.objectContaining({
                    basket_item: [], // Items without pricing are filtered out
                    total_count: 0,
                }),
            });
        });
    });

    describe('Error scenarios', () => {
        it('should return NOT_FOUND when detailed basket is not found', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 10 };
            const mockCall = createMockCall(mockRequest, 'user-nonexistent');

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 10 });
            mockGetDetailedBasketByUserID.mockResolvedValue(null);

            // Act
            await viewBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockGetDetailedBasketByUserID).toHaveBeenCalledWith('user-nonexistent', undefined);
            expect(mockGetPaginatedBasketByUserID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.BASKET.BASKET_NOT_FOUND,
                status: status.NOT_FOUND,
                data: emptyBasketResponse,
            });
        });

        it('should return NOT_FOUND when paginated basket is not found', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 10 };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockBasket = createMockBasket([createMockBasketItem()]);

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 10 });
            mockGetDetailedBasketByUserID.mockResolvedValue(mockBasket);
            mockGetPaginatedBasketByUserID.mockResolvedValue(null);

            // Act
            await viewBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockGetDetailedBasketByUserID).toHaveBeenCalledWith('user-123', undefined);
            expect(mockGetPaginatedBasketByUserID).toHaveBeenCalledWith('user-123', 1, 10, undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.BASKET.BASKET_NOT_FOUND,
                status: status.NOT_FOUND,
                data: emptyBasketResponse,
            });
        });

        it('should handle database errors during basket retrieval', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 10 };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockError = new Error('Database connection failed');

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 10 });
            mockGetDetailedBasketByUserID.mockRejectedValue(mockError);

            // Act
            await viewBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
                data: null,
            });
        });
    });

    describe('Edge cases', () => {
        it('should handle empty basket items array', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 10 };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockBasket = createMockBasket([]); // Empty basket
            const mockPaginatedBasket = createMockBasket([]);
            const mockPriceAlerts = [];

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 10 });
            mockGetDetailedBasketByUserID.mockResolvedValue(mockBasket);
            mockGetPaginatedBasketByUserID.mockResolvedValue(mockPaginatedBasket);
            mockGetPriceAlertsByUserID.mockResolvedValue(mockPriceAlerts);

            // Act
            await viewBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.BASKET.VIEW_BASKET_SUCCESS,
                status: status.OK,
                data: {
                    basket_id: 'basket-123',
                    best_total: 0,
                    basket_item: [],
                    retailer_totals: [],
                    total_count: 0,
                },
            });
        });

        it('should handle request without pagination parameters', async () => {
            // Arrange
            const mockRequest = {}; // No pagination params
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockBasket = createMockBasket([createMockBasketItem()]);
            const mockPaginatedBasket = createMockBasket([createMockBasketItem()]);
            const mockPriceAlerts = [];

            mockUtilFns.removeEmptyFields.mockReturnValue({});
            mockGetDetailedBasketByUserID.mockResolvedValue(mockBasket);
            mockGetPaginatedBasketByUserID.mockResolvedValue(mockPaginatedBasket);
            mockGetPriceAlertsByUserID.mockResolvedValue(mockPriceAlerts);

            // Act
            await viewBasket(mockCall as any, mockCallback);

            // Assert
            expect(mockGetDetailedBasketByUserID).toHaveBeenCalledWith('user-123', undefined);
            expect(mockGetPaginatedBasketByUserID).toHaveBeenCalledWith('user-123', undefined, undefined, undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
                status: status.OK,
            }));
        });
    });
});