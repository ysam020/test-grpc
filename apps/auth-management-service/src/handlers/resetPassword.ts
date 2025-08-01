import {
    ResetPasswordRequest__Output,
    ResetPasswordResponse,
    ResetPasswordResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { errorMessage, hashFns, responseMessage, tokenFns } from '@atc/common';
import { getUserByEmail, updateUserData } from '../services/model-services';

const resetPassword = async (
    call: ServerUnaryCall<ResetPasswordRequest__Output, ResetPasswordResponse>,
    callback: sendUnaryData<ResetPasswordResponse__Output>,
) => {
    try {
        const { password, token, otp } = call.request;

        const verifyResetToken = tokenFns.verifyToken(
            token,
            process.env.RESET_JWT_TOKEN as string,
        );

        if (!verifyResetToken) {
            return callback(null, {
                message: errorMessage.TOKEN.INVALID,
                status: status.UNAUTHENTICATED,
            });
        }

        const { email } = verifyResetToken as any;

        const user = await getUserByEmail(email);

        if (!user) {
            return callback(null, {
                message: errorMessage.USER.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        if (user.otp !== otp) {
            return callback(null, {
                message: errorMessage.OTP.INVALID,
                status: status.NOT_FOUND,
            });
        }

        const hashPassword = await hashFns.hashValue(password);

        await updateUserData(user.id, {
            password: hashPassword,
            otp: null,
        });

        return callback(null, {
            message: responseMessage.PASSWORD.UPDATED,
            status: status.OK,
        });
    } catch (error) {
        console.log(error);
        return callback(null, {
            message: errorMessage.PASSWORD.UPDATE_FAILED,
            status: status.INTERNAL,
        });
    }
};

export { resetPassword };
