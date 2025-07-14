import { apiResponse, asyncHandler, utilFns } from '@atc/common';
import {
    UpdateUserResponse,
    GetSingleUserResponse,
    DeleteUserResponse,
    GetUsersResponse,
    ChangePasswordResponse,
    AcceptDeviceTokenResponse,
    GetUserEngagementResponse,
} from '@atc/proto';
import { userStub } from '../client';
import { grpcToHttpStatus } from '@atc/common';
import { logger } from '@atc/logger';

const getSingleUser = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const getUser: Promise<GetSingleUserResponse> = new Promise(
            (resolve, reject) => {
                userStub.GetSingleUser(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await getUser;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getSingleUserAdmin = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const getUser: Promise<GetSingleUserResponse> = new Promise(
            (resolve, reject) => {
                userStub.GetSingleUserAmin(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await getUser;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const updateUser = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const updatedUser: Promise<UpdateUserResponse> = new Promise(
            (resolve, reject) => {
                userStub.UpdateUser(
                    {
                        ...req.body,
                        ...req.params,
                        profile_pic: req.file ? req.file.buffer : null,
                        mime_type: req.file ? req.file.mimetype : '',
                        content_length: req.file ? req.file.size : 0,
                    },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await updatedUser;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const deleteUser = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const deletedUser: Promise<DeleteUserResponse> = new Promise(
            (resolve, reject) => {
                userStub.DeleteUser(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await deletedUser;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getUsers = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const allUsers: Promise<GetUsersResponse> = new Promise(
            (resolve, reject) => {
                userStub.GetUsers(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await allUsers;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const changePassword = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const changePass: Promise<ChangePasswordResponse> = new Promise(
            (resolve, reject) => {
                userStub.ChangePassword(
                    { ...req.params, ...req.body },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await changePass;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const acceptDeviceToken = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const deviceToken: Promise<AcceptDeviceTokenResponse> = new Promise(
            (resolve, reject) => {
                userStub.AcceptDeviceToken(
                    req.body,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await deviceToken;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getUserEngagement = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const userEngagement: Promise<GetUserEngagementResponse> = new Promise(
            (resolve, reject) => {
                userStub.GetUserEngagement(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await userEngagement;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

export {
    getSingleUser,
    updateUser,
    deleteUser,
    getUsers,
    changePassword,
    acceptDeviceToken,
    getSingleUserAdmin,
    getUserEngagement,
};
