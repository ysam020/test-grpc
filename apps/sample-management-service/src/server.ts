import { logger } from '@atc/logger';
import { serviceConfig } from '@atc/grpc-config';
import { SampleServer } from '.';

async function startServer() {
    try {
        const server = new SampleServer();
        server.start(
            serviceConfig.sample?.host + ':' + serviceConfig.sample?.port,
        );
        logger.info(
            `${SampleServer.name} started at ${serviceConfig.sample?.host}:${serviceConfig.sample?.port}`,
        );
    } catch (error) {
        logger.error(`Failed to start ${SampleServer.name}: ${error}`);
        process.exit(1);
    }
}

startServer();
