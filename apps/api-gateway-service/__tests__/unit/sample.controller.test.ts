import * as SampleController from '../../src/controllers/sample.controller';
import { sampleStub } from '../../src/client';
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
    sampleStub: {
        CreateDraft: jest.fn(),
        CreateSample: jest.fn(),
        UpdateSample: jest.fn(),
        DeleteSample: jest.fn(),
        GetSingleSample: jest.fn(),
        GetAllSample: jest.fn(),
        ToggleSample: jest.fn(),
        SubmitSampleAnswer: jest.fn(),
        ReviewSample: jest.fn(),
        GetAllReviews: jest.fn(),
        FetchSampleForUser: jest.fn(),
        FetchAllSampleForUser: jest.fn(),
        GetAllRequestedSample: jest.fn(),
        GetSampleEngagement: jest.fn(),
        ExportToExcel: jest.fn(),
    },
}));

const mockRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

const setupGrpcMock = (fnName, response) => {
    sampleStub[fnName].mockImplementation((_req, _meta, cb) =>
        cb(null, response),
    );
};

describe('Sample Controller', () => {
    afterEach(() => jest.clearAllMocks());

    const testCases = [
        ['createDraft', 'CreateDraft', { title: 'Draft Sample' }, 'body'],
        ['createSample', 'CreateSample', { title: 'New Sample' }, 'body'],
        [
            'updateSample',
            'UpdateSample',
            { id: '1', title: 'Updated Sample' },
            'body+params',
        ],
        ['deleteSample', 'DeleteSample', { id: '1' }, 'params'],
        ['getSingleSample', 'GetSingleSample', { id: '1' }, 'params'],
        ['getAllSample', 'GetAllSample', { page: 1, limit: 10 }, 'query'],
        ['toggleSample', 'ToggleSample', { id: '1' }, 'params'],
        [
            'submitSampleAnswer',
            'SubmitSampleAnswer',
            { sampleId: '1', answers: [] },
            'body',
        ],
        ['reviewSample', 'ReviewSample', { sampleId: '1', rating: 5 }, 'body'],
        ['getAllReviews', 'GetAllReviews', { sampleId: '1' }, 'query'],
        ['fetchSingleSample', 'FetchSampleForUser', { id: '1' }, 'params'],
        [
            'fetchAllSample',
            'FetchAllSampleForUser',
            { page: 1, limit: 10 },
            'query+params',
        ],
        [
            'getAllRequestedSample',
            'GetAllRequestedSample',
            { page: 1, limit: 10 },
            'query',
        ],
        ['getSampleEngagement', 'GetSampleEngagement', { id: '1' }, 'params'],
        ['exportToExcel', 'ExportToExcel', { type: 'samples' }, 'query+params'],
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
            } else if (source === 'query+params') {
                req.query = { ...payload };
                req.params = { id: payload.id || '1' };
            }

            setupGrpcMock(grpcFn, { status: 'SUCCESS', result: 'ok' });

            await SampleController[fnName](req, res);

            expect(sampleStub[grpcFn]).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
