import { status } from '@grpc/grpc-js';

// Mock business logic dependencies BEFORE importing the handler
jest.mock('@atc/common', () => ({
    errorMessage: {
        PRODUCT_GROUP: {
            NOT_FOUND: 'Product Group Not Found',
        },
        PRODUCT: {
            NOT_FOUND: 'Product Not Found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something Went Wrong',
        },
    },
    responseMessage: {
        EMAIL: {
            MAIL_SENT: 'Mail Sent successfully',
        },
    },
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
    ExcelReportType: {
        PRODUCT_GROUP: 'PRODUCT_GROUP',
    },
    generateExcelSheet: jest.fn(),
    sendEmail: jest.fn(),
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        fatal: jest.fn(),
    },
}));

jest.mock('../../../src/services/model.service', () => ({
    getGroupByID: jest.fn(),
    getProductsByGroupID: jest.fn(),
}));

// Import after mocks
import { exportToExcel } from '../../../src/handlers/exportToExcel';
import {
    getGroupByID,
    getProductsByGroupID,
} from '../../../src/services/model.service';
import { utilFns, generateExcelSheet, sendEmail, ExcelReportType } from '@atc/common';

describe('exportToExcel Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        
        mockCall = {
            request: {
                group_id: 'group-123',
                email: 'admin@test.com',
            },
        };

        // Setup default mock implementations
        (utilFns.removeEmptyFields as jest.Mock).mockImplementation((data) => data);
        
        // Mock current date for consistent testing
        jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:30:00.000Z');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Successful scenarios', () => {
        it('should successfully export products to excel and send email', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-123',
                group_name: 'Test Product Group',
                type: 'STANDARD',
            };

            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Product One',
                            barcode: '1234567890123',
                            pack_size: '500ml',
                            rrp: '10.99',
                            Brand: {
                                brand_name: 'Brand Alpha',
                            },
                            Category: {
                                category_name: 'Beverages',
                            },
                        },
                    },
                    {
                        MasterProduct: {
                            product_name: 'Product Two',
                            barcode: '9876543210987',
                            pack_size: '1L',
                            rrp: '15.50',
                            Brand: {
                                brand_name: 'Brand Beta',
                            },
                            Category: {
                                category_name: 'Food',
                            },
                        },
                    },
                ],
            };

            const mockExcelBuffer = Buffer.from('mock-excel-data');

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(mockExcelBuffer);
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(mockCall.request);
            expect(getGroupByID).toHaveBeenCalledWith('group-123');
            expect(getProductsByGroupID).toHaveBeenCalledWith('group-123');
            
            expect(generateExcelSheet).toHaveBeenCalledWith(
                [
                    {
                        product_name: 'Product One',
                        barcode: '1234567890123',
                        pack_size: '500ml',
                        rrp: 10.99,
                        brand_name: 'Brand Alpha',
                        category_name: 'Beverages',
                    },
                    {
                        product_name: 'Product Two',
                        barcode: '9876543210987',
                        pack_size: '1L',
                        rrp: 15.5,
                        brand_name: 'Brand Beta',
                        category_name: 'Food',
                    },
                ],
                ExcelReportType.PRODUCT_GROUP
            );

            expect(sendEmail).toHaveBeenCalledWith(
                'admin@test.com',
                {
                    subject: 'Product Group Products',
                    text: 'Dear Admin,\n\nPlease find attached report as per your request',
                },
                {
                    buffer: mockExcelBuffer,
                    fileName: 'product-group-Test Product Group-20240115.xlsx',
                }
            );

            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Mail Sent successfully',
                status: status.OK,
            });
        });

        it('should handle single product export', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-single',
                group_name: 'Single Product Group',
            };

            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Single Product',
                            barcode: '1111111111111',
                            pack_size: '250ml',
                            rrp: '5.99',
                            Brand: {
                                brand_name: 'Single Brand',
                            },
                            Category: {
                                category_name: 'Single Category',
                            },
                        },
                    },
                ],
            };

            const mockExcelBuffer = Buffer.from('single-product-excel');

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(mockExcelBuffer);
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(generateExcelSheet).toHaveBeenCalledWith(
                [
                    {
                        product_name: 'Single Product',
                        barcode: '1111111111111',
                        pack_size: '250ml',
                        rrp: 5.99,
                        brand_name: 'Single Brand',
                        category_name: 'Single Category',
                    },
                ],
                ExcelReportType.PRODUCT_GROUP
            );

            expect(sendEmail).toHaveBeenCalledWith(
                'admin@test.com',
                expect.any(Object),
                expect.objectContaining({
                    fileName: 'product-group-Single Product Group-20240115.xlsx',
                })
            );
        });

        it('should handle group name with special characters in filename', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-special',
                group_name: 'Special@Group#Name$123',
            };

            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Test Product',
                            barcode: '1234567890',
                            pack_size: '500ml',
                            rrp: '10.00',
                            Brand: { brand_name: 'Test Brand' },
                            Category: { category_name: 'Test Category' },
                        },
                    },
                ],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('test'));
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(sendEmail).toHaveBeenCalledWith(
                'admin@test.com',
                expect.any(Object),
                expect.objectContaining({
                    fileName: 'product-group-Special@Group#Name$123-20240115.xlsx',
                })
            );
        });

        it('should call utilFns.removeEmptyFields to clean request data', async () => {
            // Arrange
            const requestWithEmptyFields = {
                group_id: 'group-123',
                email: 'admin@test.com',
                extra_field: '',
                another_field: null,
            };

            const cleanedRequest = {
                group_id: 'group-123',
                email: 'admin@test.com',
            };

            mockCall.request = requestWithEmptyFields;
            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);

            const mockProductGroup = { id: 'group-123', group_name: 'Clean Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Clean Product',
                            barcode: '1234567890',
                            pack_size: '500ml',
                            rrp: '10.00',
                            Brand: { brand_name: 'Clean Brand' },
                            Category: { category_name: 'Clean Category' },
                        },
                    },
                ],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('clean'));
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(utilFns.removeEmptyFields).toHaveBeenCalledWith(requestWithEmptyFields);
            expect(getGroupByID).toHaveBeenCalledWith('group-123');
        });

        it('should handle different email addresses', async () => {
            // Arrange
            const customEmailCall = {
                request: {
                    group_id: 'group-123',
                    email: 'custom.user+test@example.org',
                },
            };

            const mockProductGroup = { id: 'group-123', group_name: 'Email Test Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Email Product',
                            barcode: '1234567890',
                            pack_size: '500ml',
                            rrp: '10.00',
                            Brand: { brand_name: 'Email Brand' },
                            Category: { category_name: 'Email Category' },
                        },
                    },
                ],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('email-test'));
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(customEmailCall, mockCallback);

            // Assert
            expect(sendEmail).toHaveBeenCalledWith(
                'custom.user+test@example.org',
                expect.any(Object),
                expect.any(Object)
            );
        });
    });

    describe('Error scenarios', () => {
        it('should return NOT_FOUND when product group does not exist', async () => {
            // Arrange
            (getGroupByID as jest.Mock).mockResolvedValue(null);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(getGroupByID).toHaveBeenCalledWith('group-123');
            expect(getProductsByGroupID).not.toHaveBeenCalled();
            expect(generateExcelSheet).not.toHaveBeenCalled();
            expect(sendEmail).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should return NOT_FOUND when no products are found', async () => {
            // Arrange
            const mockProductGroup = {
                id: 'group-123',
                group_name: 'Empty Group',
            };

            const mockEmptyProductsResponse = {
                products: [],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockEmptyProductsResponse);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(getProductsByGroupID).toHaveBeenCalledWith('group-123');
            expect(generateExcelSheet).not.toHaveBeenCalled();
            expect(sendEmail).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should return INTERNAL error when getGroupByID throws an error', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            (getGroupByID as jest.Mock).mockRejectedValue(mockError);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(getProductsByGroupID).not.toHaveBeenCalled();
            expect(generateExcelSheet).not.toHaveBeenCalled();
            expect(sendEmail).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should return INTERNAL error when getProductsByGroupID throws an error', async () => {
            // Arrange
            const mockProductGroup = { id: 'group-123', group_name: 'Test Group' };
            const mockError = new Error('Product fetch failed');

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockRejectedValue(mockError);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(generateExcelSheet).not.toHaveBeenCalled();
            expect(sendEmail).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should return INTERNAL error when generateExcelSheet throws an error', async () => {
            // Arrange
            const mockProductGroup = { id: 'group-123', group_name: 'Test Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Test Product',
                            barcode: '1234567890',
                            pack_size: '500ml',
                            rrp: '10.00',
                            Brand: { brand_name: 'Test Brand' },
                            Category: { category_name: 'Test Category' },
                        },
                    },
                ],
            };
            const mockError = new Error('Excel generation failed');

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockRejectedValue(mockError);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(sendEmail).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should return INTERNAL error when sendEmail throws an error', async () => {
            // Arrange
            const mockProductGroup = { id: 'group-123', group_name: 'Test Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Test Product',
                            barcode: '1234567890',
                            pack_size: '500ml',
                            rrp: '10.00',
                            Brand: { brand_name: 'Test Brand' },
                            Category: { category_name: 'Test Category' },
                        },
                    },
                ],
            };
            const mockExcelBuffer = Buffer.from('test-excel');
            const mockError = new Error('Email sending failed');

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(mockExcelBuffer);
            (sendEmail as jest.Mock).mockRejectedValue(mockError);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should handle utilFns.removeEmptyFields throwing an error', async () => {
            // Arrange
            const mockError = new Error('removeEmptyFields failed');
            (utilFns.removeEmptyFields as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(getGroupByID).not.toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });
    });

    describe('Data transformation', () => {
        it('should correctly transform product data for Excel export', async () => {
            // Arrange
            const mockProductGroup = { id: 'group-transform', group_name: 'Transform Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Complex Product Name',
                            barcode: '9876543210123',
                            pack_size: '2.5L',
                            rrp: '25.75', // String that should be converted to number
                            Brand: {
                                brand_name: 'Premium Brand',
                            },
                            Category: {
                                category_name: 'Luxury Category',
                            },
                        },
                    },
                ],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('transform-test'));
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(generateExcelSheet).toHaveBeenCalledWith(
                [
                    {
                        product_name: 'Complex Product Name',
                        barcode: '9876543210123',
                        pack_size: '2.5L',
                        rrp: 25.75, // Should be converted to number
                        brand_name: 'Premium Brand',
                        category_name: 'Luxury Category',
                    },
                ],
                ExcelReportType.PRODUCT_GROUP
            );
        });

        it('should handle zero and negative RRP values', async () => {
            // Arrange
            const mockProductGroup = { id: 'group-rrp', group_name: 'RRP Test Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Zero RRP Product',
                            barcode: '0000000000000',
                            pack_size: '0ml',
                            rrp: '0.00',
                            Brand: { brand_name: 'Zero Brand' },
                            Category: { category_name: 'Zero Category' },
                        },
                    },
                    {
                        MasterProduct: {
                            product_name: 'Negative RRP Product',
                            barcode: '1111111111111',
                            pack_size: '100ml',
                            rrp: '-5.50',
                            Brand: { brand_name: 'Negative Brand' },
                            Category: { category_name: 'Negative Category' },
                        },
                    },
                ],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('rrp-test'));
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(generateExcelSheet).toHaveBeenCalledWith(
                [
                    {
                        product_name: 'Zero RRP Product',
                        barcode: '0000000000000',
                        pack_size: '0ml',
                        rrp: 0,
                        brand_name: 'Zero Brand',
                        category_name: 'Zero Category',
                    },
                    {
                        product_name: 'Negative RRP Product',
                        barcode: '1111111111111',
                        pack_size: '100ml',
                        rrp: -5.5,
                        brand_name: 'Negative Brand',
                        category_name: 'Negative Category',
                    },
                ],
                ExcelReportType.PRODUCT_GROUP
            );
        });

        it('should handle missing or null product fields', async () => {
            // Arrange
            const mockProductGroup = { id: 'group-missing', group_name: 'Missing Fields Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Incomplete Product',
                            barcode: null,
                            pack_size: undefined,
                            rrp: '',
                            Brand: {
                                brand_name: 'Incomplete Brand',
                            },
                            Category: {
                                category_name: null,
                            },
                        },
                    },
                ],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('missing-test'));
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(generateExcelSheet).toHaveBeenCalledWith(
                [
                    {
                        product_name: 'Incomplete Product',
                        barcode: null,
                        pack_size: undefined,
                        rrp: 0, // Number('') results in 0, not NaN
                        brand_name: 'Incomplete Brand',
                        category_name: null,
                    },
                ],
                ExcelReportType.PRODUCT_GROUP
            );
        });
    });

    describe('Excel file generation', () => {
        it('should use correct ExcelReportType', async () => {
            // Arrange
            const mockProductGroup = { id: 'group-type', group_name: 'Type Test Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Type Test Product',
                            barcode: '1234567890',
                            pack_size: '500ml',
                            rrp: '10.00',
                            Brand: { brand_name: 'Type Brand' },
                            Category: { category_name: 'Type Category' },
                        },
                    },
                ],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('type-test'));
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(generateExcelSheet).toHaveBeenCalledWith(
                expect.any(Array),
                ExcelReportType.PRODUCT_GROUP
            );
        });

        it('should generate correct filename with date', async () => {
            // Arrange
            const mockProductGroup = { id: 'group-filename', group_name: 'Filename Test Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Filename Product',
                            barcode: '1234567890',
                            pack_size: '500ml',
                            rrp: '10.00',
                            Brand: { brand_name: 'Filename Brand' },
                            Category: { category_name: 'Filename Category' },
                        },
                    },
                ],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('filename-test'));
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(sendEmail).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                expect.objectContaining({
                    fileName: 'product-group-Filename Test Group-20240115.xlsx',
                })
            );
        });
    });

    describe('Email content', () => {
        it('should use correct email subject and content', async () => {
            // Arrange
            const mockProductGroup = { id: 'group-email', group_name: 'Email Test Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Email Product',
                            barcode: '1234567890',
                            pack_size: '500ml',
                            rrp: '10.00',
                            Brand: { brand_name: 'Email Brand' },
                            Category: { category_name: 'Email Category' },
                        },
                    },
                ],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('email-test'));
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(sendEmail).toHaveBeenCalledWith(
                'admin@test.com',
                {
                    subject: 'Product Group Products',
                    text: 'Dear Admin,\n\nPlease find attached report as per your request',
                },
                expect.any(Object)
            );
        });

        it('should pass correct buffer and filename to email', async () => {
            // Arrange
            const mockProductGroup = { id: 'group-attachment', group_name: 'Attachment Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Attachment Product',
                            barcode: '1234567890',
                            pack_size: '500ml',
                            rrp: '10.00',
                            Brand: { brand_name: 'Attachment Brand' },
                            Category: { category_name: 'Attachment Category' },
                        },
                    },
                ],
            };

            const mockExcelBuffer = Buffer.from('attachment-excel-data');

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(mockExcelBuffer);
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(sendEmail).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                {
                    buffer: mockExcelBuffer,
                    fileName: 'product-group-Attachment Group-20240115.xlsx',
                }
            );
        });
    });

    describe('Edge cases', () => {
        it('should handle field cleaning that removes required fields', async () => {
            // Arrange
            const cleanedRequest = {
                // group_id and email removed by removeEmptyFields
            };

            (utilFns.removeEmptyFields as jest.Mock).mockReturnValue(cleanedRequest);
            (getGroupByID as jest.Mock).mockResolvedValue(null);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(getGroupByID).toHaveBeenCalledWith(undefined);
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Product Group Not Found',
                status: status.NOT_FOUND,
            });
        });

        it('should handle large product datasets', async () => {
            // Arrange
            const mockProductGroup = { id: 'group-large', group_name: 'Large Dataset Group' };
            
            // Create 100 mock products
            const mockProducts = Array.from({ length: 100 }, (_, index) => ({
                MasterProduct: {
                    product_name: `Product ${index + 1}`,
                    barcode: `${String(index + 1).padStart(13, '0')}`,
                    pack_size: `${(index + 1) * 100}ml`,
                    rrp: `${(index + 1) * 1.5}`,
                    Brand: {
                        brand_name: `Brand ${Math.floor(index / 10) + 1}`,
                    },
                    Category: {
                        category_name: `Category ${Math.floor(index / 20) + 1}`,
                    },
                },
            }));

            const mockProductsResponse = { products: mockProducts };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('large-dataset'));
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(generateExcelSheet).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        product_name: 'Product 1',
                        rrp: 1.5,
                    }),
                    expect.objectContaining({
                        product_name: 'Product 100',
                        rrp: 150,
                    }),
                ]),
                ExcelReportType.PRODUCT_GROUP
            );
            expect(generateExcelSheet.mock.calls[0][0]).toHaveLength(100);
        });

        it('should handle products with unicode characters', async () => {
            // Arrange
            const mockProductGroup = { id: 'group-unicode', group_name: 'Unicode Test Group 测试组' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Produit français café',
                            barcode: '1234567890123',
                            pack_size: '500ml',
                            rrp: '12.50',
                            Brand: {
                                brand_name: 'Marque française',
                            },
                            Category: {
                                category_name: 'Catégorie spéciale',
                            },
                        },
                    },
                    {
                        MasterProduct: {
                            product_name: '日本の製品',
                            barcode: '9876543210987',
                            pack_size: '250ml',
                            rrp: '8.75',
                            Brand: {
                                brand_name: 'ブランド名',
                            },
                            Category: {
                                category_name: 'カテゴリー',
                            },
                        },
                    },
                ],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('unicode-test'));
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(generateExcelSheet).toHaveBeenCalledWith(
                [
                    {
                        product_name: 'Produit français café',
                        barcode: '1234567890123',
                        pack_size: '500ml',
                        rrp: 12.5,
                        brand_name: 'Marque française',
                        category_name: 'Catégorie spéciale',
                    },
                    {
                        product_name: '日本の製品',
                        barcode: '9876543210987',
                        pack_size: '250ml',
                        rrp: 8.75,
                        brand_name: 'ブランド名',
                        category_name: 'カテゴリー',
                    },
                ],
                ExcelReportType.PRODUCT_GROUP
            );

            expect(sendEmail).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                expect.objectContaining({
                    fileName: 'product-group-Unicode Test Group 测试组-20240115.xlsx',
                })
            );
        });

        it('should handle different date formats in filename generation', async () => {
            // Arrange
            const mockProductGroup = { id: 'group-date', group_name: 'Date Test Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Date Product',
                            barcode: '1234567890',
                            pack_size: '500ml',
                            rrp: '10.00',
                            Brand: { brand_name: 'Date Brand' },
                            Category: { category_name: 'Date Category' },
                        },
                    },
                ],
            };

            // Mock different date
            jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-12-25T15:45:30.123Z');

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('date-test'));
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert
            expect(sendEmail).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                expect.objectContaining({
                    fileName: 'product-group-Date Test Group-20241225.xlsx',
                })
            );
        });
    });

    describe('Service integration', () => {
        it('should verify correct service call sequence', async () => {
            // Arrange
            const mockProductGroup = { id: 'group-sequence', group_name: 'Sequence Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Sequence Product',
                            barcode: '1234567890',
                            pack_size: '500ml',
                            rrp: '10.00',
                            Brand: { brand_name: 'Sequence Brand' },
                            Category: { category_name: 'Sequence Category' },
                        },
                    },
                ],
            };

            let callOrder = 0;
            const getGroupSpy = jest.fn().mockImplementation(async () => {
                getGroupSpy.callOrder = ++callOrder;
                return mockProductGroup;
            });
            const getProductsSpy = jest.fn().mockImplementation(async () => {
                getProductsSpy.callOrder = ++callOrder;
                return mockProductsResponse;
            });
            const generateExcelSpy = jest.fn().mockImplementation(async () => {
                generateExcelSpy.callOrder = ++callOrder;
                return Buffer.from('sequence-test');
            });
            const sendEmailSpy = jest.fn().mockImplementation(async () => {
                sendEmailSpy.callOrder = ++callOrder;
                return true;
            });

            (getGroupByID as jest.Mock).mockImplementation(getGroupSpy);
            (getProductsByGroupID as jest.Mock).mockImplementation(getProductsSpy);
            (generateExcelSheet as jest.Mock).mockImplementation(generateExcelSpy);
            (sendEmail as jest.Mock).mockImplementation(sendEmailSpy);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert - Verify call order
            expect(getGroupSpy.callOrder).toBeLessThan(getProductsSpy.callOrder);
            expect(getProductsSpy.callOrder).toBeLessThan(generateExcelSpy.callOrder);
            expect(generateExcelSpy.callOrder).toBeLessThan(sendEmailSpy.callOrder);
        });

        it('should verify group ID consistency across service calls', async () => {
            // Arrange
            const testGroupId = 'consistent-group-id-test';
            const consistentCall = {
                request: {
                    group_id: testGroupId,
                    email: 'consistency@test.com',
                },
            };

            const mockProductGroup = { id: testGroupId, group_name: 'Consistency Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Consistency Product',
                            barcode: '1234567890',
                            pack_size: '500ml',
                            rrp: '10.00',
                            Brand: { brand_name: 'Consistency Brand' },
                            Category: { category_name: 'Consistency Category' },
                        },
                    },
                ],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('consistency-test'));
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(consistentCall, mockCallback);

            // Assert - Same group ID should be used across service calls
            expect(getGroupByID).toHaveBeenCalledWith(testGroupId);
            expect(getProductsByGroupID).toHaveBeenCalledWith(testGroupId);
        });

        it('should handle partial service failures gracefully', async () => {
            // Arrange - Excel generation succeeds but email sending fails
            const mockProductGroup = { id: 'group-partial', group_name: 'Partial Failure Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Partial Product',
                            barcode: '1234567890',
                            pack_size: '500ml',
                            rrp: '10.00',
                            Brand: { brand_name: 'Partial Brand' },
                            Category: { category_name: 'Partial Category' },
                        },
                    },
                ],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('partial-test'));
            (sendEmail as jest.Mock).mockRejectedValue(new Error('Email service unavailable'));

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert - Should still process through Excel generation
            expect(generateExcelSheet).toHaveBeenCalled();
            expect(sendEmail).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(null, {
                message: 'Something Went Wrong',
                status: status.INTERNAL,
            });
        });

        it('should validate all service dependencies are called', async () => {
            // Arrange
            const mockProductGroup = { id: 'group-dependencies', group_name: 'Dependencies Group' };
            const mockProductsResponse = {
                products: [
                    {
                        MasterProduct: {
                            product_name: 'Dependencies Product',
                            barcode: '1234567890',
                            pack_size: '500ml',
                            rrp: '10.00',
                            Brand: { brand_name: 'Dependencies Brand' },
                            Category: { category_name: 'Dependencies Category' },
                        },
                    },
                ],
            };

            (getGroupByID as jest.Mock).mockResolvedValue(mockProductGroup);
            (getProductsByGroupID as jest.Mock).mockResolvedValue(mockProductsResponse);
            (generateExcelSheet as jest.Mock).mockResolvedValue(Buffer.from('dependencies-test'));
            (sendEmail as jest.Mock).mockResolvedValue(true);

            // Act
            await exportToExcel(mockCall, mockCallback);

            // Assert - All services should be called exactly once
            expect(getGroupByID).toHaveBeenCalledTimes(1);
            expect(getProductsByGroupID).toHaveBeenCalledTimes(1);
            expect(generateExcelSheet).toHaveBeenCalledTimes(1);
            expect(sendEmail).toHaveBeenCalledTimes(1);
            expect(utilFns.removeEmptyFields).toHaveBeenCalledTimes(1);
        });
    });
});