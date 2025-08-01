import { serviceDefinitions } from '@atc/grpc-config';
import { healthCheck } from '@atc/common';

import { BaseGrpcServer } from '@atc/grpc-server';
import { handlers } from './handlers';
import {
    emailSchema,
    loginSchema,
    refreshTokenSchema,
    oauthRegisterSchema,
    registerSchema,
    resetPasswordSchema,
    verifyUserSchema,
} from './validations';

export class AuthServer extends BaseGrpcServer {
    constructor() {
        super();
        this.initializeServer();
    }

    private initializeServer() {
        this.addService(
            serviceDefinitions.authPackageDefinition.auth.AuthService.service,
            {
                ...handlers,
                RegisterUser: this.wrapWithValidation(
                    handlers.RegisterUser,
                    registerSchema,
                ),
                LoginUser: this.wrapWithValidation(
                    handlers.LoginUser,
                    loginSchema,
                ),
                VerifyUser: this.wrapWithValidation(
                    handlers.VerifyUser,
                    verifyUserSchema,
                ),
                ForgotPassword: this.wrapWithValidation(
                    handlers.ForgotPassword,
                    emailSchema,
                ),
                ResendEmail: this.wrapWithValidation(
                    handlers.ResendEmail,
                    emailSchema,
                ),
                ResetPassword: this.wrapWithValidation(
                    handlers.ResetPassword,
                    resetPasswordSchema,
                ),
                RefreshToken: this.wrapWithValidation(
                    handlers.RefreshToken,
                    refreshTokenSchema,
                ),
                OauthRegister: this.wrapWithValidation(
                    handlers.OauthRegister,
                    oauthRegisterSchema,
                ),
            },
        );

        this.addService(
            serviceDefinitions.healthPackageDefinition.health.HealthService
                .service,
            { healthCheck },
        );
    }
}
