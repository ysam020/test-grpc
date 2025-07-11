import {
    errorMessage,
    ExcelReportType,
    generateExcelSheet,
    generateFileName,
    ReportType,
    responseMessage,
    sendEmail,
} from '@atc/common';
import { logger } from '@atc/logger';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import {
    getRetailerList,
    getAllCategoryList,
    getPotentialMatchList,
    getProductListWithRetailerCode,
    getAllSuppliers,
    getBrandList,
} from '../services/model-services';
import {
    ExportToExcelForRetailerListRequest__Output,
    ExportToExcelForRetailerListResponse,
    ExportToExcelForRetailerListResponse__Output,
} from '@atc/proto';
import { ExportToExcelType } from '../validations';

export const ExportToExcel = async (
    call: ServerUnaryCall<
        ExportToExcelForRetailerListRequest__Output,
        ExportToExcelForRetailerListResponse
    >,
    callback: sendUnaryData<ExportToExcelForRetailerListResponse__Output>,
) => {
    try {
        const { email, type, keyword, sort_by_order } =
            call.request as ExportToExcelType;

        let fileName = '';
        let data: any[] = [];

        if (type === ExcelReportType.RETAILER_LIST) {
            fileName = await generateFileName(ReportType.RETAILER);
            const { retailers } = await getRetailerList(keyword, sort_by_order);

            data = retailers;

            if (data.length === 0) {
                return callback(null, {
                    message: errorMessage.PRODUCT.RETAILER_NOT_FOUND,
                    status: status.NOT_FOUND,
                });
            }
        } else if (type === ExcelReportType.CATEGORY_LIST) {
            fileName = await generateFileName(ReportType.CATEGORY);
            const { categories } = await getAllCategoryList(
                keyword,
                sort_by_order,
            );

            data = categories;

            if (data.length === 0) {
                return callback(null, {
                    message: errorMessage.PRODUCT.CATEGORY_NOT_FOUND,
                    status: status.NOT_FOUND,
                });
            }
        } else if (type === ExcelReportType.NEW_PRODUCT_MATCH) {
            fileName = await generateFileName(ReportType.NEW_PRODUCT_MATCH);
            const { potentialMatchesData } = await getPotentialMatchList(
                keyword,
                sort_by_order,
            );

            data = potentialMatchesData;

            if (data.length === 0) {
                return callback(null, {
                    message: errorMessage.PRODUCT.PRODUCT_NOT_FOUND,
                    status: status.NOT_FOUND,
                });
            }
        } else if (type === ExcelReportType.MASTER_PRODUCT_LIST) {
            fileName = await generateFileName(ReportType.MASTER_PRODUCT_LIST);
            const { products } = await getProductListWithRetailerCode(
                keyword,
                sort_by_order,
            );

            data = products;

            if (data.length === 0) {
                return callback(null, {
                    message: errorMessage.PRODUCT.PRODUCT_NOT_FOUND,
                    status: status.NOT_FOUND,
                });
            }
        } else if (type === ExcelReportType.SUPPLIER_LIST) {
            fileName = await generateFileName(ReportType.SUPPLIER);
            const { suppliers } = await getAllSuppliers(
                undefined,
                undefined,
                keyword,
                sort_by_order,
            );

            data = suppliers;

            if (data.length === 0) {
                return callback(null, {
                    message: errorMessage.SUPPLIER.NOT_FOUND,
                    status: status.NOT_FOUND,
                });
            }
        } else if (type === ExcelReportType.BRAND_LIST) {
            fileName = await generateFileName(ReportType.BRAND);
            const { brands } = await getBrandList(keyword, sort_by_order);

            data = brands;

            if (data.length === 0) {
                return callback(null, {
                    message: errorMessage.BRAND.NOT_FOUND,
                    status: status.NOT_FOUND,
                });
            }
        }

        const buffer = await generateExcelSheet(data, type);

        const emailContent = {
            subject: convertToTitleCase(type),
            text: 'Dear Admin,\n\nPlease find attached report as per your request',
        };

        const excelContent = {
            buffer,
            fileName,
        };

        await sendEmail(email, emailContent, excelContent);

        return callback(null, {
            message: responseMessage.EMAIL.MAIL_SENT,
            status: status.OK,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};

function convertToTitleCase(str: string) {
    return str
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('-');
}
