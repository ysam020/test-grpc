// __tests__/server/AuthServer.test.ts
import { jest } from '@jest/globals';
import { AuthServer } from '../../src/index';
import { handlers } from '../../src/handlers';
import {
    emailSchema,
    loginSchema,
    refreshTokenSchema,
    oauthRegisterSchema,
    registerSchema,
    resetPasswordSchema,
    verifyUserSchema,
} from '../../src/validations';

// Mock the dependencies
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

jest.mock('@atc/grpc-server', () => ({
    BaseGrpcServer: jest.fn().mockImplementation(() => ({
        addService: jest.fn(),
        wrapWithValidation: jest.fn((handler, schema) => ({
            handler,
            schema,
            isWrapped: true,
        })),
    })),
}));

jest.mock('../../src/handlers', () => ({
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

describe('AuthServer', () => {
    let authServer: AuthServer;
    let mockAddService: jest.MockedFunction<any>;
    let mockWrapWithValidation: jest.MockedFunction<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        authServer = new AuthServer();
        mockAddService = authServer.addService as jest.MockedFunction<any>;
        mockWrapWithValidation =
            authServer.wrapWithValidation as jest.MockedFunction<any>;
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

    describe('Handler Integration', () => {
        it('should use original handlers from handlers module', () => {
            // Verify that each handler from the handlers module is referenced
            const authServiceCall = mockAddService.mock.calls.find(
                (call) => call[1] && typeof call[1].RegisterUser === 'object',
            );

            expect(authServiceCall).toBeDefined();
            // The wrapped handlers should still reference the original handlers
            expect(mockWrapWithValidation).toHaveBeenCalledWith(
                handlers.RegisterUser,
                expect.any(Object),
            );
            expect(mockWrapWithValidation).toHaveBeenCalledWith(
                handlers.LoginUser,
                expect.any(Object),
            );
        });

        it('should maintain handler function integrity after wrapping', () => {
            // Ensure that the wrapWithValidation returns something that can be used as a handler
            mockWrapWithValidation.mock.results.forEach((result) => {
                expect(result.value).toHaveProperty('handler');
                expect(result.value).toHaveProperty('schema');
                expect(result.value).toHaveProperty('isWrapped', true);
            });
        });
    });

    describe('Schema Integration', () => {
        it('should use correct schemas for each handler', () => {
            const expectedSchemaMapping = [
                { handler: handlers.RegisterUser, schema: registerSchema },
                { handler: handlers.LoginUser, schema: loginSchema },
                { handler: handlers.VerifyUser, schema: verifyUserSchema },
                { handler: handlers.ForgotPassword, schema: emailSchema },
                { handler: handlers.ResendEmail, schema: emailSchema },
                {
                    handler: handlers.ResetPassword,
                    schema: resetPasswordSchema,
                },
                { handler: handlers.RefreshToken, schema: refreshTokenSchema },
                {
                    handler: handlers.OauthRegister,
                    schema: oauthRegisterSchema,
                },
            ];

            expectedSchemaMapping.forEach(({ handler, schema }) => {
                expect(mockWrapWithValidation).toHaveBeenCalledWith(
                    handler,
                    schema,
                );
            });
        });

        it('should use emailSchema for both ForgotPassword and ResendEmail', () => {
            const emailSchemaCalls = mockWrapWithValidation.mock.calls.filter(
                (call) => call[1] === emailSchema,
            );
            expect(emailSchemaCalls).toHaveLength(2);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing service definitions gracefully', () => {
            // Mock a scenario where service definitions might be undefined
            jest.doMock('@atc/grpc-config', () => ({
                serviceDefinitions: {
                    authPackageDefinition: undefined,
                    healthPackageDefinition: undefined,
                },
            }));

            // This should not throw an error, but would be caught by the base class
            expect(() => {
                new AuthServer();
            }).not.toThrow();
        });
    });

    describe('Service Method Availability', () => {
        it('should ensure all required auth methods are available', () => {
            const authServiceCall = mockAddService.mock.calls.find(
                (call) => call[1] && typeof call[1].RegisterUser === 'object',
            );

            const requiredMethods = [
                'RegisterUser',
                'VerifyUser',
                'ResendEmail',
                'LoginUser',
                'ForgotPassword',
                'ResetPassword',
                'RefreshToken',
                'OauthRegister',
            ];

            requiredMethods.forEach((method) => {
                expect(authServiceCall[1]).toHaveProperty(method);
            });
        });

        it('should ensure health check method is available', () => {
            const healthServiceCall = mockAddService.mock.calls.find(
                (call) => call[1] && typeof call[1].healthCheck === 'function',
            );

            expect(healthServiceCall[1]).toHaveProperty('healthCheck');
            expect(typeof healthServiceCall[1].healthCheck).toBe('function');
        });
    });

    describe('Inheritance and Base Class Integration', () => {
        it('should extend BaseGrpcServer', () => {
            // Verify that AuthServer extends BaseGrpcServer by checking method availability
            expect(authServer.addService).toBeDefined();
            expect(authServer.wrapWithValidation).toBeDefined();
        });

        it('should call super constructor', () => {
            // This is implicitly tested by the fact that the mock BaseGrpcServer constructor is called
            const { BaseGrpcServer } = require('@atc/grpc-server');
            expect(BaseGrpcServer).toHaveBeenCalled();
        });
    });
});
