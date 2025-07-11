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
import { exportToExcelAdvertisementsType } from '../validations';
import { getAllAdvertisements } from '../services/model.service';
import { prismaClient } from '@atc/db';

export const exportToExcelAdvertisements = async (
    call: CustomServerUnaryCall<
        ExportToExcelAdvertisementsRequest__Output,
        DefaultResponse
    >,
    callback: sendUnaryData<DefaultResponse__Output>,
) => {
    try {
        const {
            email,
            retailer_id,
            advertisement_type,
            year,
            month,
            product_match,
        } = utilFns.removeEmptyFields(
            call.request,
        ) as exportToExcelAdvertisementsType;

        const { advertisements } = await getAllAdvertisements(
            undefined,
            undefined,
            retailer_id,
            advertisement_type,
            year,
            month,
            product_match,
        );

        const data = advertisements.map((advertisement) => ({
            id: advertisement.id,
            title: advertisement.title,
            retailer_name: advertisement.Retailer.retailer_name,
            advertisement_type: advertisement.advertisement_type,
            start_date:
                advertisement.start_date.toISOString().split('T')[0] || '',
            end_date: advertisement.end_date.toISOString().split('T')[0] || '',
            status: prismaClient.AdvertisementStatus.NEEDS_REVIEW,
            product_match: ProductMatch.IN_PROGRESS,
        }));

        const buffer = await generateExcelSheet(
            data,
            ExcelReportType.ADVERTISEMENT,
        );

        const emailContent = {
            subject: 'Advertisement Report',
            text: 'Dear Admin,\n\nPlease find attached report as per your request',
        };

        const excelContent = {
            buffer,
            fileName: await generateFileName(
                ExcelReportType.ADVERTISEMENT,
                retailer_id,
            ),
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
