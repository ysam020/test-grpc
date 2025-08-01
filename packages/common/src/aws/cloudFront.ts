import { logger } from '@atc/logger';
import {
    CloudFrontClient,
    CreateInvalidationCommand,
    CreateInvalidationCommandInput,
} from '@aws-sdk/client-cloudfront';

const invalidateCloudFrontCache = async (objectPath: string) => {
    try {
        const cloudFrontClient = new CloudFrontClient({
            region: process.env.S3_REGION,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID!,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
            },
        });

        const params: CreateInvalidationCommandInput = {
            DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
            InvalidationBatch: {
                CallerReference: `invalidate-${Date.now()}`,
                Paths: {
                    Quantity: 1,
                    Items: [`/${objectPath}`],
                },
            },
        };

        const invalidationCommand = new CreateInvalidationCommand(params);

        return await cloudFrontClient.send(invalidationCommand);
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

export { invalidateCloudFrontCache };
