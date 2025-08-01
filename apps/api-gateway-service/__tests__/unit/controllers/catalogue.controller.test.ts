import * as CatalogueController from '../../../src/controllers/catalogue.controller';
import { catalogueStub } from '../../../src/client';

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
    catalogueStub: {
        CreateProductGroup: jest.fn(),
        GetProductGroup: jest.fn(),
        UpdateProductGroup: jest.fn(),
        AttachProductToGroup: jest.fn(),
        GetAllProductGroups: jest.fn(),
        GetAttachedProducts: jest.fn(),
        DeleteProductGroup: jest.fn(),
        RemoveProductsFromGroup: jest.fn(),
        ExportToExcel: jest.fn(),
        CreateAdvertisement: jest.fn(),
        GetAdvertisements: jest.fn(),
        GetSingleAdvertisement: jest.fn(),
        DeleteAdvertisement: jest.fn(),
        UpdateAdvertisement: jest.fn(),
        ExportToExcelAdvertisements: jest.fn(),
        ToggleManualMatch: jest.fn(),
        AddAdvertisementItem: jest.fn(),
        MatchAdvertisementItem: jest.fn(),
        MarkAsCompleteAdvertisement: jest.fn(),
        FinishLaterAdvertisement: jest.fn(),
    },
}));

const mockRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

const setupGrpcMock = (fnName, response) => {
    catalogueStub[fnName].mockImplementation((_req, _meta, cb) =>
        cb(null, response),
    );
};

describe('Catalogue Controller', () => {
    afterEach(() => jest.clearAllMocks());

    const testCases = [
        [
            'createProductGroup',
            'CreateProductGroup',
            { name: 'Electronics' },
            'body',
        ],
        ['getProductGroup', 'GetProductGroup', { id: '1' }, 'params'],
        [
            'updateProductGroup',
            'UpdateProductGroup',
            { id: '1', name: 'Updated' },
            'body+params',
        ],
        [
            'attachProductsToGroup',
            'AttachProductToGroup',
            { id: '1', products: ['p1'] },
            'body+params',
        ],
        ['getAllProductGroups', 'GetAllProductGroups', { page: 1 }, 'query'],
        [
            'getAttachedProducts',
            'GetAttachedProducts',
            { id: '1' },
            'query+params',
        ],
        ['deleteProductGroup', 'DeleteProductGroup', { id: '1' }, 'params'],
        [
            'removeProductsFromGroup',
            'RemoveProductsFromGroup',
            { id: '1', pids: ['x'] },
            'body+params',
        ],
        ['exportToExcel', 'ExportToExcel', { type: 'product' }, 'query+params'],
        [
            'createAdvertisement',
            'CreateAdvertisement',
            { title: 'New', files: [] },
            'body',
        ],
        [
            'getAdvertisements',
            'GetAdvertisements',
            { category: 'tech' },
            'query',
        ],
        [
            'getSingleAdvertisement',
            'GetSingleAdvertisement',
            { id: '1' },
            'query+params',
        ],
        ['deleteAdvertisement', 'DeleteAdvertisement', { id: '1' }, 'params'],
        [
            'updateAdvertisement',
            'UpdateAdvertisement',
            { id: '1', title: 'Updated' },
            'body+params',
        ],
        [
            'exportToExcelAdvertisements',
            'ExportToExcelAdvertisements',
            { year: 2024 },
            'query',
        ],
        ['toggleManualMatch', 'ToggleManualMatch', { id: '1' }, 'params'],
        ['addAdvertisementItem', 'AddAdvertisementItem', { adId: '1' }, 'body'],
        [
            'matchAdvertisementItem',
            'MatchAdvertisementItem',
            { adId: '1', productId: '2' },
            'body+params',
        ],
        [
            'markAsCompleteAdvertisement',
            'MarkAsCompleteAdvertisement',
            { id: '1' },
            'params',
        ],
        [
            'finishLaterAdvertisement',
            'FinishLaterAdvertisement',
            { id: '1' },
            'params',
        ],
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
                req.params = { id: payload.id };
            }

            if (fnName === 'createAdvertisement') req.files = []; // Special case

            setupGrpcMock(grpcFn, { status: 'SUCCESS', result: 'ok' });

            await CatalogueController[fnName](req, res);

            expect(catalogueStub[grpcFn]).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: { result: 'ok' },
            });
        });
    });
});
