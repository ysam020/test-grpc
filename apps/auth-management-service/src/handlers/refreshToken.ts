import { errorMessage, tokenFns } from '@atc/common';
import { logger } from '@atc/logger';
import {
    RefreshTokenRequest__Output,
    RefreshTokenResponse,
    RefreshTokenResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { TokenExpiredError, SignOptions } from 'jsonwebtoken';

const refreshToken = async (
    call: ServerUnaryCall<RefreshTokenRequest__Output, RefreshTokenResponse>,
    callback: sendUnaryData<RefreshTokenResponse__Output>,
) => {
    try {
        const { refresh_token } = call.request;
        const tokenPayload = tokenFns.verifyToken(
            refresh_token,
            process.env.REFRESH_TOKEN as string,
        );

        if (!tokenPayload) {
            return callback(null, {
                message: errorMessage.TOKEN.INVALID,
                accessToken: '',
                refreshToken: '',
                status: status.UNAUTHENTICATED,
            });
        }

        const { userID, role, email } = tokenPayload as any;

        const accessToken = tokenFns.generateToken(
            {
                userID,
                role,
                email,
            },
            process.env.ACCESS_JWT_TOKEN as string,
            {
                expiresIn: process.env
                    .ACCESS_JWT_EXPIRE as SignOptions['expiresIn'],
            },
        );

        const refreshTokenNew = tokenFns.generateToken(
            {
                userID,
                role,
                email,
            },
            process.env.REFRESH_TOKEN as string,
            {
                expiresIn: process.env
                    .REFRESH_TOKEN_EXPIRE as SignOptions['expiresIn'],
            },
        );

        return callback(null, {
            message: errorMessage.TOKEN.REFRESHED,
            accessToken,
            refreshToken: refreshTokenNew,
            status: status.OK,
        });
    } catch (error) {
        logger.error(error);

        if (error instanceof TokenExpiredError) {
            return callback(null, {
                message: errorMessage.TOKEN.EXPIRED,
                accessToken: '',
                refreshToken: '',
                status: status.UNAUTHENTICATED,
            });
        }

        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            accessToken: '',
            refreshToken: '',
            status: status.INTERNAL,
        });
    }
};

export { refreshToken };
