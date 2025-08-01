import * as grpc from '@grpc/grpc-js';
import { logger } from '@atc/logger';

export const loggingInterceptor = () => {
    return (options: any, nextCall: any) => {
        const requester = new grpc.RequesterBuilder()
            .withStart((metadata, listener, next) => {
                logger.info(
                    `gRPC call started: ${options.method_definition.path}`,
                );
                next(metadata, listener);
            })
            .withSendMessage((message, next) => {
                logger.debug('Message sent:', message);
                next(message);
            })
            .withHalfClose((next) => {
                logger.info(`gRPC call finished`);
                next();
            })
            .build();
        return new grpc.InterceptingCall(nextCall(options), requester);
    };
};
