// Auto-generated mock file for @atc/grpc-config
module.exports = {
  serviceConfig: {
    health: {
      host: 'localhost',
      port: 50051,
    },
    auth: {
      host: 'localhost', 
      port: 50052
    },
    user: {
      host: 'localhost',
      port: 50053
    },
    product: {
      host: 'localhost', 
      port: 50054
    },
    widget: {
      host: 'localhost',
      port: 50055
    },
    survey: {
      host: 'localhost',
      port: 50056
    },
    notification: {
      host: 'localhost',
      port: 50057
    },
    sample: {
      host: 'localhost',
      port: 50058
    },
    catalogue: {
      host: 'localhost',
      port: 50059
    },
  },

  serviceDefinitions: {
    healthPackageDefinition: {
      health: {
        HealthService: {
          service: {
            healthCheck: {
              path: '/health.HealthService/healthCheck',
              requestStream: false,
              responseStream: false,
              requestDeserialize: jest.fn(),
              responseSerialize: jest.fn(),
            },
          },
        },
      },
    },
  },
};