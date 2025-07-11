import { serviceDefinitions } from '@atc/grpc-config';
import { credentials } from '@grpc/grpc-js';

const productStub =
    new serviceDefinitions.productPackageDefinition.product.ProductService(
        `${process.env.PRODUCT_SERVICE_HOST}:${process.env.PRODUCT_SERVICE_PORT}`,
        credentials.createInsecure(),
    );

export { productStub };
