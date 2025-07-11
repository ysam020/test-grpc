import {
    errorMessage,
    ExcelReportType,
    generateExcelSheet,
    generateFileName,
    ReportType,
    responseMessage,
    sendEmail,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { ExportToExcelType } from '../validations';
import {
    findAllSamplesReport,
    findQuestionReport,
    findSampleReport,
} from '../services/model.services';
import {
    ExportToExcelRequest__Output,
    ExportToExcelResponse,
    ExportToExcelResponse__Output,
} from '@atc/proto';

export const ExportToExcel = async (
    call: CustomServerUnaryCall<
        ExportToExcelRequest__Output,
        ExportToExcelResponse
    >,
    callback: sendUnaryData<ExportToExcelResponse__Output>,
) => {
    try {
        const { type, id, start_date, end_date, email } =
            utilFns.removeEmptyFields(call.request) as ExportToExcelType;

        const fileName = await generateFileName(
            ReportType.SAMPLE,
            start_date ? start_date : undefined,
            end_date ? end_date : undefined,
        );

        let data: any[] = [];

        if (type === ExcelReportType.ALL_SAMPLE_REPORT) {
            data = await findAllSamplesReport({
                start_date,
                end_date,
            });

            if (data.length === 0) {
                return callback(null, {
                    message: responseMessage.SAMPLE.RETRIEVED,
                    status: status.OK,
                });
            }
        }

        if (type === ExcelReportType.SAMPLE_REPORT) {
            data = await findSampleReport(id!);

            if (data.length === 0) {
                return callback(null, {
                    message: errorMessage.SAMPLE.NOT_FOUND,
                    status: status.NOT_FOUND,
                });
            }
        }

        if (type === ExcelReportType.QUESTION_REPORT) {
            data = await findQuestionReport(id);

            if (data.length === 0) {
                return callback(null, {
                    message: errorMessage.SAMPLE.QUESTION_NOT_FOUND,
                    status: status.NOT_FOUND,
                });
            }
        }

        const buffer = await generateExcelSheet(data, type);

        const emailContent = {
            subject: 'Sample-Report',
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
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
