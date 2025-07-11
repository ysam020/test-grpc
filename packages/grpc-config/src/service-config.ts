export interface ServiceConfig {
    name: string;
    host: string;
    port: number;
    timeout?: number;
    retries?: number;
}

export const serviceConfig: Record<string, ServiceConfig> = {
    auth: {
        name: 'AuthService',
        host: process.env.AUTH_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.AUTH_SERVICE_PORT || '50052'),
        timeout: 3000,
        retries: 2,
    },

    user: {
        name: 'UserService',
        host: process.env.USER_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.USER_SERVICE_PORT || '50053'),
        timeout: 3000,
        retries: 2,
    },

    product: {
        name: 'ProductService',
        host: process.env.PRODUCT_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.PRODUCT_SERVICE_PORT || '50054'),
        timeout: 3000,
        retries: 2,
    },

    health: {
        name: 'HealthService',
        host: process.env.HEALTH_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.HEALTH_SERVICE_PORT || '50055'),
        timeout: 3000,
        retries: 2,
    },

    widget: {
        name: 'WidgetService',
        host: process.env.WIDGET_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.WIDGET_SERVICE_PORT || '50056'),
        timeout: 3000,
        retries: 2,
    },

    survey: {
        name: 'SurveyService',
        host: process.env.SURVEY_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.SURVEY_SERVICE_PORT || '50057'),
        timeout: 3000,
        retries: 2,
    },

    notification: {
        name: 'NotificationService',
        host: process.env.NOTIFICATION_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '50058'),
        timeout: 3000,
        retries: 2,
    },

    sample: {
        name: 'SampleService',
        host: process.env.SAMPLE_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.SAMPLE_SERVICE_PORT || '50059'),
        timeout: 3000,
        retries: 2,
    },

    catalogue: {
        name: 'CatalogueService',
        host: process.env.CATALOGUE_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.CATALOGUE_SERVICE_PORT || '50060'),
        timeout: 3000,
        retries: 2,
    },
};
