module.exports = {
    dbClient: {
        adminNotification: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        notification: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            updateMany: jest.fn(),
        },
        priceAlert: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            upsert: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
        },
        product: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
        },
        masterProduct: {
            findUnique: jest.fn(),
        },
    },
    prismaClient: {
        AdminNotificationStatus: {
            SCHEDULED: 'SCHEDULED',
            SENT: 'SENT',
            FAILED: 'FAILED',
            CANCELLED: 'CANCELLED',
            PENDING: 'PENDING',
        },
        NotificationType: {
            REGISTRATION: 'REGISTRATION',
            PRICE_ALERT: 'PRICE_ALERT',
            PROMOTION: 'PROMOTION',
            SYSTEM: 'SYSTEM',
            ORDER: 'ORDER',
            PAYMENT: 'PAYMENT',
        },
        Channel: {
            EMAIL: 'EMAIL',
            SMS: 'SMS',
            PUSH: 'PUSH',
            IN_APP: 'IN_APP',
        },
    },
};
