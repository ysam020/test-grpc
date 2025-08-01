import { NextFunction, Request, Response } from 'express';
import { createLogger, format, transports } from 'winston';

const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
    format: combine(label({ label: 'atc' }), timestamp(), myFormat),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/combined.log' }),
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
    ],
});

const apiRequestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // Log details about incoming request
    logger.info(
        `Request received - Method: ${req.method}, URL: ${req.url}, IP: ${req.ip}`,
    );

    // Capture the end of the request/response lifecycle
    res.on('finish', () => {
        const duration = Date.now() - start;

        // Log details about response
        logger.info(
            `Response sent - Status: ${res.statusCode}, Duration: ${duration}ms`,
        );
    });

    next();
};

const grpcApiRequestLogger = async (call: any, next: () => Promise<any>) => {
    const start = Date.now();

    const sanitizedRequest = sanitizeRequest(call.request);

    logger.info(
        `Request received - Path: ${call.path}, Request: ${JSON.stringify(sanitizedRequest)}`,
    );

    const response = await next();
    const duration = Date.now() - start;

    logger.info(`Response sent - Path: ${call.path}, Duration: ${duration}ms`);
    return response;
};

function sanitizeRequest(request: Record<string, any>): Record<string, any> {
    const fileKeys = ['image', 'file', 'files'];

    const sanitized: Record<string, any> = {};

    for (const key in request) {
        if (fileKeys.includes(key)) {
            sanitized[key] = '[FILE_DATA_REMOVED]';
        } else {
            sanitized[key] = request[key];
        }
    }

    return sanitized;
}

export { logger, apiRequestLogger, grpcApiRequestLogger };
