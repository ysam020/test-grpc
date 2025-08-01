import {
    dashboard,
    productDashboard,
} from '../../../src/controllers/dashboard.controller';
import { apiResponse } from '@atc/common';
import {
    notificationStub,
    sampleStub,
    surveyStub,
    userStub,
    productStub,
} from '../../../src/client';

jest.mock('@atc/common', () => ({
    apiResponse: jest.fn((res, statusCode, data) =>
        res.status(statusCode).json({ success: true, data }),
    ),
    asyncHandler: (fn) => fn,
    grpcToHttpStatus: jest.fn(() => 200),
    utilFns: {
        createMetadata: jest.fn(() => 'mockMetadata'),
    },
}));

describe('Dashboard Controller', () => {
    const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return counts for dashboard', async () => {
        userStub.GetMonthlyActiveUsersCount = jest.fn((_req, _meta, cb) =>
            cb(null, { status: 'SUCCESS', message: 'ok', data: { count: 10 } }),
        );
        sampleStub.GetSamplesCount = jest.fn((_req, _meta, cb) =>
            cb(null, { status: 'SUCCESS', data: { count: 5 } }),
        );
        surveyStub.getSurveysCount = jest.fn((_req, _meta, cb) =>
            cb(null, { status: 'SUCCESS', data: { count: 7 } }),
        );
        notificationStub.GetAverageNotificationCount = jest.fn(
            (_req, _meta, cb) =>
                cb(null, { status: 'SUCCESS', data: { count: 3 } }),
        );

        await dashboard(
            { headers: { authorization: 'Bearer xyz' } } as any,
            res,
        );

        expect(apiResponse).toHaveBeenCalledWith(res, 200, {
            message: 'ok',
            data: {
                monthly_active_users: 10,
                samples_count: 5,
                surveys_count: 7,
                average_notification_count: 3,
            },
        });
    });

    it('should return product count for productDashboard', async () => {
        productStub.getProductsCount = jest.fn((_req, _meta, cb) =>
            cb(null, {
                status: 'SUCCESS',
                message: 'products ok',
                total_products: 50,
                pending_products: 10,
                verified_products: 40,
            }),
        );

        await productDashboard(
            { headers: { authorization: 'Bearer xyz' } } as any,
            res,
        );

        expect(apiResponse).toHaveBeenCalledWith(res, 200, {
            message: 'products ok',
            total_products: 50,
            pending_products: 10,
            verified_products: 40,
        });
    });
});
