import {
    registerSchema,
    loginSchema,
    verifyUserSchema,
    emailSchema,
    resetPasswordSchema,
    refreshTokenSchema,
    oauthRegisterSchema,
} from '../../../src/validations';

// Mock dependencies
jest.mock('@atc/common', () => ({
    errorMessage: {
        PASSWORD: {
            LENGTH: 'Password must be between 6-15 characters',
            NUMBER: 'Password must contain at least one number',
            UPPERCASE: 'Password must contain at least one uppercase letter',
            SPECIAL_CHAR:
                'Password must contain at least one special character',
        },
    },
    UserRoleEnum: {
        USER: 'USER',
        ADMIN: 'ADMIN',
    },
    AuthProviderEnum: {
        GOOGLE: 'google',
        META: 'meta',
        APPLE: 'apple',
        INTERNAL: 'internal',
    },
}));

describe('Auth Validations', () => {
    describe('refreshTokenSchema', () => {
        it('should validate correct refresh token data', () => {
            const validData = {
                refresh_token: 'valid-refresh-token',
            };

            const result = refreshTokenSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({
                    refresh_token: 'valid-refresh-token',
                });
            }
        });

        it('should reject missing refresh token', () => {
            const invalidData = {};

            const result = refreshTokenSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept empty string refresh token', () => {
            const dataWithEmptyToken = {
                refresh_token: '',
            };

            const result = refreshTokenSchema.safeParse(dataWithEmptyToken);
            expect(result.success).toBe(true);
        });
    });

    describe('registerSchema', () => {
        it('should validate correct registration data', () => {
            const validData = {
                email: 'test@example.com',
                password: 'password123',
            };

            const result = registerSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({
                    email: 'test@example.com',
                    password: 'password123',
                });
            }
        });

        it('should trim and lowercase email', () => {
            const dataWithSpaces = {
                email: '  TEST@EXAMPLE.COM  ',
                password: 'password123',
            };

            const result = registerSchema.safeParse(dataWithSpaces);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('test@example.com');
            }
        });

        it('should reject invalid email format', () => {
            const invalidData = {
                email: 'invalid-email',
                password: 'password123',
            };

            const result = registerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('loginSchema', () => {
        it('should validate correct login data', () => {
            const validData = {
                email: 'test@example.com',
                password: 'password123',
                role: 'USER',
            };

            const result = loginSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid role', () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'password123',
                role: 'INVALID_ROLE',
            };

            const result = loginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('oauthRegisterSchema', () => {
        it('should validate correct OAuth registration data', () => {
            const validData = {
                token: 'oauth-token',
                authProvider: 'google',
                userId: 'user-123',
                fcmToken: 'fcm-token',
            };

            const result = oauthRegisterSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should validate with optional fields missing', () => {
            const validData = {
                token: 'oauth-token',
                authProvider: 'apple',
            };

            const result = oauthRegisterSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid auth provider', () => {
            const invalidData = {
                token: 'oauth-token',
                authProvider: 'invalid-provider',
            };

            const result = oauthRegisterSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
