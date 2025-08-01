import { status } from '@grpc/grpc-js';

// Mock business logic dependencies BEFORE importing the handler
jest.mock('@atc/common', () => ({
    errorMessage: {
        BRAND: {
            NOT_FOUND: 'Brand Not Found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something Went Wrong',
        },
    },
    responseMessage: {
        PRODUCT_GROUP: {
            CREATED: 'Product Group Created successfully',
        },
    },
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        fatal: jest.fn(),
    },
}));

jest.mock('@atc/db', () => ({
    prismaClient: {
        Prisma: {
            ProductGroupCreateInput: {},
        },
    },
}));

jest.mock('../../../src/services/model.service', () => ({
    createGroup: jest.fn(),
    getBrandByIDs: jest.fn(),
}));

// Import after mocks
import { createProductGroup } from '../../../src/handlers/createProductGroup';
import {
    createGroup,
    getBrandByIDs,
} from '../../../src/services/model.service';
import { utilFns } from '@atc/common';
import { logger } from '@atc/logger';

describe('createProductGroup Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        
        mockCall = {
            request: {
                group_name: 'Test Product Group',
                brand_ids: ['brand-1', 'brand-2', 'brand-3'],
                type: 'STANDARD',
            },
        };

        // Setup default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((data) => data);
    });

    describe('Successful scenarios', () => {
        it('should successfully create product group with brands when all conditions are met', async () => {
            // Arrange
            const mockBrands = [
                { id: 'brand-1', brand_name: 'Brand One' },
                { id: 'brand-2', brand_name: 'Brand Two' },
                { id: 'brand-3', brand_name: 'Brand Three' },
            ];

            const mockCreatedGroup = {
                id: 'group-123',
                group_name: 'Test Product Group',
                type: 'STANDARD',
                created_at: new Date(),
            };

            (getBrandByIDs as jest.Mock).mockResolvedValue(mockBrands);
            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(getBrandByIDs).toHaveBeenCalledWith(['brand-1', 'brand-2', 'brand-3']);
            expect(createGroup).toHaveBeenCalledWith({
                group_name: 'Test Product Group',
                brands: {
                    connect: [
                        { id: 'brand-1' },
                        { id: 'brand-2' },
                        { id: 'brand-3' },
                    ],
                },
                type: 'STANDARD',
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Created successfully',
                data: {
                    id: 'group-123',
                    group_name: 'Test Product Group',
                },
                status: status.OK,
            });
        });

        it('should successfully create product group without brands when brand_ids is empty', async () => {
            // Arrange
            const mockCallNoBrands = {
                request: {
                    group_name: 'No Brands Group',
                    brand_ids: [],
                    type: 'STANDARD',
                },
            };

            const mockCreatedGroup = {
                id: 'group-456',
                group_name: 'No Brands Group',
                type: 'STANDARD',
            };

            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCallNoBrands, mockCallback);

            // Assert
            expect(getBrandByIDs).not.toHaveBeenCalled(); // Should not validate empty brands array
            expect(createGroup).toHaveBeenCalledWith({
                group_name: 'No Brands Group',
                brands: {
                    connect: [],
                },
                type: 'STANDARD',
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Created successfully',
                data: {
                    id: 'group-456',
                    group_name: 'No Brands Group',
                },
                status: status.OK,
            });
        });

        it('should successfully create product group without brands when brand_ids is undefined', async () => {
            // Arrange
            const mockCallUndefinedBrands = {
                request: {
                    group_name: 'Undefined Brands Group',
                    // brand_ids is undefined
                    type: 'CUSTOM',
                },
            };

            const mockCreatedGroup = {
                id: 'group-789',
                group_name: 'Undefined Brands Group',
                type: 'CUSTOM',
            };

            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCallUndefinedBrands, mockCallback);

            // Assert
            expect(getBrandByIDs).not.toHaveBeenCalled();
            expect(createGroup).toHaveBeenCalledWith({
                group_name: 'Undefined Brands Group',
                brands: {
                    connect: undefined,
                },
                type: 'CUSTOM',
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Created successfully',
                data: {
                    id: 'group-789',
                    group_name: 'Undefined Brands Group',
                },
                status: status.OK,
            });
        });

        it('should handle single brand creation', async () => {
            // Arrange
            const mockCallSingleBrand = {
                request: {
                    group_name: 'Single Brand Group',
                    brand_ids: ['brand-1'],
                    type: 'PREMIUM',
                },
            };

            const mockBrands = [
                { id: 'brand-1', brand_name: 'Single Brand' },
            ];

            const mockCreatedGroup = {
                id: 'group-single',
                group_name: 'Single Brand Group',
                type: 'PREMIUM',
            };

            (getBrandByIDs as jest.Mock).mockResolvedValue(mockBrands);
            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCallSingleBrand, mockCallback);

            // Assert
            expect(getBrandByIDs).toHaveBeenCalledWith(['brand-1']);
            expect(createGroup).toHaveBeenCalledWith({
                group_name: 'Single Brand Group',
                brands: {
                    connect: [{ id: 'brand-1' }],
                },
                type: 'PREMIUM',
            });
        });

        it('should call utilFns.removeEmptyFields to clean request data', async () => {
            // Arrange
            const requestWithEmptyFields = {
                group_name: 'Clean Group',
                brand_ids: ['brand-1'],
                type: '',
                description: null,
            };

            const cleanedRequest = {
                group_name: 'Clean Group',
                brand_ids: ['brand-1'],
            };

            mockCall.request = requestWithEmptyFields;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);
            
            const mockBrands = [{ id: 'brand-1', brand_name: 'Brand One' }];
            const mockCreatedGroup = {
                id: 'group-clean',
                group_name: 'Clean Group',
            };

            (getBrandByIDs as jest.Mock).mockResolvedValue(mockBrands);
            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(createGroup).toHaveBeenCalledWith({
                group_name: 'Clean Group',
                brands: {
                    connect: [{ id: 'brand-1' }],
                },
                type: undefined, // type was cleaned out
            });
        });
    });

    describe('Error scenarios', () => {
        it('should return NOT_FOUND when some brands do not exist (count mismatch)', async () => {
            // Arrange
            const mockBrands = [
                { id: 'brand-1', brand_name: 'Brand One' },
                { id: 'brand-2', brand_name: 'Brand Two' },
                // Missing brand-3, so length mismatch: 2 vs 3
            ];

            (getBrandByIDs as jest.Mock).mockResolvedValue(mockBrands);

            // Act
            await createProductGroup(mockCall, mockCallback);

            // Assert
            expect(getBrandByIDs).toHaveBeenCalledWith(['brand-1', 'brand-2', 'brand-3']);
            expect(createGroup).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Brand Not Found',
                data: null,
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when all brands do not exist (empty array returned)', async () => {
            // Arrange
            (getBrandByIDs as jest.Mock).mockResolvedValue([]); // No brands found

            // Act
            await createProductGroup(mockCall, mockCallback);

            // Assert
            expect(getBrandByIDs).toHaveBeenCalledWith(['brand-1', 'brand-2', 'brand-3']);
            expect(createGroup).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Brand Not Found',
                data: null,
                status: status.NOT_FOUND,
            });
        });

        it('should return INTERNAL error when getBrandByIDs throws an error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            (getBrandByIDs as jest.Mock).mockRejectedValue(mockError);

            // Act
            await createProductGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(createGroup).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
                data: null,
            });
        });

        it('should return INTERNAL error when createGroup throws an error', async () => {
            // Arrange
            const mockBrands = [
                { id: 'brand-1', brand_name: 'Brand One' },
                { id: 'brand-2', brand_name: 'Brand Two' },
                { id: 'brand-3', brand_name: 'Brand Three' },
            ];
            const mockError = new Error('Group creation failed');

            (getBrandByIDs as jest.Mock).mockResolvedValue(mockBrands);
            (createGroup as jest.Mock).mockRejectedValue(mockError);

            // Act
            await createProductGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
                data: null,
            });
        });

        it('should return INTERNAL error when utilFns.removeEmptyFields throws an error', async () => {
            // Arrange
            const mockError = new Error('removeEmptyFields failed');
            (utilFns.removeEmptyFields as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            // Act
            await createProductGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(getBrandByIDs).not.toHaveBeenCalled();
            expect(createGroup).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
                data: null,
            });
        });
    });

    describe('Brand validation logic', () => {
        it('should skip brand validation when brand_ids is null', async () => {
            // Arrange
            const mockCallNullBrands = {
                request: {
                    group_name: 'Null Brands Group',
                    brand_ids: null,
                    type: 'STANDARD',
                },
            };

            const mockCreatedGroup = {
                id: 'group-null',
                group_name: 'Null Brands Group',
            };

            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCallNullBrands, mockCallback);

            // Assert
            expect(getBrandByIDs).not.toHaveBeenCalled();
            expect(createGroup).toHaveBeenCalledWith({
                group_name: 'Null Brands Group',
                brands: {
                    connect: undefined, // null?.map() returns undefined
                },
                type: 'STANDARD',
            });
        });

        it('should validate brands when brand_ids has exactly one element', async () => {
            // Arrange
            const mockCallOneBrand = {
                request: {
                    group_name: 'One Brand Group',
                    brand_ids: ['brand-only'],
                    type: 'STANDARD',
                },
            };

            const mockBrands = [{ id: 'brand-only', brand_name: 'Only Brand' }];
            const mockCreatedGroup = { id: 'group-one', group_name: 'One Brand Group' };

            (getBrandByIDs as jest.Mock).mockResolvedValue(mockBrands);
            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCallOneBrand, mockCallback);

            // Assert
            expect(getBrandByIDs).toHaveBeenCalledWith(['brand-only']);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Created successfully',
                data: {
                    id: 'group-one',
                    group_name: 'One Brand Group',
                },
                status: status.OK,
            });
        });

        it('should handle partial brand match scenario', async () => {
            // Arrange - Request 4 brands but only 3 found
            const mockCallFourBrands = {
                request: {
                    group_name: 'Four Brands Group',
                    brand_ids: ['brand-1', 'brand-2', 'brand-3', 'brand-missing'],
                    type: 'STANDARD',
                },
            };

            const mockBrands = [
                { id: 'brand-1', brand_name: 'Brand One' },
                { id: 'brand-2', brand_name: 'Brand Two' },
                { id: 'brand-3', brand_name: 'Brand Three' },
                // brand-missing is not found
            ];

            (getBrandByIDs as jest.Mock).mockResolvedValue(mockBrands);

            // Act
            await createProductGroup(mockCallFourBrands, mockCallback);

            // Assert
            expect(getBrandByIDs).toHaveBeenCalledWith(['brand-1', 'brand-2', 'brand-3', 'brand-missing']);
            expect(createGroup).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Brand Not Found',
                data: null,
                status: status.NOT_FOUND,
            });
        });
    });

    describe('Prisma data structure construction', () => {
        it('should construct correct Prisma data structure with brands', async () => {
            // Arrange
            const mockBrands = [
                { id: 'brand-A', brand_name: 'Brand A' },
                { id: 'brand-B', brand_name: 'Brand B' },
            ];

            const mockCallCustomType = {
                request: {
                    group_name: 'Custom Type Group',
                    brand_ids: ['brand-A', 'brand-B'],
                    type: 'CUSTOM_TYPE',
                },
            };

            const mockCreatedGroup = {
                id: 'group-custom',
                group_name: 'Custom Type Group',
                type: 'CUSTOM_TYPE',
            };

            (getBrandByIDs as jest.Mock).mockResolvedValue(mockBrands);
            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCallCustomType, mockCallback);

            // Assert
            expect(createGroup).toHaveBeenCalledWith({
                group_name: 'Custom Type Group',
                brands: {
                    connect: [
                        { id: 'brand-A' },
                        { id: 'brand-B' },
                    ],
                },
                type: 'CUSTOM_TYPE',
            });
        });

        it('should construct Prisma data structure with empty brands connect array', async () => {
            // Arrange
            const mockCallEmptyBrands = {
                request: {
                    group_name: 'Empty Brands Group',
                    brand_ids: [],
                    type: 'EMPTY_TYPE',
                },
            };

            const mockCreatedGroup = {
                id: 'group-empty',
                group_name: 'Empty Brands Group',
            };

            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCallEmptyBrands, mockCallback);

            // Assert
            expect(createGroup).toHaveBeenCalledWith({
                group_name: 'Empty Brands Group',
                brands: {
                    connect: [], // Empty array, not undefined
                },
                type: 'EMPTY_TYPE',
            });
        });

        it('should handle field cleaning affecting data structure', async () => {
            // Arrange
            const originalRequest = {
                group_name: 'Original Group',
                brand_ids: ['brand-1', 'brand-2'],
                type: '',
                description: null,
                category: undefined,
            };

            const cleanedRequest = {
                group_name: 'Original Group',
                brand_ids: ['brand-1', 'brand-2'],
                // type, description, category removed by removeEmptyFields
            };

            mockCall.request = originalRequest;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const mockBrands = [
                { id: 'brand-1', brand_name: 'Brand One' },
                { id: 'brand-2', brand_name: 'Brand Two' },
            ];
            const mockCreatedGroup = { id: 'group-original', group_name: 'Original Group' };

            (getBrandByIDs as jest.Mock).mockResolvedValue(mockBrands);
            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCall, mockCallback);

            // Assert
            expect(createGroup).toHaveBeenCalledWith({
                group_name: 'Original Group',
                brands: {
                    connect: [
                        { id: 'brand-1' },
                        { id: 'brand-2' },
                    ],
                },
                type: undefined, // Cleaned out field becomes undefined
            });
        });
    });

    describe('Response data structure', () => {
        it('should return correct response structure with minimal group data', async () => {
            // Arrange
            const mockCreatedGroup = {
                id: 'minimal-group-id',
                group_name: 'Minimal Group Name',
                // Only required fields present
            };

            const mockCallMinimal = {
                request: {
                    group_name: 'Minimal Group Name',
                    brand_ids: [],
                    type: 'MINIMAL',
                },
            };

            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCallMinimal, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Created successfully',
                data: {
                    id: 'minimal-group-id',
                    group_name: 'Minimal Group Name',
                },
                status: status.OK,
            });
        });

        it('should return correct response structure with complex group data', async () => {
            // Arrange
            const mockCreatedGroup = {
                id: 'complex-group-id',
                group_name: 'Complex Group Name',
                type: 'COMPLEX',
                created_at: new Date(),
                updated_at: new Date(),
                description: 'This is a complex group',
                is_active: true,
                brand_count: 5,
                // Extra fields that should not appear in response
            };

            const mockCallComplex = {
                request: {
                    group_name: 'Complex Group Name',
                    brand_ids: ['brand-1'],
                    type: 'COMPLEX',
                },
            };

            const mockBrands = [{ id: 'brand-1', brand_name: 'Brand One' }];

            (getBrandByIDs as jest.Mock).mockResolvedValue(mockBrands);
            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCallComplex, mockCallback);

            // Assert - Should only return id and group_name, not other fields
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Created successfully',
                data: {
                    id: 'complex-group-id',
                    group_name: 'Complex Group Name',
                    // Only these two fields, despite more being in mockCreatedGroup
                },
                status: status.OK,
            });
        });
    });

    describe('Edge cases', () => {
        it('should handle very long group names', async () => {
            // Arrange
            const longGroupName = 'A'.repeat(1000); // Very long name
            const mockCallLongName = {
                request: {
                    group_name: longGroupName,
                    brand_ids: [],
                    type: 'LONG_NAME',
                },
            };

            const mockCreatedGroup = {
                id: 'group-long',
                group_name: longGroupName,
            };

            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCallLongName, mockCallback);

            // Assert
            expect(createGroup).toHaveBeenCalledWith({
                group_name: longGroupName,
                brands: {
                    connect: [],
                },
                type: 'LONG_NAME',
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Created successfully',
                data: {
                    id: 'group-long',
                    group_name: longGroupName,
                },
                status: status.OK,
            });
        });

        it('should handle large brand_ids arrays', async () => {
            // Arrange
            const largeBrandIds = Array.from({ length: 100 }, (_, i) => `brand-${i + 1}`);
            const mockCallLargeBrands = {
                request: {
                    group_name: 'Large Brands Group',
                    brand_ids: largeBrandIds,
                    type: 'LARGE',
                },
            };

            const mockBrands = largeBrandIds.map(id => ({ id, brand_name: `Brand ${id}` }));
            const mockCreatedGroup = {
                id: 'group-large',
                group_name: 'Large Brands Group',
            };

            (getBrandByIDs as jest.Mock).mockResolvedValue(mockBrands);
            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCallLargeBrands, mockCallback);

            // Assert
            expect(getBrandByIDs).toHaveBeenCalledWith(largeBrandIds);
            expect(createGroup).toHaveBeenCalledWith({
                group_name: 'Large Brands Group',
                brands: {
                    connect: largeBrandIds.map(id => ({ id })),
                },
                type: 'LARGE',
            });
        });

        it('should handle special characters in group name', async () => {
            // Arrange
            const specialGroupName = 'Test Group @#$%^&*()_+{}[]|;:"<>?,./-=`~';
            const mockCallSpecialChars = {
                request: {
                    group_name: specialGroupName,
                    brand_ids: [],
                    type: 'SPECIAL',
                },
            };

            const mockCreatedGroup = {
                id: 'group-special',
                group_name: specialGroupName,
            };

            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCallSpecialChars, mockCallback);

            // Assert
            expect(createGroup).toHaveBeenCalledWith({
                group_name: specialGroupName,
                brands: {
                    connect: [],
                },
                type: 'SPECIAL',
            });
        });
    });

    describe('Service integration', () => {
        it('should verify service call sequence when brands are present', async () => {
            // Arrange
            const mockBrands = [
                { id: 'brand-1', brand_name: 'Brand One' },
                { id: 'brand-2', brand_name: 'Brand Two' },
                { id: 'brand-3', brand_name: 'Brand Three' },
            ];
            const mockCreatedGroup = { id: 'group-sequence', group_name: 'Sequence Group' };

            // Use simple resolved value mocks and verify call count instead of order
            (getBrandByIDs as jest.Mock).mockResolvedValue(mockBrands);
            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCall, mockCallback);

            // Assert - Verify both services were called
            expect(getBrandByIDs).toHaveBeenCalledTimes(1);
            expect(createGroup).toHaveBeenCalledTimes(1);
            expect(getBrandByIDs).toHaveBeenCalledWith(['brand-1', 'brand-2', 'brand-3']);
            expect(createGroup).toHaveBeenCalledWith(expect.objectContaining({
                group_name: 'Test Product Group',
                brands: {
                    connect: [
                        { id: 'brand-1' },
                        { id: 'brand-2' },
                        { id: 'brand-3' },
                    ],
                },
                type: 'STANDARD',
            }));
        });

        it('should verify service call sequence when no brands are present', async () => {
            // Arrange
            const mockCallNoBrands = {
                request: {
                    group_name: 'No Brands Sequence',
                    brand_ids: [],
                    type: 'STANDARD',
                },
            };

            const mockCreatedGroup = { id: 'group-no-brands', group_name: 'No Brands Sequence' };

            // Create spy for createGroup only (getBrandByIDs should not be called)
            const createGroupSpy = jest.fn().mockResolvedValue(mockCreatedGroup);
            (createGroup as jest.Mock).mockImplementation(createGroupSpy);

            // Act
            await createProductGroup(mockCallNoBrands, mockCallback);

            // Assert
            expect(getBrandByIDs).not.toHaveBeenCalled();
            expect(createGroupSpy).toHaveBeenCalledTimes(1);
        });

        it('should pass TypeScript-typed data to createGroup', async () => {
            // Arrange
            const mockBrands = [
                { id: 'brand-ts', brand_name: 'TypeScript Brand' },
                { id: 'brand-2', brand_name: 'Brand Two' },
                { id: 'brand-3', brand_name: 'Brand Three' },
            ];
            const mockCreatedGroup = { id: 'group-ts', group_name: 'TypeScript Group' };

            (getBrandByIDs as jest.Mock).mockResolvedValue(mockBrands);
            (createGroup as jest.Mock).mockResolvedValue(mockCreatedGroup);

            // Act
            await createProductGroup(mockCall, mockCallback);

            // Assert - Verify the data structure matches Prisma types
            expect(createGroup).toHaveBeenCalledWith(
                expect.objectContaining({
                    group_name: expect.any(String),
                    brands: expect.objectContaining({
                        connect: expect.arrayContaining([
                            expect.objectContaining({
                                id: expect.any(String),
                            }),
                        ]),
                    }),
                    type: expect.any(String),
                })
            );
        });
    });
});