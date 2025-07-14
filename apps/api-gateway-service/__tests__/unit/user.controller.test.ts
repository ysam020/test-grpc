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
        GetAllUsers: jest.fn(),
        GetSingleUser: jest.fn(),
        UpdateUser: jest.fn(),
        DeleteUser: jest.fn(),
        ToggleUserActivation: jest.fn(),
        GetUserProfile: jest.fn(),
        UpdateUserProfile: jest.fn(),
        ChangePassword: jest.fn(),
        ExportToExcel: jest.fn(),
        MonthlyActiveUsers: jest.fn(),
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

    const testCases = [
        ['getAllUsers', 'GetAllUsers', { page: 1, limit: 10 }, 'query'],
        ['getSingleUser', 'GetSingleUser', { id: '1' }, 'params'],
        [
            'updateUser',
            'UpdateUser',
            { id: '1', name: 'John Doe' },
            'body+params',
        ],
        ['deleteUser', 'DeleteUser', { id: '1' }, 'params'],
        ['toggleUserActivation', 'ToggleUserActivation', { id: '1' }, 'params'],
        ['getUserProfile', 'GetUserProfile', {}, 'query'],
        [
            'updateUserProfile',
            'UpdateUserProfile',
            { name: 'Jane Doe' },
            'body',
        ],
        [
            'changePassword',
            'ChangePassword',
            { oldPassword: 'old', newPassword: 'new' },
            'body',
        ],
        ['exportToExcel', 'ExportToExcel', { type: 'users' }, 'query'],
        ['monthlyActiveUsers', 'MonthlyActiveUsers', {}, 'query'],
    ];

    testCases.forEach(([fnName, grpcFn, payload, source]) => {
        it(`${fnName} should call ${grpcFn} and respond`, async () => {
            const res = mockRes();
            const req: any = { headers: { authorization: 'Bearer xyz' } };

            if (source === 'body') req.body = payload;
            else if (source === 'params') req.params = payload;
            else if (source === 'query') req.query = payload;
            else if (source === 'body+params') {
                req.body = { ...payload };
                req.params = { id: payload.id };
            }

            setupGrpcMock(grpcFn, { status: 'SUCCESS', result: 'ok' });

            await UserController[fnName](req, res);

            expect(userStub[grpcFn]).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
