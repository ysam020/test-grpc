import { logger } from '@atc/logger';
import { NotificationServer } from '.';
import { serviceConfig } from '@atc/grpc-config';

async function startServer() {
    try {
        const server = new NotificationServer();
        server.start(
            serviceConfig.notification?.host +
                ':' +
                serviceConfig.notification?.port,
        );
        logger.info(
            `${NotificationServer.name} started at ${serviceConfig.notification?.host}:${serviceConfig.notification?.port}`,
        );
    } catch (error) {
        logger.error(`Failed to start ${NotificationServer.name}: ${error}`);
        process.exit(1);
    }
}

startServer();
