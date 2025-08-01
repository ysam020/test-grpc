import { NextFunction, Request, Response } from 'express';
import { ZodEffects, ZodError, ZodObject } from 'zod';
import { fromZodError } from 'zod-validation-error';

import { errorMessage } from '@atc/common';

type ZodSchema = ZodObject<any, any, any> | ZodEffects<any, any, any>;

function validateData(
    bodySchema?: ZodSchema,
    querySchema?: ZodSchema,
    paramSchema?: ZodSchema,
    headerSchema?: ZodSchema,
    imageSchema?: ZodSchema,
) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (bodySchema) {
                const validatedBody = bodySchema.parse(req.body);
                req.body = validatedBody;
            }

            if (querySchema) {
                const validatedQuery = querySchema.parse(req.query);
                req.query = validatedQuery;
            }

            if (paramSchema) {
                const validatedParams = paramSchema.parse(req.params);
                req.params = validatedParams;
            }

            if (headerSchema) {
                const validatedHeaders = headerSchema.parse(req.headers);
                req.headers = validatedHeaders;
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = fromZodError(error).toString();
                const isPasswordError = error.errors.some((err) =>
                    err.path.includes('password'),
                );

               res.status(400).json({
                message:
                     req.url?.startsWith('/login') && isPasswordError
                     ? errorMessage.PASSWORD.INVALID
                    : errorMessages,
                });
            } else {
                res.status(500).json({
                    message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                });
            }
        }
    };
}

export { validateData };
