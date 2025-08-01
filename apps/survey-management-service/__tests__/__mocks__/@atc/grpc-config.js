// Auto-generated mock file for @atc/grpc-config
module.exports = {
  serviceConfig: {
    survey: {
      host: 'localhost',
      port: 50051,
    },
  },

  serviceDefinitions: {
    userPackageDefinition: {
      user: {
        UserService: jest.fn(),
      },
    },
    widgetPackageDefinition: {
      widget: {
        WidgetService: jest.fn(),
      },
    },
    surveyPackageDefinition: {
      survey: {
        SurveyService: {
          service: jest.fn(),
        },
      },
    },
    healthPackageDefinition: {
      health: {
        HealthService: {
          service: jest.fn(),
        },
      },
    },
  },
};
