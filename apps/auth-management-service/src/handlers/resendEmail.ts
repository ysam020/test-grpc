import {
    ResendEmailRequest__Output,
    ResendEmailResponse,
    ResendEmailResponse__Output,
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
import { SignOptions } from 'jsonwebtoken';

const resendEmail = async (
    call: ServerUnaryCall<ResendEmailRequest__Output, ResendEmailResponse>,
    callback: sendUnaryData<ResendEmailResponse__Output>,
) => {
    const { email } = call.request;

    const user = await getUserByEmail(email);

    if (!user) {
        return callback(null, {
            message: errorMessage.USER.NOT_FOUND,
            status: status.NOT_FOUND,
            token: '',
        });
    }

    if (user.is_verified) {
        return callback(null, {
            message: errorMessage.USER.ALREADY_VERIFIED,
            status: status.ALREADY_EXISTS,
            token: '',
        });
    }

    const otp = utilFns.generateRandomNumber(100000, 1000000);

    const genVerifyToken = tokenFns.generateToken(
        { email: user.email },
        process.env.VERIFY_JWT_TOKEN as string,
        {
            expiresIn: process.env
                .VERIFY_JWT_EXPIRE as SignOptions['expiresIn'],
        },
    );

    await updateUserData(user.id, {
        otp,
    });

    sendEmail(user.email, {
        subject: 'Verify User',
        text: `OTP:- ${otp}`,
    });

    return callback(null, {
        message: responseMessage.EMAIL.EMAIL_SENT,
        status: status.OK,
        token: genVerifyToken,
    });
};

export { resendEmail };
