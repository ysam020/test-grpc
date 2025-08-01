import * as WidgetController from '../../../src/controllers/widget.controller';
import { widgetStub } from '../../../src/client';

jest.mock('@atc/common', () => ({
    apiResponse: jest.fn((res, status, data) =>
        res.status(status).json({ success: true, data }),
    ),
    asyncHandler: (fn) => fn,
    grpcToHttpStatus: jest.fn(() => 200),
    utilFns: {
        createMetadata: jest.fn(() => 'mockMeta'),
        cleanObject: jest.fn((data) => data),
    },
}));

jest.mock('@atc/logger', () => ({
    logger: { error: jest.fn() },
}));

jest.mock('../../../src/client', () => ({
    widgetStub: {
        AddWidget: jest.fn(),
        GetWidgets: jest.fn(),
        GetSingleWidget: jest.fn(),
        DeleteWidget: jest.fn(),
        PublishWidget: jest.fn(),
        SaveAsDraft: jest.fn(),
        ToggleWidgetActivation: jest.fn(),
        GetActiveWidget: jest.fn(),
        AddBanner: jest.fn(),
        UpdateBanner: jest.fn(),
        DeleteBanner: jest.fn(),
        GetBanner: jest.fn(),
        AddWidgetSurvey: jest.fn(),
        UpdateWidgetSurvey: jest.fn(),
        DeleteWidgetSurvey: jest.fn(),
        AddProductSlider: jest.fn(),
        UpdateProductSlider: jest.fn(),
        DeleteProductSlider: jest.fn(),
        GetProductSlider: jest.fn(),
    },
}));

const mockRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

const setupGrpcMock = (fnName, response) => {
    widgetStub[fnName].mockImplementation((_req, _meta, cb) =>
        cb(null, response),
    );
};

describe('Widget Controller', () => {
    afterEach(() => jest.clearAllMocks());

    const testCases = [
        ['addWidget', 'AddWidget', { name: 'New Widget' }, 'body'],
        ['getWidgets', 'GetWidgets', { page: 1, limit: 10 }, 'query'],
        ['getSingleWidget', 'GetSingleWidget', { widget_id: '1' }, 'params'],
        ['deleteWidget', 'DeleteWidget', { widget_id: '1' }, 'params'],
        [
            'publishWidget',
            'PublishWidget',
            { widget_id: '1', name: 'Published Widget' },
            'params+body',
        ],
        ['saveAsDraft', 'SaveAsDraft', { widget_id: '1' }, 'params+body'],
        [
            'toggleWidgetActivation',
            'ToggleWidgetActivation',
            { widget_id: '1' },
            'params',
        ],
        ['getActiveWidget', 'GetActiveWidget', {}, 'empty'],
        ['addBanner', 'AddBanner', { title: 'New Banner' }, 'body+file'],
        [
            'updateBanner',
            'UpdateBanner',
            { id: '1', title: 'Updated Banner' },
            'body+params+file',
        ],
        ['deleteBanner', 'DeleteBanner', { id: '1' }, 'params'],
        ['getBanner', 'GetBanner', { banner_id: '1' }, 'params'],
        [
            'addWidgetSurvey',
            'AddWidgetSurvey',
            { widgetId: '1', surveyId: '2' },
            'body',
        ],
        [
            'updateWidgetSurvey',
            'UpdateWidgetSurvey',
            { survey_id: '1', surveyId: '2' },
            'params+body',
        ],
        [
            'deleteWidgetSurvey',
            'DeleteWidgetSurvey',
            { widgetId: '1', surveyId: '2' },
            'body',
        ],
        [
            'addProductSlider',
            'AddProductSlider',
            { title: 'New Slider' },
            'body+file',
        ],
        [
            'updateProductSlider',
            'UpdateProductSlider',
            { product_slider_id: '1', title: 'Updated Slider' },
            'params+body+file',
        ],
        [
            'deleteProductSlider',
            'DeleteProductSlider',
            { product_slider_id: '1' },
            'params',
        ],
        [
            'getProductSlider',
            'GetProductSlider',
            { product_slider_id: '1' },
            'params',
        ],
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
            } else if (source === 'empty') {
                // No additional setup needed
            } else if (source === 'body+file') {
                req.body = payload;
                req.file = {
                    buffer: Buffer.from('test'),
                    mimetype: 'image/png',
                    size: 1024,
                };
            } else if (source === 'params+body') {
                req.params = {
                    [Object.keys(payload)[0]]: payload[Object.keys(payload)[0]],
                };
                req.body = payload;
            } else if (source === 'body+params+file') {
                req.body = { ...payload };
                req.params = { id: payload.id || '1' };
                req.file = {
                    buffer: Buffer.from('test'),
                    mimetype: 'image/png',
                    size: 1024,
                };
            } else if (source === 'params+body+file') {
                req.params = {
                    [Object.keys(payload)[0]]: payload[Object.keys(payload)[0]],
                };
                req.body = payload;
                req.file = {
                    buffer: Buffer.from('test'),
                    mimetype: 'image/png',
                    size: 1024,
                };
            }

            setupGrpcMock(grpcFn, { status: 'SUCCESS', message: 'Success' });

            await WidgetController[fnName](req, res);

            expect(widgetStub[grpcFn]).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: { message: 'Success' },
            });
        });
    });
});
