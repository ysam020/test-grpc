import {
    apiResponse,
    asyncHandler,
    grpcToHttpStatus,
    utilFns,
} from '@atc/common';
import { logger } from '@atc/logger';
import { CountResponse, ProductCountResponse } from '@atc/proto';
import {
    notificationStub,
    sampleStub,
    surveyStub,
    userStub,
    productStub,
} from '../client';

const dashboard = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const monthlyActiveUsers: Promise<CountResponse> = new Promise(
            (resolve, reject) => {
                userStub.GetMonthlyActiveUsersCount(
                    {},
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const samplesCount: Promise<CountResponse> = new Promise(
            (resolve, reject) => {
                sampleStub.GetSamplesCount(
                    {},
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const surveysCount: Promise<CountResponse> = new Promise(
            (resolve, reject) => {
                surveyStub.getSurveysCount(
                    {},
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const avgNotification: Promise<CountResponse> = new Promise(
            (resolve, reject) => {
                notificationStub.GetAverageNotificationCount(
                    {},
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const [
            monthlyActiveUsersRes,
            samplesCountRes,
            surveysCountRes,
            avgNotificationRes,
        ] = await Promise.all([
            monthlyActiveUsers,
            samplesCount,
            surveysCount,
            avgNotification,
        ]);

        const counts = {
            monthly_active_users: monthlyActiveUsersRes.data.count,
            samples_count: samplesCountRes.data.count,
            surveys_count: surveysCountRes.data.count,
            average_notification_count: avgNotificationRes.data.count,
        };

        return apiResponse(
            res,
            grpcToHttpStatus(monthlyActiveUsersRes.status),
            {
                message: monthlyActiveUsersRes.message,
                data: counts,
            },
        );
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const productDashboard = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const getProductsCount: Promise<ProductCountResponse> = new Promise(
            (resolve, reject) => {
                productStub.getProductsCount(
                    {},
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await getProductsCount;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

export { dashboard, productDashboard };
