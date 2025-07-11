import {
    ForgotPasswordRequest__Output,
    ForgotPasswordResponse,
    ForgotPasswordResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { getUserByEmail, updateUserData } from '../services/model-services';
import {
    errorMessage,
    responseMessage,
    sendEmail,
    tokenFns,
    utilFns,
} from '@atc/common';
import { logger } from '@atc/logger';
import { SignOptions } from 'jsonwebtoken';

const forgotPassword = async (
    call: ServerUnaryCall<
        ForgotPasswordRequest__Output,
        ForgotPasswordResponse
    >,
    callback: sendUnaryData<ForgotPasswordResponse__Output>,
) => {
    try {
        const { email } = call.request;

        const user = await getUserByEmail(email);

        if (!user) {
            return callback(null, {
                message: errorMessage.USER.NOT_FOUND,
                status: status.NOT_FOUND,
                token: '',
            });
        }

        if (!user.is_verified) {
            return callback(null, {
                message: errorMessage.USER.NOT_VERIFIED,
                status: status.NOT_FOUND,
                token: '',
            });
        }

        const resetToken = tokenFns.generateToken(
            { email: user.email },
            process.env.RESET_JWT_TOKEN as string,
            {
                expiresIn: process.env
                    .RESET_JWT_EXPIRE as SignOptions['expiresIn'],
            },
        );

        const otp = utilFns.generateRandomNumber(100000, 1000000);

        await updateUserData(user.id, { otp });

        sendEmail(user.email, {
            subject: 'Verify User',
            text: `Reset Password OTP: - ${otp}`,
        });

        return callback(null, {
            message: responseMessage.EMAIL.EMAIL_SENT,
            status: status.OK,
            token: resetToken,
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

export { forgotPassword };
