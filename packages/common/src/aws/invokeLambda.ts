import { logger } from '@atc/logger';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
});

export const invokeLambda = async (functionName: string, payload: object) => {
    try {
        const command = new InvokeCommand({
            FunctionName: functionName,
            Payload: JSON.stringify(payload),
            InvocationType: 'Event',
        });

        await lambda.send(command);
    } catch (error) {
        logger.error(error);
        throw error;
    }
};
