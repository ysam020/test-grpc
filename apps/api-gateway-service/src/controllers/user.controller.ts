import * as UserController from '../../src/controllers/user.controller';
import { userStub } from '../../src/client';
import { logger } from '@atc/logger';

jest.mock('@atc/common', () => ({
    apiResponse: jest.fn((res, status, data) =>
        res.status(status).json({ success: true, data }),
    ),
    asyncHandler: (fn) => fn,
    grpcToHttpStatus: jest.fn(() => 200),
    utilFns: {
        createMetadata: jest.fn(() => 'mockMeta'),
        convertCamelToSnake: jest.fn((data) => data),
    },
}));

jest.mock('@atc/logger', () => ({
    logger: { error: jest.fn() },
}));

jest.mock('../../src/client', () => ({
    userStub: {
        GetUsers: jest.fn(),
        GetSingleUser: jest.fn(),
        GetSingleUserAmin: jest.fn(),
        UpdateUser: jest.fn(),
        DeleteUser: jest.fn(),
        ChangePassword: jest.fn(),
        AcceptDeviceToken: jest.fn(),
        GetUserEngagement: jest.fn(),
    },
}));

const mockRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

const setupGrpcMock = (fnName, response) => {
    userStub[fnName].mockImplementation((_req, _meta, cb) =>
        cb(null, response),
    );
};

describe('User Controller', () => {
    afterEach(() => jest.clearAllMocks());

    it('getUsers should call GetUsers and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            query: { page: 1, limit: 10 },
        };

        setupGrpcMock('GetUsers', { status: 'SUCCESS', result: 'ok' });

        await UserController.getUsers(req, res);

        expect(userStub.GetUsers).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getSingleUser should call GetSingleUser and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { id: '1' },
        };

        setupGrpcMock('GetSingleUser', { status: 'SUCCESS', result: 'ok' });

        await UserController.getSingleUser(req, res);

        expect(userStub.GetSingleUser).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getSingleUserAdmin should call GetSingleUserAmin and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { id: '1' },
        };

        setupGrpcMock('GetSingleUserAmin', { status: 'SUCCESS', result: 'ok' });

        await UserController.getSingleUserAdmin(req, res);

        expect(userStub.GetSingleUserAmin).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('updateUser should call UpdateUser and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { id: '1' },
            body: { name: 'John Doe' },
            file: {
                buffer: Buffer.from('test'),
                mimetype: 'image/png',
                size: 1024,
            },
        };

        setupGrpcMock('UpdateUser', { status: 'SUCCESS', result: 'ok' });

        await UserController.updateUser(req, res);

        expect(userStub.UpdateUser).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deleteUser should call DeleteUser and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { id: '1' },
        };

        setupGrpcMock('DeleteUser', { status: 'SUCCESS', result: 'ok' });

        await UserController.deleteUser(req, res);

        expect(userStub.DeleteUser).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('changePassword should call ChangePassword and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { id: '1' },
            body: { oldPassword: 'old', newPassword: 'new' },
        };

        setupGrpcMock('ChangePassword', { status: 'SUCCESS', result: 'ok' });

        await UserController.changePassword(req, res);

        expect(userStub.ChangePassword).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('acceptDeviceToken should call AcceptDeviceToken and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            body: { device_token: 'token123' },
        };

        setupGrpcMock('AcceptDeviceToken', { status: 'SUCCESS', result: 'ok' });

        await UserController.acceptDeviceToken(req, res);

        expect(userStub.AcceptDeviceToken).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getUserEngagement should call GetUserEngagement and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            query: { type: 'monthly' },
        };

        setupGrpcMock('GetUserEngagement', { status: 'SUCCESS', result: 'ok' });

        await UserController.getUserEngagement(req, res);

        expect(userStub.GetUserEngagement).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
