import {
    DeleteObjectCommand,
    DeleteObjectsCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
    S3ClientConfig,
} from '@aws-sdk/client-s3';
import { logger } from '@atc/logger';
import { errorMessage } from '../errorMessage';

function createS3Client(): S3Client {
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    const region = process.env.S3_REGION;

    if (!accessKeyId || !secretAccessKey || !region) {
        throw new Error(errorMessage.OTHER.MISSING_CREDENTIAL);
    }

    const credentials = {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    };

    const s3ClientConfig: S3ClientConfig = {
        credentials: credentials,
        region: region,
    };

    return new S3Client(s3ClientConfig);
}

async function putS3Object(
    folderName: string,
    fileBuffer: any,
    fileName: string,
    contentType?: string,
    contentLength?: number,
) {
    try {
        const key = folderName ? `${folderName}/${fileName}` : fileName;

        const s3ClientConfig = createS3Client();

        const commandConfig = {
            Body: fileBuffer,
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            ContentType: contentType || 'application/octet-stream',
            ContentLength: contentLength,
        };

        const command = new PutObjectCommand(commandConfig);
        return await s3ClientConfig.send(command);
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

const deleteS3Object = async (folderName: string, fileName: string) => {
    try {
        const key = folderName ? `${folderName}/${fileName}` : fileName;

        const s3ClientConfig = createS3Client();

        const commandConfig = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
        };

        const command = new DeleteObjectCommand(commandConfig);
        return await s3ClientConfig.send(command);
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const deleteS3Folder = async (folderPrefix: string) => {
    const s3Client = createS3Client();
    const Bucket = process.env.S3_BUCKET_NAME as string;
    const Prefix = folderPrefix.endsWith('/')
        ? folderPrefix
        : `${folderPrefix}/`;

    try {
        let isTruncated = true;
        let ContinuationToken: string | undefined = undefined;

        while (isTruncated) {
            const listCommand: ListObjectsV2Command = new ListObjectsV2Command({
                Bucket,
                Prefix,
                ContinuationToken,
            });

            const listResponse = await s3Client.send(listCommand);

            const objectsToDelete =
                listResponse.Contents?.map((obj) => ({ Key: obj.Key! })) || [];

            if (objectsToDelete.length > 0) {
                const deleteCommand = new DeleteObjectsCommand({
                    Bucket,
                    Delete: { Objects: objectsToDelete },
                });

                await s3Client.send(deleteCommand);
            }

            isTruncated = !!listResponse.IsTruncated;
            ContinuationToken = listResponse.NextContinuationToken;
        }

        return true;
    } catch (error) {
        logger.error(`Failed to delete folder ${folderPrefix}`, error);
        throw error;
    }
};

export { putS3Object, deleteS3Object, deleteS3Folder };
