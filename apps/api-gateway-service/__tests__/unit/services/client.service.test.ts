import {
    getSurveyByID,
    didUserAnswered,
    allProducts,
    getActiveWidgetLayout,
    getSampleStatus,
} from '../../../src/services/client.service';
import {
    productStub,
    sampleStub,
    surveyStub,
    widgetStub,
} from '../../../src/client';
import { Metadata } from '@grpc/grpc-js';

// Mock the logger
jest.mock('@atc/logger', () => ({
    logger: { error: jest.fn() },
}));

// Mock the client stubs
jest.mock('../../../src/client', () => ({
    productStub: {
        getAllProducts: jest.fn(),
    },
    sampleStub: {
        GetSampleStatus: jest.fn(),
    },
    surveyStub: {
        GetSingleSurvey: jest.fn(),
        DidUserAnswered: jest.fn(),
    },
    widgetStub: {
        GetActiveLayout: jest.fn(),
    },
}));

// Mock Metadata
jest.mock('@grpc/grpc-js', () => ({
    Metadata: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
    })),
}));

describe('Client Service', () => {
    let mockMetadata: Metadata;

    beforeEach(() => {
        jest.clearAllMocks();
        mockMetadata = new Metadata();
    });

    describe('getSurveyByID', () => {
        const mockParams = { survey_id: 'test-survey-id' };

        it('should successfully get survey by ID', async () => {
            const mockResponse = {
                id: 'test-survey-id',
                title: 'Test Survey',
                questions: [],
            };

            (surveyStub.GetSingleSurvey as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(null, mockResponse);
                },
            );

            const result = await getSurveyByID(mockParams, mockMetadata);

            expect(surveyStub.GetSingleSurvey).toHaveBeenCalledWith(
                mockParams,
                mockMetadata,
                expect.any(Function),
            );
            expect(result).toEqual(mockResponse);
        });

        it('should reject when gRPC call fails', async () => {
            const mockError = new Error('gRPC error');

            (surveyStub.GetSingleSurvey as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(mockError, null);
                },
            );

            await expect(
                getSurveyByID(mockParams, mockMetadata),
            ).rejects.toThrow('gRPC error');

            expect(surveyStub.GetSingleSurvey).toHaveBeenCalledWith(
                mockParams,
                mockMetadata,
                expect.any(Function),
            );
        });

        it('should handle empty response', async () => {
            (surveyStub.GetSingleSurvey as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(null, null);
                },
            );

            const result = await getSurveyByID(mockParams, mockMetadata);

            expect(result).toBeNull();
        });
    });

    describe('didUserAnswered', () => {
        const mockParams = {
            user_id: 'test-user-id',
            survey_id: 'test-survey-id',
        };

        it('should successfully check if user answered', async () => {
            const mockResponse = {
                user_id: 'test-user-id',
                survey_id: 'test-survey-id',
                answered: true,
            };

            (surveyStub.DidUserAnswered as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(null, mockResponse);
                },
            );

            const result = await didUserAnswered(mockParams, mockMetadata);

            expect(surveyStub.DidUserAnswered).toHaveBeenCalledWith(
                mockParams,
                mockMetadata,
                expect.any(Function),
            );
            expect(result).toEqual(mockResponse);
        });

        it('should reject when gRPC call fails', async () => {
            const mockError = new Error('User not found');

            (surveyStub.DidUserAnswered as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(mockError, null);
                },
            );

            await expect(
                didUserAnswered(mockParams, mockMetadata),
            ).rejects.toThrow('User not found');
        });

        it('should handle user who has not answered', async () => {
            const mockResponse = {
                user_id: 'test-user-id',
                survey_id: 'test-survey-id',
                answered: false,
            };

            (surveyStub.DidUserAnswered as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(null, mockResponse);
                },
            );

            const result = await didUserAnswered(mockParams, mockMetadata);

            expect(result).toEqual(mockResponse);
            expect(result.answered).toBe(false);
        });
    });

    describe('allProducts', () => {
        const mockParams = {
            page: 1,
            limit: 10,
            search: 'test product',
        };

        it('should successfully get all products', async () => {
            const mockResponse = {
                products: [
                    { id: '1', name: 'Product 1' },
                    { id: '2', name: 'Product 2' },
                ],
                total_count: 2,
                page: 1,
                limit: 10,
            };

            (productStub.getAllProducts as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(null, mockResponse);
                },
            );

            const result = await allProducts(mockParams, mockMetadata);

            expect(productStub.getAllProducts).toHaveBeenCalledWith(
                mockParams,
                mockMetadata,
                expect.any(Function),
            );
            expect(result).toEqual(mockResponse);
        });

        it('should reject when gRPC call fails', async () => {
            const mockError = new Error('Database connection failed');

            (productStub.getAllProducts as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(mockError, null);
                },
            );

            await expect(allProducts(mockParams, mockMetadata)).rejects.toThrow(
                'Database connection failed',
            );
        });

        it('should handle empty product list', async () => {
            const mockResponse = {
                products: [],
                total_count: 0,
                page: 1,
                limit: 10,
            };

            (productStub.getAllProducts as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(null, mockResponse);
                },
            );

            const result = await allProducts(mockParams, mockMetadata);

            expect(result).toEqual(mockResponse);
            expect(result.products).toHaveLength(0);
        });

        it('should handle request without search parameter', async () => {
            const paramsWithoutSearch = { page: 1, limit: 10 };
            const mockResponse = {
                products: [{ id: '1', name: 'Product 1' }],
                total_count: 1,
                page: 1,
                limit: 10,
            };

            (productStub.getAllProducts as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(null, mockResponse);
                },
            );

            const result = await allProducts(paramsWithoutSearch, mockMetadata);

            expect(productStub.getAllProducts).toHaveBeenCalledWith(
                paramsWithoutSearch,
                mockMetadata,
                expect.any(Function),
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getActiveWidgetLayout', () => {
        it('should successfully get active widget layout with widget ID', async () => {
            const widgetID = 'test-widget-id';
            const mockResponse = {
                widget_id: widgetID,
                layout: {
                    components: [],
                    style: {},
                },
                is_active: true,
            };

            (widgetStub.GetActiveLayout as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(null, mockResponse);
                },
            );

            const result = await getActiveWidgetLayout(mockMetadata, widgetID);

            expect(widgetStub.GetActiveLayout).toHaveBeenCalledWith(
                { widget_id: widgetID },
                mockMetadata,
                expect.any(Function),
            );
            expect(result).toEqual(mockResponse);
        });

        it('should successfully get active widget layout without widget ID', async () => {
            const mockResponse = {
                widget_id: undefined,
                layout: {
                    components: [],
                    style: {},
                },
                is_active: true,
            };

            (widgetStub.GetActiveLayout as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(null, mockResponse);
                },
            );

            const result = await getActiveWidgetLayout(mockMetadata);

            expect(widgetStub.GetActiveLayout).toHaveBeenCalledWith(
                { widget_id: undefined },
                mockMetadata,
                expect.any(Function),
            );
            expect(result).toEqual(mockResponse);
        });

        it('should reject when gRPC call fails', async () => {
            const mockError = new Error('Widget not found');

            (widgetStub.GetActiveLayout as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(mockError, null);
                },
            );

            await expect(
                getActiveWidgetLayout(mockMetadata, 'invalid-id'),
            ).rejects.toThrow('Widget not found');
        });

        it('should handle null widget ID parameter', async () => {
            const mockResponse = {
                widget_id: undefined,
                layout: null,
                is_active: false,
            };

            (widgetStub.GetActiveLayout as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(null, mockResponse);
                },
            );

            const result = await getActiveWidgetLayout(mockMetadata, undefined);

            expect(widgetStub.GetActiveLayout).toHaveBeenCalledWith(
                { widget_id: undefined },
                mockMetadata,
                expect.any(Function),
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getSampleStatus', () => {
        const mockParams = {
            sample_id: 'test-sample-id',
            user_id: 'test-user-id',
        };

        it('should successfully get sample status', async () => {
            const mockResponse = {
                sample_id: 'test-sample-id',
                user_id: 'test-user-id',
                status: 'COMPLETED',
                progress: 100,
            };

            (sampleStub.GetSampleStatus as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(null, mockResponse);
                },
            );

            const result = await getSampleStatus(mockParams, mockMetadata);

            expect(sampleStub.GetSampleStatus).toHaveBeenCalledWith(
                mockParams,
                mockMetadata,
                expect.any(Function),
            );
            expect(result).toEqual(mockResponse);
        });

        it('should reject when gRPC call fails', async () => {
            const mockError = new Error('Sample not found');

            (sampleStub.GetSampleStatus as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(mockError, null);
                },
            );

            await expect(
                getSampleStatus(mockParams, mockMetadata),
            ).rejects.toThrow('Sample not found');
        });

        it('should handle pending sample status', async () => {
            const mockResponse = {
                sample_id: 'test-sample-id',
                user_id: 'test-user-id',
                status: 'PENDING',
                progress: 0,
            };

            (sampleStub.GetSampleStatus as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(null, mockResponse);
                },
            );

            const result = await getSampleStatus(mockParams, mockMetadata);

            expect(result).toEqual(mockResponse);
            expect(result.status).toBe('PENDING');
            expect(result.progress).toBe(0);
        });

        it('should handle in-progress sample status', async () => {
            const mockResponse = {
                sample_id: 'test-sample-id',
                user_id: 'test-user-id',
                status: 'IN_PROGRESS',
                progress: 50,
            };

            (sampleStub.GetSampleStatus as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(null, mockResponse);
                },
            );

            const result = await getSampleStatus(mockParams, mockMetadata);

            expect(result).toEqual(mockResponse);
            expect(result.status).toBe('IN_PROGRESS');
            expect(result.progress).toBe(50);
        });
    });

    describe('Error Handling', () => {
        it('should handle gRPC timeout errors', async () => {
            const timeoutError = new Error('Deadline exceeded');
            const mockParams = { survey_id: 'test-id' };

            (surveyStub.GetSingleSurvey as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(timeoutError, null);
                },
            );

            await expect(
                getSurveyByID(mockParams, mockMetadata),
            ).rejects.toThrow('Deadline exceeded');
        });

        it('should handle network connectivity issues', async () => {
            const networkError = new Error('Connection refused');
            const mockParams = { page: 1, limit: 10 };

            (productStub.getAllProducts as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(networkError, null);
                },
            );

            await expect(allProducts(mockParams, mockMetadata)).rejects.toThrow(
                'Connection refused',
            );
        });

        it('should handle authentication errors', async () => {
            const authError = new Error('Unauthenticated');
            const mockParams = { sample_id: 'test-id', user_id: 'test-user' };

            (sampleStub.GetSampleStatus as jest.Mock).mockImplementation(
                (params, metadata, callback) => {
                    callback(authError, null);
                },
            );

            await expect(
                getSampleStatus(mockParams, mockMetadata),
            ).rejects.toThrow('Unauthenticated');
        });
    });

    describe('Promise Resolution and Rejection', () => {
        it('should properly resolve promises for all service functions', async () => {
            const mockResponse = { success: true };

            // Mock all functions to resolve
            (surveyStub.GetSingleSurvey as jest.Mock).mockImplementation(
                (params, metadata, callback) => callback(null, mockResponse),
            );
            (surveyStub.DidUserAnswered as jest.Mock).mockImplementation(
                (params, metadata, callback) => callback(null, mockResponse),
            );
            (productStub.getAllProducts as jest.Mock).mockImplementation(
                (params, metadata, callback) => callback(null, mockResponse),
            );
            (widgetStub.GetActiveLayout as jest.Mock).mockImplementation(
                (params, metadata, callback) => callback(null, mockResponse),
            );
            (sampleStub.GetSampleStatus as jest.Mock).mockImplementation(
                (params, metadata, callback) => callback(null, mockResponse),
            );

            // Test all functions resolve
            await expect(
                getSurveyByID({ survey_id: 'test' }, mockMetadata),
            ).resolves.toEqual(mockResponse);
            await expect(
                didUserAnswered(
                    { user_id: 'test', survey_id: 'test' },
                    mockMetadata,
                ),
            ).resolves.toEqual(mockResponse);
            await expect(
                allProducts({ page: 1, limit: 10 }, mockMetadata),
            ).resolves.toEqual(mockResponse);
            await expect(getActiveWidgetLayout(mockMetadata)).resolves.toEqual(
                mockResponse,
            );
            await expect(
                getSampleStatus(
                    { sample_id: 'test', user_id: 'test' },
                    mockMetadata,
                ),
            ).resolves.toEqual(mockResponse);
        });

        it('should properly reject promises for all service functions', async () => {
            const mockError = new Error('Test error');

            // Mock all functions to reject
            (surveyStub.GetSingleSurvey as jest.Mock).mockImplementation(
                (params, metadata, callback) => callback(mockError, null),
            );
            (surveyStub.DidUserAnswered as jest.Mock).mockImplementation(
                (params, metadata, callback) => callback(mockError, null),
            );
            (productStub.getAllProducts as jest.Mock).mockImplementation(
                (params, metadata, callback) => callback(mockError, null),
            );
            (widgetStub.GetActiveLayout as jest.Mock).mockImplementation(
                (params, metadata, callback) => callback(mockError, null),
            );
            (sampleStub.GetSampleStatus as jest.Mock).mockImplementation(
                (params, metadata, callback) => callback(mockError, null),
            );

            // Test all functions reject
            await expect(
                getSurveyByID({ survey_id: 'test' }, mockMetadata),
            ).rejects.toThrow('Test error');
            await expect(
                didUserAnswered(
                    { user_id: 'test', survey_id: 'test' },
                    mockMetadata,
                ),
            ).rejects.toThrow('Test error');
            await expect(
                allProducts({ page: 1, limit: 10 }, mockMetadata),
            ).rejects.toThrow('Test error');
            await expect(getActiveWidgetLayout(mockMetadata)).rejects.toThrow(
                'Test error',
            );
            await expect(
                getSampleStatus(
                    { sample_id: 'test', user_id: 'test' },
                    mockMetadata,
                ),
            ).rejects.toThrow('Test error');
        });
    });
});
