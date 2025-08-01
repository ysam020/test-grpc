import { ProductServer } from './index';
import { serviceConfig } from '@atc/grpc-config';
import { logger } from '@atc/logger';

async function startServer() {
    try {
        const server = new ProductServer();
        server.start(
            serviceConfig.product?.host + ':' + serviceConfig.product?.port,
        );
        logger.info(
            `${ProductServer.name} started at ${serviceConfig.product?.host}:${serviceConfig.product?.port}`,
        );
    } catch (error) {
        logger.error(`Failed to start ${ProductServer.name}: ${error}`);
        process.exit(1);
    }
}

startServer();
