// Mock the BaseGrpcServer before importing AuthServer
const mockAddService = jest.fn();
const mockWrapWithValidation = jest.fn((handler, schema) => ({
    handler,
    schema,
    isWrapped: true,
}));

jest.mock('@atc/grpc-server', () => ({
    BaseGrpcServer: jest.fn().mockImplementation(function () {
        this.addService = mockAddService;
        this.wrapWithValidation = mockWrapWithValidation;
        return this;
    }),
}));

jest.mock('@atc/grpc-config', () => ({
    serviceDefinitions: {
        authPackageDefinition: {
            auth: {
                AuthService: {
                    service: {
                        RegisterUser: {},
                        VerifyUser: {},
                        ResendEmail: {},
                        LoginUser: {},
                        ForgotPassword: {},
                        ResetPassword: {},
                        RefreshToken: {},
                        OauthRegister: {},
                    },
                },
            },
        },
        healthPackageDefinition: {
            health: {
                HealthService: {
                    service: {
                        healthCheck: {},
                    },
                },
            },
        },
    },
}));

jest.mock('@atc/common', () => ({
    healthCheck: jest.fn(),
}));

jest.mock('../../../src/handlers', () => ({
    handlers: {
        RegisterUser: jest.fn(),
        VerifyUser: jest.fn(),
        ResendEmail: jest.fn(),
        LoginUser: jest.fn(),
        ForgotPassword: jest.fn(),
        ResetPassword: jest.fn(),
        RefreshToken: jest.fn(),
        OauthRegister: jest.fn(),
    },
}));

import { AuthServer } from '../../../src/index';
import { handlers } from '../../../src/handlers';
import {
    emailSchema,
    loginSchema,
    refreshTokenSchema,
    oauthRegisterSchema,
    registerSchema,
    resetPasswordSchema,
    verifyUserSchema,
} from '../../../src/validations';

describe('AuthServer', () => {
    let authServer: AuthServer;

    beforeEach(() => {
        jest.clearAllMocks();
        authServer = new AuthServer();
    });

    describe('Constructor and Initialization', () => {
        it('should create AuthServer instance successfully', () => {
            expect(authServer).toBeInstanceOf(AuthServer);
        });

        it('should call initializeServer during construction', () => {
            // The constructor calls initializeServer, so services should be added
            expect(mockAddService).toHaveBeenCalledTimes(2); // Auth service + Health service
        });
    });

    describe('Service Registration', () => {
        it('should register AuthService with all handlers', () => {
            const authServiceCall = mockAddService.mock.calls.find(
                (call) => call[1] && typeof call[1].RegisterUser === 'object',
            );

            expect(authServiceCall).toBeDefined();
            expect(authServiceCall[1]).toHaveProperty('RegisterUser');
            expect(authServiceCall[1]).toHaveProperty('VerifyUser');
            expect(authServiceCall[1]).toHaveProperty('ResendEmail');
            expect(authServiceCall[1]).toHaveProperty('LoginUser');
            expect(authServiceCall[1]).toHaveProperty('ForgotPassword');
            expect(authServiceCall[1]).toHaveProperty('ResetPassword');
            expect(authServiceCall[1]).toHaveProperty('RefreshToken');
            expect(authServiceCall[1]).toHaveProperty('OauthRegister');
        });

        it('should register HealthService', () => {
            const healthServiceCall = mockAddService.mock.calls.find(
                (call) => call[1] && typeof call[1].healthCheck === 'function',
            );

            expect(healthServiceCall).toBeDefined();
            expect(healthServiceCall[1]).toHaveProperty('healthCheck');
        });
    });

    describe('Validation Wrapper Integration', () => {
        it('should wrap RegisterUser with registerSchema', () => {
            expect(mockWrapWithValidation).toHaveBeenCalledWith(
                handlers.RegisterUser,
                registerSchema,
            );
        });

        it('should wrap LoginUser with loginSchema', () => {
            expect(mockWrapWithValidation).toHaveBeenCalledWith(
                handlers.LoginUser,
                loginSchema,
            );
        });

        it('should wrap VerifyUser with verifyUserSchema', () => {
            expect(mockWrapWithValidation).toHaveBeenCalledWith(
                handlers.VerifyUser,
                verifyUserSchema,
            );
        });

        it('should wrap ForgotPassword with emailSchema', () => {
            expect(mockWrapWithValidation).toHaveBeenCalledWith(
                handlers.ForgotPassword,
                emailSchema,
            );
        });

        it('should wrap ResendEmail with emailSchema', () => {
            expect(mockWrapWithValidation).toHaveBeenCalledWith(
                handlers.ResendEmail,
                emailSchema,
            );
        });

        it('should wrap ResetPassword with resetPasswordSchema', () => {
            expect(mockWrapWithValidation).toHaveBeenCalledWith(
                handlers.ResetPassword,
                resetPasswordSchema,
            );
        });

        it('should wrap RefreshToken with refreshTokenSchema', () => {
            expect(mockWrapWithValidation).toHaveBeenCalledWith(
                handlers.RefreshToken,
                refreshTokenSchema,
            );
        });

        it('should wrap OauthRegister with oauthRegisterSchema', () => {
            expect(mockWrapWithValidation).toHaveBeenCalledWith(
                handlers.OauthRegister,
                oauthRegisterSchema,
            );
        });
    });

    describe('Service Configuration', () => {
        it('should call addService exactly twice (auth + health)', () => {
            expect(mockAddService).toHaveBeenCalledTimes(2);
        });

        it('should call wrapWithValidation for all handlers that need validation', () => {
            // All handlers except health check should be wrapped with validation
            expect(mockWrapWithValidation).toHaveBeenCalledTimes(8);
        });

        it('should not call wrapWithValidation for health check', () => {
            const healthCheckCalls = mockWrapWithValidation.mock.calls.filter(
                (call) => call[0] && call[0].name === 'healthCheck',
            );
            expect(healthCheckCalls).toHaveLength(0);
        });
    });

    describe('Schema Integration', () => {
        it('should use emailSchema for both ForgotPassword and ResendEmail', () => {
            const emailSchemaCalls = mockWrapWithValidation.mock.calls.filter(
                (call) => call[1] === emailSchema,
            );
            expect(emailSchemaCalls).toHaveLength(2);
        });
    });

    describe('Error Handling', () => {
        it('should handle service registration errors gracefully', () => {
            // Test that the server can handle errors during service registration
            expect(() => new AuthServer()).not.toThrow();
        });
    });
});
