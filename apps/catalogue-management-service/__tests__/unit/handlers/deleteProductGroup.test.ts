import { jest } from '@jest/globals';
import { status } from '@grpc/grpc-js';

// Mock business logic dependencies BEFORE importing the handler
jest.mock('@atc/common', () => ({
    errorMessage: {
        PRODUCT_GROUP: {
            NOT_FOUND: 'Product Group Not Found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something Went Wrong',
        },
    },
    responseMessage: {
        PRODUCT_GROUP: {
            DELETED: 'Product Group Deleted successfully',
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

jest.mock('../../../src/services/model.service', () => ({
    getGroupByID: jest.fn(),
    deleteGroupByID: jest.fn(),
}));

// Import after mocks
import { deleteProductGroup } from '../../../src/handlers/deleteProductGroup';
import {
    getGroupByID,
    deleteGroupByID,
} from '../../../src/services/model.service';
import { utilFns } from '@atc/common';
import { logger } from '@atc/logger';

describe('deleteProductGroup Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        
        mockCall = {
            request: {
                group_id: 'group-123',
            },
        };

        // Setup default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((data) => data);
    });

    describe('Successful scenarios', () => {
        it('should successfully delete product group when it exists', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-123',
                group_name: 'Test Product Group',
                type: 'STANDARD',
                created_at: new Date('2024-01-01'),
                updated_at: new Date('2024-01-02'),
                brands: [
                    { id: 'brand-1', brand_name: 'Brand One' },
                    { id: 'brand-2', brand_name: 'Brand Two' },
                ],
                ProductGroupProduct: [
                    { product_id: 'product-1' },
                    { product_id: 'product-2' },
                ],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (deleteGroupByID as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteProductGroup(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(getGroupByID).toHaveBeenCalledWith('group-123');
            expect(deleteGroupByID).toHaveBeenCalledWith('group-123');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Deleted successfully',
                status: status.OK,
            });
        });

        it('should handle product group with minimal data structure', async () => {
            // Arrange
            const mockMinimalGroup = {
                id: 'group-minimal',
                group_name: 'Minimal Group',
                // Only required fields present
            };

            const minimalCall = {
                request: {
                    group_id: 'group-minimal',
                },
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockMinimalGroup);
            (deleteGroupByID as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteProductGroup(minimalCall, mockCallback);

            // Assert
            expect(getGroupByID).toHaveBeenCalledWith('group-minimal');
            expect(deleteGroupByID).toHaveBeenCalledWith('group-minimal');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Deleted successfully',
                status: status.OK,
            });
        });

        it('should handle product group with different ID formats', async () => {
            // Arrange
            const uuidCall = {
                request: {
                    group_id: 'group-550e8400-e29b-41d4-a716-446655440000',
                },
            };

            const mockUuidGroup = {
                id: 'group-550e8400-e29b-41d4-a716-446655440000',
                group_name: 'UUID Group',
                type: 'PREMIUM',
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockUuidGroup);
            (deleteGroupByID as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteProductGroup(uuidCall, mockCallback);

            // Assert
            expect(getGroupByID).toHaveBeenCalledWith('group-550e8400-e29b-41d4-a716-446655440000');
            expect(deleteGroupByID).toHaveBeenCalledWith('group-550e8400-e29b-41d4-a716-446655440000');
        });

        it('should call utilFns.removeEmptyFields to clean request data', async () => {
            // Arrange
            const requestWithEmptyFields = {
                group_id: 'group-123',
                extra_field: '',
                another_field: null,
                unused_field: undefined,
            };

            const cleanedRequest = {
                group_id: 'group-123',
            };

            mockCall.request = requestWithEmptyFields;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const mockProductGroup = {
                id: 'group-123',
                group_name: 'Clean Group',
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (deleteGroupByID as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteProductGroup(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(getGroupByID).toHaveBeenCalledWith('group-123');
        });

        it('should handle product group with complex relationships', async () => {
            // Arrange
            const mockComplexGroup = {
                id: 'group-complex',
                group_name: 'Complex Product Group',
                type: 'ENTERPRISE',
                description: 'A complex group with many relationships',
                brands: [
                    { id: 'brand-1', brand_name: 'Brand Alpha' },
                    { id: 'brand-2', brand_name: 'Brand Beta' },
                    { id: 'brand-3', brand_name: 'Brand Gamma' },
                ],
                ProductGroupProduct: [
                    { product_id: 'product-1' },
                    { product_id: 'product-2' },
                    { product_id: 'product-3' },
                    { product_id: 'product-4' },
                    { product_id: 'product-5' },
                ],
                created_by: 'user-456',
                is_active: true,
            };

            const complexCall = {
                request: {
                    group_id: 'group-complex',
                },
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockComplexGroup);
            (deleteGroupByID as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteProductGroup(complexCall, mockCallback);

            // Assert - Should delete regardless of complex relationships
            expect(deleteGroupByID).toHaveBeenCalledWith('group-complex');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Deleted successfully',
                status: status.OK,
            });
        });
    });

    describe('Error scenarios', () => {
        it('should return NOT_FOUND when product group does not exist', async () => {
            // Arrange
            (getGroupByID as jest.Mock).mockResolvedValue(null);

            // Act
            await deleteProductGroup(mockCall, mockCallback);

            // Assert
            expect(getGroupByID).toHaveBeenCalledWith('group-123');
            expect(deleteGroupByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when product group is undefined', async () => {
            // Arrange
            (getGroupByID as jest.Mock).mockResolvedValue(undefined);

            // Act
            await deleteProductGroup(mockCall, mockCallback);

            // Assert
            expect(getGroupByID).toHaveBeenCalledWith('group-123');
            expect(deleteGroupByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should return INTERNAL error when getGroupByID throws an error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            (getGroupByID as jest.Mock).mockRejectedValue(mockError);

            // Act
            await deleteProductGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(deleteGroupByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should return INTERNAL error when deleteGroupByID throws an error', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-123',
                group_name: 'Test Product Group',
                type: 'STANDARD',
            };
            const mockError = new Error('Delete operation failed');

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (deleteGroupByID as jest.Mock).mockRejectedValue(mockError);

            // Act
            await deleteProductGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle utilFns.removeEmptyFields throwing an error', async () => {
            // Arrange
            const mockError = new Error('removeEmptyFields failed');
            (utilFns.removeEmptyFields as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            // Act
            await deleteProductGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(getGroupByID).not.toHaveBeenCalled();
            expect(deleteGroupByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle database constraint violation errors', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-123',
                group_name: 'Constrained Group',
            };
            const constraintError = new Error('Foreign key constraint violation');

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (deleteGroupByID as jest.Mock).mockRejectedValue(constraintError);

            // Act
            await deleteProductGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(constraintError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });
    });

    describe('Edge cases', () => {
        it('should handle field cleaning that removes group_id', async () => {
            // Arrange
            const cleanedRequest = {
                // group_id removed by removeEmptyFields
            };

            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);
            (getGroupByID as jest.Mock).mockResolvedValue(null);

            // Act
            await deleteProductGroup(mockCall, mockCallback);

            // Assert
            expect(getGroupByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle empty string group_id', async () => {
            // Arrange
            const emptyIdCall = {
                request: {
                    group_id: '',
                },
            };

            const cleanedRequest = {
                // Empty string might be removed by removeEmptyFields
            };

            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);
            (getGroupByID as jest.Mock).mockResolvedValue(null);

            // Act
            await deleteProductGroup(emptyIdCall, mockCallback);

            // Assert
            expect(getGroupByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle null group_id', async () => {
            // Arrange
            const nullIdCall = {
                request: {
                    group_id: null,
                },
            };

            const cleanedRequest = {
                // null might be removed by removeEmptyFields
            };

            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);
            (getGroupByID as jest.Mock).mockResolvedValue(null);

            // Act
            await deleteProductGroup(nullIdCall, mockCallback);

            // Assert
            expect(getGroupByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle special characters in group_id', async () => {
            // Arrange
            const specialIdCall = {
                request: {
                    group_id: 'group-special_123-456@test',
                },
            };

            const mockSpecialGroup = {
                id: 'group-special_123-456@test',
                group_name: 'Special Characters Group',
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockSpecialGroup);
            (deleteGroupByID as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteProductGroup(specialIdCall, mockCallback);

            // Assert
            expect(getGroupByID).toHaveBeenCalledWith('group-special_123-456@test');
            expect(deleteGroupByID).toHaveBeenCalledWith('group-special_123-456@test');
        });

        it('should handle very long group_id', async () => {
            // Arrange
            const longId = 'group-' + 'a'.repeat(1000);
            const longIdCall = {
                request: {
                    group_id: longId,
                },
            };

            const mockLongGroup = {
                id: longId,
                group_name: 'Long ID Group',
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockLongGroup);
            (deleteGroupByID as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteProductGroup(longIdCall, mockCallback);

            // Assert
            expect(getGroupByID).toHaveBeenCalledWith(longId);
            expect(deleteGroupByID).toHaveBeenCalledWith(longId);
        });

        it('should handle case-sensitive group_id', async () => {
            // Arrange
            const caseSensitiveCall = {
                request: {
                    group_id: 'Group-CaSe-SeNsItIvE-123',
                },
            };

            const mockCaseGroup = {
                id: 'Group-CaSe-SeNsItIvE-123',
                group_name: 'Case Sensitive Group',
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockCaseGroup);
            (deleteGroupByID as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteProductGroup(caseSensitiveCall, mockCallback);

            // Assert
            expect(getGroupByID).toHaveBeenCalledWith('Group-CaSe-SeNsItIvE-123');
            expect(deleteGroupByID).toHaveBeenCalledWith('Group-CaSe-SeNsItIvE-123');
        });
    });

    describe('Service integration', () => {
        it('should verify correct service call sequence', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-sequence',
                group_name: 'Sequence Test Group',
            };

            let callOrder = 0;
            const getGroupSpy = jest.fn().mockImplementation(async () => {
                getGroupSpy.callOrder = ++callOrder;
                return mockProductGroup;
            });
            const deleteGroupSpy = jest.fn().mockImplementation(async () => {
                deleteGroupSpy.callOrder = ++callOrder;
                return true;
            });

            (getGroupByID as jest.Mock).mockImplementation(getGroupSpy);
            (deleteGroupByID as jest.Mock).mockImplementation(deleteGroupSpy);

            // Act
            await deleteProductGroup(mockCall, mockCallback);

            // Assert - Verify call order
            expect(getGroupSpy.callOrder).toBeLessThan(deleteGroupSpy.callOrder);
        });

        it('should verify group ID consistency across service calls', async () => {
            // Arrange
            const testGroupId = 'consistent-group-id-test';
            const consistentCall = {
                request: {
                    group_id: testGroupId,
                },
            };

            const mockProductGroup = {
                id: testGroupId,
                group_name: 'Consistency Test Group',
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (deleteGroupByID as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteProductGroup(consistentCall, mockCallback);

            // Assert - Same ID should be used across all service calls
            expect(getGroupByID).toHaveBeenCalledWith(testGroupId);
            expect(deleteGroupByID).toHaveBeenCalledWith(testGroupId);
        });

        it('should handle service response validation', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-validation',
                group_name: 'Validation Test Group',
                // Include extra fields to ensure handler works with any response structure
                extra_field: 'should be ignored',
                metadata: { some: 'data' },
                relations: [],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (deleteGroupByID as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteProductGroup(mockCall, mockCallback);

            // Assert - Handler should work regardless of extra fields in response
            expect(deleteGroupByID).toHaveBeenCalledWith('group-123');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Deleted successfully',
                status: status.OK,
            });
        });

        it('should handle different service response types', async () => {
            // Arrange - Test with boolean true response
            const mockProductGroup = {
                id: 'group-boolean',
                group_name: 'Boolean Response Group',
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (deleteGroupByID as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteProductGroup(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Deleted successfully',
                status: status.OK,
            });
        });

        it('should handle database transaction rollback scenarios', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-transaction',
                group_name: 'Transaction Test Group',
            };
            const transactionError = new Error('Transaction rolled back');

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (deleteGroupByID as jest.Mock).mockRejectedValue(transactionError);

            // Act
            await deleteProductGroup(mockCall, mockCallback);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(transactionError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should verify service isolation and independence', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-isolation',
                group_name: 'Isolation Test Group',
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (deleteGroupByID as jest.Mock).mockResolvedValue(true);

            // Act
            await deleteProductGroup(mockCall, mockCallback);

            // Assert - Each service should be called exactly once
            expect(getGroupByID).toHaveBeenCalledTimes(1);
            expect(deleteGroupByID).toHaveBeenCalledTimes(1);
            
            // Verify no unexpected service calls
            expect(utilFns.removeEmptyFields).toHaveBeenCalledTimes(1);
        });
    });
});