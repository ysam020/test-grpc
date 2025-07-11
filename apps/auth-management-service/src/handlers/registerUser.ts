import {
    RegisterUserRequest__Output,
    RegisterUserResponse,
    RegisterUserResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { createUser, getUserByEmail } from '../services/model-services';
import {
    errorMessage,
    hashFns,
    responseMessage,
    sendEmail,
    tokenFns,
    utilFns,
} from '@atc/common';
import { logger } from '@atc/logger';
import { SignOptions } from 'jsonwebtoken';

const registerUser = async (
    call: ServerUnaryCall<RegisterUserRequest__Output, RegisterUserResponse>,
    callback: sendUnaryData<RegisterUserResponse__Output>,
) => {
    try {
        const { email, password } = call.request;

        const ifAlreadyUser = await getUserByEmail(email);

        if (ifAlreadyUser) {
            return callback(null, {
                message: errorMessage.USER.ALREADY_EXISTS,
                status: status.ALREADY_EXISTS,
                token: '',
            });
        }

        const hashPassword = await hashFns.hashValue(password);
        const otp = utilFns.generateRandomNumber(100000, 1000000);

        const user = {
            email,
            password: hashPassword,
            otp,
        };

        const newUser = await createUser(user);

        if (!newUser) {
            return callback(null, {
                message: errorMessage.USER.REGISTER_FAILED,
                status: status.INTERNAL,
                token: '',
            });
        }

        const genVerifyToken = tokenFns.generateToken(
            { email: user.email },
            process.env.VERIFY_JWT_TOKEN as string,
            {
                expiresIn: process.env
                    .VERIFY_JWT_EXPIRE as SignOptions['expiresIn'],
            },
        );

        sendEmail(user.email, {
            subject: 'Verify User',
            text: `Please use the following OTP to verify your account. OTP:- ${otp}`,
        });

        return callback(null, {
            message: responseMessage.USER.REGISTERED,
            status: status.OK,
            token: genVerifyToken,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
            token: '',
        });
    }
};

export { registerUser };
