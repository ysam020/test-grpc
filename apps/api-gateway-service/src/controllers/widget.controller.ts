import {
    apiResponse,
    asyncHandler,
    grpcToHttpStatus,
    utilFns,
} from '@atc/common';
import { widgetStub } from '../client';
import {
    AddBannerResponse,
    AddProductSliderResponse,
    AddWidgetResponse,
    AddWidgetSurveyResponse,
    DeleteBannerResponse,
    DeleteProductSliderResponse,
    DeleteWidgetResponse,
    DeleteWidgetSurveyResponse,
    GetActiveWidgetResponse,
    GetBannerResponse,
    GetProductSliderResponse,
    GetSingleWidgetResponse,
    GetWidgetsResponse,
    PublishWidgetResponse,
    SaveAsDraftResponse,
    ToggleWidgetActivationResponse,
    UpdateBannerResponse,
    UpdateProductSliderResponse,
    UpdateWidgetSurveyResponse,
} from '@atc/proto';
import { logger } from '@atc/logger';

const addWidget = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const widget: Promise<AddWidgetResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.AddWidget(
                    req.body,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await widget;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const addBanner = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const banner: Promise<AddBannerResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.AddBanner(
                    {
                        ...req.body,
                        image: req.file.buffer,
                        mime_type: req.file.mimetype,
                        content_length: req.file.size,
                    },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await banner;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const updateBanner = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const banner: Promise<UpdateBannerResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.UpdateBanner(
                    {
                        ...req.params,
                        ...req.body,
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

        const { status, ...resData } = await banner;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const deleteBanner = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const banner: Promise<DeleteBannerResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.DeleteBanner(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await banner;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const addWidgetSurvey = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const widgetSurvey: Promise<AddWidgetSurveyResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.AddWidgetSurvey(
                    req.body,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await widgetSurvey;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const deleteWidgetSurvey = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const widgetSurvey: Promise<DeleteWidgetSurveyResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.DeleteWidgetSurvey(
                    req.body,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await widgetSurvey;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const addProductSlider = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const productSlider: Promise<AddProductSliderResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.AddProductSlider(
                    {
                        ...req.body,
                        brand_logo: req.file.buffer,
                        mime_type: req.file.mimetype,
                        content_length: req.file.size,
                    },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await productSlider;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const updateProductSlider = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const productSlider: Promise<UpdateProductSliderResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.UpdateProductSlider(
                    {
                        ...req.params,
                        ...req.body,
                        brand_logo: req.file ? req.file.buffer : null,
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

        const { status, ...resData } = await productSlider;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const deleteProductSlider = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const deletedProductSlider: Promise<DeleteProductSliderResponse> =
            new Promise((resolve, reject) => {
                widgetStub.DeleteProductSlider(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            });

        const { status, ...resData } = await deletedProductSlider;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const publishWidget = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const publishedWidget: Promise<PublishWidgetResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.PublishWidget(
                    { ...req.params, ...req.body },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await publishedWidget;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const saveAsDraft = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const draftWidget: Promise<SaveAsDraftResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.SaveAsDraft(
                    { ...req.params, ...req.body },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await draftWidget;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getWidgets = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const widgets: Promise<GetWidgetsResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.GetWidgets(
                    req.query,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await widgets;

        const cleanedData = utilFns.cleanObject(resData);

        return apiResponse(res, grpcToHttpStatus(status), cleanedData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getSingleWidget = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const widget: Promise<GetSingleWidgetResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.GetSingleWidget(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await widget;

        const cleanedData = utilFns.cleanObject(resData);

        return apiResponse(res, grpcToHttpStatus(status), cleanedData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const deleteWidget = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const widget: Promise<DeleteWidgetResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.DeleteWidget(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await widget;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getActiveWidget = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const widget: Promise<GetActiveWidgetResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.GetActiveWidget(
                    {},
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await widget;

        const cleanedData = utilFns.cleanObject(resData);

        return apiResponse(res, grpcToHttpStatus(status), cleanedData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getBanner = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const banner: Promise<GetBannerResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.GetBanner(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await banner;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getProductSlider = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const productSlider: Promise<GetProductSliderResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.GetProductSlider(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await productSlider;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const toggleWidgetActivation = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const widget: Promise<ToggleWidgetActivationResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.ToggleWidgetActivation(
                    req.params,
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await widget;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const updateWidgetSurvey = asyncHandler(async (req, res) => {
    try {
        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const widgetSurvey: Promise<UpdateWidgetSurveyResponse> = new Promise(
            (resolve, reject) => {
                widgetStub.UpdateWidgetSurvey(
                    { ...req.params, ...req.body },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        const { status, ...resData } = await widgetSurvey;

        return apiResponse(res, grpcToHttpStatus(status), resData);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

export {
    addWidget,
    addBanner,
    updateBanner,
    deleteBanner,
    addWidgetSurvey,
    deleteWidgetSurvey,
    addProductSlider,
    updateProductSlider,
    deleteProductSlider,
    publishWidget,
    saveAsDraft,
    getWidgets,
    getSingleWidget,
    deleteWidget,
    getActiveWidget,
    getBanner,
    getProductSlider,
    toggleWidgetActivation,
    updateWidgetSurvey,
};
