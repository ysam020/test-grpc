import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { authorizeApple } from '../services/OAuth/apple-auth';
import { authorizeFacebook } from '../services/OAuth/fb-auth';
import { authorizeGoogle } from '../services/OAuth/google-auth';
import {
    LoginUserResponse,
    LoginUserResponse__Output,
    OauthRegisterRequest__Output,
} from '@atc/proto';
import {
    AuthProviderEnum,
    errorMessage,
    OauthPayload,
    responseMessage,
    tokenFns,
} from '@atc/common';
import { createUser, getUserByEmail } from '../services/model-services';
import { prismaClient } from '@atc/db';
import { SignOptions } from 'jsonwebtoken';

const oAuthRegister = async (
    call: ServerUnaryCall<OauthRegisterRequest__Output, LoginUserResponse>,
    callback: sendUnaryData<LoginUserResponse__Output>,
) => {
    const { token, authProvider, userId, fcmToken } = call.request;

    let authData: OauthPayload | undefined;

    if (authProvider === AuthProviderEnum.GOOGLE) {
        authData = await authorizeGoogle(token);
    }

    if (authProvider === AuthProviderEnum.META) {
        authData = await authorizeFacebook(token, userId);
    }

    if (authProvider === AuthProviderEnum.APPLE) {
        authData = await authorizeApple(token);
    }

    if (!authData) {
        return callback(null, {
            message: errorMessage.OTHER.BAD_REQUEST,
            accessToken: '',
            refreshToken: '',
            status: status.ABORTED,
            data: null,
        });
    }

    const { email, first_name, last_name, picture, auth } = authData;

    // Check if user already exits
    let userFound = await getUserByEmail(email);

    if (!userFound) {
        const userData: prismaClient.Prisma.UserCreateInput = {
            first_name: first_name || '',
            last_name: last_name || '',
            email: email!,
            profile_pic: picture || '',
            password: '',
            is_verified: true,
            auth_provider: auth,
        };

        userFound = await createUser(userData);
        if (!userFound) {
            return callback(null, {
                message: errorMessage.USER.LOGIN_FAILED,
                accessToken: '',
                refreshToken: '',
                data: null,
                status: status.INTERNAL,
            });
        }
    }

    // Generate access token and refresh token
    const accessToken = tokenFns.generateToken(
        {
            userID: userFound.id,
            role: userFound.role,
            email: userFound.email,
        },
        process.env.ACCESS_JWT_TOKEN as string,
        {
            expiresIn: process.env
                .ACCESS_JWT_EXPIRE as SignOptions['expiresIn'],
        },
    );

    const refreshToken = tokenFns.generateToken(
        {
            userID: userFound.id,
            role: userFound.role,
            email: userFound.email,
        },
        process.env.REFRESH_TOKEN as string,
        {
            expiresIn: process.env
                .REFRESH_TOKEN_EXPIRE as SignOptions['expiresIn'],
        },
    );

    const sample_registered =
        userFound.age &&
        userFound.address &&
        userFound.city &&
        userFound.first_name &&
        userFound.last_name &&
        userFound.no_of_adult !== null &&
        userFound.no_of_children !== null &&
        userFound.postcode &&
        userFound.phone_number;

    // Create an object containing only the required fields of the user
    return callback(null, {
        message: responseMessage.USER.LOGGED_IN,
        data: {
            id: userFound.id,
            email: userFound.email,
            first_name: userFound.first_name || '',
            last_name: userFound.last_name || '',
            sample_registered: Boolean(sample_registered),
        },
        accessToken,
        refreshToken,
        status: status.OK,
    });
};

export { oAuthRegister };
