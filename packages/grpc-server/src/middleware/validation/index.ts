import * as grpc from '@grpc/grpc-js';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';
import { utilFns } from '@atc/common';

// packages/grpc-server/src/middleware/validation.ts
export const validationMiddleware = (schema: z.ZodObject<any>) => {
    return async (call: any, next: () => Promise<any>) => {
        const validation = schema.safeParse(
            utilFns.removeEmptyFields(call.request),
        );
        if (!validation.success) {
            const validationError = fromError(validation.error);
            // Return a rejected promise instead of throwing
            return Promise.reject({
                message: validationError.toString(),
                status: grpc.status.INVALID_ARGUMENT,
            });
        }

        call.request = validation.data;
        return next();
    };
};
