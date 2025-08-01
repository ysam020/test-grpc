import * as grpc from '@grpc/grpc-js';
import { retryMiddleware } from './middleware/retry';
import { GrpcClientConfig } from './types';
import { loggingInterceptor } from './interceptors/logging';

export class BaseGrpcClient {
    protected client: any;
    protected config: GrpcClientConfig;

    constructor(config: GrpcClientConfig) {
        this.config = config;
        this.setupClient();
    }

    private setupClient() {
        const options = {
            'grpc.keepalive_time_ms': 120000,
            'grpc.http2.min_time_between_pings_ms': 120000,
            'grpc.keepalive_timeout_ms': 20000,
            'grpc.http2.max_pings_without_data': 0,
            'grpc.keepalive_permit_without_calls': 1,
        };

        this.client = new grpc.Client(
            this.config.address,
            this.config.credentials || grpc.credentials.createInsecure(),
            {
                ...options,
                ...this.config.options,
            },
        );

        // Add default interceptors
        // this.client.interceptors.push(loggingInterceptor());s
    }

    async makeCall(method: string, request: any) {
        console.log({ cl: this.client });

        return new Promise((resolve, reject) => {
            this.client[method](request, (error: any, response: any) => {
                if (error) reject(error);
                else resolve(response);
            });
        });
    }
}
