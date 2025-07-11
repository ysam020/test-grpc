import { logger } from '@atc/logger';
import {
    UpdateUserResponse,
    UpdateUserResponse__Output,
    UpdateUserRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    getPostcodeData,
    getUserByID,
    updateUserByID,
    updateUserPreference,
} from '../services/model.service';
import {
    constants,
    errorMessage,
    invalidateCloudFrontCache,
    putS3Object,
    responseMessage,
    utilFns,
} from '@atc/common';
import { prismaClient } from '@atc/db';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { updateUserType } from '../validations';

const updateUser = async (
    call: CustomServerUnaryCall<UpdateUserRequest__Output, UpdateUserResponse>,
    callback: sendUnaryData<UpdateUserResponse__Output>,
) => {
    try {
        const {
            id,
            first_name,
            last_name,
            profile_pic,
            retailer_ids,
            address,
            city,
            postcode,
            no_of_adult,
            no_of_child,
            phone_number,
            birth_date,
            gender,
            mime_type,
            content_length,
        } = utilFns.removeEmptyFields(call.request) as updateUserType;
        const { userID } = call.user;

        const updateUserData: prismaClient.Prisma.UserUpdateInput = {};

        if (id !== userID) {
            return callback(null, {
                message: errorMessage.USER.UNAUTHORIZED_ACCESS,
                data: null,
                status: status.UNAUTHENTICATED,
            });
        }

        if (first_name) {
            updateUserData.first_name = first_name;
        }
        if (last_name) {
            updateUserData.last_name = last_name;
        }

        if (profile_pic) {
            await invalidateCloudFrontCache(
                `${constants.PROFILE_PIC_FOLDER}/${id}`,
            );

            await putS3Object(
                constants.PROFILE_PIC_FOLDER,
                profile_pic,
                id,
                mime_type,
                content_length,
            );

            updateUserData.profile_pic = userID;
        }

        if (address) {
            updateUserData.address = address;
        }

        if (city) {
            updateUserData.city = city;
        }

        if (postcode) {
            updateUserData.postcode = postcode;

            const postcodeData = await getPostcodeData(postcode);
            if (postcodeData && postcodeData.electorate_rating) {
                const region = utilFns.mapElectorateRatingToRegion(
                    postcodeData.electorate_rating,
                );

                updateUserData.region = region;
            }
        }

        if (no_of_adult) {
            updateUserData.no_of_adult = no_of_adult;
        }

        if (no_of_child) {
            updateUserData.no_of_children = no_of_child;
        }

        if (phone_number) {
            updateUserData.phone_number = phone_number;
        }

        if (birth_date) {
            const age = utilFns.calculateAge(birth_date);
            updateUserData.birth_date = birth_date;
            updateUserData.age = age;
        }

        if (gender) {
            updateUserData.gender = gender;
        }

        const updatedUser = await updateUserByID(id, updateUserData);

        if (retailer_ids && retailer_ids.length > 0) {
            await updateUserPreference(userID, retailer_ids);
        }

        const userData = await getUserByID(userID);

        const sample_registered =
            updatedUser.age &&
            updatedUser.address &&
            updatedUser.city &&
            updatedUser.first_name &&
            updatedUser.last_name &&
            updatedUser.no_of_adult !== null &&
            updatedUser.no_of_children !== null &&
            updatedUser.postcode &&
            updatedUser.phone_number;

        return callback(null, {
            message: responseMessage.USER.UPDATED,
            data: {
                id: updatedUser.id,
                email: updatedUser.email,
                first_name: updatedUser.first_name || '',
                last_name: updatedUser.last_name || '',
                profile_pic: updatedUser.profile_pic || '',
                createdAt: updatedUser.createdAt
                    ? new Date(updatedUser.createdAt).toISOString()
                    : '',
                preferences: {
                    retailers: userData?.Preference?.retailers
                        ? userData.Preference.retailers.map((retailer) => ({
                              id: retailer.id,
                              retailer_name: retailer.retailer_name,
                              image_url: '',
                          }))
                        : [],
                },
                address: updatedUser.address || '',
                city: updatedUser.city || '',
                postcode: updatedUser.postcode || 0,
                no_of_adult: updatedUser.no_of_adult || 0,
                no_of_child: updatedUser.no_of_children || 0,
                phone_number: updatedUser.phone_number || '',
                birth_date: updatedUser.birth_date?.toISOString() || '',
                gender: updatedUser.gender || '',
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

export { updateUser };
