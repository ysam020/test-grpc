import { logger } from '@atc/logger';
import {
    CreatePlatformEndpointCommand,
    CreateTopicCommand,
    DeleteTopicCommand,
    PublishCommand,
    SNSClient,
    SubscribeCommand,
} from '@aws-sdk/client-sns';

const sns = new SNSClient({
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
});

const snsHelper = {
    createTopic: async (name: string): Promise<string> => {
        const params = {
            Name: name,
        };
        const result = await sns.send(new CreateTopicCommand(params));
        return result.TopicArn!;
    },

    deleteTopic: async (topicArn: string) => {
        const params = {
            TopicArn: topicArn,
        };
        await sns.send(new DeleteTopicCommand(params));
    },

    subscribe: async (topicArn: string, protocol: string, endpoint: string) => {
        const params = {
            TopicArn: topicArn,
            Protocol: protocol,
            Endpoint: endpoint,
        };
        return await sns.send(new SubscribeCommand(params));
    },

    publishToTopic: async (topicArn: string, message: any) => {
        const params = {
            TopicArn: topicArn,
            Message: JSON.stringify(message),
            MessageStructure: 'json',
        };
        await sns.send(new PublishCommand(params));
    },
};

async function createPlatformEndpoint(deviceToken: string) {
    try {
        const command = new CreatePlatformEndpointCommand({
            PlatformApplicationArn: process.env.PLATFORM_APPLICATION_ARN!,
            Token: deviceToken,
        });

        return await sns.send(command);
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

export { snsHelper, createPlatformEndpoint };
