import { logger } from '@atc/logger';
import { SurveyServer } from './index';
import { serviceConfig } from '@atc/grpc-config';

async function startServer() {
    try {
        const server = new SurveyServer();
        server.start(
            serviceConfig.survey?.host + ':' + serviceConfig.survey?.port,
        );
        logger.info(
            `${SurveyServer.name} started at ${serviceConfig.survey?.host}:${serviceConfig.survey?.port}`,
        );
    } catch (error) {
        logger.error(`Failed to start ${SurveyServer.name}: ${error}`);
        process.exit(1);
    }
}

startServer();
