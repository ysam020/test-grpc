import {
    constants,
    deleteS3Object,
    errorMessage,
    responseMessage,
    UserRoleEnum,
    utilFns,
} from '@atc/common';
import {
    DeleteUserResponse,
    DeleteUserResponse__Output,
    DeleteUserRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { deleteUserByID, getUserByID } from '../services/model.service';
import { logger } from '@atc/logger';
import { CustomServerUnaryCall, GrpcError } from '@atc/grpc-server';

export const deleteUser = async (
    call: CustomServerUnaryCall<DeleteUserRequest__Output, DeleteUserResponse>,
    callback: sendUnaryData<DeleteUserResponse__Output>,
) => {
    try {
        const { id } = utilFns.removeEmptyFields(call.request);
        const { userID, role } = call.user;

        const user = await getUserByID(id);
        if (!user) {
            return callback(null, {
                message: errorMessage.USER.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        if (user.role === UserRoleEnum.ADMIN) {
            return callback(null, {
                message: errorMessage.USER.UNAUTHORIZED_ACCESS,
                status: status.UNAUTHENTICATED,
            });
        }

        if (role === UserRoleEnum.ADMIN) {
            await deleteUserByID(user.id);
        } else {
            if (id !== userID) {
                return callback(null, {
                    message: errorMessage.USER.UNAUTHORIZED_ACCESS,
                    status: status.UNAUTHENTICATED,
                });
            }

            await deleteUserByID(userID);
        }

        await deleteS3Object(constants.PROFILE_PIC_FOLDER, user.id);

        return callback(null, {
            message: responseMessage.USER.DELETED,
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
