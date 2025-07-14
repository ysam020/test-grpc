import * as NotificationController from '../../src/controllers/notification.controller';
import { notificationStub } from '../../src/client';
import { logger } from '@atc/logger';

jest.mock('@atc/common', () => ({
    apiResponse: jest.fn((res, status, data) =>
        res.status(status).json({ success: true, data }),
    ),
    asyncHandler: (fn) => fn,
    grpcToHttpStatus: jest.fn(() => 200),
    utilFns: {
        createMetadata: jest.fn(() => 'mockMeta'),
    },
}));

jest.mock('@atc/logger', () => ({
    logger: { error: jest.fn() },
}));

jest.mock('../../src/client', () => ({
    notificationStub: {
        GetNotifications: jest.fn(),
        MarkAsRead: jest.fn(),
        MarkAllAsRead: jest.fn(),
        DeleteNotification: jest.fn(),
    },
}));

const mockRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

const setupGrpcMock = (fnName, response) => {
    notificationStub[fnName].mockImplementation((_req, _meta, cb) =>
        cb(null, response),
    );
};

describe('Notification Controller', () => {
    afterEach(() => jest.clearAllMocks());

    const testCases = [
        [
            'getNotifications',
            'GetNotifications',
            { page: 1, limit: 10 },
            'query',
        ],
        ['markAsRead', 'MarkAsRead', { id: '1' }, 'params'],
        ['markAllAsRead', 'MarkAllAsRead', {}, 'body'],
        ['deleteNotification', 'DeleteNotification', { id: '1' }, 'params'],
    ];

    testCases.forEach(([fnName, grpcFn, payload, source]) => {
        it(`${fnName} should call ${grpcFn} and respond`, async () => {
            const res = mockRes();
            const req: any = { headers: { authorization: 'Bearer xyz' } };

            if (source === 'body') req.body = payload;
            else if (source === 'params') req.params = payload;
            else if (source === 'query') req.query = payload;

            setupGrpcMock(grpcFn, { status: 'SUCCESS', result: 'ok' });

            await NotificationController[fnName](req, res);

            expect(notificationStub[grpcFn]).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: { result: 'ok' },
            });
        });
    });
});
