import { logger } from '@atc/logger';
import { serviceConfig } from '@atc/grpc-config';
import { WidgetServer } from '.';

async function startServer() {
    try {
        const server = new WidgetServer();
        server.start(
            serviceConfig.widget?.host + ':' + serviceConfig.widget?.port,
        );
        logger.info(
            `${WidgetServer.name} started at ${serviceConfig.widget?.host}:${serviceConfig.widget?.port}`,
        );
    } catch (error) {
        logger.error(`Failed to start ${WidgetServer.name}: ${error}`);
        process.exit(1);
    }
}

startServer();
