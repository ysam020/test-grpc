import * as grpc from '@grpc/grpc-js';

export const retryMiddleware = (options: {
    maxRetries: number;
    timeout: number;
}) => {
    return async (call: any, next: () => Promise<any>) => {
        let attempts = 0;
        while (attempts < options.maxRetries) {
            try {
                return await Promise.race([
                    next(),
                    new Promise((_, reject) =>
                        setTimeout(
                            () => reject(new Error('Timeout')),
                            options.timeout,
                        ),
                    ),
                ]);
            } catch (error) {
                attempts++;
                if (attempts === options.maxRetries) throw error;
                await new Promise((resolve) =>
                    setTimeout(resolve, Math.pow(2, attempts) * 100),
                );
            }
        }
    };
};
