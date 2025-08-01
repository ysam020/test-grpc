import { errorMessage, hashFns, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    ChangePasswordRequest__Output,
    ChangePasswordResponse,
    ChangePasswordResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getUserByID, updateUserByID } from '../services/model.service';
import { changePasswordType } from '../validations';

export const changePassword = async (
    call: CustomServerUnaryCall<
        ChangePasswordRequest__Output,
        ChangePasswordResponse
    >,
    callback: sendUnaryData<ChangePasswordResponse__Output>,
) => {
    try {
        const { id, current_password, new_password } =
            utilFns.removeEmptyFields(call.request) as changePasswordType;
        const { userID } = call.user;

        if (userID !== id) {
            return callback(null, {
                message: errorMessage.USER.UNAUTHORIZED_ACCESS,
                status: status.UNAUTHENTICATED,
            });
        }

        const user = await getUserByID(userID);
        if (!user) {
            return callback(null, {
                message: errorMessage.USER.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const passwordMatch = await hashFns.compareHash(
            current_password,
            user.password,
        );
        if (!passwordMatch) {
            return callback(null, {
                message: errorMessage.PASSWORD.INCORRECT_CURRENT_PASSWORD,
                status: status.UNAUTHENTICATED,
            });
        }

        const hashPassword = await hashFns.hashValue(new_password);

        await updateUserByID(userID, { password: hashPassword });

        return callback(null, {
            message: responseMessage.PASSWORD.UPDATED,
            status: status.OK,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
