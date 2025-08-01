import {
    apiResponse,
    asyncHandler,
    grpcToHttpStatus,
    utilFns,
} from '@atc/common';
import { logger } from '@atc/logger';
import {
    CreateAdminNotificationResponse,
    DeleteAdminNotificationResponse,
    GetAdminNotificationsResponse,
    GetNotificationsResponse,
    GetSingleAdminNotificationResponse,
    RetryAdminNotificationResponse,
    UpdateAdminNotificationResponse,
} from '@atc/proto';
import { notificationStub } from '../client';

const createAdminNotification = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const notification: Promise<CreateAdminNotificationResponse> =
            new Promise((resolve, reject) => {
                notificationStub.CreateAdminNotification(
                    req.body,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await notification;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const updateAdminNotification = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const notification: Promise<UpdateAdminNotificationResponse> =
            new Promise((resolve, reject) => {
                notificationStub.UpdateAdminNotification(
                    { ...req.params, ...req.body },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await notification;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getAdminNotifications = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const notifications: Promise<GetAdminNotificationsResponse> =
            new Promise((resolve, reject) => {
                notificationStub.GetAdminNotifications(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await notifications;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getSingleAdminNotifications = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const notification: Promise<GetSingleAdminNotificationResponse> =
            new Promise((resolve, reject) => {
                notificationStub.GetSingleAdminNotification(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await notification;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const deleteAdminNotification = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const notification: Promise<DeleteAdminNotificationResponse> =
            new Promise((resolve, reject) => {
                notificationStub.DeleteAdminNotification(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await notification;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getNotifications = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const notifications: Promise<GetNotificationsResponse> = new Promise(
            (resolve, reject) => {
                notificationStub.GetNotifications(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await notifications;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const retryAdminNotification = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const notification: Promise<RetryAdminNotificationResponse> =
            new Promise((resolve, reject) => {
                notificationStub.RetryAdminNotification(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await notification;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

export {
    createAdminNotification,
    updateAdminNotification,
    getAdminNotifications,
    getSingleAdminNotifications,
    deleteAdminNotification,
    getNotifications,
    retryAdminNotification,
};
