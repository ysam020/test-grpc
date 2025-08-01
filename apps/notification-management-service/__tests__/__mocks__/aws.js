// apps/notification-management-service/__tests__/__mocks__/aws.js
module.exports = {
    EventBridge: jest.fn().mockImplementation(() => ({
        createSchedule: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
                ScheduleArn:
                    'arn:aws:scheduler:us-east-1:123456789012:schedule/test-schedule',
            }),
        }),
        deleteSchedule: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({}),
        }),
        updateSchedule: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({}),
        }),
        getSchedule: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
                State: 'ENABLED',
                ScheduleExpression: 'at(2024-01-01T12:00:00)',
            }),
        }),
        listSchedules: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
                Schedules: [],
            }),
        }),
    })),

    SNS: jest.fn().mockImplementation(() => ({
        publish: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
                MessageId: 'test-message-id',
            }),
        }),
        createTopic: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
                TopicArn: 'arn:aws:sns:us-east-1:123456789012:test-topic',
            }),
        }),
        deleteTopic: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({}),
        }),
        subscribe: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
                SubscriptionArn:
                    'arn:aws:sns:us-east-1:123456789012:test-topic:subscription-id',
            }),
        }),
        unsubscribe: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({}),
        }),
    })),

    SES: jest.fn().mockImplementation(() => ({
        sendEmail: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
                MessageId: 'test-email-message-id',
            }),
        }),
        sendBulkTemplatedEmail: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
                MessageId: 'test-bulk-email-message-id',
            }),
        }),
        createTemplate: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({}),
        }),
        deleteTemplate: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({}),
        }),
        getTemplate: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
                Template: {
                    TemplateName: 'test-template',
                    SubjectPart: 'Test Subject',
                    HtmlPart: '<h1>Test HTML</h1>',
                    TextPart: 'Test Text',
                },
            }),
        }),
    })),
};
