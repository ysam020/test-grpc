import {
    apiResponse,
    asyncHandler,
    errorMessage,
    grpcToHttpStatus,
    RESPONSE_STATUS,
    responseMessage,
    UserSampleStatus,
    utilFns,
} from '@atc/common';
import {
    allProducts,
    didUserAnswered,
    getActiveWidgetLayout,
    getSampleStatus,
    getSurveyByID,
} from '../services/client.service';
import {
    DidUserAnsweredResponse,
    GetActiveLayoutResponse,
    getAllProductsResponse,
    GetSampleStatusResponse,
    GetSingleSurveyResponse,
} from '@atc/proto';
import { getProductSliderByID } from '../services/product-slider.service';
import { logger } from '@atc/logger';

const getActiveLayout = asyncHandler(async (req, res) => {
    try {
        const auth = req.headers.authorization;
        const token = auth?.split(' ')[1];

        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const layoutData = [];
        const widget: GetActiveLayoutResponse =
            await getActiveWidgetLayout(metadata);

        if (!widget.data) {
            return apiResponse(res, RESPONSE_STATUS.NOT_FOUND, {
                message: 'Layout not found',
            });
        }

        const allSurveys = widget.data.widget.component.map((wid) => {
            if (wid.component_type === 'SURVEY') {
                return wid.reference_model_id;
            }
        });

        const filteredSurveys = allSurveys.filter(
            (item) => item !== undefined && item !== '',
        );

        let userAnsweredSurvey: string[] = [];
        if (filteredSurveys.length && auth && token) {
            const userAnsweredSurveyRes: DidUserAnsweredResponse =
                await didUserAnswered(
                    { survey_ids: filteredSurveys },
                    metadata,
                );

            if (userAnsweredSurveyRes.data.length) {
                userAnsweredSurveyRes.data.forEach((res) => {
                    if (res.did_user_answered) {
                        userAnsweredSurvey.push(res.survey_id);
                    }
                });
            }
        }

        const sampleIDs = widget.data.banner
            .map((banner) => banner.widget_filter.sample_id)
            .filter((id) => id);

        let sampleStatusMap = new Map();

        if (auth && token && sampleIDs.length > 0) {
            const sampleStatus: GetSampleStatusResponse = await getSampleStatus(
                { sample_ids: sampleIDs },
                metadata,
            );

            sampleStatusMap = new Map(
                sampleStatus.data.map((item) => [item.sample_id, item.status]),
            );
        }

        const updatedBanners = widget.data.banner
            .map((banner) => {
                const sample_id = banner.widget_filter.sample_id;
                const status = sampleStatusMap.get(sample_id);

                if (status === UserSampleStatus.NOT_FOUND) {
                    return null;
                }

                if (auth && token) {
                    if (status === null) {
                        return null;
                    }

                    return {
                        ...banner,
                        widget_filter: {
                            ...banner.widget_filter,
                            sample_status: status,
                        },
                    };
                }

                if (!token && sample_id) {
                    return null;
                }

                return banner;
            })
            .filter((banner) => banner !== null);

        layoutData.push(...utilFns.cleanObject(updatedBanners));

        for (let i = 0; i < widget.data.widget.component.length; i++) {
            const element = widget.data.widget.component[i];
            if (
                element?.component_type === 'SURVEY' &&
                auth &&
                token &&
                !userAnsweredSurvey.includes(element.reference_model_id)
            ) {
                const surveyData = (await getSurveyByID(
                    { id: element.reference_model_id },
                    metadata,
                )) as GetSingleSurveyResponse;

                if (!surveyData.data) {
                    continue;
                }

                layoutData.push({
                    widget_type: 'SURVEY',
                    widget_metadata: {
                        widget_order: element.order,
                    },
                    widget_data: {
                        survey: {
                            survey_id: surveyData.data.id,
                            survey_question: surveyData.data.question.question,
                            survey_options: surveyData.data.option.map(
                                (surveyOp) => ({
                                    label: surveyOp.option,
                                    value: surveyOp.id,
                                    count: surveyOp.count,
                                }),
                            ),
                            survey_responses: surveyData.data.totalAnswered,
                        },
                    },
                });
            }

            if (element?.component_type === 'PRODUCT_SLIDER') {
                const productSliderData = await getProductSliderByID(
                    element.reference_model_id,
                );

                if (!productSliderData) {
                    continue;
                }

                const productBody = {
                    ...(productSliderData.brands.length && {
                        brand_ids: productSliderData.brands.map(
                            (data) => data.id,
                        ),
                    }),
                    ...(productSliderData.retailers.length && {
                        retailer_ids: productSliderData.retailers.map(
                            (data) => data.id,
                        ),
                    }),
                    ...(productSliderData.categories.length && {
                        category_ids: productSliderData.categories.map(
                            (data) => data.id,
                        ),
                    }),
                    ...(productSliderData.promotion_type && {
                        promotion_type: productSliderData.promotion_type,
                    }),
                    sort_by_field: productSliderData.sort_by_field,
                    sort_by_order: productSliderData.sort_by_order,
                    limit: productSliderData.number_of_product,
                    page: 1,
                };

                const productData = (await allProducts(
                    productBody,
                    metadata,
                )) as getAllProductsResponse;

                if (!productData.data) {
                    continue;
                }

                layoutData.push({
                    widget_type: 'PRODUCT_SLIDER',
                    widget_metadata: {
                        widget_order: element.order,
                        widget_name: productSliderData.module_name,
                        widget_image: productSliderData.brand_logo,
                        widget_background_color:
                            productSliderData.background_color,
                    },
                    widget_data: {
                        product_slider: productData.data.products,
                    },
                    widget_filter: {
                        brand_id: productBody.brand_ids,
                        category_id: productBody.category_ids,
                        retailer_id: productBody.retailer_ids,
                        promotion_type: productBody.promotion_type,
                        sort_by_field: productBody.sort_by_field,
                        sort_by_order: productBody.sort_by_order,
                        limit: productBody.limit,
                        page: productBody.page,
                    },
                });
            }
        }

        layoutData.sort(
            (a, b) =>
                a.widget_metadata.widget_order - b.widget_metadata.widget_order,
        );

        const widgetResponse = {
            widget_id: widget.data.widget.widget_id,
            widgets: layoutData,
            message: responseMessage.LAYOUT.ACTIVE_LAYOUT_FETCHED,
        };

        return apiResponse(res, RESPONSE_STATUS.SUCCESS, widgetResponse);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

const getSingleLayout = asyncHandler(async (req, res) => {
    try {
        const { widget_id } = req.params;

        const auth = req.headers.authorization;
        const token = auth?.split(' ')[1];

        if (!token) {
            return apiResponse(res, RESPONSE_STATUS.UN_AUTHORIZED, {
                message: errorMessage.TOKEN.NOT_FOUND,
            });
        }

        const metadata = utilFns.createMetadata(
            'authorization',
            req.headers.authorization,
        );

        const layoutData = [];
        const widget: GetActiveLayoutResponse = await getActiveWidgetLayout(
            metadata,
            widget_id,
        );

        if (!widget.data) {
            return apiResponse(res, RESPONSE_STATUS.NOT_FOUND, {
                message: 'Layout not found',
            });
        }

        layoutData.push(...utilFns.cleanObject(widget.data.banner));

        const allSurveys = widget.data.widget.component.map((wid) => {
            if (wid.component_type === 'SURVEY') {
                return wid.reference_model_id;
            }
        });

        const filteredSurveys = allSurveys.filter(
            (item) => item !== undefined && item !== '',
        );

        let userAnsweredSurvey: string[] = [];
        if (filteredSurveys.length && auth && token) {
            const userAnsweredSurveyRes: DidUserAnsweredResponse =
                await didUserAnswered(
                    { survey_ids: filteredSurveys },
                    metadata,
                );

            if (userAnsweredSurveyRes.data.length) {
                userAnsweredSurveyRes.data.forEach((res) => {
                    if (res.did_user_answered) {
                        userAnsweredSurvey.push(res.survey_id);
                    }
                });
            }
        }

        for (let i = 0; i < widget.data.widget.component.length; i++) {
            const element = widget.data.widget.component[i];
            if (
                element?.component_type === 'SURVEY' &&
                auth &&
                token &&
                !userAnsweredSurvey.includes(element.reference_model_id)
            ) {
                const surveyData = (await getSurveyByID(
                    { id: element.reference_model_id },
                    metadata,
                )) as GetSingleSurveyResponse;

                if (!surveyData.data) {
                    continue;
                }

                layoutData.push({
                    widget_type: 'SURVEY',
                    widget_metadata: {
                        widget_order: element.order,
                    },
                    widget_data: {
                        survey: {
                            survey_id: surveyData.data.id,
                            survey_question: surveyData.data.question.question,
                            survey_options: surveyData.data.option.map(
                                (surveyOp) => ({
                                    label: surveyOp.option,
                                    value: surveyOp.id,
                                    count: surveyOp.count,
                                }),
                            ),
                            survey_responses: surveyData.data.totalAnswered,
                        },
                    },
                });
            }

            if (element?.component_type === 'PRODUCT_SLIDER') {
                const productSliderData = await getProductSliderByID(
                    element.reference_model_id,
                );

                if (!productSliderData) {
                    continue;
                }

                const productBody = {
                    ...(productSliderData.brands.length && {
                        brand_ids: productSliderData.brands.map(
                            (data) => data.id,
                        ),
                    }),
                    ...(productSliderData.retailers.length && {
                        retailer_ids: productSliderData.retailers.map(
                            (data) => data.id,
                        ),
                    }),
                    ...(productSliderData.categories.length && {
                        category_ids: productSliderData.categories.map(
                            (data) => data.id,
                        ),
                    }),
                    ...(productSliderData.promotion_type && {
                        promotion_type: productSliderData.promotion_type,
                    }),
                    sort_by_field: productSliderData.sort_by_field,
                    sort_by_order: productSliderData.sort_by_order,
                    limit: productSliderData.number_of_product,
                    page: 1,
                };

                const productData = (await allProducts(
                    productBody,
                    metadata,
                )) as getAllProductsResponse;

                if (!productData.data) {
                    continue;
                }

                layoutData.push({
                    widget_type: 'PRODUCT_SLIDER',
                    widget_metadata: {
                        widget_order: element.order,
                        widget_name: productSliderData.module_name,
                        widget_image: productSliderData.brand_logo,
                        widget_background_color:
                            productSliderData.background_color,
                    },
                    widget_data: {
                        product_slider: productData.data.products,
                    },
                    widget_filter: {
                        brand_id: productBody.brand_ids,
                        category_id: productBody.category_ids,
                        retailer_id: productBody.retailer_ids,
                        promotion_type: productBody.promotion_type,
                        sort_by_field: productBody.sort_by_field,
                        sort_by_order: productBody.sort_by_order,
                        limit: productBody.limit,
                        page: productBody.page,
                    },
                });
            }
        }

        layoutData.sort(
            (a, b) =>
                a.widget_metadata.widget_order - b.widget_metadata.widget_order,
        );

        const widgetResponse = {
            message: responseMessage.LAYOUT.LAYOUT_FETCHED,
            widget_id: widget.data.widget.widget_id,
            widgets: layoutData,
        };

        return apiResponse(res, RESPONSE_STATUS.SUCCESS, widgetResponse);
    } catch (error) {
        logger.error(error);
        return apiResponse(res, grpcToHttpStatus(error.code), {
            message: error.details,
        });
    }
});

export { getActiveLayout, getSingleLayout };
