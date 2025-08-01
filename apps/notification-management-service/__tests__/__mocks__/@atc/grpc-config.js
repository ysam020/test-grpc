// Auto-generated mock file for @atc/grpc-config
module.exports = {
  serviceConfig: {
    notification: {
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
    notificationPackageDefinition: {
      notification: {
        NotificationService: {
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
