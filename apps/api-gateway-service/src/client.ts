import { credentials } from '@grpc/grpc-js';
import { serviceDefinitions } from '@atc/grpc-config';

const clientStub =
    new serviceDefinitions.authPackageDefinition.auth.AuthService(
        `${process.env.AUTH_SERVICE_HOST}:${process.env.AUTH_SERVICE_PORT}`,
        credentials.createInsecure(),
    );

const userStub = new serviceDefinitions.userPackageDefinition.user.UserService(
    `${process.env.USER_SERVICE_HOST}:${process.env.USER_SERVICE_PORT}`,
    credentials.createInsecure(),
);

const widgetStub =
    new serviceDefinitions.widgetPackageDefinition.widget.WidgetService(
        `${process.env.WIDGET_SERVICE_HOST}:${process.env.WIDGET_SERVICE_PORT}`,
        credentials.createInsecure(),
    );

const surveyStub =
    new serviceDefinitions.surveyPackageDefinition.survey.SurveyService(
        `${process.env.SURVEY_SERVICE_HOST}:${process.env.SURVEY_SERVICE_PORT}`,
        credentials.createInsecure(),
    );

const productStub =
    new serviceDefinitions.productPackageDefinition.product.ProductService(
        `${process.env.PRODUCT_SERVICE_HOST}:${process.env.PRODUCT_SERVICE_PORT}`,
        credentials.createInsecure(),
    );

const notificationStub =
    new serviceDefinitions.notificationPackageDefinition.notification.NotificationService(
        `${process.env.NOTIFICATION_SERVICE_HOST}:${process.env.NOTIFICATION_SERVICE_PORT}`,
        credentials.createInsecure(),
    );

const sampleStub =
    new serviceDefinitions.samplePackageDefinition.sample.SampleService(
        `${process.env.SAMPLE_SERVICE_HOST}:${process.env.SAMPLE_SERVICE_PORT}`,
        credentials.createInsecure(),
    );

const catalogueStub =
    new serviceDefinitions.cataloguePackageDefinition.catalogue.CatalogueService(
        `${process.env.CATALOGUE_SERVICE_HOST}:${process.env.CATALOGUE_SERVICE_PORT}`,
        credentials.createInsecure(),
    );

export {
    clientStub,
    userStub,
    widgetStub,
    productStub,
    surveyStub,
    sampleStub,
    notificationStub,
    catalogueStub,
};
