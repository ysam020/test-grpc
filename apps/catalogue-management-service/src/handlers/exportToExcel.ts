import {
    errorMessage,
    ExcelReportType,
    generateExcelSheet,
    responseMessage,
    sendEmail,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import {
    DefaultResponse,
    DefaultResponse__Output,
    ExportToExcelSheetRequest__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { exportToExcelType } from '../validations';
import { getGroupByID, getProductsByGroupID } from '../services/model.service';

export const exportToExcel = async (
    call: CustomServerUnaryCall<
        ExportToExcelSheetRequest__Output,
        DefaultResponse
    >,
    callback: sendUnaryData<DefaultResponse__Output>,
) => {
    try {
        const { group_id, email } = utilFns.removeEmptyFields(
            call.request,
        ) as exportToExcelType;

        const productGroup = await getGroupByID(group_id);
        if (!productGroup) {
            return callback(null, {
                message: errorMessage.PRODUCT_GROUP.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const { products } = await getProductsByGroupID(group_id);

        if (products.length === 0) {
            return callback(null, {
                message: errorMessage.PRODUCT.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const data = products.map((product) => ({
            product_name: product.MasterProduct.product_name,
            barcode: product.MasterProduct.barcode,
            pack_size: product.MasterProduct.pack_size,
            rrp: Number(product.MasterProduct.rrp),
            brand_name: product.MasterProduct.Brand.brand_name,
            category_name: product.MasterProduct.Category.category_name,
        }));

        const buffer = await generateExcelSheet(
            data,
            ExcelReportType.PRODUCT_GROUP,
        );

        const emailContent = {
            subject: 'Product Group Products',
            text: 'Dear Admin,\n\nPlease find attached report as per your request',
        };

        const excelContent = {
            buffer,
            fileName: `product-group-${productGroup.group_name}-${new Date().toISOString().replace(/-/g, '').slice(0, 8)}.xlsx`,
        };

        await sendEmail(email, emailContent, excelContent);

        return callback(null, {
            message: responseMessage.EMAIL.MAIL_SENT,
            status: status.OK,
        });
    } catch (error) {
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
