import {
    VerifyUserRequest__Output,
    VerifyUserResponse,
    VerifyUserResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, responseMessage, tokenFns, utilFns } from '@atc/common';
import {
    getAdminDetails,
    getAllRetailersforPreference,
    getUserByEmail,
    updateUserData,
    updateUserPreference,
} from '../services/model-services';
import { notificationStub } from '../client';
import { prismaClient } from '@atc/db';
import { SignOptions } from 'jsonwebtoken';

const verifyUser = async (
    call: ServerUnaryCall<VerifyUserRequest__Output, VerifyUserResponse>,
    callback: sendUnaryData<VerifyUserResponse__Output>,
) => {
    try {
        const { otp, token } = call.request;

        const verifyToken = tokenFns.verifyToken(
            token,
            process.env.VERIFY_JWT_TOKEN as string,
        );

        if (!verifyToken) {
            return callback(null, {
                message: errorMessage.TOKEN.INVALID,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.UNAUTHENTICATED,
            });
        }

        const { email } = verifyToken as any;

        const user = await getUserByEmail(email);

        if (!user) {
            return callback(null, {
                message: errorMessage.USER.NOT_FOUND,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.NOT_FOUND,
            });
        }

        if (user.is_verified) {
            return callback(null, {
                message: errorMessage.USER.ALREADY_VERIFIED,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.ALREADY_EXISTS,
            });
        }

        if (user.otp !== otp) {
            return callback(null, {
                message: errorMessage.OTP.INVALID,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.UNAUTHENTICATED,
            });
        }

        const accessToken = tokenFns.generateToken(
            { userID: user.id, role: user.role, email: user.email },
            process.env.ACCESS_JWT_TOKEN as string,
            {
                expiresIn: process.env
                    .ACCESS_JWT_EXPIRE as SignOptions['expiresIn'],
            },
        );

        const refreshToken = tokenFns.generateToken(
            { userID: user.id, role: user.role, email: user.email },
            process.env.REFRESH_TOKEN as string,
            {
                expiresIn: process.env
                    .REFRESH_TOKEN_EXPIRE as SignOptions['expiresIn'],
            },
        );

        const retailers = await getAllRetailersforPreference();

        await updateUserPreference(
            user.id,
            retailers.map((value) => value.id),
        );

        const { password, ...userData } = user;

        await updateUserData(user.id, {
            is_verified: true,
            otp: null,
        });

        const admin = await getAdminDetails();

        const metadata = utilFns.createMetadata(
            'authorization',
            `Bearer ${accessToken}`,
        );

        const createNotification = new Promise((resolve, reject) => {
            notificationStub.CreateNotification(
                {
                    user_id: admin!.id,
                    title: 'User Registered',
                    description: `New user has been Registered. Email: ${user.email}`,
                    type: prismaClient.NotificationType.REGISTRATION,
                },
                metadata,
                (err: any, response: any) => {
                    if (err) reject(err);
                    else resolve(response);
                },
            );
        });

        await createNotification;

        return callback(null, {
            message: responseMessage.EMAIL.VERIFIED,
            data: {
                id: userData.id,
                email: userData.email,
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
            },
            accessToken,
            refreshToken,
            status: status.OK,
        });
    } catch (error: Error | any) {
        console.log('error: ', error);
        if (error.name === 'TokenExpiredError') {
            return callback(null, {
                message: errorMessage.TOKEN.EXPIRED,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.UNAUTHENTICATED,
            });
        }
        return callback(null, {
            message: errorMessage.USER.VERIFY_FAILED,
            data: null,
            accessToken: '',
            refreshToken: '',
            status: status.INTERNAL,
        });
    }
};

export { verifyUser };
