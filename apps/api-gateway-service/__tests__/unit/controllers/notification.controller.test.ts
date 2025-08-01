import * as NotificationController from '../../../src/controllers/notification.controller';
import { notificationStub } from '../../../src/client';

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

jest.mock('../../../src/client', () => ({
    notificationStub: {
        GetNotifications: jest.fn(),
        CreateAdminNotification: jest.fn(),
        UpdateAdminNotification: jest.fn(),
        GetAdminNotifications: jest.fn(),
        GetSingleAdminNotification: jest.fn(),
        DeleteAdminNotification: jest.fn(),
        RetryAdminNotification: jest.fn(),
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

    it('getNotifications should call GetNotifications and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            query: { page: 1, limit: 10 },
        };

        setupGrpcMock('GetNotifications', { status: 'SUCCESS', result: 'ok' });

        await NotificationController.getNotifications(req, res);

        expect(notificationStub.GetNotifications).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('createAdminNotification should call CreateAdminNotification and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            body: { title: 'Test Notification', message: 'Test Message' },
        };

        setupGrpcMock('CreateAdminNotification', {
            status: 'SUCCESS',
            result: 'ok',
        });

        await NotificationController.createAdminNotification(req, res);

        expect(notificationStub.CreateAdminNotification).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('updateAdminNotification should call UpdateAdminNotification and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { admin_notification_id: '1' },
            body: { title: 'Updated Notification' },
        };

        setupGrpcMock('UpdateAdminNotification', {
            status: 'SUCCESS',
            result: 'ok',
        });

        await NotificationController.updateAdminNotification(req, res);

        expect(notificationStub.UpdateAdminNotification).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getAdminNotifications should call GetAdminNotifications and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            query: { page: 1, limit: 10 },
        };

        setupGrpcMock('GetAdminNotifications', {
            status: 'SUCCESS',
            result: 'ok',
        });

        await NotificationController.getAdminNotifications(req, res);

        expect(notificationStub.GetAdminNotifications).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getSingleAdminNotifications should call GetSingleAdminNotification and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { admin_notification_id: '1' },
        };

        setupGrpcMock('GetSingleAdminNotification', {
            status: 'SUCCESS',
            result: 'ok',
        });

        await NotificationController.getSingleAdminNotifications(req, res);

        expect(notificationStub.GetSingleAdminNotification).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deleteAdminNotification should call DeleteAdminNotification and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { admin_notification_id: '1' },
        };

        setupGrpcMock('DeleteAdminNotification', {
            status: 'SUCCESS',
            result: 'ok',
        });

        await NotificationController.deleteAdminNotification(req, res);

        expect(notificationStub.DeleteAdminNotification).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retryAdminNotification should call RetryAdminNotification and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { admin_notification_id: '1' },
        };

        setupGrpcMock('RetryAdminNotification', {
            status: 'SUCCESS',
            result: 'ok',
        });

        await NotificationController.retryAdminNotification(req, res);

        expect(notificationStub.RetryAdminNotification).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
