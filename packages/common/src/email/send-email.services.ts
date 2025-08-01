import nodemailer from 'nodemailer';

import { EmailContent, ExcelContent } from '../types';
import { logger } from '@atc/logger';

async function sendEmail(
    to: string,
    emailContent: EmailContent,
    excelContent?: ExcelContent,
) {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SIB_HOST,
            port: 587,
            secure: false,
            auth: {
                user: process.env.SIB_USER,
                pass: process.env.SIB_PASS,
            },
        });

        let data: any = {
            from: process.env.SIB_SENDER_EMAIL,
            to: to,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html,
        };

        if (excelContent) {
            data = {
                ...data,
                attachments: [
                    {
                        filename: excelContent.fileName,
                        content: excelContent.buffer,
                        contentType:
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    },
                ],
            };
        }

        await transporter.sendMail(data);

        return true;
    } catch (error) {
        logger.error(error);
        return false;
    }
}

export { sendEmail };
