import { Router } from 'express';
import {
    addBanner,
    addProductSlider,
    addWidget,
    addWidgetSurvey,
    deleteBanner,
    deleteProductSlider,
    deleteWidget,
    deleteWidgetSurvey,
    getActiveWidget,
    getBanner,
    getProductSlider,
    getSingleWidget,
    getWidgets,
    publishWidget,
    saveAsDraft,
    toggleWidgetActivation,
    updateBanner,
    updateProductSlider,
    updateWidgetSurvey,
} from '../controllers/widget.controller';
import { uploadFile } from '../middlewares/uploadFile.middleware';
import { validateData } from '../middlewares/validation.middleware';
import { UUIDSchema, widgetValidation } from '@atc/common';

const widgetRouter = Router();

widgetRouter.post(
    '/',
    validateData(widgetValidation.addWidgetSchema),
    addWidget,
);

widgetRouter.get(
    '/',
    validateData(undefined, widgetValidation.getWidgetsSchema),
    getWidgets,
);

widgetRouter.get('/active', getActiveWidget);

widgetRouter.post(
    '/banner',
    uploadFile,
    validateData(widgetValidation.addBannerSchema),
    addBanner,
);

widgetRouter.put(
    '/banner/:id',
    uploadFile,
    validateData(widgetValidation.updateBannerSchema, undefined, UUIDSchema),
    updateBanner,
);

widgetRouter.delete(
    '/banner/:id',
    validateData(undefined, undefined, UUIDSchema),
    deleteBanner,
);

widgetRouter.post(
    '/survey',
    validateData(widgetValidation.addWidgetSurveySchema),
    addWidgetSurvey,
);

widgetRouter.put(
    '/survey/:survey_id',
    validateData(
        widgetValidation.updateWidgetSurveySchema,
        undefined,
        widgetValidation.surveyIDSchema,
    ),
    updateWidgetSurvey,
);

widgetRouter.delete(
    '/survey',
    validateData(widgetValidation.deleteWidgetSurveySchema),
    deleteWidgetSurvey,
);

widgetRouter.post(
    '/productSlider',
    uploadFile,
    validateData(widgetValidation.addProductSliderSchema),
    addProductSlider,
);

widgetRouter.put(
    '/productSlider/:product_slider_id',
    uploadFile,
    validateData(
        widgetValidation.updateProductSliderSchema,
        undefined,
        widgetValidation.productSliderIDSchema,
    ),
    updateProductSlider,
);

widgetRouter.delete(
    '/productSlider/:product_slider_id',
    validateData(undefined, undefined, widgetValidation.productSliderIDSchema),
    deleteProductSlider,
);

widgetRouter.get(
    '/banner/:banner_id',
    validateData(undefined, undefined, widgetValidation.bannerIDSchema),
    getBanner,
);

widgetRouter.get(
    '/productSlider/:product_slider_id',
    validateData(undefined, undefined, widgetValidation.productSliderIDSchema),
    getProductSlider,
);

widgetRouter.put(
    '/toggle/:widget_id',
    validateData(undefined, undefined, widgetValidation.widgetIDSchema),
    toggleWidgetActivation,
);

widgetRouter.put(
    '/:widget_id',
    validateData(
        widgetValidation.publishWidgetSchema,
        undefined,
        widgetValidation.widgetIDSchema,
    ),
    publishWidget,
);

widgetRouter.post(
    '/:widget_id',
    validateData(
        widgetValidation.saveAsDraftSchema,
        undefined,
        widgetValidation.widgetIDSchema,
    ),
    saveAsDraft,
);

widgetRouter.get(
    '/:widget_id',
    validateData(undefined, undefined, widgetValidation.widgetIDSchema),
    getSingleWidget,
);

widgetRouter.delete(
    '/:widget_id',
    validateData(undefined, undefined, widgetValidation.widgetIDSchema),
    deleteWidget,
);

export { widgetRouter };
