import { WidgetServiceHandlers } from '@atc/proto';
import { addBanner } from './addBanner';
import { addWidget } from './addWidget';
import { updateBanner } from './updateBanner';
import { deleteBanner } from './deleteBanner';
import { addWidgetSurvey } from './addWidgetSurvey';
import { deleteWidgetSurvey } from './deleteWidgetSurvey';
import { addProductSlider } from './addProductSlider';
import { updateProductSlider } from './updateProductSlider';
import { deleteProductSlider } from './deleteProductSlider';
import { publishWidget } from './publishWidget';
import { saveAsDraft } from './saveAsDraft';
import { getWidgets } from './getWidgets';
import { getSingleWidget } from './getSingleWidget';
import { deleteWidget } from './deleteWidget';
import { getActiveWidget } from './getActiveWidget';
import { getBanner } from './getBanner';
import { getProductSlider } from './getProductSlider';
import { toggleWidgetActivation } from './toggleWidgetActivation';
import { getActiveLayout } from './getActiveLayout';
import { updateWidgetSurvey } from './updateWidgetSurvey';
import { findWidgetsBySample } from './findWidgetsBySample';
import { RemoveSurveyFromWidget } from './removeSurveyFromWidget';

export const handlers: WidgetServiceHandlers = {
    AddWidget: addWidget,
    AddBanner: addBanner,
    UpdateBanner: updateBanner,
    DeleteBanner: deleteBanner,
    AddWidgetSurvey: addWidgetSurvey,
    DeleteWidgetSurvey: deleteWidgetSurvey,
    AddProductSlider: addProductSlider,
    UpdateProductSlider: updateProductSlider,
    DeleteProductSlider: deleteProductSlider,
    PublishWidget: publishWidget,
    SaveAsDraft: saveAsDraft,
    GetWidgets: getWidgets,
    GetSingleWidget: getSingleWidget,
    DeleteWidget: deleteWidget,
    GetActiveWidget: getActiveWidget,
    GetBanner: getBanner,
    GetProductSlider: getProductSlider,
    ToggleWidgetActivation: toggleWidgetActivation,
    GetActiveLayout: getActiveLayout,
    UpdateWidgetSurvey: updateWidgetSurvey,
    FindWidgetsBySample: findWidgetsBySample,
    RemoveSurveyFromWidget: RemoveSurveyFromWidget,
};
