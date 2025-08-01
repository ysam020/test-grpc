// Auto-generated mock file for @atc/grpc-config
module.exports = {
  serviceConfig: {
    catalogue: {
      host: 'localhost',
      port: 50051,
    },
  },

  serviceDefinitions: {
    productPackageDefinition: {
      product: {
        ProductService: jest.fn(),
      },
    },
    cataloguePackageDefinition: {
      catalogue: {
        CatalogueService: {
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
