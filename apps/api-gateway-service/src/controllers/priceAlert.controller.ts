import {
    apiResponse,
    asyncHandler,
    grpcToHttpStatus,
    utilFns,
} from '@atc/common';
import {
    AddPriceAlertResponse,
    DeletePriceAlertResponse,
    GetPriceAlertsResponse,
} from '@atc/proto';
import { notificationStub } from '../client';
import { logger } from '@atc/logger';

const addPriceAlert = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const priceAlert: Promise<AddPriceAlertResponse> = new Promise(
            (resolve, reject) => {
                notificationStub.AddPriceAlert(
                    req.body,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await priceAlert;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getPriceAlerts = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const priceAlerts: Promise<GetPriceAlertsResponse> = new Promise(
            (resolve, reject) => {
                notificationStub.GetPriceAlerts(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await priceAlerts;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const deletePriceAlert = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const priceAlert: Promise<DeletePriceAlertResponse> = new Promise(
            (resolve, reject) => {
                notificationStub.DeletePriceAlert(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await priceAlert;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

export { addPriceAlert, getPriceAlerts, deletePriceAlert };
