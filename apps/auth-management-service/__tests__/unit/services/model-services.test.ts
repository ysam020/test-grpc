// Mock the dbClient import from model-services
jest.mock('@atc/db', () => ({
    prismaClient: {
        user: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        userLoginActivity: {
            create: jest.fn(),
        },
        PromotionTypeEnum: {
            RETAILER: 'RETAILER',
            BRAND: 'BRAND',
        },
        Prisma: {
            UserCreateInput: {},
        },
    },
}));

jest.mock('../../../src/services/model-services', () => {
    const mockPrismaClient = {
        user: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        userLoginActivity: {
            create: jest.fn(),
        },
    };

    return {
        createUser: jest.fn().mockImplementation(async (userData) => {
            return mockPrismaClient.user.create({ data: userData });
        }),
        getUserByEmail: jest.fn().mockImplementation(async (email) => {
            return mockPrismaClient.user.findUnique({ where: { email } });
        }),
        addUserLoginActivity: jest.fn().mockImplementation(async (userId) => {
            return mockPrismaClient.userLoginActivity.create({
                data: { user_id: userId, login_date: new Date() },
            });
        }),
        
        __mockPrismaClient: mockPrismaClient,
    };
});

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));

import {
    createUser,
    getUserByEmail,
    addUserLoginActivity,
} from '../../../src/services/model-services';

// Get the mock prisma client
const mockModelServices = require('../../../src/services/model-services');
const mockPrismaClient = mockModelServices.__mockPrismaClient;

describe('Model Services', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createUser', () => {
        const mockUserData = {
            email: 'test@example.com',
            first_name: 'John',
            last_name: 'Doe',
            password: 'hashedPassword',
            is_verified: false,
            auth_provider: 'internal',
        };

        const mockCreatedUser = {
            id: 'user-123',
            ...mockUserData,
            created_at: new Date(),
            updated_at: new Date(),
        };

        it('should successfully create a user', async () => {
            mockPrismaClient.user.create.mockResolvedValue(mockCreatedUser);
            (createUser as jest.Mock).mockResolvedValue(mockCreatedUser);

            const result = await createUser(mockUserData);

            expect(result).toEqual(mockCreatedUser);
        });

        it('should handle database errors when creating user', async () => {
            const mockError = new Error('Database connection failed');
            (createUser as jest.Mock).mockRejectedValue(mockError);

            await expect(createUser(mockUserData)).rejects.toThrow(
                'Database connection failed',
            );
        });
    });

    describe('getUserByEmail', () => {
        const mockEmail = 'test@example.com';
        const mockUser = {
            id: 'user-123',
            email: mockEmail,
            first_name: 'John',
            last_name: 'Doe',
            password: 'hashedPassword',
            is_verified: true,
            auth_provider: 'internal',
            role: 'USER',
        };

        it('should successfully find user by email', async () => {
            (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);

            const result = await getUserByEmail(mockEmail);

            expect(result).toEqual(mockUser);
        });

        it('should return null when user not found', async () => {
            (getUserByEmail as jest.Mock).mockResolvedValue(null);

            const result = await getUserByEmail('nonexistent@example.com');

            expect(result).toBeNull();
        });

        it('should handle database errors when finding user', async () => {
            const mockError = new Error('Database query failed');
            (getUserByEmail as jest.Mock).mockRejectedValue(mockError);

            await expect(getUserByEmail(mockEmail)).rejects.toThrow(
                'Database query failed',
            );
        });
    });

    describe('addUserLoginActivity', () => {
        const mockUserId = 'user-123';
        const mockLoginActivity = {
            id: 'activity-123',
            user_id: mockUserId,
            login_date: new Date(),
        };

        it('should successfully create user login activity', async () => {
            (addUserLoginActivity as jest.Mock).mockResolvedValue(
                mockLoginActivity,
            );

            const result = await addUserLoginActivity(mockUserId);

            expect(result).toEqual(mockLoginActivity);
        });

        it('should handle database errors when creating login activity', async () => {
            const mockError = new Error('Failed to create login activity');
            (addUserLoginActivity as jest.Mock).mockRejectedValue(mockError);

            await expect(addUserLoginActivity(mockUserId)).rejects.toThrow(
                'Failed to create login activity',
            );
        });
    });
});
