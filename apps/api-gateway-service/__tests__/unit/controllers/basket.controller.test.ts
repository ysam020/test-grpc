import {
    addToBasket,
    removeFromBasket,
    clearBasket,
    viewBasket,
} from '../../../src/controllers/basket.controller';
import { userStub } from '../../../src/client';

const mockFns = {
    AddToBasket: jest.fn(),
    RemoveFromBasket: jest.fn(),
    ClearBasket: jest.fn(),
    ViewBasket: jest.fn(),
};

jest.mock('../../../src/client', () => ({
    userStub: {
        AddToBasket: jest.fn(),
        RemoveFromBasket: jest.fn(),
        ClearBasket: jest.fn(),
        ViewBasket: jest.fn(),
    },
}));

jest.mock('@atc/common', () => ({
    apiResponse: jest.fn((res, status, data) =>
        res.status(status).json({ success: true, data }),
    ),
    asyncHandler: (fn) => fn,
    grpcToHttpStatus: jest.fn(() => 200),
    utilFns: {
        createMetadata: jest.fn(() => 'mockMetadata'),
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

Object.assign(userStub, mockFns);

const createMockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
});

describe('Basket Controller', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('addToBasket should call gRPC and return response', async () => {
        const req = {
            headers: { authorization: 'Bearer token' },
            body: { productId: 'abc', quantity: 2 },
        } as any;
        const res = createMockRes();

        const grpcResponse = { status: 'SUCCESS', message: 'Added to basket' };
        mockFns.AddToBasket.mockImplementation((_body, _meta, cb) =>
            cb(null, grpcResponse),
        );

        await addToBasket(req, res);

        expect(mockFns.AddToBasket).toHaveBeenCalledWith(
            req.body,
            'mockMetadata',
            expect.any(Function),
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('removeFromBasket should call gRPC and return response', async () => {
        const req = {
            headers: { authorization: 'Bearer token' },
            params: { productId: 'abc' },
        } as any;
        const res = createMockRes();

        const grpcResponse = {
            status: 'SUCCESS',
            message: 'Removed from basket',
        };
        mockFns.RemoveFromBasket.mockImplementation((_params, _meta, cb) =>
            cb(null, grpcResponse),
        );

        await removeFromBasket(req, res);

        expect(mockFns.RemoveFromBasket).toHaveBeenCalledWith(
            req.params,
            'mockMetadata',
            expect.any(Function),
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('clearBasket should call gRPC and return response', async () => {
        const req = {
            headers: { authorization: 'Bearer token' },
        } as any;
        const res = createMockRes();

        const grpcResponse = { status: 'SUCCESS', message: 'Basket cleared' };
        mockFns.ClearBasket.mockImplementation((_body, _meta, cb) =>
            cb(null, grpcResponse),
        );

        await clearBasket(req, res);

        expect(mockFns.ClearBasket).toHaveBeenCalledWith(
            {},
            'mockMetadata',
            expect.any(Function),
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('viewBasket should call gRPC and return response', async () => {
        const req = {
            headers: { authorization: 'Bearer token' },
            query: { userId: '123' },
        } as any;
        const res = createMockRes();

        const grpcResponse = { status: 'SUCCESS', basket: [] };
        mockFns.ViewBasket.mockImplementation((_query, _meta, cb) =>
            cb(null, grpcResponse),
        );

        await viewBasket(req, res);

        expect(mockFns.ViewBasket).toHaveBeenCalledWith(
            req.query,
            'mockMetadata',
            expect.any(Function),
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
