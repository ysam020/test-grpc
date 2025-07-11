export interface GrpcClientConfig {
    serviceName: string;
    address: string;
    credentials?: any;
    options?: {
        timeout?: number;
        retries?: number;
    };
}
