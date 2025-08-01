import { logger } from '@atc/logger';
import {
    UpdateUserResponse,
    UpdateUserResponse__Output,
    UpdateUserRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getPostcodeData,
    getUserByID,
    updateUserByID,
    updateUserPreference,
} from '../../../src/services/model.service';
import {
    constants,
    errorMessage,
    invalidateCloudFrontCache,
    putS3Object,
    responseMessage,
    utilFns,
} from '@atc/common';
import { prismaClient } from '@atc/db';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { updateUser } from '../../../src/handlers/updateUser';

// Mock dependencies
jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

jest.mock('../../../src/services/model.service');

jest.mock('@atc/common', () => ({
    constants: {
        PROFILE_PIC_FOLDER: 'profile-pics',
    },
    errorMessage: {
        USER: {
            UNAUTHORIZED_ACCESS: 'Unauthorized access to user data',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        USER: {
            UPDATED: 'User updated successfully',
        },
    },
    utilFns: {
        removeEmptyFields: jest.fn(),
        mapElectorateRatingToRegion: jest.fn(),
        calculateAge: jest.fn(),
    },
    invalidateCloudFrontCache: jest.fn(),
    putS3Object: jest.fn(),
}));

jest.mock('@atc/db', () => ({
    prismaClient: {
        Prisma: {
            UserUpdateInput: {},
        },
    },
}));

const mockGetPostcodeData = getPostcodeData as jest.Mock;
const mockGetUserByID = getUserByID as jest.Mock;
const mockUpdateUserByID = updateUserByID as jest.Mock;
const mockUpdateUserPreference = updateUserPreference as jest.Mock;
const mockUtilFns = utilFns as jest.Mocked<typeof utilFns>;
const mockLogger = logger as jest.Mocked<typeof logger>;
const mockInvalidateCloudFrontCache = invalidateCloudFrontCache as jest.Mock;
const mockPutS3Object = putS3Object as jest.Mock;

describe('updateUser Handler', () => {
    let mockCall: jest.Mocked<CustomServerUnaryCall<UpdateUserRequest__Output, UpdateUserResponse>>;
    let mockCallback: jest.MockedFunction<sendUnaryData<UpdateUserResponse__Output>>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        
        // Default mock implementations
        mockUtilFns.removeEmptyFields.mockImplementation((obj) => obj);
        mockUtilFns.mapElectorateRatingToRegion.mockReturnValue('METRO');
        mockUtilFns.calculateAge.mockReturnValue(25);
        mockInvalidateCloudFrontCache.mockResolvedValue(undefined);
        mockPutS3Object.mockResolvedValue(undefined);
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

    const createMockUser = (overrides = {}) => ({
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        profile_pic: 'user-123',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        address: '123 Main St',
        city: 'Sydney',
        postcode: '2000',
        no_of_adult: 2,
        no_of_children: 1,
        phone_number: '+61123456789',
        birth_date: new Date('1999-01-01'),
        gender: 'MALE',
        age: 25,
        ...overrides,
    });

    const createMockUserData = () => ({
        Preference: {
            retailers: [
                {
                    id: 'retailer-1',
                    retailer_name: 'Test Retailer',
                },
                {
                    id: 'retailer-2',
                    retailer_name: 'Another Retailer',
                },
            ],
        },
    });

    describe('Successful scenarios', () => {
        it('should update user with basic fields successfully', async () => {
            // Arrange
            const mockRequest = {
                id: 'user-123',
                first_name: 'Jane',
                last_name: 'Smith',
                address: '456 New St',
                city: 'Melbourne',
            };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockUpdatedUser = createMockUser({
                first_name: 'Jane',
                last_name: 'Smith',
                address: '456 New St',
                city: 'Melbourne',
            });
            const mockUserData = createMockUserData();

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockUpdateUserByID.mockResolvedValue(mockUpdatedUser);
            mockGetUserByID.mockResolvedValue(mockUserData);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockUpdateUserByID).toHaveBeenCalledWith('user-123', {
                first_name: 'Jane',
                last_name: 'Smith',
                address: '456 New St',
                city: 'Melbourne',
            });
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.USER.UPDATED,
                data: expect.objectContaining({
                    id: 'user-123',
                    first_name: 'Jane',
                    last_name: 'Smith',
                    address: '456 New St',
                    city: 'Melbourne',
                    sample_registered: true,
                }),
                status: status.OK,
            });
        });

        it('should update user with profile picture and handle S3 upload', async () => {
            // Arrange
            const mockRequest = {
                id: 'user-123',
                profile_pic: 'base64encodedimage',
                mime_type: 'image/jpeg',
                content_length: 1024,
            };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockUpdatedUser = createMockUser({ profile_pic: 'user-123' });
            const mockUserData = createMockUserData();

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockUpdateUserByID.mockResolvedValue(mockUpdatedUser);
            mockGetUserByID.mockResolvedValue(mockUserData);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockInvalidateCloudFrontCache).toHaveBeenCalledWith('profile-pics/user-123');
            expect(mockPutS3Object).toHaveBeenCalledWith(
                'profile-pics',
                'base64encodedimage',
                'user-123',
                'image/jpeg',
                1024,
            );
            expect(mockUpdateUserByID).toHaveBeenCalledWith('user-123', {
                profile_pic: 'user-123',
            });
        });

        it('should update user with postcode and calculate region', async () => {
            // Arrange
            const mockRequest = {
                id: 'user-123',
                postcode: '3000',
            };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockPostcodeData = {
                electorate_rating: 'VERY_SAFE_ALP',
            };
            const mockUpdatedUser = createMockUser({
                postcode: '3000',
                region: 'METRO',
            });
            const mockUserData = createMockUserData();

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockGetPostcodeData.mockResolvedValue(mockPostcodeData);
            mockUtilFns.mapElectorateRatingToRegion.mockReturnValue('METRO');
            mockUpdateUserByID.mockResolvedValue(mockUpdatedUser);
            mockGetUserByID.mockResolvedValue(mockUserData);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockGetPostcodeData).toHaveBeenCalledWith('3000');
            expect(mockUtilFns.mapElectorateRatingToRegion).toHaveBeenCalledWith('VERY_SAFE_ALP');
            expect(mockUpdateUserByID).toHaveBeenCalledWith('user-123', {
                postcode: '3000',
                region: 'METRO',
            });
        });

        it('should update user with birth date and calculate age', async () => {
            // Arrange
            const mockBirthDate = '1990-05-15';
            const mockRequest = {
                id: 'user-123',
                birth_date: mockBirthDate,
            };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockUpdatedUser = createMockUser({
                birth_date: new Date(mockBirthDate),
                age: 34,
            });
            const mockUserData = createMockUserData();

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockUtilFns.calculateAge.mockReturnValue(34);
            mockUpdateUserByID.mockResolvedValue(mockUpdatedUser);
            mockGetUserByID.mockResolvedValue(mockUserData);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockUtilFns.calculateAge).toHaveBeenCalledWith(mockBirthDate);
            expect(mockUpdateUserByID).toHaveBeenCalledWith('user-123', {
                birth_date: mockBirthDate,
                age: 34,
            });
        });

        it('should update user preferences with retailer IDs', async () => {
            // Arrange
            const mockRequest = {
                id: 'user-123',
                retailer_ids: ['retailer-1', 'retailer-2', 'retailer-3'],
            };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockUpdatedUser = createMockUser();
            const mockUserData = createMockUserData();

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockUpdateUserByID.mockResolvedValue(mockUpdatedUser);
            mockGetUserByID.mockResolvedValue(mockUserData);
            mockUpdateUserPreference.mockResolvedValue(undefined);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockUpdateUserPreference).toHaveBeenCalledWith('user-123', ['retailer-1', 'retailer-2', 'retailer-3']);
            expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
                data: expect.objectContaining({
                    preferences: {
                        retailers: [
                            {
                                id: 'retailer-1',
                                retailer_name: 'Test Retailer',
                                image_url: '',
                            },
                            {
                                id: 'retailer-2',
                                retailer_name: 'Another Retailer',
                                image_url: '',
                            },
                        ],
                    },
                }),
            }));
        });

        it('should correctly calculate sample_registered status when all required fields are present', async () => {
            // Arrange
            const mockRequest = { id: 'user-123' };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockUpdatedUser = createMockUser(); // All required fields present
            const mockUserData = createMockUserData();

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockUpdateUserByID.mockResolvedValue(mockUpdatedUser);
            mockGetUserByID.mockResolvedValue(mockUserData);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
                data: expect.objectContaining({
                    sample_registered: true,
                }),
            }));
        });

        it('should correctly calculate sample_registered as false when required fields are missing', async () => {
            // Arrange
            const mockRequest = { id: 'user-123' };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockUpdatedUser = createMockUser({
                age: null, // Missing required field
                address: null, // Missing required field
            });
            const mockUserData = createMockUserData();

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockUpdateUserByID.mockResolvedValue(mockUpdatedUser);
            mockGetUserByID.mockResolvedValue(mockUserData);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
                data: expect.objectContaining({
                    sample_registered: false,
                }),
            }));
        });
    });

    describe('Authorization scenarios', () => {
        it('should return UNAUTHENTICATED when user tries to update different user', async () => {
            // Arrange
            const mockRequest = {
                id: 'different-user-456', // Different from userID
            };
            const mockCall = createMockCall(mockRequest, 'user-123');

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockUpdateUserByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.USER.UNAUTHORIZED_ACCESS,
                data: null,
                status: status.UNAUTHENTICATED,
            });
        });
    });

    describe('Edge cases and partial updates', () => {
        it('should handle postcode without electorate data', async () => {
            // Arrange
            const mockRequest = {
                id: 'user-123',
                postcode: '9999', // Invalid postcode
            };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockUpdatedUser = createMockUser({ postcode: '9999' });
            const mockUserData = createMockUserData();

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockGetPostcodeData.mockResolvedValue(null); // No postcode data
            mockUpdateUserByID.mockResolvedValue(mockUpdatedUser);
            mockGetUserByID.mockResolvedValue(mockUserData);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockGetPostcodeData).toHaveBeenCalledWith('9999');
            expect(mockUtilFns.mapElectorateRatingToRegion).not.toHaveBeenCalled();
            expect(mockUpdateUserByID).toHaveBeenCalledWith('user-123', {
                postcode: '9999',
                // region should not be included
            });
        });

        it('should handle empty retailer_ids array', async () => {
            // Arrange
            const mockRequest = {
                id: 'user-123',
                retailer_ids: [], // Empty array
            };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockUpdatedUser = createMockUser();
            const mockUserData = createMockUserData();

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockUpdateUserByID.mockResolvedValue(mockUpdatedUser);
            mockGetUserByID.mockResolvedValue(mockUserData);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockUpdateUserPreference).not.toHaveBeenCalled();
        });

        it('should handle user with no preferences', async () => {
            // Arrange
            const mockRequest = { id: 'user-123' };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockUpdatedUser = createMockUser();
            const mockUserData = { Preference: null }; // No preferences

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockUpdateUserByID.mockResolvedValue(mockUpdatedUser);
            mockGetUserByID.mockResolvedValue(mockUserData);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
                data: expect.objectContaining({
                    preferences: {
                        retailers: [],
                    },
                }),
            }));
        });

        it('should handle null/undefined fields correctly in response', async () => {
            // Arrange
            const mockRequest = { id: 'user-123' };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockUpdatedUser = createMockUser({
                first_name: null,
                last_name: null,
                profile_pic: null,
                address: null,
                city: null,
                postcode: null,
                no_of_adult: null,
                no_of_children: null,
                phone_number: null,
                birth_date: null,
                gender: null,
                createdAt: null,
            });
            const mockUserData = createMockUserData();

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockUpdateUserByID.mockResolvedValue(mockUpdatedUser);
            mockGetUserByID.mockResolvedValue(mockUserData);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
                data: expect.objectContaining({
                    first_name: '',
                    last_name: '',
                    profile_pic: '',
                    address: '',
                    city: '',
                    postcode: 0,
                    no_of_adult: 0,
                    no_of_child: 0,
                    phone_number: '',
                    birth_date: '',
                    gender: '',
                    createdAt: '',
                }),
            }));
        });
    });

    describe('Error handling scenarios', () => {
        it('should handle database errors during user update', async () => {
            // Arrange
            const mockRequest = { id: 'user-123', first_name: 'Jane' };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockError = new Error('Database update failed');

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockUpdateUserByID.mockRejectedValue(mockError);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                data: null,
                status: status.INTERNAL,
            });
        });

        it('should handle S3 upload errors', async () => {
            // Arrange
            const mockRequest = {
                id: 'user-123',
                profile_pic: 'base64encodedimage',
                mime_type: 'image/jpeg',
                content_length: 1024,
            };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockError = new Error('S3 upload failed');

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockPutS3Object.mockRejectedValue(mockError);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                data: null,
                status: status.INTERNAL,
            });
        });

        it('should handle postcode data service errors', async () => {
            // Arrange
            const mockRequest = {
                id: 'user-123',
                postcode: '2000',
            };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockError = new Error('Postcode service failed');

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockGetPostcodeData.mockRejectedValue(mockError);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                data: null,
                status: status.INTERNAL,
            });
        });

        it('should handle preference update errors', async () => {
            // Arrange
            const mockRequest = {
                id: 'user-123',
                retailer_ids: ['retailer-1'],
            };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockError = new Error('Preference update failed');
            const mockUpdatedUser = createMockUser();

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockUpdateUserByID.mockResolvedValue(mockUpdatedUser);
            mockUpdateUserPreference.mockRejectedValue(mockError);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                data: null,
                status: status.INTERNAL,
            });
        });

        it('should handle getUserByID errors', async () => {
            // Arrange
            const mockRequest = { id: 'user-123' };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockError = new Error('Get user failed');
            const mockUpdatedUser = createMockUser();

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockUpdateUserByID.mockResolvedValue(mockUpdatedUser);
            mockGetUserByID.mockRejectedValue(mockError);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                data: null,
                status: status.INTERNAL,
            });
        });
    });

    describe('Complex integration scenarios', () => {
        it('should handle complete user profile update with all fields', async () => {
            // Arrange
            const mockRequest = {
                id: 'user-123',
                first_name: 'Jane',
                last_name: 'Smith',
                profile_pic: 'base64encodedimage',
                mime_type: 'image/jpeg',
                content_length: 1024,
                address: '789 Complete St',
                city: 'Brisbane',
                postcode: '4000',
                no_of_adult: 3,
                no_of_child: 2,
                phone_number: '+61987654321',
                birth_date: '1985-12-25',
                gender: 'FEMALE',
                retailer_ids: ['retailer-1', 'retailer-2'],
            };
            const mockCall = createMockCall(mockRequest, 'user-123');
            const mockPostcodeData = { electorate_rating: 'SAFE_LNP' };
            const mockUpdatedUser = createMockUser({
                first_name: 'Jane',
                last_name: 'Smith',
                profile_pic: 'user-123',
                address: '789 Complete St',
                city: 'Brisbane',
                postcode: '4000',
                region: 'REGIONAL',
                no_of_adult: 3,
                no_of_children: 2,
                phone_number: '+61987654321',
                birth_date: new Date('1985-12-25'),
                age: 39,
                gender: 'FEMALE',
            });
            const mockUserData = createMockUserData();

            mockUtilFns.removeEmptyFields.mockReturnValue(mockRequest);
            mockGetPostcodeData.mockResolvedValue(mockPostcodeData);
            mockUtilFns.mapElectorateRatingToRegion.mockReturnValue('REGIONAL');
            mockUtilFns.calculateAge.mockReturnValue(39);
            mockUpdateUserByID.mockResolvedValue(mockUpdatedUser);
            mockGetUserByID.mockResolvedValue(mockUserData);
            mockUpdateUserPreference.mockResolvedValue(undefined);

            // Act
            await updateUser(mockCall as any, mockCallback);

            // Assert
            expect(mockInvalidateCloudFrontCache).toHaveBeenCalledWith('profile-pics/user-123');
            expect(mockPutS3Object).toHaveBeenCalledWith(
                'profile-pics',
                'base64encodedimage',
                'user-123',
                'image/jpeg',
                1024,
            );
            expect(mockGetPostcodeData).toHaveBeenCalledWith('4000');
            expect(mockUtilFns.calculateAge).toHaveBeenCalledWith('1985-12-25');
            expect(mockUpdateUserByID).toHaveBeenCalledWith('user-123', {
                first_name: 'Jane',
                last_name: 'Smith',
                profile_pic: 'user-123',
                address: '789 Complete St',
                city: 'Brisbane',
                postcode: '4000',
                region: 'REGIONAL',
                no_of_adult: 3,
                no_of_children: 2,
                phone_number: '+61987654321',
                birth_date: '1985-12-25',
                age: 39,
                gender: 'FEMALE',
            });
            expect(mockUpdateUserPreference).toHaveBeenCalledWith('user-123', ['retailer-1', 'retailer-2']);
            expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
                message: responseMessage.USER.UPDATED,
                status: status.OK,
                data: expect.objectContaining({
                    sample_registered: true,
                }),
            }));
        });
    });
});