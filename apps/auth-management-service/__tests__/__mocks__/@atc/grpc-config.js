// Auto-generated mock file for @atc/grpc-config
module.exports = {
  serviceConfig: {
    auth: {
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
        NotificationService: jest.fn(),
      },
    },
    authPackageDefinition: {
      auth: {
        AuthService: {
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
