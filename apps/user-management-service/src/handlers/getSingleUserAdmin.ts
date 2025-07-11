import {
    errorMessage,
    responseMessage,
    UserRoleEnum,
    utilFns,
} from '@atc/common';
import { logger } from '@atc/logger';
import {
    GetSingleUserRequest__Output,
    GetUserAdminResponse,
    GetUserAdminResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getUserByID } from '../services/model.service';
import { CustomServerUnaryCall } from '@atc/grpc-server';

const getSingleUserAdmin = async (
    call: CustomServerUnaryCall<
        GetSingleUserRequest__Output,
        GetUserAdminResponse
    >,
    callback: sendUnaryData<GetUserAdminResponse__Output>,
) => {
    try {
        const { id } = utilFns.removeEmptyFields(call.request);
        const { userID, role } = call.user;

        if (role !== UserRoleEnum.ADMIN && userID !== id) {
            return callback(null, {
                message: errorMessage.USER.UNAUTHORIZED_ACCESS,
                data: null,
                status: status.UNAUTHENTICATED,
            });
        }

        const user = await getUserByID(id);
        if (!user) {
            return callback(null, {
                message: errorMessage.USER.NOT_FOUND,
                data: null,
                status: status.NOT_FOUND,
            });
        }

        return callback(null, {
            message: responseMessage.USER.RETRIEVED,
            data: {
                id: user.id,
                email: '******',
                postcode: user.postcode || 0,
                no_of_adult: user.no_of_adult || 0,
                no_of_child: user.no_of_children || 0,
                gender: user.gender || '',
                age: user.age || 0,
            },
            status: status.OK,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            data: null,
            status: status.INTERNAL,
        });
    }
};

export { getSingleUserAdmin };
