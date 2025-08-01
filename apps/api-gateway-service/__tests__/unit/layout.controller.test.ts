import * as LayoutController from '../../src/controllers/layout.controller';

jest.mock('@atc/common', () => ({
    apiResponse: jest.fn(),
    asyncHandler: (fn) => fn,
    grpcToHttpStatus: jest.fn(() => 200),
    errorMessage: {
        TOKEN: {
            NOT_FOUND: 'Token not found',
        },
    },
    utilFns: {
        createMetadata: jest.fn(() => 'mockMeta'),
        cleanObject: jest.fn((data) => data || []),
    },
    RESPONSE_STATUS: {
        SUCCESS: 200,
        NOT_FOUND: 404,
        UN_AUTHORIZED: 401,
    },
    responseMessage: {
        LAYOUT: {
            ACTIVE_LAYOUT_FETCHED: 'Active layout fetched successfully',
            LAYOUT_FETCHED: 'Layout fetched successfully',
        },
    },
}));

jest.mock('@atc/logger', () => ({
    logger: { error: jest.fn() },
}));

// Mock all the service functions
jest.mock('../../src/services/client.service', () => ({
    getActiveWidgetLayout: jest.fn(),
    allProducts: jest.fn(),
    didUserAnswered: jest.fn(),
    getSampleStatus: jest.fn(),
    getSurveyByID: jest.fn(),
}));

jest.mock('../../src/services/product-slider.service', () => ({
    getProductSliderByID: jest.fn(),
}));

const mockRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('Layout Controller', () => {
    let mockApiResponse: jest.Mock;
    let mockGetActiveWidgetLayout: jest.Mock;

    beforeEach(() => {
        mockApiResponse = require('@atc/common').apiResponse;
        mockGetActiveWidgetLayout =
            require('../../src/services/client.service').getActiveWidgetLayout;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('getActiveLayout should handle successful response', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer token123' },
        };

        // Mock the service response
        mockGetActiveWidgetLayout.mockResolvedValue({
            data: {
                widget: {
                    widget_id: 'widget-1',
                    component: [],
                    widget_name: 'Test Widget',
                },
                banner: [],
            },
        });

        await LayoutController.getActiveLayout(req, res);

        expect(mockGetActiveWidgetLayout).toHaveBeenCalled();
        expect(mockApiResponse).toHaveBeenCalledWith(
            res,
            200,
            expect.objectContaining({
                widget_id: 'widget-1',
                widgets: expect.any(Array),
                message: 'Active layout fetched successfully',
            }),
        );
    });

    it('getActiveLayout should handle missing layout data', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer token123' },
        };

        // Mock the service response with no data
        mockGetActiveWidgetLayout.mockResolvedValue({
            data: null,
        });

        await LayoutController.getActiveLayout(req, res);

        expect(mockGetActiveWidgetLayout).toHaveBeenCalled();
        expect(mockApiResponse).toHaveBeenCalledWith(res, 404, {
            message: 'Layout not found',
        });
    });

    it('getSingleLayout should handle missing token', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer' }, // Invalid token format
            params: { widget_id: 'widget-1' },
        };

        await LayoutController.getSingleLayout(req, res);

        expect(mockApiResponse).toHaveBeenCalledWith(res, 401, {
            message: 'Token not found',
        });
    });

    it('getSingleLayout should handle successful response', async () => {
        const res = mockRes();
        const req: any = {
            headers: { authorization: 'Bearer token123' },
            params: { widget_id: 'widget-1' },
        };

        // Mock the service response
        mockGetActiveWidgetLayout.mockResolvedValue({
            data: {
                widget: {
                    widget_id: 'widget-1',
                    component: [],
                    widget_name: 'Test Widget',
                },
                banner: [],
            },
        });

        await LayoutController.getSingleLayout(req, res);

        expect(mockGetActiveWidgetLayout).toHaveBeenCalledWith(
            'mockMeta',
            'widget-1',
        );
        expect(mockApiResponse).toHaveBeenCalledWith(
            res,
            200,
            expect.objectContaining({
                widget_id: 'widget-1',
                widgets: expect.any(Array),
                message: 'Layout fetched successfully',
            }),
        );
    });
});
