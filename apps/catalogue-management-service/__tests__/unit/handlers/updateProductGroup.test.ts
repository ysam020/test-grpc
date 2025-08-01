import { updateProductGroup } from '../../../src/handlers/updateProductGroup';
import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    UpdateProductGroupRequest__Output,
    UpdateProductGroupResponse,
    UpdateProductGroupResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { updateProductGroupType } from '../../../src/validations/index';
import {
    getBrandByIDs,
    getGroupByID,
    updateGroup,
} from '../../../src/services/model.service';
import { prismaClient } from '@atc/db';

// Mock all dependencies
jest.mock('@atc/common', () => ({
    errorMessage: {
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
        PRODUCT_GROUP: {
            UPDATED: 'Product group updated successfully',
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

jest.mock('@grpc/grpc-js', () => ({
    status: {
        OK: 0,
        NOT_FOUND: 5,
        INTERNAL: 13,
    },
}));

jest.mock('../../../src/services/model.service', () => ({
    getBrandByIDs: jest.fn(),
    getGroupByID: jest.fn(),
    updateGroup: jest.fn(),
}));

jest.mock('@atc/db');

describe('updateProductGroup', () => {
    let mockCall: jest.Mocked<CustomServerUnaryCall<UpdateProductGroupRequest__Output, UpdateProductGroupResponse>>;
    let mockCallback: jest.MockedFunction<sendUnaryData<UpdateProductGroupResponse__Output>>;
    let mockRemoveEmptyFields: jest.MockedFunction<typeof utilFns.removeEmptyFields>;
    let mockLoggerError: jest.MockedFunction<typeof logger.error>;
    let mockGetGroupByID: jest.MockedFunction<typeof getGroupByID>;
    let mockGetBrandByIDs: jest.MockedFunction<typeof getBrandByIDs>;
    let mockUpdateGroup: jest.MockedFunction<typeof updateGroup>;

    beforeEach(() => {
        // Setup mocks
        mockCall = {
            request: {},
        } as any;

        mockCallback = jest.fn();
        
        mockRemoveEmptyFields = utilFns.removeEmptyFields as jest.MockedFunction<typeof utilFns.removeEmptyFields>;
        mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>;
        mockGetGroupByID = getGroupByID as jest.MockedFunction<typeof getGroupByID>;
        mockGetBrandByIDs = getBrandByIDs as jest.MockedFunction<typeof getBrandByIDs>;
        mockUpdateGroup = updateGroup as jest.MockedFunction<typeof updateGroup>;

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('Successful scenarios', () => {
        it('should successfully update product group with all fields', async () => {
            // Arrange
            const requestData: updateProductGroupType = {
                group_id: 1,
                group_name: 'Updated Group',
                brand_ids: [1, 2, 3],
                type: 'PREMIUM',
            };

            const existingGroup = { id: 1, group_name: 'Old Group' };
            const brands = [{ id: 1 }, { id: 2 }, { id: 3 }];
            const updatedGroup = { id: 1, group_name: 'Updated Group', type: 'PREMIUM' };

            mockRemoveEmptyFields.mockReturnValue(requestData);
            mockGetGroupByID.mockResolvedValue(existingGroup);
            mockGetBrandByIDs.mockResolvedValue(brands);
            mockUpdateGroup.mockResolvedValue(updatedGroup);

            // Act
            await updateProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockRemoveEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(mockGetGroupByID).toHaveBeenCalledWith(1);
            expect(mockGetBrandByIDs).toHaveBeenCalledWith([1, 2, 3]);
            expect(mockUpdateGroup).toHaveBeenCalledWith(1, {
                group_name: 'Updated Group',
                brands: {
                    set: [{ id: 1 }, { id: 2 }, { id: 3 }],
                },
                type: 'PREMIUM',
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.PRODUCT_GROUP.UPDATED,
                status: status.OK,
                data: updatedGroup,
            });
        });

        it('should successfully update product group with only group_name', async () => {
            // Arrange
            const requestData: updateProductGroupType = {
                group_id: 1,
                group_name: 'Updated Group',
            };

            const existingGroup = { id: 1, group_name: 'Old Group' };
            const updatedGroup = { id: 1, group_name: 'Updated Group' };

            mockRemoveEmptyFields.mockReturnValue(requestData);
            mockGetGroupByID.mockResolvedValue(existingGroup);
            mockUpdateGroup.mockResolvedValue(updatedGroup);

            // Act
            await updateProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetBrandByIDs).not.toHaveBeenCalled();
            expect(mockUpdateGroup).toHaveBeenCalledWith(1, {
                group_name: 'Updated Group',
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.PRODUCT_GROUP.UPDATED,
                status: status.OK,
                data: updatedGroup,
            });
        });

        it('should successfully update product group with only brand_ids', async () => {
            // Arrange
            const requestData: updateProductGroupType = {
                group_id: 1,
                brand_ids: [1, 2],
            };

            const existingGroup = { id: 1, group_name: 'Group' };
            const brands = [{ id: 1 }, { id: 2 }];
            const updatedGroup = { id: 1, group_name: 'Group' };

            mockRemoveEmptyFields.mockReturnValue(requestData);
            mockGetGroupByID.mockResolvedValue(existingGroup);
            mockGetBrandByIDs.mockResolvedValue(brands);
            mockUpdateGroup.mockResolvedValue(updatedGroup);

            // Act
            await updateProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockUpdateGroup).toHaveBeenCalledWith(1, {
                brands: {
                    set: [{ id: 1 }, { id: 2 }],
                },
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.PRODUCT_GROUP.UPDATED,
                status: status.OK,
                data: updatedGroup,
            });
        });

        it('should successfully update product group with only type', async () => {
            // Arrange
            const requestData: updateProductGroupType = {
                group_id: 1,
                type: 'BASIC',
            };

            const existingGroup = { id: 1, group_name: 'Group' };
            const updatedGroup = { id: 1, group_name: 'Group', type: 'BASIC' };

            mockRemoveEmptyFields.mockReturnValue(requestData);
            mockGetGroupByID.mockResolvedValue(existingGroup);
            mockUpdateGroup.mockResolvedValue(updatedGroup);

            // Act
            await updateProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetBrandByIDs).not.toHaveBeenCalled();
            expect(mockUpdateGroup).toHaveBeenCalledWith(1, {
                type: 'BASIC',
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.PRODUCT_GROUP.UPDATED,
                status: status.OK,
                data: updatedGroup,
            });
        });
    });

    describe('Error scenarios', () => {
        it('should return NOT_FOUND when product group does not exist', async () => {
            // Arrange
            const requestData: updateProductGroupType = {
                group_id: 999,
                group_name: 'Updated Group',
            };

            mockRemoveEmptyFields.mockReturnValue(requestData);
            mockGetGroupByID.mockResolvedValue(null);

            // Act
            await updateProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetGroupByID).toHaveBeenCalledWith(999);
            expect(mockGetBrandByIDs).not.toHaveBeenCalled();
            expect(mockUpdateGroup).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.PRODUCT_GROUP.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        });

        it('should return NOT_FOUND when some brands do not exist', async () => {
            // Arrange
            const requestData: updateProductGroupType = {
                group_id: 1,
                brand_ids: [1, 2, 999], // 999 doesn't exist
            };

            const existingGroup = { id: 1, group_name: 'Group' };
            const brands = [{ id: 1 }, { id: 2 }]; // Only 2 brands found, but 3 requested

            mockRemoveEmptyFields.mockReturnValue(requestData);
            mockGetGroupByID.mockResolvedValue(existingGroup);
            mockGetBrandByIDs.mockResolvedValue(brands);

            // Act
            await updateProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetGroupByID).toHaveBeenCalledWith(1);
            expect(mockGetBrandByIDs).toHaveBeenCalledWith([1, 2, 999]);
            expect(mockUpdateGroup).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.BRAND.NOT_FOUND,
                data: null,
                status: status.NOT_FOUND,
            });
        });

        it('should handle database errors gracefully', async () => {
            // Arrange
            const requestData: updateProductGroupType = {
                group_id: 1,
                group_name: 'Updated Group',
            };

            const dbError = new Error('Database connection failed');

            mockRemoveEmptyFields.mockReturnValue(requestData);
            mockGetGroupByID.mockRejectedValue(dbError);

            // Act
            await updateProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockLoggerError).toHaveBeenCalledWith(dbError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
                data: null,
            });
        });

        it('should handle updateGroup service errors', async () => {
            // Arrange
            const requestData: updateProductGroupType = {
                group_id: 1,
                group_name: 'Updated Group',
            };

            const existingGroup = { id: 1, group_name: 'Old Group' };
            const updateError = new Error('Update failed');

            mockRemoveEmptyFields.mockReturnValue(requestData);
            mockGetGroupByID.mockResolvedValue(existingGroup);
            mockUpdateGroup.mockRejectedValue(updateError);

            // Act
            await updateProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockLoggerError).toHaveBeenCalledWith(updateError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
                data: null,
            });
        });

        it('should handle getBrandByIDs service errors', async () => {
            // Arrange
            const requestData: updateProductGroupType = {
                group_id: 1,
                brand_ids: [1, 2],
            };

            const existingGroup = { id: 1, group_name: 'Group' };
            const brandError = new Error('Brand service failed');

            mockRemoveEmptyFields.mockReturnValue(requestData);
            mockGetGroupByID.mockResolvedValue(existingGroup);
            mockGetBrandByIDs.mockRejectedValue(brandError);

            // Act
            await updateProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockLoggerError).toHaveBeenCalledWith(brandError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
                data: null,
            });
        });
    });

    describe('Edge cases', () => {
        it('should handle empty brand_ids array', async () => {
            // Arrange
            const requestData: updateProductGroupType = {
                group_id: 1,
                brand_ids: [],
            };

            const existingGroup = { id: 1, group_name: 'Group' };
            const brands: any[] = [];
            const updatedGroup = { id: 1, group_name: 'Group' };

            mockRemoveEmptyFields.mockReturnValue(requestData);
            mockGetGroupByID.mockResolvedValue(existingGroup);
            mockGetBrandByIDs.mockResolvedValue(brands);
            mockUpdateGroup.mockResolvedValue(updatedGroup);

            // Act
            await updateProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetBrandByIDs).toHaveBeenCalledWith([]);
            expect(mockUpdateGroup).toHaveBeenCalledWith(1, {
                brands: {
                    set: [],
                },
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.PRODUCT_GROUP.UPDATED,
                status: status.OK,
                data: updatedGroup,
            });
        });

        it('should handle request with only group_id (no updates)', async () => {
            // Arrange
            const requestData: updateProductGroupType = {
                group_id: 1,
            };

            const existingGroup = { id: 1, group_name: 'Group' };
            const updatedGroup = { id: 1, group_name: 'Group' };

            mockRemoveEmptyFields.mockReturnValue(requestData);
            mockGetGroupByID.mockResolvedValue(existingGroup);
            mockUpdateGroup.mockResolvedValue(updatedGroup);

            // Act
            await updateProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockGetBrandByIDs).not.toHaveBeenCalled();
            expect(mockUpdateGroup).toHaveBeenCalledWith(1, {});
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.PRODUCT_GROUP.UPDATED,
                status: status.OK,
                data: updatedGroup,
            });
        });

        it('should handle null/undefined values in removeEmptyFields result', async () => {
            // Arrange
            const requestData: updateProductGroupType = {
                group_id: 1,
                group_name: undefined,
                brand_ids: undefined,
                type: undefined,
            };

            const existingGroup = { id: 1, group_name: 'Group' };
            const updatedGroup = { id: 1, group_name: 'Group' };

            mockRemoveEmptyFields.mockReturnValue(requestData);
            mockGetGroupByID.mockResolvedValue(existingGroup);
            mockUpdateGroup.mockResolvedValue(updatedGroup);

            // Act
            await updateProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockUpdateGroup).toHaveBeenCalledWith(1, {});
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.PRODUCT_GROUP.UPDATED,
                status: status.OK,
                data: updatedGroup,
            });
        });
    });

    describe('Service integration', () => {
        it('should pass correct parameters to updateGroup with brands mapping', async () => {
            // Arrange
            const requestData: updateProductGroupType = {
                group_id: 1,
                group_name: 'New Name',
                brand_ids: [10, 20, 30],
                type: 'PREMIUM',
            };

            const existingGroup = { id: 1, group_name: 'Old Name' };
            const brands = [{ id: 10 }, { id: 20 }, { id: 30 }];
            const updatedGroup = { id: 1, group_name: 'New Name' };

            mockRemoveEmptyFields.mockReturnValue(requestData);
            mockGetGroupByID.mockResolvedValue(existingGroup);
            mockGetBrandByIDs.mockResolvedValue(brands);
            mockUpdateGroup.mockResolvedValue(updatedGroup);

            const expectedUpdateData: prismaClient.Prisma.ProductGroupUpdateInput = {
                group_name: 'New Name',
                brands: {
                    set: [{ id: 10 }, { id: 20 }, { id: 30 }],
                },
                type: 'PREMIUM',
            };

            // Act
            await updateProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockUpdateGroup).toHaveBeenCalledWith(1, expectedUpdateData);
        });
    });
});