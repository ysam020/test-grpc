import {
    apiResponse,
    asyncHandler,
    grpcToHttpStatus,
    utilFns,
} from '@atc/common';
import { logger } from '@atc/logger';
import {
    CountResponse,
    CreateSampleResponse,
    ExportToExcelResponse,
    FetchAllSamplesForUserResponse,
    FetchSampleForUserResponse,
    GetAllRequestedSampleResponse,
    GetAllSampleResponse,
    GetSampleEngagementResponse,
    GetSingleUserResponse,
    UpdateSampleResponse,
} from '@atc/proto';
import { sampleStub } from '../client';

const createSample = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const newSample: Promise<CreateSampleResponse> = new Promise(
            (resolve, reject) => {
                sampleStub.CreateSample(
                    {
                        ...req.body,
                        ...req.params,
                        image: req.file ? req.file.buffer : null,
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

        const { status, ...resData } = await newSample;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const createDraft = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const newDraft: Promise<CreateSampleResponse> = new Promise(
            (resolve, reject) => {
                sampleStub.DraftSample(
                    {
                        ...req.body,
                        ...req.params,
                        image: req.file ? req.file.buffer : null,
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

        const { status, ...resData } = await newDraft;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const updateSample = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const editSample: Promise<UpdateSampleResponse> = new Promise(
            (resolve, reject) => {
                sampleStub.UpdateSample(
                    {
                        ...req.body,
                        ...req.params,
                        image: req.file ? req.file.buffer : null,
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

        const { status, ...resData } = await editSample;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const deleteSample = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const removeSample: Promise<UpdateSampleResponse> = new Promise(
            (resolve, reject) => {
                sampleStub.DeleteSample(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await removeSample;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getSingleSample = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const getOneSample: Promise<GetSingleUserResponse> = new Promise(
            (resolve, reject) => {
                sampleStub.GetSingleSample(
                    { ...req.params, ...req.query },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await getOneSample;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getAllSample = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const allSample: Promise<GetAllSampleResponse> = new Promise(
            (resolve, reject) => {
                sampleStub.GetAllSample(
                    { ...req.params, ...req.query },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await allSample;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const toggleSample = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const editSample: Promise<GetAllSampleResponse> = new Promise(
            (resolve, reject) => {
                sampleStub.ToggleSample(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await editSample;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const submitSampleAnswer = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const submitAnswer: Promise<GetAllSampleResponse> = new Promise(
            (resolve, reject) => {
                sampleStub.SubmitSampleAnswer(
                    { ...req.body, ...req.params },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await submitAnswer;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const reviewSample = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const rateSample: Promise<GetAllSampleResponse> = new Promise(
            (resolve, reject) => {
                sampleStub.ReviewSample(
                    {
                        ...req.body,
                        ...req.params,
                        image: req.file ? req.file.buffer : null,
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

        const { status, ...resData } = await rateSample;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getAllReviews = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const getReviews: Promise<GetAllSampleResponse> = new Promise(
            (resolve, reject) => {
                sampleStub.GetAllReview(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await getReviews;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});
const fetchSingleSample = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const fetchOneSample: Promise<FetchSampleForUserResponse> = new Promise(
            (resolve, reject) => {
                sampleStub.FetchSampleForUser(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await fetchOneSample;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const fetchAllSample = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const allSample: Promise<FetchAllSamplesForUserResponse> = new Promise(
            (resolve, reject) => {
                sampleStub.FetchAllSampleForUser(
                    { ...req.params, ...req.query },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await allSample;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getAllRequestedSample = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const allRequestedSamples: Promise<GetAllRequestedSampleResponse> =
            new Promise((resolve, reject) => {
                sampleStub.GetAllRequestedSamples(
                    { ...req.params, ...req.query },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await allRequestedSamples;

        const responseData = utilFns.convertCamelToSnake(resData);

        return apiResponse(res, grpcToHttpStatus(status), responseData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getSampleEngagement = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const dashboard: Promise<GetSampleEngagementResponse> = new Promise(
            (resolve, reject) => {
                sampleStub.GetSampleEngagement(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await dashboard;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const exportToExcel = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const exportReport: Promise<ExportToExcelResponse> = new Promise(
            (resolve, reject) => {
                sampleStub.ExportToExcel(
                    { ...req.params, ...req.query },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await exportReport;

        const responseData = utilFns.convertCamelToSnake(resData);

        return apiResponse(res, grpcToHttpStatus(status), responseData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

export {
    createDraft,
    createSample,
    updateSample,
    deleteSample,
    getSingleSample,
    getAllSample,
    toggleSample,
    submitSampleAnswer,
    reviewSample,
    getAllReviews,
    fetchSingleSample,
    fetchAllSample,
    getAllRequestedSample,
    getSampleEngagement,
    exportToExcel,
};
