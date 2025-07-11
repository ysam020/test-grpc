import {
    apiResponse,
    asyncHandler,
    grpcToHttpStatus,
    utilFns,
} from '@atc/common';
import { logger } from '@atc/logger';
import {
    AddToBasketResponse,
    ClearBasketResponse,
    RemoveFromBasketResponse,
    ViewBasketResponse,
} from '@atc/proto';
import { userStub } from '../client';

const addToBasket = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const addBasket: Promise<AddToBasketResponse> = new Promise(
            (resolve, reject) => {
                userStub.AddToBasket(
                    req.body,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await addBasket;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const removeFromBasket = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const basket: Promise<RemoveFromBasketResponse> = new Promise(
            (resolve, reject) => {
                userStub.RemoveFromBasket(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await basket;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const clearBasket = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const basket: Promise<ClearBasketResponse> = new Promise(
            (resolve, reject) => {
                userStub.ClearBasket(
                    {},
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await basket;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const viewBasket = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const basket: Promise<ViewBasketResponse> = new Promise(
            (resolve, reject) => {
                userStub.ViewBasket(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await basket;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

export { addToBasket, removeFromBasket, clearBasket, viewBasket };
