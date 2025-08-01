import {
    errorMessage,
    ExcelReportType,
    generateExcelSheet,
    generateFileName,
    ProductMatch,
    responseMessage,
    sendEmail,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import {
    DefaultResponse,
    DefaultResponse__Output,
    ExportToExcelAdvertisementsRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getAllAdvertisements } from '../../../src/services/model.service';
import { prismaClient } from '@atc/db';
import { exportToExcelAdvertisements } from '../../../src/handlers/exportToExcelAdvertisements';

// Mock all dependencies following the project pattern
jest.mock('@atc/common', () => ({
    errorMessage: {
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        EMAIL: {
            MAIL_SENT: 'Email sent successfully',
        },
    },
    ExcelReportType: {
        ADVERTISEMENT: 'ADVERTISEMENT',
    },
    ProductMatch: {
        MATCHED: 'MATCHED',
        NOT_MATCHED: 'NOT_MATCHED',
        IN_PROGRESS: 'IN_PROGRESS',
    },
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
    generateExcelSheet: jest.fn(),
    generateFileName: jest.fn(),
    sendEmail: jest.fn(),
}));

jest.mock('../../../src/services/model.service');
jest.mock('@atc/db');

describe('exportToExcelAdvertisements', () => {
    let mockCall: jest.Mocked<CustomServerUnaryCall<ExportToExcelAdvertisementsRequest__Output, DefaultResponse>>;
    let mockCallback: jest.MockedFunction<sendUnaryData<DefaultResponse__Output>>;
    let mockGetAllAdvertisements: jest.MockedFunction<typeof getAllAdvertisements>;
    let mockPrismaClient: jest.Mocked<typeof prismaClient>;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mocks
        mockGetAllAdvertisements = getAllAdvertisements as jest.MockedFunction<typeof getAllAdvertisements>;
        mockPrismaClient = prismaClient as jest.Mocked<typeof prismaClient>;

        // Mock call object with default request
        mockCall = {
            request: {
                email: 'admin@company.com',
                retailer_id: 'retailer-123',
                advertisement_type: 'BANNER',
                year: 2024,
                month: 3,
                product_match: 'MATCHED' as any,
            },
        } as any;

        // Mock callback function
        mockCallback = jest.fn();

        // Default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((obj) => obj);
        
        // Mock prisma client enums
        mockPrismaClient.AdvertisementStatus = {
            NEEDS_REVIEW: 'NEEDS_REVIEW',
            APPROVED: 'APPROVED',
            REJECTED: 'REJECTED',
        } as any;
    });

    describe('Successful Operations', () => {
        it('should successfully export advertisements to Excel and send email', async () => {
            // Arrange
            const mockAdvertisements = [
                {
                    id: 'ad-001',
                    title: 'Spring Sale 2024',
                    advertisement_type: 'BANNER',
                    start_date: new Date('2024-03-01T00:00:00Z'),
                    end_date: new Date('2024-03-31T23:59:59Z'),
                    Retailer: {
                        retailer_name: 'SuperMart',
                    },
                },
                {
                    id: 'ad-002',
                    title: 'Electronics Clearance',
                    advertisement_type: 'POPUP',
                    start_date: new Date('2024-03-15T00:00:00Z'),
                    end_date: new Date('2024-03-25T23:59:59Z'),
                    Retailer: {
                        retailer_name: 'TechStore',
                    },
                },
            ];

            const mockBuffer = Buffer.from('excel-content');
            const mockFileName = 'advertisements_report_2024_03_15.xlsx';

            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 2,
            });
            (generateExcelSheet as jest.Mock).mockResolvedValue(mockBuffer);
            (generateFileName as jest.Mock).mockResolvedValue(mockFileName);
            (sendEmail as jest.Mock).mockResolvedValue(undefined);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(mockGetAllAdvertisements).toHaveBeenCalledWith(
                undefined,
                undefined,
                'retailer-123',
                'BANNER',
                2024,
                3,
                'MATCHED'
            );

            const expectedData = [
                {
                    id: 'ad-001',
                    title: 'Spring Sale 2024',
                    retailer_name: 'SuperMart',
                    advertisement_type: 'BANNER',
                    start_date: '2024-03-01',
                    end_date: '2024-03-31',
                    status: 'NEEDS_REVIEW',
                    product_match: 'IN_PROGRESS',
                },
                {
                    id: 'ad-002',
                    title: 'Electronics Clearance',
                    retailer_name: 'TechStore',
                    advertisement_type: 'POPUP',
                    start_date: '2024-03-15',
                    end_date: '2024-03-25',
                    status: 'NEEDS_REVIEW',
                    product_match: 'IN_PROGRESS',
                },
            ];

            expect(generateExcelSheet).toHaveBeenCalledWith(
                expectedData,
                'ADVERTISEMENT'
            );

            expect(generateFileName).toHaveBeenCalledWith(
                'ADVERTISEMENT',
                'retailer-123'
            );

            expect(sendEmail).toHaveBeenCalledWith(
                'admin@company.com',
                {
                    subject: 'Advertisement Report',
                    text: 'Dear Admin,\n\nPlease find attached report as per your request',
                },
                {
                    buffer: mockBuffer,
                    fileName: mockFileName,
                }
            );

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Email sent successfully',
                status: status.OK,
            });
        });

        it('should successfully handle empty advertisements list', async () => {
            // Arrange
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: [],
                totalCount: 0,
            });
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('empty-excel'));
            (generateFileName as jest.Mock).mockResolvedValue('empty_report.xlsx');
            (sendEmail as jest.Mock).mockResolvedValue(undefined);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            expect(generateExcelSheet).toHaveBeenCalledWith(
                [],
                'ADVERTISEMENT'
            );

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Email sent successfully',
                status: status.OK,
            });
        });

        it('should properly clean request fields using utilFns.removeEmptyFields', async () => {
            // Arrange
            const requestWithEmptyFields = {
                email: 'admin@company.com',
                retailer_id: 'retailer-123',
                advertisement_type: 'BANNER',
                year: 2024,
                month: 3,
                product_match: 'MATCHED',
                empty_field: '',
                null_field: null,
            };

            const cleanedRequest = {
                email: 'admin@company.com',
                retailer_id: 'retailer-123',
                advertisement_type: 'BANNER',
                year: 2024,
                month: 3,
                product_match: 'MATCHED',
            };

            mockCall.request = requestWithEmptyFields as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);
            
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: [],
                totalCount: 0,
            });
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('test'));
            (generateFileName as jest.Mock).mockResolvedValue('test.xlsx');
            (sendEmail as jest.Mock).mockResolvedValue(undefined);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(mockGetAllAdvertisements).toHaveBeenCalledWith(
                undefined,
                undefined,
                'retailer-123',
                'BANNER',
                2024,
                3,
                'MATCHED'
            );
        });
    });

    describe('Parameter Handling', () => {
        it('should handle request with minimal parameters', async () => {
            // Arrange
            const minimalRequest = {
                email: 'user@company.com',
            };

            mockCall.request = minimalRequest as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(minimalRequest);
            
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: [],
                totalCount: 0,
            });
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('test'));
            (generateFileName as jest.Mock).mockResolvedValue('test.xlsx');
            (sendEmail as jest.Mock).mockResolvedValue(undefined);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            expect(mockGetAllAdvertisements).toHaveBeenCalledWith(
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined
            );
        });

        it('should handle request with specific filters', async () => {
            // Arrange
            const filteredRequest = {
                email: 'manager@company.com',
                retailer_id: 'retailer-456',
                advertisement_type: 'VIDEO',
                year: 2023,
                month: 12,
                product_match: 'NOT_MATCHED',
            };

            mockCall.request = filteredRequest as any;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(filteredRequest);
            
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: [],
                totalCount: 0,
            });
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('test'));
            (generateFileName as jest.Mock).mockResolvedValue('test.xlsx');
            (sendEmail as jest.Mock).mockResolvedValue(undefined);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            expect(mockGetAllAdvertisements).toHaveBeenCalledWith(
                undefined,
                undefined,
                'retailer-456',
                'VIDEO',
                2023,
                12,
                'NOT_MATCHED'
            );
        });
    });

    describe('Data Transformation', () => {
        it('should correctly transform advertisement data for Excel export', async () => {
            // Arrange
            const mockAdvertisements = [
                {
                    id: 'ad-special-001',
                    title: 'Holiday Special Offer',
                    advertisement_type: 'EMAIL',
                    start_date: new Date('2024-12-01T08:30:00Z'),
                    end_date: new Date('2024-12-25T18:45:00Z'),
                    Retailer: {
                        retailer_name: 'Holiday Store Inc.',
                    },
                },
            ];

            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 1,
            });
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('test'));
            (generateFileName as jest.Mock).mockResolvedValue('test.xlsx');
            (sendEmail as jest.Mock).mockResolvedValue(undefined);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            const expectedTransformedData = [
                {
                    id: 'ad-special-001',
                    title: 'Holiday Special Offer',
                    retailer_name: 'Holiday Store Inc.',
                    advertisement_type: 'EMAIL',
                    start_date: '2024-12-01',
                    end_date: '2024-12-25',
                    status: 'NEEDS_REVIEW',
                    product_match: 'IN_PROGRESS',
                },
            ];

            expect(generateExcelSheet).toHaveBeenCalledWith(
                expectedTransformedData,
                'ADVERTISEMENT'
            );
        });

        it('should handle dates correctly in transformation', async () => {
            // Arrange
            const mockAdvertisements = [
                {
                    id: 'ad-date-test',
                    title: 'Date Test Ad',
                    advertisement_type: 'BANNER',
                    start_date: new Date('2024-01-01T00:00:00.000Z'),
                    end_date: new Date('2024-12-31T23:59:59.999Z'),
                    Retailer: {
                        retailer_name: 'Date Test Store',
                    },
                },
            ];

            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 1,
            });
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('test'));
            (generateFileName as jest.Mock).mockResolvedValue('test.xlsx');
            (sendEmail as jest.Mock).mockResolvedValue(undefined);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            const callArgs = (generateExcelSheet as jest.Mock).mock.calls[0][0];
            expect(callArgs[0].start_date).toBe('2024-01-01');
            expect(callArgs[0].end_date).toBe('2024-12-31');
        });

        it('should set default status and product_match values', async () => {
            // Arrange
            const mockAdvertisements = [
                {
                    id: 'ad-defaults',
                    title: 'Default Values Test',
                    advertisement_type: 'POPUP',
                    start_date: new Date('2024-06-15T12:00:00Z'),
                    end_date: new Date('2024-06-20T12:00:00Z'),
                    Retailer: {
                        retailer_name: 'Test Retailer',
                    },
                },
            ];

            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 1,
            });
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('test'));
            (generateFileName as jest.Mock).mockResolvedValue('test.xlsx');
            (sendEmail as jest.Mock).mockResolvedValue(undefined);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            const callArgs = (generateExcelSheet as jest.Mock).mock.calls[0][0];
            expect(callArgs[0].status).toBe('NEEDS_REVIEW');
            expect(callArgs[0].product_match).toBe('IN_PROGRESS');
        });
    });

    describe('Email Functionality', () => {
        it('should send email with correct subject and content', async () => {
            // Arrange
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: [],
                totalCount: 0,
            });
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('test-buffer'));
            (generateFileName as jest.Mock).mockResolvedValue('custom_filename.xlsx');
            (sendEmail as jest.Mock).mockResolvedValue(undefined);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            expect(sendEmail).toHaveBeenCalledWith(
                'admin@company.com',
                {
                    subject: 'Advertisement Report',
                    text: 'Dear Admin,\n\nPlease find attached report as per your request',
                },
                {
                    buffer: Buffer.from('test-buffer'),
                    fileName: 'custom_filename.xlsx',
                }
            );
        });

        it('should use generated filename and buffer for email attachment', async () => {
            // Arrange
            const customBuffer = Buffer.from('custom-excel-data-123');
            const customFileName = 'advertisements_custom_2024_report.xlsx';

            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: [],
                totalCount: 0,
            });
            (generateExcelSheet as jest.Mock).mockResolvedValue(customBuffer);
            (generateFileName as jest.Mock).mockResolvedValue(customFileName);
            (sendEmail as jest.Mock).mockResolvedValue(undefined);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            expect(generateFileName).toHaveBeenCalledWith(
                'ADVERTISEMENT',
                'retailer-123'
            );

            const emailCallArgs = (sendEmail as jest.Mock).mock.calls[0];
            expect(emailCallArgs[2].buffer).toBe(customBuffer);
            expect(emailCallArgs[2].fileName).toBe(customFileName);
        });
    });

    describe('Error Handling', () => {
        it('should handle getAllAdvertisements service error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            mockGetAllAdvertisements.mockRejectedValue(mockError);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle generateExcelSheet error', async () => {
            // Arrange
            const mockError = new Error('Excel generation failed');
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: [],
                totalCount: 0,
            });
            (generateExcelSheet as jest.Mock).mockRejectedValue(mockError);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle generateFileName error', async () => {
            // Arrange
            const mockError = new Error('Filename generation failed');
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: [],
                totalCount: 0,
            });
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('test'));
            (generateFileName as jest.Mock).mockRejectedValue(mockError);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle sendEmail error', async () => {
            // Arrange
            const mockError = new Error('Email sending failed');
            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: [],
                totalCount: 0,
            });
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('test'));
            (generateFileName as jest.Mock).mockResolvedValue('test.xlsx');
            (sendEmail as jest.Mock).mockRejectedValue(mockError);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle utilFns.removeEmptyFields error', async () => {
            // Arrange
            const mockError = new Error('Field removal failed');
            (utilFns.removeEmptyFields as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle data transformation error', async () => {
            // Arrange
            const mockMalformedAdvertisements = [
                {
                    id: 'ad-001',
                    title: 'Test Ad',
                    advertisement_type: 'BANNER',
                    start_date: null, // This will cause error during transformation
                    end_date: new Date('2024-03-31T23:59:59Z'),
                    Retailer: {
                        retailer_name: 'Test Store',
                    },
                },
            ];

            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockMalformedAdvertisements,
                totalCount: 1,
            });

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something went wrong',
                status: status.INTERNAL,
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle advertisements with special characters in titles', async () => {
            // Arrange
            const mockAdvertisements = [
                {
                    id: 'ad-special-chars',
                    title: 'Special Deal! 50% Off & Free Shipping "Today Only" 🎉',
                    advertisement_type: 'EMAIL',
                    start_date: new Date('2024-03-01T00:00:00Z'),
                    end_date: new Date('2024-03-01T23:59:59Z'),
                    Retailer: {
                        retailer_name: 'Special Chars Store & Co.',
                    },
                },
            ];

            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 1,
            });
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('test'));
            (generateFileName as jest.Mock).mockResolvedValue('test.xlsx');
            (sendEmail as jest.Mock).mockResolvedValue(undefined);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            const callArgs = (generateExcelSheet as jest.Mock).mock.calls[0][0];
            expect(callArgs[0].title).toBe('Special Deal! 50% Off & Free Shipping "Today Only" 🎉');
            expect(callArgs[0].retailer_name).toBe('Special Chars Store & Co.');
        });

        it('should handle large number of advertisements', async () => {
            // Arrange
            const mockAdvertisements = Array.from({ length: 1000 }, (_, index) => ({
                id: `ad-${index.toString().padStart(4, '0')}`,
                title: `Advertisement ${index + 1}`,
                advertisement_type: 'BANNER',
                start_date: new Date('2024-01-01T00:00:00Z'),
                end_date: new Date('2024-12-31T23:59:59Z'),
                Retailer: {
                    retailer_name: `Retailer ${index + 1}`,
                },
            }));

            mockGetAllAdvertisements.mockResolvedValue({
                advertisements: mockAdvertisements,
                totalCount: 1000,
            });
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('large-excel'));
            (generateFileName as jest.Mock).mockResolvedValue('large_report.xlsx');
            (sendEmail as jest.Mock).mockResolvedValue(undefined);

            // Act
            await exportToExcelAdvertisements(mockCall, mockCallback);

            // Assert
            const callArgs = (generateExcelSheet as jest.Mock).mock.calls[0][0];
            expect(callArgs).toHaveLength(1000);
            expect(callArgs[0].id).toBe('ad-0000');
            expect(callArgs[999].id).toBe('ad-0999');
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Email sent successfully',
                status: status.OK,
            });
        });

        it('should handle different email formats', async () => {
            // Arrange
            const emailFormats = [
                'simple@example.com',
                'user.name+tag@domain.co.uk',
                'user123@sub.domain-name.org',
            ];

            for (const email of emailFormats) {
                jest.clearAllMocks();
                mockCall.request.email = email;
                
                mockGetAllAdvertisements.mockResolvedValue({
                    advertisements: [],
                    totalCount: 0,
                });
                (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('test'));
                (generateFileName as jest.Mock).mockResolvedValue('test.xlsx');
                (sendEmail as jest.Mock).mockResolvedValue(undefined);

                // Act
                await exportToExcelAdvertisements(mockCall, mockCallback);

                // Assert
                expect(sendEmail).toHaveBeenCalledWith(
                    email,
                    expect.any(Object),
                    expect.any(Object)
                );
            }
        });
    });
});