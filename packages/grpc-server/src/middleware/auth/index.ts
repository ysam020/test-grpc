import { TokenExpiredError } from 'jsonwebtoken';
import * as grpc from '@grpc/grpc-js';
import { GrpcError } from '../../error-handling';
import { errorMessage } from '@atc/common';
import { tokenFns } from '@atc/common';
import { dbClient } from '@atc/db';

export interface CustomServerUnaryCall<RequestType, ResponseType>
    extends grpc.ServerUnaryCall<RequestType, ResponseType> {
    user?: any;
}

export const authMiddleware = (
    publicMethods: String[] = [],
    optionalMethods: String[] = [],
) => {
    return async (call: any, next: () => Promise<any>) => {
        const metadata = call.metadata.getMap();
        const method = call.getPath();

        // Check if the method is public
        if (publicMethods.includes(method)) {
            return next();
        }

        const token = metadata['authorization']?.split(' ')[1];

        // Check if the method allows optional authentication
        if (optionalMethods.includes(method) && !token) {
            return next();
        }

        if (!token) {
            throw new GrpcError(
                errorMessage.TOKEN.NOT_FOUND,
                grpc.status.UNAUTHENTICATED,
            );
        }

        try {
            const tokenPayload = tokenFns.verifyToken(
                token,
                process.env.ACCESS_JWT_TOKEN as string,
            );
            if (!tokenPayload) {
                throw new GrpcError(
                    errorMessage.TOKEN.INVALID,
                    grpc.status.UNAUTHENTICATED,
                );
            }

            const { userID, role, email } = tokenPayload as any;

            const user = await dbClient.user.findUnique({
                where: { id: userID, is_deleted: false },
            });
            if (!user) {
                throw new GrpcError(
                    errorMessage.USER.NOT_FOUND,
                    grpc.status.NOT_FOUND,
                );
            }

            call.user = { userID, role, email };
            return next();
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                throw new GrpcError(
                    errorMessage.TOKEN.EXPIRED,
                    grpc.status.UNAUTHENTICATED,
                );
            }

            throw error;
        }
    };
};

export const roleMiddleware = (roleRequirements: Record<string, string[]>) => {
    return async (call: any, next: () => Promise<any>) => {
        const method = call.getPath();

        if (!call.user) return next();

        const userRole = call.user.role;
        if (!userRole) {
            throw new GrpcError(
                errorMessage.USER.ROLE_REQUIRED,
                grpc.status.UNAUTHENTICATED,
            );
        }

        const requiredRoles = roleRequirements[method];
        if (
            !requiredRoles ||
            requiredRoles.length === 0 ||
            requiredRoles.includes(userRole)
        ) {
            return next();
        }

        throw new GrpcError(
            errorMessage.USER.UNAUTHORIZED_ACCESS,
            grpc.status.UNAUTHENTICATED,
        );
    };
};
