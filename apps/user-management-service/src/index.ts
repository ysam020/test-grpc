import {
    authMiddleware,
    BaseGrpcServer,
    roleMiddleware,
} from '@atc/grpc-server';
import { serviceDefinitions } from '@atc/grpc-config';
import { handlers } from './handlers';
import {
    acceptDeviceTokenSchema,
    addToBasketSchema,
    changePasswordSchema,
    pageAndLimitSchema,
    removeFromBasketSchema,
    updateUserSchema,
    UUIDSchema,
    viewBasketSchema,
} from './validations';
import { UserRoleEnum, healthCheck, userValidation } from '@atc/common';

export class UserServer extends BaseGrpcServer {
    constructor() {
        super();
        this.initializeServer();
    }

    private initializeServer() {
        this.addMiddleware(
            authMiddleware(['/health.HealthService/healthCheck']),
        );

        const roleRequirements = {
            '/user.UserService/GetUsers': [UserRoleEnum.ADMIN],
            '/user.UserService/GetSingleUserAmin': [UserRoleEnum.ADMIN],
            '/user.UserService/GetMonthlyActiveUsersCount': [
                UserRoleEnum.ADMIN,
            ],
        };

        this.addMiddleware(roleMiddleware(roleRequirements));

        this.addService(
            serviceDefinitions.userPackageDefinition.user.UserService.service,
            {
                ...handlers,
                GetSingleUser: this.wrapWithValidation(
                    handlers.GetSingleUser,
                    UUIDSchema,
                ),
                GetUsers: this.wrapWithValidation(
                    handlers.GetUsers,
                    pageAndLimitSchema,
                ),
                UpdateUser: this.wrapWithValidation(
                    handlers.UpdateUser,
                    updateUserSchema,
                ),
                DeleteUser: this.wrapWithValidation(
                    handlers.DeleteUser,
                    UUIDSchema,
                ),
                ChangePassword: this.wrapWithValidation(
                    handlers.ChangePassword,
                    changePasswordSchema,
                ),
                AddToBasket: this.wrapWithValidation(
                    handlers.AddToBasket,
                    addToBasketSchema,
                ),
                RemoveFromBasket: this.wrapWithValidation(
                    handlers.RemoveFromBasket,
                    removeFromBasketSchema,
                ),
                AcceptDeviceToken: this.wrapWithValidation(
                    handlers.AcceptDeviceToken,
                    acceptDeviceTokenSchema,
                ),
                GetSingleUserAmin: this.wrapWithValidation(
                    handlers.GetSingleUserAmin,
                    UUIDSchema,
                ),
                ViewBasket: this.wrapWithValidation(
                    handlers.ViewBasket,
                    viewBasketSchema,
                ),
                GetUserEngagement: this.wrapWithValidation(
                    handlers.GetUserEngagement,
                    userValidation.getUserEngagementSchema,
                ),
            },
        );

        this.addService(
            serviceDefinitions.healthPackageDefinition.health.HealthService
                .service,
            {
                healthCheck,
            },
        );
    }
}
