import {
    errorMessage,
    responseMessage,
    UserRoleEnum,
    utilFns,
} from '@atc/common';
import { logger } from '@atc/logger';
import {
    GetSingleUserResponse,
    GetSingleUserResponse__Output,
    GetSingleUserRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getUserByID } from '../services/model.service';
import { CustomServerUnaryCall } from '@atc/grpc-server';

const getSingleUser = async (
    call: CustomServerUnaryCall<
        GetSingleUserRequest__Output,
        GetSingleUserResponse
    >,
    callback: sendUnaryData<GetSingleUserResponse__Output>,
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

        const sample_registered =
            user.age &&
            user.address &&
            user.city &&
            user.first_name &&
            user.last_name &&
            user.no_of_adult !== null &&
            user.no_of_children !== null &&
            user.postcode &&
            user.phone_number;

        return callback(null, {
            message: responseMessage.USER.RETRIEVED,
            data: {
                id: user.id,
                email: user.email,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                profile_pic: user.profile_pic || '',
                createdAt: user.createdAt
                    ? new Date(user.createdAt).toISOString()
                    : '',
                preferences: {
                    retailers: user?.Preference?.retailers
                        ? user.Preference.retailers.map((retailer) => ({
                              id: retailer.id,
                              retailer_name: retailer.retailer_name,
                              image_url: '',
                          }))
                        : [],
                },
                address: user.address || '',
                city: user.city || '',
                postcode: user.postcode || 0,
                no_of_adult: user.no_of_adult || 0,
                no_of_child: user.no_of_children || 0,
                phone_number: user.phone_number || '',
                birth_date: user.birth_date?.toISOString() || '',
                gender: user.gender || '',
                sample_registered: Boolean(sample_registered),
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

export { getSingleUser };
