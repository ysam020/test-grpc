import { serviceDefinitions } from '@atc/grpc-config';
import { credentials } from '@grpc/grpc-js';

const catalogueStub =
    new serviceDefinitions.cataloguePackageDefinition.catalogue.CatalogueService(
        `${process.env.CATALOGUE_SERVICE_HOST}:${process.env.CATALOGUE_SERVICE_PORT}`,
        credentials.createInsecure(),
    );

export { catalogueStub };
