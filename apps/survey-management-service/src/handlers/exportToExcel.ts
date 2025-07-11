import {
    errorMessage,
    ExcelReportType,
    generateExcelSheet,
    generateFileName,
    ReportType,
    responseMessage,
    sendEmail,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    ExportToExcelSurveyRequest__Output,
    ExportToExcelSurveyResponse,
    ExportToExcelSurveyResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { ExportToExcelType } from '../validations';
import { findQuestionReport } from '../services/model.service';

export const ExportToExcel = async (
    call: CustomServerUnaryCall<
        ExportToExcelSurveyRequest__Output,
        ExportToExcelSurveyResponse
    >,
    callback: sendUnaryData<ExportToExcelSurveyResponse__Output>,
) => {
    try {
        const { email, id } = call.request as ExportToExcelType;

        const data = await findQuestionReport(id);

        if (data.length === 0) {
            return callback(null, {
                message: errorMessage.SURVEY.QUESTION_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const fileName = await generateFileName(ReportType.SURVEY);

        const buffer = await generateExcelSheet(
            data,
            ExcelReportType.QUESTION_REPORT,
        );

        const emailContent = {
            subject: 'Survey-Report',
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
