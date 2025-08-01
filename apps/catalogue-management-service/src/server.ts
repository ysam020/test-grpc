import { logger } from '@atc/logger';
import { serviceConfig } from '@atc/grpc-config';
import { CatalogueServer } from '.';
import { startAllWorkers } from '@atc/common';

async function startServer() {
    try {
        const server = new CatalogueServer();
        server.start(
            serviceConfig.catalogue?.host + ':' + serviceConfig.catalogue?.port,
        );
        logger.info(
            `${CatalogueServer.name} started at ${serviceConfig.catalogue?.host}:${serviceConfig.catalogue?.port}`,
        );
    } catch (error) {
        logger.error(`Failed to start ${CatalogueServer.name}: ${error}`);
        process.exit(1);
    }
}

startServer();
startAllWorkers();
