// Auto-generated mock file for @atc/grpc-config
module.exports = {
  serviceConfig: {
    product: {
      host: 'localhost',
      port: 50051,
    },
  },

  serviceDefinitions: {
    cataloguePackageDefinition: {
      catalogue: {
        CatalogueService: jest.fn(),
      },
    },
    productPackageDefinition: {
      product: {
        ProductService: {
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
