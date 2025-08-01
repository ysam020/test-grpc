import * as grpc from '@grpc/grpc-js';

export class GrpcError extends Error {
    constructor(
        message: string,
        public code: grpc.status = grpc.status.INTERNAL,
        public metadata?: grpc.Metadata,
    ) {
        super(message);
    }
}

export const errorHandler = (error: any) => {
    if (error instanceof GrpcError) {
        return {
            code: error.code,
            message: error.message,
            metadata: error.metadata,
        };
    }

    // Default error mapping
    return {
        code: grpc.status.INTERNAL,
        message: 'Internal server error',
        metadata: new grpc.Metadata(),
    };
};
