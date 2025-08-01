// Auto-generated mock file for @atc/grpc-config
module.exports = {
  serviceConfig: {
    sample: {
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
    productPackageDefinition: {
      product: {
        ProductService: jest.fn(),
      },
    },
    widgetPackageDefinition: {
      widget: {
        WidgetService: jest.fn(),
      },
    },
    samplePackageDefinition: {
      sample: {
        SampleService: {
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
