import { healthCheck, UserRoleEnum } from '@atc/common';
import {
    BaseGrpcServer,
    authMiddleware,
    roleMiddleware,
} from '@atc/grpc-server';
import { serviceDefinitions } from '@atc/grpc-config';
import { handlers } from './handlers';
import {
    addBannerSchema,
    addProductSliderSchema,
    addWidgetSchema,
    addWidgetSurveySchema,
    productSliderIDSchema,
    deleteWidgetSurveySchema,
    getWidgetsSchema,
    publishWidgetSchema,
    saveAsDraftSchema,
    updateBannerSchema,
    updateProductSliderSchema,
    UUIDSchema,
    widgetIDSchema,
    bannerIDSchema,
    updateWidgetSurveySchema,
    getActiveLayoutSchema,
    findWidgetsBySampleSchema,
} from './validations';
import { RemoveSurveyFromWidget } from './handlers/removeSurveyFromWidget';

export class WidgetServer extends BaseGrpcServer {
    constructor() {
        super();
        this.initializeServer();
    }

    private initializeServer() {
        this.addMiddleware(
            authMiddleware([
                '/health.HealthService/healthCheck',
                '/widget.WidgetService/GetActiveWidget',
                '/widget.WidgetService/GetActiveLayout',
            ]),
        );

        const roleRequirements = {
            '/widget.WidgetService/AddWidget': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/AddBanner': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/UpdateBanner': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/DeleteBanner': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/AddWidgetSurvey': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/DeleteWidgetSurvey': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/AddProductSlider': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/UpdateProductSlider': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/DeleteProductSlider': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/PublishWidget': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/SaveAsDraft': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/GetWidgets': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/DeleteWidget': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/GetBanner': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/GetProductSlider': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/ToggleWidgetActivation': [
                UserRoleEnum.ADMIN,
            ],
            '/widget.WidgetService/UpdateWidgetSurvey': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/FindWidgetsBySample': [UserRoleEnum.ADMIN],
            '/widget.WidgetService/RemoveSurveyFromWidget': [
                UserRoleEnum.ADMIN,
            ],
        };

        this.addMiddleware(roleMiddleware(roleRequirements));

        this.addService(
            serviceDefinitions.widgetPackageDefinition.widget.WidgetService
                .service,
            {
                ...handlers,
                AddWidget: this.wrapWithValidation(
                    handlers.AddWidget,
                    addWidgetSchema,
                ),
                AddBanner: this.wrapWithValidation(
                    handlers.AddBanner,
                    addBannerSchema,
                ),
                UpdateBanner: this.wrapWithValidation(
                    handlers.UpdateBanner,
                    updateBannerSchema,
                ),
                DeleteBanner: this.wrapWithValidation(
                    handlers.DeleteBanner,
                    UUIDSchema,
                ),
                AddWidgetSurvey: this.wrapWithValidation(
                    handlers.AddWidgetSurvey,
                    addWidgetSurveySchema,
                ),
                DeleteWidgetSurvey: this.wrapWithValidation(
                    handlers.DeleteWidgetSurvey,
                    deleteWidgetSurveySchema,
                ),
                AddProductSlider: this.wrapWithValidation(
                    handlers.AddProductSlider,
                    addProductSliderSchema,
                ),
                UpdateProductSlider: this.wrapWithValidation(
                    handlers.UpdateProductSlider,
                    updateProductSliderSchema,
                ),
                DeleteProductSlider: this.wrapWithValidation(
                    handlers.DeleteProductSlider,
                    productSliderIDSchema,
                ),
                PublishWidget: this.wrapWithValidation(
                    handlers.PublishWidget,
                    publishWidgetSchema,
                ),
                SaveAsDraft: this.wrapWithValidation(
                    handlers.SaveAsDraft,
                    saveAsDraftSchema,
                ),
                GetWidgets: this.wrapWithValidation(
                    handlers.GetWidgets,
                    getWidgetsSchema,
                ),
                GetSingleWidget: this.wrapWithValidation(
                    handlers.GetSingleWidget,
                    widgetIDSchema,
                ),
                DeleteWidget: this.wrapWithValidation(
                    handlers.DeleteWidget,
                    widgetIDSchema,
                ),
                GetBanner: this.wrapWithValidation(
                    handlers.GetBanner,
                    bannerIDSchema,
                ),
                GetProductSlider: this.wrapWithValidation(
                    handlers.GetProductSlider,
                    productSliderIDSchema,
                ),
                ToggleWidgetActivation: this.wrapWithValidation(
                    handlers.ToggleWidgetActivation,
                    widgetIDSchema,
                ),
                UpdateWidgetSurvey: this.wrapWithValidation(
                    handlers.UpdateWidgetSurvey,
                    updateWidgetSurveySchema,
                ),
                GetActiveLayout: this.wrapWithValidation(
                    handlers.GetActiveLayout,
                    getActiveLayoutSchema,
                ),
                FindWidgetsBySample: this.wrapWithValidation(
                    handlers.FindWidgetsBySample,
                    findWidgetsBySampleSchema,
                ),
                RemoveSurveyFromWidget: this.wrapWithValidation(
                    handlers.RemoveSurveyFromWidget,
                    UUIDSchema,
                ),
            },
        );

        this.addService(
            serviceDefinitions.healthPackageDefinition.health.HealthService
                .service,
            { healthCheck },
        );
    }
}
