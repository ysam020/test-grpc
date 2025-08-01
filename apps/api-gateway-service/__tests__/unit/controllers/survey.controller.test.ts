import * as SurveyController from '../../../src/controllers/survey.controller';
import { surveyStub } from '../../../src/client';

jest.mock('@atc/common', () => ({
    apiResponse: jest.fn((res, status, data) =>
        res.status(status).json({ success: true, data }),
    ),
    asyncHandler: (fn) => fn,
    grpcToHttpStatus: jest.fn(() => 200),
    utilFns: {
        createMetadata: jest.fn(() => 'mockMeta'),
        convertCamelToSnake: jest.fn((data) => data),
        convertSnakeToCamel: jest.fn((data) => data),
        removeEmptyFields: jest.fn((data) => data),
    },
}));

jest.mock('@atc/logger', () => ({
    logger: { error: jest.fn() },
}));

jest.mock('../../../src/client', () => ({
    surveyStub: {
        CreateSurvey: jest.fn(),
        DraftSurvey: jest.fn(),
        UpdateSurvey: jest.fn(),
        DeleteSurvey: jest.fn(),
        GetSingleSurvey: jest.fn(),
        GetAllSurvey: jest.fn(),
        ToggleSurvey: jest.fn(),
        SubmitSurveyAnswer: jest.fn(),
        GetAllResponsesByUserID: jest.fn(),
        GetSurveyEngagement: jest.fn(),
        ExportToExcel: jest.fn(),
    },
}));

const mockRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

const setupGrpcMock = (fnName, response) => {
    surveyStub[fnName].mockImplementation((_req, _meta, cb) =>
        cb(null, response),
    );
};

describe('Survey Controller', () => {
    afterEach(() => jest.clearAllMocks());

    const testCases = [
        [
            'createSurvey',
            'CreateSurvey',
            { title: 'New Survey' },
            'body+params',
        ],
        [
            'draftSurvey',
            'DraftSurvey',
            { title: 'Draft Survey' },
            'body+params',
        ],
        [
            'updateSurvey',
            'UpdateSurvey',
            { id: '1', title: 'Updated Survey' },
            'body+params',
        ],
        ['deleteSurvey', 'DeleteSurvey', { id: '1' }, 'params'],
        ['getSingleSurvey', 'GetSingleSurvey', { id: '1' }, 'params'],
        ['getAllSurvey', 'GetAllSurvey', { type: 'all' }, 'query+params'],
        ['toggleSurvey', 'ToggleSurvey', { type: 'active' }, 'params+body'],
        [
            'submitSurveyAnswer',
            'SubmitSurveyAnswer',
            { id: '1', answers: [] },
            'params+body',
        ],
        [
            'getAllResponses',
            'GetAllResponsesByUserID',
            { id: '1' },
            'params+query',
        ],
        [
            'getSurveyEngagement',
            'GetSurveyEngagement',
            { page: 1, limit: 10 },
            'query',
        ],
        ['exportToExcel', 'ExportToExcel', { id: '1' }, 'params+query'],
    ];

    testCases.forEach(([fnName, grpcFn, payload, source]) => {
        it(`${fnName} should call ${grpcFn} and respond`, async () => {
            const res = mockRes();
            const req: any = { headers: { authorization: 'Bearer xyz' } };

            if (source === 'body') {
                req.body = payload;
            } else if (source === 'params') {
                req.params = payload;
            } else if (source === 'query') {
                req.query = payload;
            } else if (source === 'body+params') {
                req.body = { ...payload };
                req.params = { id: payload.id || '1' };
            } else if (source === 'query+params') {
                req.query = { ...payload };
                req.params = { id: payload.id || '1' };
            } else if (source === 'params+body') {
                req.params = { type: payload.type || 'active' };
                req.body = { ...payload };
            } else if (source === 'params+query') {
                req.params = { id: payload.id || '1' };
                req.query = { page: 1, limit: 10 };
            }

            setupGrpcMock(grpcFn, { status: 'SUCCESS', result: 'ok' });

            await SurveyController[fnName](req, res);

            expect(surveyStub[grpcFn]).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
