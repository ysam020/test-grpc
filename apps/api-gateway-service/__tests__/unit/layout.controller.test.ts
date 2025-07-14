import * as LayoutController from '../../src/controllers/layout.controller';
import { widgetStub } from '../../src/client';
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
    widgetStub: {
        GetActiveLayout: jest.fn(),
    },
}));

const mockRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('Layout Controller', () => {
    afterEach(() => jest.clearAllMocks());

    it('getActiveLayout should call GetActiveLayout and respond', async () => {
        const res = mockRes();
        const req: any = { headers: { authorization: 'Bearer xyz' } };

        const mockResponse = {
            status: 'SUCCESS',
            layout: { id: '1', name: 'Main Layout' },
        };

        widgetStub.GetActiveLayout.mockImplementation((_req, _meta, cb) =>
            cb(null, mockResponse),
        );

        await LayoutController.getActiveLayout(req, res);

        expect(widgetStub.GetActiveLayout).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: { layout: { id: '1', name: 'Main Layout' } },
        });
    });
});
