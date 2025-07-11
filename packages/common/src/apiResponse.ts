import { Response } from 'express';
import { RESPONSE_STATUS } from './responseStatus';

function apiResponse(res: Response, statusCode: RESPONSE_STATUS, data: any) {
    return res.status(statusCode).json({
        success: statusCode < 300 && statusCode >= 200 ? true : false,
        ...data,
    });
}

export { apiResponse };
