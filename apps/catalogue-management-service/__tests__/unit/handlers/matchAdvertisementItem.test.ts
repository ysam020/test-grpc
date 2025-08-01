import {
    AdItemMatchType,
    errorMessage,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    DefaultResponse,
    DefaultResponse__Output,
    MatchAdvertisementItemRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getAdSuggestedBrandByID,
    getAdSuggestedGroupByID,
    getAdSuggestedProductByID,
    getAdvertisementItemByID,
    updateAdSuggestedBrandByID,
    updateAdSuggestedGroupByID,
    updateAdSuggestedProductByID,
    updateAdvertisementItemByID,
} from '../../../src/services/model.service';
import { prismaClient } from '@atc/db';
import { matchAdvertisementItem } from '../../../src/handlers/matchAdvertisementItem';

// Mock all dependencies following the project pattern
jest.mock('@atc/common', () => ({
    AdItemMatchType: {
        PRODUCT: 'PRODUCT',
        PRODUCT_GROUP: 'PRODUCT_GROUP',
        BRAND: 'BRAND',
    },
    errorMessage: {
        ADVERTISEMENT: {
            ADVERTISEMENT_ITEM_NOT_FOUND: 'Advertisement item not found',
        },
        PRODUCT: {
            NOT_FOUND: 'Product not found',
        },
        PRODUCT_GROUP: {
            NOT_FOUND: 'Product group not found',
        },
        BRAND: {
            NOT_FOUND: 'Brand not found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        ADVERTISEMENT: {
            ADVERTISEMENT_ITEM_MATCHED: 'Advertisement item matched successfully',
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
jest.mock('@atc/db');

describe('matchAdvertisementItem', () => {
    let mockCall: jest.Mocked<CustomServerUnaryCall<MatchAdvertisementItemRequest__Output, DefaultResponse>>;
    let mockCallback: jest.MockedFunction<sendUnaryData<DefaultResponse__Output>>;
    let mockGetAdvertisementItemByID: jest.MockedFunction<typeof getAdvertisementItemByID>;
    let mockGetAdSuggestedProductByID: jest.MockedFunction<typeof getAdSuggestedProductByID>;
    let mockGetAdSuggestedGroupByID: jest.MockedFunction<typeof getAdSuggestedGroupByID>;
    let mockGetAdSuggestedBrandByID: jest.MockedFunction<typeof getAdSuggestedBrandByID>;
    let mockUpdateAdvertisementItemByID: jest.MockedFunction<typeof updateAdvertisementItemByID>;
    let mockUpdateAdSuggestedProductByID: jest.MockedFunction<typeof updateAdSuggestedProductByID>;
    let mockUpdateAdSuggestedGroupByID: jest.MockedFunction<typeof updateAdSuggestedGroupByID>;
    let mockUpdateAdSuggestedBrandByID: jest.MockedFunction<typeof updateAdSuggestedBrandByID>;
    let mockPrismaClient: jest.Mocked<typeof prismaClient>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup service mocks
        mockGetAdvertisementItemByID = getAdvertisementItemByID as jest.MockedFunction<typeof getAdvertisementItemByID>;
        mockGetAdSuggestedProductByID = getAdSuggestedProductByID as jest.MockedFunction<typeof getAdSuggestedProductByID>;
        mockGetAdSuggestedGroupByID = getAdSuggestedGroupByID as jest.MockedFunction<typeof getAdSuggestedGroupByID>;
        mockGetAdSuggestedBrandByID = getAdSuggestedBrandByID as jest.MockedFunction<typeof getAdSuggestedBrandByID>;
        mockUpdateAdvertisementItemByID = updateAdvertisementItemByID as jest.MockedFunction<typeof updateAdvertisementItemByID>;
        mockUpdateAdSuggestedProductByID = updateAdSuggestedProductByID as jest.MockedFunction<typeof updateAdSuggestedProductByID>;
        mockUpdateAdSuggestedGroupByID = updateAdSuggestedGroupByID as jest.MockedFunction<typeof updateAdSuggestedGroupByID>;
        mockUpdateAdSuggestedBrandByID = updateAdSuggestedBrandByID as jest.MockedFunction<typeof updateAdSuggestedBrandByID>;
        mockPrismaClient = prismaClient as jest.Mocked<typeof prismaClient>;

        // Mock call object with default request
        mockCall = {
            request: {
                ad_item_id: 'ad-item-123',
                match_type: 'PRODUCT' as any,
                match_id: 'match-456',
            },
        } as any;

        // Mock callback function
        mockCallback = jest.fn();

        // Default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((obj) => obj);

        // Mock prisma client
        mockPrismaClient.Prisma = {
            AdvertisementItemUpdateInput: {} as any,
        } as any;
    });

    describe('Successful Operations - Product Matching', () => {
        it('should successfully match advertisement item with product', async () => {
            // Arrange
            const mockAdItem = {
                id: 'ad-item-123',
                title: 'Test Ad Item',
                is_matched: false,
            };

            const mockSuggestedProduct = {
                id: 'suggested-product-456',
                is_matched: false,
                MasterProduct: {
                    id: 'master-product-789',
                    product_name: 'Test Product',
                    brand_name: 'Test Brand',
                },
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedProductByID.mockResolvedValue(mockSuggestedProduct);
            mockUpdateAdSuggestedProductByID.mockResolvedValue(undefined);
            mockUpdateAdvertisementItemByID.mockResolvedValue(undefined);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith('ad-item-123');
            expect(mockGetAdSuggestedProductByID).toHaveBeenCalledWith('match-456');
            expect(mockUpdateAdSuggestedProductByID).toHaveBeenCalledWith('suggested-product-456', {
                is_matched: true,
            });
            expect(mockUpdateAdvertisementItemByID).toHaveBeenCalledWith('ad-item-123', {
                is_matched: true,
                MasterProduct: {
                    connect: {
                        id: 'master-product-789',
                    },
                },
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item matched successfully',
                status: status.OK,
            });
        });

        it('should handle product matching with complex product data', async () => {
            // Arrange
            const mockAdItem = {
                id: 'ad-item-complex',
                title: 'Complex Ad Item',
                description: 'Test description',
                is_matched: false,
            };

            const mockSuggestedProduct = {
                id: 'suggested-product-complex',
                confidence_score: 0.95,
                is_matched: false,
                MasterProduct: {
                    id: 'master-product-complex',
                    product_name: 'Samsung Galaxy S24',
                    brand_name: 'Samsung',
                    category: 'Smartphones',
                    price: 899.99,
                    sku: 'SAM-GS24-128',
                },
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedProductByID.mockResolvedValue(mockSuggestedProduct);
            mockUpdateAdSuggestedProductByID.mockResolvedValue(undefined);
            mockUpdateAdvertisementItemByID.mockResolvedValue(undefined);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockUpdateAdvertisementItemByID).toHaveBeenCalledWith('ad-item-123', {
                is_matched: true,
                MasterProduct: {
                    connect: {
                        id: 'master-product-complex',
                    },
                },
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item matched successfully',
                status: status.OK,
            });
        });
    });

    describe('Successful Operations - Product Group Matching', () => {
        it('should successfully match advertisement item with product group', async () => {
            // Arrange
            mockCall.request = {
                ad_item_id: 'ad-item-123',
                match_type: 'PRODUCT_GROUP' as any,
                match_id: 'group-match-456',
            } as any;

            const mockAdItem = {
                id: 'ad-item-123',
                title: 'Test Ad Item',
                is_matched: false,
            };

            const mockSuggestedGroup = {
                id: 'suggested-group-456',
                is_matched: false,
                ProductGroup: {
                    id: 'product-group-789',
                    group_name: 'Electronics Group',
                    type: 'CATEGORY',
                },
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedGroupByID.mockResolvedValue(mockSuggestedGroup);
            mockUpdateAdSuggestedGroupByID.mockResolvedValue(undefined);
            mockUpdateAdvertisementItemByID.mockResolvedValue(undefined);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockGetAdSuggestedGroupByID).toHaveBeenCalledWith('group-match-456');
            expect(mockUpdateAdSuggestedGroupByID).toHaveBeenCalledWith('suggested-group-456', {
                is_matched: true,
            });
            expect(mockUpdateAdvertisementItemByID).toHaveBeenCalledWith('ad-item-123', {
                is_matched: true,
                ProductGroup: {
                    connect: {
                        id: 'product-group-789',
                    },
                },
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item matched successfully',
                status: status.OK,
            });
        });

        it('should handle product group matching with detailed group data', async () => {
            // Arrange
            mockCall.request = {
                ad_item_id: 'ad-item-group',
                match_type: 'PRODUCT_GROUP' as any,
                match_id: 'group-detailed',
            } as any;

            const mockAdItem = {
                id: 'ad-item-group',
                title: 'Group Ad Item',
                is_matched: false,
            };

            const mockSuggestedGroup = {
                id: 'suggested-group-detailed',
                confidence_score: 0.88,
                is_matched: false,
                ProductGroup: {
                    id: 'product-group-detailed',
                    group_name: 'Summer Electronics Collection',
                    type: 'SEASONAL',
                    description: 'Electronics for summer season',
                    created_at: '2024-06-01T00:00:00Z',
                },
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedGroupByID.mockResolvedValue(mockSuggestedGroup);
            mockUpdateAdSuggestedGroupByID.mockResolvedValue(undefined);
            mockUpdateAdvertisementItemByID.mockResolvedValue(undefined);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockUpdateAdvertisementItemByID).toHaveBeenCalledWith('ad-item-group', {
                is_matched: true,
                ProductGroup: {
                    connect: {
                        id: 'product-group-detailed',
                    },
                },
            });
        });
    });

    describe('Successful Operations - Brand Matching', () => {
        it('should successfully match advertisement item with brand', async () => {
            // Arrange
            mockCall.request = {
                ad_item_id: 'ad-item-123',
                match_type: 'BRAND' as any,
                match_id: 'brand-match-456',
            } as any;

            const mockAdItem = {
                id: 'ad-item-123',
                title: 'Test Ad Item',
                is_matched: false,
            };

            const mockSuggestedBrand = {
                id: 'suggested-brand-456',
                is_matched: false,
                Brand: {
                    id: 'brand-789',
                    brand_name: 'Apple',
                    logo_url: 'https://example.com/apple-logo.png',
                },
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedBrandByID.mockResolvedValue(mockSuggestedBrand);
            mockUpdateAdSuggestedBrandByID.mockResolvedValue(undefined);
            mockUpdateAdvertisementItemByID.mockResolvedValue(undefined);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockGetAdSuggestedBrandByID).toHaveBeenCalledWith('brand-match-456');
            expect(mockUpdateAdSuggestedBrandByID).toHaveBeenCalledWith('suggested-brand-456', {
                is_matched: true,
            });
            expect(mockUpdateAdvertisementItemByID).toHaveBeenCalledWith('ad-item-123', {
                is_matched: true,
                Brand: {
                    connect: {
                        id: 'brand-789',
                    },
                },
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item matched successfully',
                status: status.OK,
            });
        });

        it('should handle brand matching with comprehensive brand data', async () => {
            // Arrange
            mockCall.request = {
                ad_item_id: 'ad-item-brand',
                match_type: 'BRAND' as any,
                match_id: 'brand-comprehensive',
            } as any;

            const mockAdItem = {
                id: 'ad-item-brand',
                title: 'Brand Ad Item',
                is_matched: false,
            };

            const mockSuggestedBrand = {
                id: 'suggested-brand-comprehensive',
                confidence_score: 0.92,
                is_matched: false,
                Brand: {
                    id: 'brand-comprehensive',
                    brand_name: 'Samsung Electronics',
                    logo_url: 'https://example.com/samsung-logo.png',
                    website: 'https://samsung.com',
                    description: 'Global technology leader',
                    founded_year: 1938,
                    country: 'South Korea',
                },
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedBrandByID.mockResolvedValue(mockSuggestedBrand);
            mockUpdateAdSuggestedBrandByID.mockResolvedValue(undefined);
            mockUpdateAdvertisementItemByID.mockResolvedValue(undefined);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockUpdateAdvertisementItemByID).toHaveBeenCalledWith('ad-item-brand', {
                is_matched: true,
                Brand: {
                    connect: {
                        id: 'brand-comprehensive',
                    },
                },
            });
        });
    });

    describe('Error Handling - Advertisement Item Not Found', () => {
        it('should return NOT_FOUND when advertisement item does not exist', async () => {
            // Arrange
            mockGetAdvertisementItemByID.mockResolvedValue(null);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith('ad-item-123');
            expect(mockGetAdSuggestedProductByID).not.toHaveBeenCalled();
            expect(mockUpdateAdvertisementItemByID).not.toHaveBeenCalled();
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item not found',
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when advertisement item is undefined', async () => {
            // Arrange
            mockGetAdvertisementItemByID.mockResolvedValue(undefined);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item not found',
                status: status.NOT_FOUND,
            });
        });
    });

    describe('Error Handling - Product Matching Errors', () => {
        it('should return NOT_FOUND when suggested product does not exist', async () => {
            // Arrange
            const mockAdItem = {
                id: 'ad-item-123',
                title: 'Test Ad Item',
                is_matched: false,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedProductByID.mockResolvedValue(null);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockGetAdSuggestedProductByID).toHaveBeenCalledWith('match-456');
            expect(mockUpdateAdSuggestedProductByID).not.toHaveBeenCalled();
            expect(mockUpdateAdvertisementItemByID).not.toHaveBeenCalled();
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product not found',
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when suggested product has no MasterProduct', async () => {
            // Arrange
            const mockAdItem = {
                id: 'ad-item-123',
                title: 'Test Ad Item',
                is_matched: false,
            };

            const mockSuggestedProductWithoutMaster = {
                id: 'suggested-product-456',
                is_matched: false,
                MasterProduct: null,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedProductByID.mockResolvedValue(mockSuggestedProductWithoutMaster);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product not found',
                status: status.NOT_FOUND,
            });
        });
    });

    describe('Error Handling - Product Group Matching Errors', () => {
        it('should return NOT_FOUND when suggested product group does not exist', async () => {
            // Arrange
            mockCall.request = {
                ad_item_id: 'ad-item-123',
                match_type: 'PRODUCT_GROUP' as any,
                match_id: 'group-match-456',
            } as any;

            const mockAdItem = {
                id: 'ad-item-123',
                title: 'Test Ad Item',
                is_matched: false,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedGroupByID.mockResolvedValue(null);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockGetAdSuggestedGroupByID).toHaveBeenCalledWith('group-match-456');
            expect(mockUpdateAdSuggestedGroupByID).not.toHaveBeenCalled();
            expect(mockUpdateAdvertisementItemByID).not.toHaveBeenCalled();
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group not found',
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when suggested product group has no ProductGroup', async () => {
            // Arrange
            mockCall.request = {
                ad_item_id: 'ad-item-123',
                match_type: 'PRODUCT_GROUP' as any,
                match_id: 'group-match-456',
            } as any;

            const mockAdItem = {
                id: 'ad-item-123',
                title: 'Test Ad Item',
                is_matched: false,
            };

            const mockSuggestedGroupWithoutProductGroup = {
                id: 'suggested-group-456',
                is_matched: false,
                ProductGroup: null,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedGroupByID.mockResolvedValue(mockSuggestedGroupWithoutProductGroup);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product group not found',
                status: status.NOT_FOUND,
            });
        });
    });

    describe('Error Handling - Brand Matching Errors', () => {
        it('should return NOT_FOUND when suggested brand does not exist', async () => {
            // Arrange
            mockCall.request = {
                ad_item_id: 'ad-item-123',
                match_type: 'BRAND' as any,
                match_id: 'brand-match-456',
            } as any;

            const mockAdItem = {
                id: 'ad-item-123',
                title: 'Test Ad Item',
                is_matched: false,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedBrandByID.mockResolvedValue(null);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockGetAdSuggestedBrandByID).toHaveBeenCalledWith('brand-match-456');
            expect(mockUpdateAdSuggestedBrandByID).not.toHaveBeenCalled();
            expect(mockUpdateAdvertisementItemByID).not.toHaveBeenCalled();
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Brand not found',
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when suggested brand has no Brand', async () => {
            // Arrange
            mockCall.request = {
                ad_item_id: 'ad-item-123',
                match_type: 'BRAND' as any,
                match_id: 'brand-match-456',
            } as any;

            const mockAdItem = {
                id: 'ad-item-123',
                title: 'Test Ad Item',
                is_matched: false,
            };

            const mockSuggestedBrandWithoutBrand = {
                id: 'suggested-brand-456',
                is_matched: false,
                Brand: null,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedBrandByID.mockResolvedValue(mockSuggestedBrandWithoutBrand);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Brand not found',
                status: status.NOT_FOUND,
            });
        });
    });

    describe('Error Handling - Invalid Match Type', () => {
        it('should return INTERNAL error for invalid match type', async () => {
            // Arrange
            mockCall.request = {
                ad_item_id: 'ad-item-123',
                match_type: 'INVALID_TYPE' as any,
                match_id: 'match-456',
            } as any;

            const mockAdItem = {
                id: 'ad-item-123',
                title: 'Test Ad Item',
                is_matched: false,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockGetAdSuggestedProductByID).not.toHaveBeenCalled();
            expect(mockGetAdSuggestedGroupByID).not.toHaveBeenCalled();
            expect(mockGetAdSuggestedBrandByID).not.toHaveBeenCalled();
            expect(mockUpdateAdvertisementItemByID).not.toHaveBeenCalled();
            
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should return INTERNAL error for undefined match type', async () => {
            // Arrange
            mockCall.request = {
                ad_item_id: 'ad-item-123',
                match_type: undefined as any,
                match_id: 'match-456',
            } as any;

            const mockAdItem = {
                id: 'ad-item-123',
                title: 'Test Ad Item',
                is_matched: false,
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });
    });

    describe('Error Handling - Service Errors', () => {
        it('should handle getAdvertisementItemByID service error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            mockGetAdvertisementItemByID.mockRejectedValue(mockError);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle updateAdvertisementItemByID service error', async () => {
            // Arrange
            const mockAdItem = {
                id: 'ad-item-123',
                title: 'Test Ad Item',
                is_matched: false,
            };

            const mockSuggestedProduct = {
                id: 'suggested-product-456',
                is_matched: false,
                MasterProduct: {
                    id: 'master-product-789',
                    product_name: 'Test Product',
                },
            };

            const mockUpdateError = new Error('Update operation failed');

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedProductByID.mockResolvedValue(mockSuggestedProduct);
            mockUpdateAdSuggestedProductByID.mockResolvedValue(undefined);
            mockUpdateAdvertisementItemByID.mockRejectedValue(mockUpdateError);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockUpdateError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle updateAdSuggestedProductByID service error', async () => {
            // Arrange
            const mockAdItem = {
                id: 'ad-item-123',
                title: 'Test Ad Item',
                is_matched: false,
            };

            const mockSuggestedProduct = {
                id: 'suggested-product-456',
                is_matched: false,
                MasterProduct: {
                    id: 'master-product-789',
                    product_name: 'Test Product',
                },
            };

            const mockSuggestedUpdateError = new Error('Suggested product update failed');

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedProductByID.mockResolvedValue(mockSuggestedProduct);
            mockUpdateAdSuggestedProductByID.mockRejectedValue(mockSuggestedUpdateError);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockSuggestedUpdateError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle utilFns.removeEmptyFields error', async () => {
            // Arrange
            const mockError = new Error('Field removal failed');
            (utilFns.removeEmptyFields as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing parameters in request', async () => {
            // Arrange
            const requestWithoutParams = {};
            const cleanedRequest = {};

            mockCall.request = requestWithoutParams as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            mockGetAdvertisementItemByID.mockResolvedValue(null);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item not found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle empty string parameters', async () => {
            // Arrange
            mockCall.request = {
                ad_item_id: '',
                match_type: 'PRODUCT' as any,
                match_id: '',
            } as any;

            mockGetAdvertisementItemByID.mockResolvedValue(null);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith('');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item not found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle very long IDs', async () => {
            // Arrange
            const longAdItemId = 'a'.repeat(1000);
            const longMatchId = 'b'.repeat(1000);

            mockCall.request = {
                ad_item_id: longAdItemId,
                match_type: 'PRODUCT' as any,
                match_id: longMatchId,
            } as any;

            mockGetAdvertisementItemByID.mockResolvedValue(null);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith(longAdItemId);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item not found',
                status: status.NOT_FOUND,
            });
        });

        it('should properly clean request fields using utilFns.removeEmptyFields', async () => {
            // Arrange
            const requestWithEmptyFields = {
                ad_item_id: 'ad-item-clean',
                match_type: 'BRAND' as any,
                match_id: 'brand-clean',
                empty_field: '',
                null_field: null,
                undefined_field: undefined,
            };

            const cleanedRequest = {
                ad_item_id: 'ad-item-clean',
                match_type: 'BRAND',
                match_id: 'brand-clean',
            };

            mockCall.request = requestWithEmptyFields as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const mockAdItem = {
                id: 'ad-item-clean',
                title: 'Clean Test Ad Item',
                is_matched: false,
            };

            const mockSuggestedBrand = {
                id: 'suggested-brand-clean',
                is_matched: false,
                Brand: {
                    id: 'brand-clean-id',
                    brand_name: 'Clean Brand',
                },
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedBrandByID.mockResolvedValue(mockSuggestedBrand);
            mockUpdateAdSuggestedBrandByID.mockResolvedValue(undefined);
            mockUpdateAdvertisementItemByID.mockResolvedValue(undefined);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(mockGetAdSuggestedBrandByID).toHaveBeenCalledWith('brand-clean');
        });
    });

    describe('Complex Integration Scenarios', () => {
        it('should handle complete product matching workflow with realistic data', async () => {
            // Arrange
            const realisticRequest = {
                ad_item_id: 'summer-banner-item-smartphone-2024',
                match_type: 'PRODUCT' as any,
                match_id: 'suggested-iphone-15-pro',
                extra_param: 'should_be_removed',
                empty_string: '',
            };

            const cleanedRequest = {
                ad_item_id: 'summer-banner-item-smartphone-2024',
                match_type: 'PRODUCT',
                match_id: 'suggested-iphone-15-pro',
            };

            mockCall.request = realisticRequest as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const realisticAdItem = {
                id: 'summer-banner-item-smartphone-2024',
                title: 'Smartphone in Summer Banner',
                description: 'High-end smartphone featured in summer sale banner',
                x_coordinate: 150,
                y_coordinate: 200,
                width: 300,
                height: 400,
                confidence_score: 0.95,
                is_matched: false,
                advertisement_id: 'summer-sale-2024',
                created_at: '2024-06-01T09:00:00Z',
            };

            const realisticSuggestedProduct = {
                id: 'suggested-iphone-15-pro',
                confidence_score: 0.98,
                match_score: 0.92,
                is_matched: false,
                suggested_by: 'AI_ML_MODEL',
                created_at: '2024-06-01T09:15:00Z',
                MasterProduct: {
                    id: 'iphone-15-pro-256gb',
                    product_name: 'iPhone 15 Pro 256GB',
                    brand_name: 'Apple',
                    category: 'Smartphones',
                    subcategory: 'Premium Smartphones',
                    price: 1199.99,
                    currency: 'USD',
                    sku: 'APPL-IP15P-256-TB',
                    barcode: '195949048234',
                    weight: 187,
                    dimensions: {
                        length: 146.6,
                        width: 70.6,
                        height: 8.25,
                    },
                    color: 'Titanium Blue',
                    storage: '256GB',
                    screen_size: '6.1 inch',
                },
            };

            mockGetAdvertisementItemByID.mockResolvedValue(realisticAdItem);
            mockGetAdSuggestedProductByID.mockResolvedValue(realisticSuggestedProduct);
            mockUpdateAdSuggestedProductByID.mockResolvedValue(undefined);
            mockUpdateAdvertisementItemByID.mockResolvedValue(undefined);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(realisticRequest);
            expect(mockGetAdvertisementItemByID).toHaveBeenCalledWith('summer-banner-item-smartphone-2024');
            expect(mockGetAdSuggestedProductByID).toHaveBeenCalledWith('suggested-iphone-15-pro');
            expect(mockUpdateAdSuggestedProductByID).toHaveBeenCalledWith('suggested-iphone-15-pro', {
                is_matched: true,
            });
            expect(mockUpdateAdvertisementItemByID).toHaveBeenCalledWith('summer-banner-item-smartphone-2024', {
                is_matched: true,
                MasterProduct: {
                    connect: {
                        id: 'iphone-15-pro-256gb',
                    },
                },
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item matched successfully',
                status: status.OK,
            });
        });

        it('should handle sequential matching of different types for the same ad item', async () => {
            // Test to ensure the function works correctly for different match types
            const testCases = [
                {
                    matchType: 'PRODUCT' as any,
                    matchId: 'product-match-123',
                    expectedConnect: 'MasterProduct',
                    expectedConnectId: 'master-product-123',
                },
                {
                    matchType: 'PRODUCT_GROUP' as any,
                    matchId: 'group-match-456',
                    expectedConnect: 'ProductGroup',
                    expectedConnectId: 'product-group-456',
                },
                {
                    matchType: 'BRAND' as any,
                    matchId: 'brand-match-789',
                    expectedConnect: 'Brand',
                    expectedConnectId: 'brand-789',
                },
            ];

            for (const testCase of testCases) {
                jest.clearAllMocks();

                mockCall.request = {
                    ad_item_id: 'ad-item-sequential',
                    match_type: testCase.matchType,
                    match_id: testCase.matchId,
                } as any;

                const mockAdItem = {
                    id: 'ad-item-sequential',
                    title: 'Sequential Test Ad Item',
                    is_matched: false,
                };

                mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);

                // Setup appropriate mock based on match type
                if (testCase.matchType === 'PRODUCT') {
                    const mockSuggestedProduct = {
                        id: 'suggested-product-123',
                        is_matched: false,
                        MasterProduct: {
                            id: testCase.expectedConnectId,
                            product_name: 'Test Product',
                        },
                    };
                    mockGetAdSuggestedProductByID.mockResolvedValue(mockSuggestedProduct);
                    mockUpdateAdSuggestedProductByID.mockResolvedValue(undefined);
                } else if (testCase.matchType === 'PRODUCT_GROUP') {
                    const mockSuggestedGroup = {
                        id: 'suggested-group-456',
                        is_matched: false,
                        ProductGroup: {
                            id: testCase.expectedConnectId,
                            group_name: 'Test Group',
                        },
                    };
                    mockGetAdSuggestedGroupByID.mockResolvedValue(mockSuggestedGroup);
                    mockUpdateAdSuggestedGroupByID.mockResolvedValue(undefined);
                } else if (testCase.matchType === 'BRAND') {
                    const mockSuggestedBrand = {
                        id: 'suggested-brand-789',
                        is_matched: false,
                        Brand: {
                            id: testCase.expectedConnectId,
                            brand_name: 'Test Brand',
                        },
                    };
                    mockGetAdSuggestedBrandByID.mockResolvedValue(mockSuggestedBrand);
                    mockUpdateAdSuggestedBrandByID.mockResolvedValue(undefined);
                }

                mockUpdateAdvertisementItemByID.mockResolvedValue(undefined);

                // Act
                await matchAdvertisementItem(mockCall, mockCallback);

                // Assert
                const expectedUpdateData = {
                    is_matched: true,
                    [testCase.expectedConnect]: {
                        connect: {
                            id: testCase.expectedConnectId,
                        },
                    },
                };

                expect(mockUpdateAdvertisementItemByID).toHaveBeenCalledWith(
                    'ad-item-sequential',
                    expectedUpdateData
                );

                expect(mockCallback).toHaveBeenCalledWith(null, {
                    message: 'Advertisement item matched successfully',
                    status: status.OK,
                });
            }
        });

        it('should handle advertisement item with special characters and unicode', async () => {
            // Arrange
            const mockAdItem = {
                id: 'ad-item-unicode',
                title: 'Spéçiál Advërtisemënt Itëm with Émojis 🎯📱',
                description: 'Ünicödé tëxt & spëçiál çharaçtërs in advërtisëmënt',
                is_matched: false,
            };

            const mockSuggestedProduct = {
                id: 'suggested-product-unicode',
                is_matched: false,
                MasterProduct: {
                    id: 'master-product-unicode',
                    product_name: 'Prodüct with Ünicödé Namë 🎯',
                    brand_name: 'Ünicödé Brand ★',
                },
            };

            mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);
            mockGetAdSuggestedProductByID.mockResolvedValue(mockSuggestedProduct);
            mockUpdateAdSuggestedProductByID.mockResolvedValue(undefined);
            mockUpdateAdvertisementItemByID.mockResolvedValue(undefined);

            // Act
            await matchAdvertisementItem(mockCall, mockCallback);

            // Assert
            expect(mockUpdateAdvertisementItemByID).toHaveBeenCalledWith('ad-item-123', {
                is_matched: true,
                MasterProduct: {
                    connect: {
                        id: 'master-product-unicode',
                    },
                },
            });

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Advertisement item matched successfully',
                status: status.OK,
            });
        });
    });

    describe('Update Data Structure Validation', () => {
        it('should always set is_matched to true in base update data', async () => {
            // Test all match types to ensure is_matched is always set
            const testCases = ['PRODUCT', 'PRODUCT_GROUP', 'BRAND'];

            for (const matchType of testCases) {
                jest.clearAllMocks();

                mockCall.request = {
                    ad_item_id: 'ad-item-is-matched-test',
                    match_type: matchType as any,
                    match_id: 'match-test-123',
                } as any;

                const mockAdItem = {
                    id: 'ad-item-is-matched-test',
                    title: 'Is Matched Test',
                    is_matched: false,
                };

                mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);

                // Setup appropriate mocks
                if (matchType === 'PRODUCT') {
                    mockGetAdSuggestedProductByID.mockResolvedValue({
                        id: 'test-suggested',
                        is_matched: false,
                        MasterProduct: { id: 'test-master', product_name: 'Test' },
                    });
                    mockUpdateAdSuggestedProductByID.mockResolvedValue(undefined);
                } else if (matchType === 'PRODUCT_GROUP') {
                    mockGetAdSuggestedGroupByID.mockResolvedValue({
                        id: 'test-suggested',
                        is_matched: false,
                        ProductGroup: { id: 'test-group', group_name: 'Test' },
                    });
                    mockUpdateAdSuggestedGroupByID.mockResolvedValue(undefined);
                } else if (matchType === 'BRAND') {
                    mockGetAdSuggestedBrandByID.mockResolvedValue({
                        id: 'test-suggested',
                        is_matched: false,
                        Brand: { id: 'test-brand', brand_name: 'Test' },
                    });
                    mockUpdateAdSuggestedBrandByID.mockResolvedValue(undefined);
                }

                mockUpdateAdvertisementItemByID.mockResolvedValue(undefined);

                // Act
                await matchAdvertisementItem(mockCall, mockCallback);

                // Assert
                const updateCall = mockUpdateAdvertisementItemByID.mock.calls[0];
                expect(updateCall[1]).toHaveProperty('is_matched', true);
            }
        });

        it('should create correct Prisma connect structure for each match type', async () => {
            // Arrange
            const connectTestCases = [
                {
                    matchType: 'PRODUCT' as any,
                    expectedProperty: 'MasterProduct',
                    mockId: 'master-product-connect-test',
                },
                {
                    matchType: 'PRODUCT_GROUP' as any,
                    expectedProperty: 'ProductGroup',
                    mockId: 'product-group-connect-test',
                },
                {
                    matchType: 'BRAND' as any,
                    expectedProperty: 'Brand',
                    mockId: 'brand-connect-test',
                },
            ];

            for (const testCase of connectTestCases) {
                jest.clearAllMocks();

                mockCall.request = {
                    ad_item_id: 'ad-item-connect-test',
                    match_type: testCase.matchType,
                    match_id: 'connect-test-123',
                } as any;

                const mockAdItem = {
                    id: 'ad-item-connect-test',
                    title: 'Connect Test',
                    is_matched: false,
                };

                mockGetAdvertisementItemByID.mockResolvedValue(mockAdItem);

                // Setup appropriate mocks
                if (testCase.matchType === 'PRODUCT') {
                    mockGetAdSuggestedProductByID.mockResolvedValue({
                        id: 'suggested-connect-test',
                        is_matched: false,
                        MasterProduct: { id: testCase.mockId, product_name: 'Connect Test' },
                    });
                    mockUpdateAdSuggestedProductByID.mockResolvedValue(undefined);
                } else if (testCase.matchType === 'PRODUCT_GROUP') {
                    mockGetAdSuggestedGroupByID.mockResolvedValue({
                        id: 'suggested-connect-test',
                        is_matched: false,
                        ProductGroup: { id: testCase.mockId, group_name: 'Connect Test' },
                    });
                    mockUpdateAdSuggestedGroupByID.mockResolvedValue(undefined);
                } else if (testCase.matchType === 'BRAND') {
                    mockGetAdSuggestedBrandByID.mockResolvedValue({
                        id: 'suggested-connect-test',
                        is_matched: false,
                        Brand: { id: testCase.mockId, brand_name: 'Connect Test' },
                    });
                    mockUpdateAdSuggestedBrandByID.mockResolvedValue(undefined);
                }

                mockUpdateAdvertisementItemByID.mockResolvedValue(undefined);

                // Act
                await matchAdvertisementItem(mockCall, mockCallback);

                // Assert
                const updateCall = mockUpdateAdvertisementItemByID.mock.calls[0];
                const updateData = updateCall[1];

                expect(updateData).toHaveProperty(testCase.expectedProperty);
                expect(updateData[testCase.expectedProperty]).toEqual({
                    connect: {
                        id: testCase.mockId,
                    },
                });
            }
        });
    });
});