// Auto-generated mock file for @atc/grpc-config
module.exports = {
  serviceConfig: {
    widget: {
      host: 'localhost',
      port: 50051,
    },
  },

  serviceDefinitions: {
    surveyPackageDefinition: {
      survey: {
        SurveyService: jest.fn(),
      },
    },
    samplePackageDefinition: {
      sample: {
        SampleService: jest.fn(),
      },
    },
    widgetPackageDefinition: {
      widget: {
        WidgetService: {
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
