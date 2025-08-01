import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { logger } from '@atc/logger';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { getAllUsers } from '../services/model.service';
import {
    GetUsersResponse,
    GetUsersResponse__Output,
    GetUsersRequest__Output,
} from '@atc/proto';

export const getUsers = async (
    call: ServerUnaryCall<GetUsersRequest__Output, GetUsersResponse>,
    callback: sendUnaryData<GetUsersResponse__Output>,
) => {
    try {
        const { page, limit } = utilFns.removeEmptyFields(call.request);

        const { users, totalCount } = await getAllUsers(page, limit);

        return callback(null, {
            message: responseMessage.USER.RETRIEVED,
            data: {
                users: users.map((user) => ({
                    id: user.id,
                    age: user.age || 0,
                    email: '********',
                    gender: user.gender || '',
                    no_of_adult: user.no_of_adult || 0,
                    no_of_child: user.no_of_children || 0,
                    postcode: user.postcode || 0,
                })),
                total_count: totalCount,
            },
            status: status.OK,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            data: { users: [], total_count: 0 },
            status: status.INTERNAL,
        });
    }
};
