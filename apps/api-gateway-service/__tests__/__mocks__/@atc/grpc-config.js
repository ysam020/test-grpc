module.exports = {
    serviceDefinitions: {
        authPackageDefinition: {
            auth: {
                AuthService: jest.fn(),
            },
        },
        userPackageDefinition: {
            user: {
                UserService: jest.fn(),
            },
        },
        productPackageDefinition: {
            product: {
                ProductService: jest.fn(),
            },
        },
        surveyPackageDefinition: {
            survey: {
                SurveyService: jest.fn(),
            },
        },
        widgetPackageDefinition: {
            widget: {
                WidgetService: jest.fn(),
            },
        },
        notificationPackageDefinition: {
            notification: {
                NotificationService: jest.fn(),
            },
        },
        samplePackageDefinition: {
            sample: {
                SampleService: jest.fn(),
            },
        },
        cataloguePackageDefinition: {
            catalogue: {
                CatalogueService: jest.fn(),
            },
        },
    },
};
