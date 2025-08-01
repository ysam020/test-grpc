import * as SampleController from '../../../src/controllers/sample.controller';
import { sampleStub } from '../../../src/client';

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

jest.mock('../../../src/client', () => ({
    sampleStub: {
        CreateSample: jest.fn(),
        DraftSample: jest.fn(),
        UpdateSample: jest.fn(),
        DeleteSample: jest.fn(),
        GetSingleSample: jest.fn(),
        GetAllSample: jest.fn(),
        ToggleSample: jest.fn(),
        SubmitSampleAnswer: jest.fn(),
        ReviewSample: jest.fn(),
        GetAllReview: jest.fn(),
        FetchSampleForUser: jest.fn(),
        FetchAllSampleForUser: jest.fn(),
        GetAllRequestedSamples: jest.fn(),
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

    it('createDraft should call DraftSample and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            body: { title: 'Draft Sample' },
            file: {
                buffer: Buffer.from('test'),
                mimetype: 'image/png',
                size: 1024,
            },
        };

        setupGrpcMock('DraftSample', { status: 'SUCCESS', result: 'ok' });

        await SampleController.createDraft(req, res);

        expect(sampleStub.DraftSample).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('createSample should call CreateSample and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            body: { title: 'New Sample' },
            file: {
                buffer: Buffer.from('test'),
                mimetype: 'image/png',
                size: 1024,
            },
        };

        setupGrpcMock('CreateSample', { status: 'SUCCESS', result: 'ok' });

        await SampleController.createSample(req, res);

        expect(sampleStub.CreateSample).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('updateSample should call UpdateSample and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { id: '1' },
            body: { title: 'Updated Sample' },
            file: {
                buffer: Buffer.from('test'),
                mimetype: 'image/png',
                size: 1024,
            },
        };

        setupGrpcMock('UpdateSample', { status: 'SUCCESS', result: 'ok' });

        await SampleController.updateSample(req, res);

        expect(sampleStub.UpdateSample).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deleteSample should call DeleteSample and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { id: '1' },
        };

        setupGrpcMock('DeleteSample', { status: 'SUCCESS', result: 'ok' });

        await SampleController.deleteSample(req, res);

        expect(sampleStub.DeleteSample).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getSingleSample should call GetSingleSample and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { id: '1' },
        };

        setupGrpcMock('GetSingleSample', { status: 'SUCCESS', result: 'ok' });

        await SampleController.getSingleSample(req, res);

        expect(sampleStub.GetSingleSample).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getAllSample should call GetAllSample and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            query: { page: 1, limit: 10 },
            params: { type: 'published' },
        };

        setupGrpcMock('GetAllSample', { status: 'SUCCESS', result: 'ok' });

        await SampleController.getAllSample(req, res);

        expect(sampleStub.GetAllSample).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('toggleSample should call ToggleSample and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { id: '1', type: 'published' },
        };

        setupGrpcMock('ToggleSample', { status: 'SUCCESS', result: 'ok' });

        await SampleController.toggleSample(req, res);

        expect(sampleStub.ToggleSample).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('submitSampleAnswer should call SubmitSampleAnswer and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { id: '1' },
            body: { answers: [] },
        };

        setupGrpcMock('SubmitSampleAnswer', {
            status: 'SUCCESS',
            result: 'ok',
        });

        await SampleController.submitSampleAnswer(req, res);

        expect(sampleStub.SubmitSampleAnswer).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('reviewSample should call ReviewSample and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { id: '1' },
            body: { rating: 5 },
            file: {
                buffer: Buffer.from('test'),
                mimetype: 'image/png',
                size: 1024,
            },
        };

        setupGrpcMock('ReviewSample', { status: 'SUCCESS', result: 'ok' });

        await SampleController.reviewSample(req, res);

        expect(sampleStub.ReviewSample).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getAllReviews should call GetAllReview and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            query: { page: 1, limit: 10 },
        };

        setupGrpcMock('GetAllReview', { status: 'SUCCESS', result: 'ok' });

        await SampleController.getAllReviews(req, res);

        expect(sampleStub.GetAllReview).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('fetchSingleSample should call FetchSampleForUser and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { id: '1' },
        };

        setupGrpcMock('FetchSampleForUser', {
            status: 'SUCCESS',
            result: 'ok',
        });

        await SampleController.fetchSingleSample(req, res);

        expect(sampleStub.FetchSampleForUser).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('fetchAllSample should call FetchAllSampleForUser and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            query: { page: 1, limit: 10 },
            params: {},
        };

        setupGrpcMock('FetchAllSampleForUser', {
            status: 'SUCCESS',
            result: 'ok',
        });

        await SampleController.fetchAllSample(req, res);

        expect(sampleStub.FetchAllSampleForUser).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getAllRequestedSample should call GetAllRequestedSamples and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { id: '1' },
            query: { page: 1, limit: 10 },
        };

        setupGrpcMock('GetAllRequestedSamples', {
            status: 'SUCCESS',
            result: 'ok',
        });

        await SampleController.getAllRequestedSample(req, res);

        expect(sampleStub.GetAllRequestedSamples).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('getSampleEngagement should call GetSampleEngagement and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            query: { type: 'monthly' },
        };

        setupGrpcMock('GetSampleEngagement', {
            status: 'SUCCESS',
            result: 'ok',
        });

        await SampleController.getSampleEngagement(req, res);

        expect(sampleStub.GetSampleEngagement).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('exportToExcel should call ExportToExcel and respond', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer xyz' },
            params: { type: 'samples' },
            query: { date_range: '30' },
        };

        setupGrpcMock('ExportToExcel', { status: 'SUCCESS', result: 'ok' });

        await SampleController.exportToExcel(req, res);

        expect(sampleStub.ExportToExcel).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
