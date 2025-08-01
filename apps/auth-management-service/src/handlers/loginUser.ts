import {
    LoginUserRequest__Output,
    LoginUserResponse,
    LoginUserResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import {
    addUserLoginActivity,
    getUserByEmail,
} from '../services/model-services';
import {
    errorMessage,
    hashFns,
    responseMessage,
    tokenFns,
    UserRoleEnum,
} from '@atc/common';
import { logger } from '@atc/logger';
import { SignOptions } from 'jsonwebtoken';

const loginUser = async (
    call: ServerUnaryCall<LoginUserRequest__Output, LoginUserResponse>,
    callback: sendUnaryData<LoginUserResponse__Output>,
) => {
    try {
        const { email, password, role } = call.request;

        const ifAlreadyUser = await getUserByEmail(email);

        if (!ifAlreadyUser) {
            return callback(null, {
                message: errorMessage.USER.NOT_REGISTERED,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.NOT_FOUND,
            });
        }

        if (ifAlreadyUser.role !== role) {
            return callback(null, {
                message: errorMessage.USER.ROLE_MISMATCH,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.UNAUTHENTICATED,
            });
        }

        if (!ifAlreadyUser.is_verified) {
            return callback(null, {
                message: errorMessage.USER.NOT_VERIFIED,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.UNAUTHENTICATED,
            });
        }

        const isPasswordMatch = await hashFns.compareHash(
            password,
            ifAlreadyUser.password,
        );

        if (!isPasswordMatch) {
            return callback(null, {
                message: errorMessage.PASSWORD.INVALID,
                data: null,
                accessToken: '',
                refreshToken: '',
                status: status.UNAUTHENTICATED,
            });
        }

        const accessToken = tokenFns.generateToken(
            {
                userID: ifAlreadyUser.id,
                role: ifAlreadyUser.role,
                email: ifAlreadyUser.email,
            },
            process.env.ACCESS_JWT_TOKEN as string,
            {
                expiresIn: process.env
                    .ACCESS_JWT_EXPIRE as SignOptions['expiresIn'],
            },
        );

        const refreshToken = tokenFns.generateToken(
            {
                userID: ifAlreadyUser.id,
                role: ifAlreadyUser.role,
                email: ifAlreadyUser.email,
            },
            process.env.REFRESH_TOKEN as string,
            {
                expiresIn: process.env
                    .REFRESH_TOKEN_EXPIRE as SignOptions['expiresIn'],
            },
        );

        if (ifAlreadyUser.role !== UserRoleEnum.ADMIN) {
            await addUserLoginActivity(ifAlreadyUser.id);
        }

        const { password: userPass, ...userData } = ifAlreadyUser;

        const sample_registered =
            userData.age &&
            userData.address &&
            userData.city &&
            userData.first_name &&
            userData.last_name &&
            userData.no_of_adult !== null &&
            userData.no_of_children !== null &&
            userData.postcode &&
            userData.phone_number;

        return callback(null, {
            message: responseMessage.USER.LOGGED_IN,
            data: {
                id: userData.id,
                email: userData.email,
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                sample_registered: Boolean(sample_registered),
            },
            accessToken,
            refreshToken,
            status: status.OK,
        });
    } catch (err) {
        logger.error(err);
        return callback(null, {
            message: errorMessage.USER.LOGIN_FAILED,
            data: null,
            accessToken: '',
            refreshToken: '',
            status: status.INTERNAL,
        });
    }
};

export { loginUser };
