import {
    apiResponse,
    asyncHandler,
    grpcToHttpStatus,
    utilFns,
} from '@atc/common';
import {
    CreateSurveyResponse,
    DeleteSurveyResponse,
    ExportToExcelSurveyResponse,
    GetAllSurveyResponse,
    GetSingleSurveyResponse,
    GetSurveyEngagementResponse,
    SubmitSurveyAnswerResponse,
    ToggleSurveyResponse,
    UpdateSurveyResponse,
} from '@atc/proto';
import { surveyStub } from '../client';
import { logger } from '@atc/logger';

const createSurvey = asyncHandler(async (req, res) => {
    try {
        const body = utilFns.removeEmptyFields(req.body);

        const data = utilFns.convertSnakeToCamel(body);

        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const newSurvey: Promise<CreateSurveyResponse> = new Promise(
            (resolve, reject) => {
                surveyStub.CreateSurvey(
                    { ...data, ...req.params },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await newSurvey;

        const responseData = utilFns.convertCamelToSnake(resData);

        return apiResponse(res, grpcToHttpStatus(status), responseData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getSingleSurvey = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const getSurvey: Promise<GetSingleSurveyResponse> = new Promise(
            (resolve, reject) => {
                surveyStub.GetSingleSurvey(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await getSurvey;

        const responseData = utilFns.convertCamelToSnake(resData);

        return apiResponse(res, grpcToHttpStatus(status), responseData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getAllSurvey = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const allSurvey: Promise<GetAllSurveyResponse> = new Promise(
            (resolve, reject) => {
                surveyStub.GetAllSurvey(
                    { ...req.query, ...req.params },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await allSurvey;

        const responseData = utilFns.convertCamelToSnake(resData);

        return apiResponse(res, grpcToHttpStatus(status), responseData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const updateSurvey = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const data = utilFns.convertSnakeToCamel(req.body);

        const editSurvey: Promise<UpdateSurveyResponse> = new Promise(
            (resolve, reject) => {
                surveyStub.UpdateSurvey(
                    { ...req.params, ...data },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await editSurvey;

        const responseData = utilFns.convertCamelToSnake(resData);

        return apiResponse(res, grpcToHttpStatus(status), responseData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const deleteSurvey = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const removeSurvey: Promise<DeleteSurveyResponse> = new Promise(
            (resolve, reject) => {
                surveyStub.DeleteSurvey(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await removeSurvey;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const toggleSurvey = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const editSurvey: Promise<ToggleSurveyResponse> = new Promise(
            (resolve, reject) => {
                surveyStub.ToggleSurvey(
                    { ...req.params, ...req.body },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await editSurvey;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const submitSurveyAnswer = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const submitAnswer: Promise<SubmitSurveyAnswerResponse> = new Promise(
            (resolve, reject) => {
                surveyStub.SubmitSurveyAnswer(
                    { ...req.params, ...req.body },
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

const draftSurvey = asyncHandler(async (req, res) => {
    try {
        const body = utilFns.removeEmptyFields(req.body);

        const data = utilFns.convertSnakeToCamel(body);

        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const newSurvey: Promise<CreateSurveyResponse> = new Promise(
            (resolve, reject) => {
                surveyStub.DraftSurvey(
                    { ...data, ...req.params },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await newSurvey;

        const responseData = utilFns.convertCamelToSnake(resData);

        return apiResponse(res, grpcToHttpStatus(status), responseData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getAllResponses = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const allResponse: Promise<CreateSurveyResponse> = new Promise(
            (resolve, reject) => {
                surveyStub.GetAllResponsesByUserID(
                    { ...req.params, ...req.query },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await allResponse;

        const responseData = utilFns.convertCamelToSnake(resData);

        return apiResponse(res, grpcToHttpStatus(status), responseData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getSurveyEngagement = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const surveyEngagement: Promise<GetSurveyEngagementResponse> =
            new Promise((resolve, reject) => {
                surveyStub.GetSurveyEngagement(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await surveyEngagement;

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

        const exportReport: Promise<ExportToExcelSurveyResponse> = new Promise(
            (resolve, reject) => {
                surveyStub.ExportToExcel(
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
    createSurvey,
    getSingleSurvey,
    getAllSurvey,
    updateSurvey,
    deleteSurvey,
    toggleSurvey,
    submitSurveyAnswer,
    draftSurvey,
    getAllResponses,
    getSurveyEngagement,
    exportToExcel,
};
