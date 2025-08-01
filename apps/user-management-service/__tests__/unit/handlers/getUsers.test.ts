import { status } from '@grpc/grpc-js';
import { getUsers } from '../../../src/handlers/getUsers';
import { getAllUsers } from '../../../src/services/model.service';
import { logger } from '@atc/logger';
import { errorMessage, responseMessage, utilFns } from '@atc/common';

// Mock dependencies
jest.mock('../../../src/services/model.service');
jest.mock('@atc/logger');
jest.mock('@atc/common', () => ({
    errorMessage: {
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        USER: {
            RETRIEVED: 'Users retrieved successfully',
        },
    },
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
}));

const mockGetAllUsers = getAllUsers as jest.Mock;
const mockUtilFns = utilFns as jest.Mocked<typeof utilFns>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('getUsers Handler', () => {
    let mockCallback: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
    });

    const createMockCall = (request: any) => ({
        request,
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

    describe('Successful scenarios', () => {
        it('should retrieve users successfully with pagination', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 10 };
            const mockCall = createMockCall(mockRequest);
            
            const mockUsers = [
                {
                    id: 'user-1',
                    age: 25,
                    email: 'user1@example.com',
                    gender: 'MALE',
                    no_of_adult: 2,
                    no_of_children: 1,
                    postcode: '12345',
                },
                {
                    id: 'user-2',
                    age: 30,
                    email: 'user2@example.com',
                    gender: 'FEMALE',
                    no_of_adult: 1,
                    no_of_children: 0,
                    postcode: '67890',
                },
            ];
            
            const mockResponse = {
                users: mockUsers,
                totalCount: 25,
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 10 });
            mockGetAllUsers.mockResolvedValue(mockResponse);

            // Act
            await getUsers(mockCall as any, mockCallback);

            // Assert
            expect(mockUtilFns.removeEmptyFields).toHaveBeenCalledWith(mockRequest);
            expect(mockGetAllUsers).toHaveBeenCalledWith(1, 10);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.USER.RETRIEVED,
                data: {
                    users: [
                        {
                            id: 'user-1',
                            age: 25,
                            email: '********',
                            gender: 'MALE',
                            no_of_adult: 2,
                            no_of_child: 1,
                            postcode: '12345',
                        },
                        {
                            id: 'user-2',
                            age: 30,
                            email: '********',
                            gender: 'FEMALE',
                            no_of_adult: 1,
                            no_of_child: 0,
                            postcode: '67890',
                        },
                    ],
                    total_count: 25,
                },
                status: status.OK,
            });
        });

        it('should handle empty user list', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 10 };
            const mockCall = createMockCall(mockRequest);
            
            const mockResponse = {
                users: [],
                totalCount: 0,
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 10 });
            mockGetAllUsers.mockResolvedValue(mockResponse);

            // Act
            await getUsers(mockCall as any, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.USER.RETRIEVED,
                data: {
                    users: [],
                    total_count: 0,
                },
                status: status.OK,
            });
        });

        it('should handle users with missing optional fields', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 5 };
            const mockCall = createMockCall(mockRequest);
            
            const mockUsers = [
                {
                    id: 'user-3',
                    email: 'user3@example.com',
                    // Missing: age, gender, no_of_adult, no_of_children, postcode
                },
                {
                    id: 'user-4',
                    age: null,
                    email: 'user4@example.com',
                    gender: null,
                    no_of_adult: null,
                    no_of_children: null,
                    postcode: null,
                },
            ];
            
            const mockResponse = {
                users: mockUsers,
                totalCount: 2,
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 5 });
            mockGetAllUsers.mockResolvedValue(mockResponse);

            // Act
            await getUsers(mockCall as any, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: responseMessage.USER.RETRIEVED,
                data: {
                    users: [
                        {
                            id: 'user-3',
                            age: 0,
                            email: '********',
                            gender: '',
                            no_of_adult: 0,
                            no_of_child: 0,
                            postcode: 0,
                        },
                        {
                            id: 'user-4',
                            age: 0,
                            email: '********',
                            gender: '',
                            no_of_adult: 0,
                            no_of_child: 0,
                            postcode: 0,
                        },
                    ],
                    total_count: 2,
                },
                status: status.OK,
            });
        });

        it('should handle request without pagination parameters', async () => {
            // Arrange
            const mockRequest = {};
            const mockCall = createMockCall(mockRequest);
            
            const mockResponse = {
                users: [],
                totalCount: 0,
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({});
            mockGetAllUsers.mockResolvedValue(mockResponse);

            // Act
            await getUsers(mockCall as any, mockCallback);

            // Assert
            expect(mockUtilFns.removeEmptyFields).toHaveBeenCalledWith(mockRequest);
            expect(mockGetAllUsers).toHaveBeenCalledWith(undefined, undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
                status: status.OK,
            }));
        });
    });

    describe('Error handling scenarios', () => {
        it('should handle database service errors', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 10 };
            const mockCall = createMockCall(mockRequest);
            const mockError = new Error('Database connection failed');

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 10 });
            mockGetAllUsers.mockRejectedValue(mockError);

            // Act
            await getUsers(mockCall as any, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                data: { users: [], total_count: 0 },
                status: status.INTERNAL,
            });
        });

        it('should handle unexpected errors during user mapping', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 10 };
            const mockCall = createMockCall(mockRequest);
            
            // Mock users with properties that might cause mapping errors
            const mockUsers = [null, undefined];
            const mockResponse = {
                users: mockUsers,
                totalCount: 2,
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 10 });
            mockGetAllUsers.mockResolvedValue(mockResponse);

            // Act
            await getUsers(mockCall as any, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                data: { users: [], total_count: 0 },
                status: status.INTERNAL,
            });
        });

        it('should handle utilFns.removeEmptyFields throwing an error', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 10 };
            const mockCall = createMockCall(mockRequest);
            const mockError = new Error('removeEmptyFields failed');

            mockUtilFns.removeEmptyFields.mockImplementation(() => {
                throw mockError;
            });

            // Act
            await getUsers(mockCall as any, mockCallback);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(mockError);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                data: { users: [], total_count: 0 },
                status: status.INTERNAL,
            });
        });
    });

    describe('Data transformation', () => {
        it('should mask email addresses correctly', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 1 };
            const mockCall = createMockCall(mockRequest);
            
            const mockUsers = [
                {
                    id: 'user-1',
                    email: 'test.user@example.com',
                    age: 25,
                    gender: 'MALE',
                    no_of_adult: 2,
                    no_of_children: 1,
                    postcode: '12345',
                },
            ];
            
            const mockResponse = {
                users: mockUsers,
                totalCount: 1,
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 1 });
            mockGetAllUsers.mockResolvedValue(mockResponse);

            // Act
            await getUsers(mockCall as any, mockCallback);

            // Assert
            const callbackArg = mockCallback.mock.calls[0][1];
            expect(callbackArg.data.users[0].email).toBe('********');
        });

        it('should convert no_of_children to no_of_child correctly', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 1 };
            const mockCall = createMockCall(mockRequest);
            
            const mockUsers = [
                {
                    id: 'user-1',
                    email: 'test@example.com',
                    no_of_children: 3,
                },
            ];
            
            const mockResponse = {
                users: mockUsers,
                totalCount: 1,
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 1 });
            mockGetAllUsers.mockResolvedValue(mockResponse);

            // Act
            await getUsers(mockCall as any, mockCallback);

            // Assert
            const callbackArg = mockCallback.mock.calls[0][1];
            expect(callbackArg.data.users[0].no_of_child).toBe(3);
            expect(callbackArg.data.users[0]).not.toHaveProperty('no_of_children');
        });

        it('should handle postcode values correctly', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 1 };
            const mockCall = createMockCall(mockRequest);
            
            const mockUsers = [
                {
                    id: 'user-1',
                    email: 'test@example.com',
                    postcode: '12345', // String postcode
                },
                {
                    id: 'user-2',
                    email: 'test2@example.com',
                    postcode: null, // Null postcode should become 0
                },
                {
                    id: 'user-3',
                    email: 'test3@example.com',
                    postcode: 67890, // Numeric postcode
                },
            ];
            
            const mockResponse = {
                users: mockUsers,
                totalCount: 3,
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 1 });
            mockGetAllUsers.mockResolvedValue(mockResponse);

            // Act
            await getUsers(mockCall as any, mockCallback);

            // Assert
            const callbackArg = mockCallback.mock.calls[0][1];
            expect(callbackArg.data.users[0].postcode).toBe('12345'); // String remains string
            expect(callbackArg.data.users[1].postcode).toBe(0); // Null becomes 0
            expect(callbackArg.data.users[2].postcode).toBe(67890); // Number remains number
        });
    });

    describe('Edge cases', () => {
        it('should handle large user datasets', async () => {
            // Arrange
            const mockRequest = { page: 1, limit: 1000 };
            const mockCall = createMockCall(mockRequest);
            
            const mockUsers = Array.from({ length: 1000 }, (_, index) => ({
                id: `user-${index + 1}`,
                email: `user${index + 1}@example.com`,
                age: 20 + (index % 50),
                gender: index % 2 === 0 ? 'MALE' : 'FEMALE',
                no_of_adult: 1 + (index % 3),
                no_of_children: index % 4,
                postcode: `${10000 + index}`,
            }));
            
            const mockResponse = {
                users: mockUsers,
                totalCount: 5000,
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 1, limit: 1000 });
            mockGetAllUsers.mockResolvedValue(mockResponse);

            // Act
            await getUsers(mockCall as any, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
                status: status.OK,
                data: expect.objectContaining({
                    users: expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(String),
                            email: '********',
                        }),
                    ]),
                    total_count: 5000,
                }),
            }));
            expect(mockCallback.mock.calls[0][1].data.users).toHaveLength(1000);
        });

        it('should handle zero pagination values', async () => {
            // Arrange
            const mockRequest = { page: 0, limit: 0 };
            const mockCall = createMockCall(mockRequest);
            
            const mockResponse = {
                users: [],
                totalCount: 0,
            };

            mockUtilFns.removeEmptyFields.mockReturnValue({ page: 0, limit: 0 });
            mockGetAllUsers.mockResolvedValue(mockResponse);

            // Act
            await getUsers(mockCall as any, mockCallback);

            // Assert
            expect(mockGetAllUsers).toHaveBeenCalledWith(0, 0);
            expect(mockCallback).toHaveBeenCalledWith(null, expect.objectContaining({
                status: status.OK,
            }));
        });
    });
});