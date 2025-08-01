import { getUserEngagement } from '../../../src/handlers/getUserEngagement';
import { status } from '@grpc/grpc-js';
import { ChartType, errorMessage, responseMessage } from '@atc/common';

// Mock @atc/db with helperQueries
jest.mock('@atc/db', () => ({
    helperQueries: {
        getMonthlyRecordCounts: jest.fn(),
        getYearlyRecordCounts: jest.fn(),
        getWeeklyRecordCounts: jest.fn(),
    },
}));

// Import the mocked module to get typed access
import { helperQueries } from '@atc/db';
const mockHelperQueries = helperQueries as jest.Mocked<typeof helperQueries>;

describe('getUserEngagement', () => {
    const callback = jest.fn();
    const mockCall: any = {
        request: {
            type: ChartType.MONTHLY,
        },
    };

    const mockChartData = [
        {
            date: '2025-01',
            count: 150,
        },
        {
            date: '2025-02',
            count: 200,
        },
        {
            date: '2025-03',
            count: 175,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('successful chart data retrieval', () => {
        it('should return monthly engagement data when type is MONTHLY', async () => {
            mockCall.request.type = ChartType.MONTHLY;
            mockHelperQueries.getMonthlyRecordCounts.mockResolvedValue(mockChartData);

            await getUserEngagement(mockCall, callback);

            expect(mockHelperQueries.getMonthlyRecordCounts).toHaveBeenCalledWith(
                'UserLoginActivity',
                'login_at',
                'user_id',
                true,
            );

            expect(callback).toHaveBeenCalledWith(null, {
                data: mockChartData,
                status: status.OK,
                message: responseMessage.OTHER.DATA_FOUND,
            });
        });

        it('should return yearly engagement data when type is YEARLY', async () => {
            mockCall.request.type = ChartType.YEARLY;
            mockHelperQueries.getYearlyRecordCounts.mockResolvedValue(mockChartData);

            await getUserEngagement(mockCall, callback);

            expect(mockHelperQueries.getYearlyRecordCounts).toHaveBeenCalledWith(
                'UserLoginActivity',
                'login_at',
                'user_id',
                true,
            );

            expect(callback).toHaveBeenCalledWith(null, {
                data: mockChartData,
                status: status.OK,
                message: responseMessage.OTHER.DATA_FOUND,
            });
        });

        it('should return weekly engagement data when type is WEEKLY', async () => {
            mockCall.request.type = ChartType.WEEKLY;
            mockHelperQueries.getWeeklyRecordCounts.mockResolvedValue(mockChartData);

            await getUserEngagement(mockCall, callback);

            expect(mockHelperQueries.getWeeklyRecordCounts).toHaveBeenCalledWith(
                'UserLoginActivity',
                'login_at',
                'user_id',
                true,
            );

            expect(callback).toHaveBeenCalledWith(null, {
                data: mockChartData,
                status: status.OK,
                message: responseMessage.OTHER.DATA_FOUND,
            });
        });

        it('should return DATA_NOT_FOUND message when no data is available', async () => {
            mockCall.request.type = ChartType.MONTHLY;
            mockHelperQueries.getMonthlyRecordCounts.mockResolvedValue([]);

            await getUserEngagement(mockCall, callback);

            expect(callback).toHaveBeenCalledWith(null, {
                data: [],
                status: status.OK,
                message: responseMessage.OTHER.DATA_NOT_FOUND,
            });
        });

        it('should return empty array when chart type is not supported', async () => {
            mockCall.request.type = 'UNSUPPORTED_TYPE' as ChartType;

            await getUserEngagement(mockCall, callback);

            expect(mockHelperQueries.getMonthlyRecordCounts).not.toHaveBeenCalled();
            expect(mockHelperQueries.getYearlyRecordCounts).not.toHaveBeenCalled();
            expect(mockHelperQueries.getWeeklyRecordCounts).not.toHaveBeenCalled();

            expect(callback).toHaveBeenCalledWith(null, {
                data: [],
                status: status.OK,
                message: responseMessage.OTHER.DATA_NOT_FOUND,
            });
        });
    });

    describe('error handling', () => {
        it('should handle database errors gracefully for monthly data', async () => {
            const mockError = new Error('Database connection failed');
            mockCall.request.type = ChartType.MONTHLY;
            mockHelperQueries.getMonthlyRecordCounts.mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await getUserEngagement(mockCall, callback);

            expect(consoleSpy).toHaveBeenCalledWith(mockError);
            expect(callback).toHaveBeenCalledWith(null, {
                data: [],
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
            });

            consoleSpy.mockRestore();
        });

        it('should handle database errors gracefully for yearly data', async () => {
            const mockError = new Error('Query timeout');
            mockCall.request.type = ChartType.YEARLY;
            mockHelperQueries.getYearlyRecordCounts.mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await getUserEngagement(mockCall, callback);

            expect(consoleSpy).toHaveBeenCalledWith(mockError);
            expect(callback).toHaveBeenCalledWith(null, {
                data: [],
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
            });

            consoleSpy.mockRestore();
        });

        it('should handle database errors gracefully for weekly data', async () => {
            const mockError = new Error('Invalid query parameters');
            mockCall.request.type = ChartType.WEEKLY;
            mockHelperQueries.getWeeklyRecordCounts.mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await getUserEngagement(mockCall, callback);

            expect(consoleSpy).toHaveBeenCalledWith(mockError);
            expect(callback).toHaveBeenCalledWith(null, {
                data: [],
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
            });

            consoleSpy.mockRestore();
        });

        it('should handle unexpected error types', async () => {
            const mockError = { message: 'Unexpected error object' };
            mockCall.request.type = ChartType.MONTHLY;
            mockHelperQueries.getMonthlyRecordCounts.mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await getUserEngagement(mockCall, callback);

            expect(consoleSpy).toHaveBeenCalledWith(mockError);
            expect(callback).toHaveBeenCalledWith(null, {
                data: [],
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
            });

            consoleSpy.mockRestore();
        });
    });

    describe('edge cases', () => {
        it('should handle missing request type', async () => {
            const callWithMissingType = {
                request: {},
            };

            await getUserEngagement(callWithMissingType as any, callback);

            expect(callback).toHaveBeenCalledWith(null, {
                data: [],
                status: status.OK,
                message: responseMessage.OTHER.DATA_NOT_FOUND,
            });
        });

        it('should handle null data response from database', async () => {
            mockCall.request.type = ChartType.MONTHLY;
            mockHelperQueries.getMonthlyRecordCounts.mockResolvedValue(null);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await getUserEngagement(mockCall, callback);

            expect(consoleSpy).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledWith(null, {
                data: [],
                status: status.INTERNAL,
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            });

            consoleSpy.mockRestore();
        });

        it('should handle undefined data response from database', async () => {
            mockCall.request.type = ChartType.WEEKLY;
            mockHelperQueries.getWeeklyRecordCounts.mockResolvedValue(undefined);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await getUserEngagement(mockCall, callback);

            expect(consoleSpy).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledWith(null, {
                data: [],
                status: status.INTERNAL,
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            });

            consoleSpy.mockRestore();
        });

        it('should handle empty request object', async () => {
            const callWithEmptyRequest = {
                request: null,
            };

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await getUserEngagement(callWithEmptyRequest as any, callback);

            expect(callback).toHaveBeenCalledWith(null, {
                data: [],
                message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
                status: status.INTERNAL,
            });

            consoleSpy.mockRestore();
        });

        it('should handle large dataset response', async () => {
            const largeMockData = Array.from({ length: 1000 }, (_, index) => ({
                date: `2025-${String(index + 1).padStart(2, '0')}`,
                count: Math.floor(Math.random() * 1000),
            }));

            mockCall.request.type = ChartType.YEARLY;
            mockHelperQueries.getYearlyRecordCounts.mockResolvedValue(largeMockData);

            await getUserEngagement(mockCall, callback);

            expect(callback).toHaveBeenCalledWith(null, {
                data: largeMockData,
                status: status.OK,
                message: responseMessage.OTHER.DATA_FOUND,
            });
        });
    });

    describe('helper queries integration', () => {
        it('should call getMonthlyRecordCounts with correct parameters only', async () => {
            mockCall.request.type = ChartType.MONTHLY;
            mockHelperQueries.getMonthlyRecordCounts.mockResolvedValue(mockChartData);

            await getUserEngagement(mockCall, callback);

            expect(mockHelperQueries.getMonthlyRecordCounts).toHaveBeenCalledWith(
                'UserLoginActivity',
                'login_at',
                'user_id',
                true,
            );
            expect(mockHelperQueries.getYearlyRecordCounts).not.toHaveBeenCalled();
            expect(mockHelperQueries.getWeeklyRecordCounts).not.toHaveBeenCalled();
        });

        it('should call getYearlyRecordCounts with correct parameters only', async () => {
            mockCall.request.type = ChartType.YEARLY;
            mockHelperQueries.getYearlyRecordCounts.mockResolvedValue(mockChartData);

            await getUserEngagement(mockCall, callback);

            expect(mockHelperQueries.getYearlyRecordCounts).toHaveBeenCalledWith(
                'UserLoginActivity',
                'login_at',
                'user_id',
                true,
            );
            expect(mockHelperQueries.getMonthlyRecordCounts).not.toHaveBeenCalled();
            expect(mockHelperQueries.getWeeklyRecordCounts).not.toHaveBeenCalled();
        });

        it('should call getWeeklyRecordCounts with correct parameters only', async () => {
            mockCall.request.type = ChartType.WEEKLY;
            mockHelperQueries.getWeeklyRecordCounts.mockResolvedValue(mockChartData);

            await getUserEngagement(mockCall, callback);

            expect(mockHelperQueries.getWeeklyRecordCounts).toHaveBeenCalledWith(
                'UserLoginActivity',
                'login_at',
                'user_id',
                true,
            );
            expect(mockHelperQueries.getMonthlyRecordCounts).not.toHaveBeenCalled();
            expect(mockHelperQueries.getYearlyRecordCounts).not.toHaveBeenCalled();
        });

        it('should not call any helper query methods for unsupported chart type', async () => {
            mockCall.request.type = 'INVALID_TYPE' as ChartType;

            await getUserEngagement(mockCall, callback);

            expect(mockHelperQueries.getMonthlyRecordCounts).not.toHaveBeenCalled();
            expect(mockHelperQueries.getYearlyRecordCounts).not.toHaveBeenCalled();
            expect(mockHelperQueries.getWeeklyRecordCounts).not.toHaveBeenCalled();
        });
    });

    describe('data transformation', () => {
        it('should properly handle type casting from database response', async () => {
            const rawDatabaseData = [
                { date: '2025-01', count: '150' },
                { date: '2025-02', count: '200' },
            ];

            mockCall.request.type = ChartType.MONTHLY;
            mockHelperQueries.getMonthlyRecordCounts.mockResolvedValue(rawDatabaseData);

            await getUserEngagement(mockCall, callback);

            expect(callback).toHaveBeenCalledWith(null, {
                data: rawDatabaseData,
                status: status.OK,
                message: responseMessage.OTHER.DATA_FOUND,
            });
        });

        it('should handle mixed data types in response', async () => {
            const mixedData = [
                { date: new Date('2025-01-01'), count: 150 },
                { date: '2025-02', count: '200' },
                { date: null, count: 0 },
            ];

            mockCall.request.type = ChartType.WEEKLY;
            mockHelperQueries.getWeeklyRecordCounts.mockResolvedValue(mixedData);

            await getUserEngagement(mockCall, callback);

            expect(callback).toHaveBeenCalledWith(null, {
                data: mixedData,
                status: status.OK,
                message: responseMessage.OTHER.DATA_FOUND,
            });
        });
    });

    describe('callback behavior', () => {
        it('should always call callback with null as first parameter on success', async () => {
            mockCall.request.type = ChartType.MONTHLY;
            mockHelperQueries.getMonthlyRecordCounts.mockResolvedValue(mockChartData);

            await getUserEngagement(mockCall, callback);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(
                null,
                expect.any(Object),
            );
        });

        it('should always call callback with null as first parameter on error', async () => {
            const mockError = new Error('Test error');
            mockCall.request.type = ChartType.MONTHLY;
            mockHelperQueries.getMonthlyRecordCounts.mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await getUserEngagement(mockCall, callback);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(
                null,
                expect.any(Object),
            );

            consoleSpy.mockRestore();
        });

        it('should return proper response structure on success', async () => {
            mockCall.request.type = ChartType.MONTHLY;
            mockHelperQueries.getMonthlyRecordCounts.mockResolvedValue(mockChartData);

            await getUserEngagement(mockCall, callback);

            const response = callback.mock.calls[0][1];
            expect(response).toHaveProperty('data');
            expect(response).toHaveProperty('status');
            expect(response).toHaveProperty('message');
            expect(response.data).toBe(mockChartData);
            expect(response.status).toBe(status.OK);
            expect(response.message).toBe(responseMessage.OTHER.DATA_FOUND);
        });

        it('should return proper response structure on error', async () => {
            const mockError = new Error('Test error');
            mockCall.request.type = ChartType.MONTHLY;
            mockHelperQueries.getMonthlyRecordCounts.mockRejectedValue(mockError);

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            await getUserEngagement(mockCall, callback);

            const response = callback.mock.calls[0][1];
            expect(response).toHaveProperty('data');
            expect(response).toHaveProperty('status');
            expect(response).toHaveProperty('message');
            expect(response.data).toEqual([]);
            expect(response.status).toBe(status.INTERNAL);
            expect(response.message).toBe(errorMessage.OTHER.SOMETHING_WENT_WRONG);

            consoleSpy.mockRestore();
        });
    });
});