// apps/notification-management-service/__tests__/__mocks__/@atc/common.js
module.exports = {
    errorMessage: {
        WIDGET: {
            INVALID_DATE_FORMAT: 'Invalid date format',
            BAD_REQUEST: 'Bad request',
        },
        USER: {
            UNAUTHORIZED_ACCESS: 'Unauthorized access',
        },
        OTHER: {
            BAD_REQUEST: 'Bad request',
            INTERNAL_ERROR: 'Internal error',
            INVALID_INPUT: 'Invalid input',
        },
        ADMIN_NOTIFICATION: {
            NO_CHANNEL_SELECTED: 'At least one channel must be selected.',
            NOT_FOUND: 'Admin notification not found',
            CREATION_FAILED: 'Failed to create admin notification',
            UPDATE_FAILED: 'Failed to update admin notification',
            DELETE_FAILED: 'Failed to delete admin notification',
        },
        NOTIFICATION: {
            NOT_FOUND: 'Notification not found',
            CREATION_FAILED: 'Failed to create notification',
        },
        PRICE_ALERT: {
            NOT_FOUND: 'Price alert not found',
            ALREADY_EXISTS: 'Price alert already exists',
        },
        PRODUCT: {
            ID_OR_BARCODE_REQUIRED: 'Either product ID or barcode is required',
        },
    },
    responseMessage: {
        ADMIN_NOTIFICATION: {
            CREATED: 'Admin notification created successfully',
            UPDATED: 'Admin notification updated successfully',
            DELETED: 'Admin notification deleted successfully',
            NOT_FOUND: 'Admin notification not found',
            RETRIEVED: 'Admin notifications retrieved successfully',
        },
        NOTIFICATION: {
            CREATED: 'Notification created successfully',
            RETRIEVED: 'Notifications retrieved successfully',
        },
        PRICE_ALERT: {
            CREATED: 'Price alert created successfully',
            DELETED: 'Price alert deleted successfully',
            RETRIEVED: 'Price alerts retrieved successfully',
        },
    },
    status: {
        OK: 0,
        NOT_FOUND: 5,
        INTERNAL: 13,
        INVALID_ARGUMENT: 3,
        ALREADY_EXISTS: 6,
        PERMISSION_DENIED: 7,
    },
    utilFns: {
        removeEmptyFields: jest.fn((obj) => obj),
        validateEmail: jest.fn(() => true),
        validateDate: jest.fn(() => true),
        formatScheduleDate: jest.fn((date, hour, minute) => new Date()),
        generatePaginationMeta: jest.fn(() => ({
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
        })),
    },
    eventBridge: {
        createEventBridgeSchedule: jest.fn().mockResolvedValue(true),
        deleteEventBridgeSchedule: jest.fn().mockResolvedValue(true),
        updateEventBridgeSchedule: jest.fn().mockResolvedValue(true),
        getEventBridgeSchedule: jest.fn().mockResolvedValue({}),
    },
    sns: {
        publishMessage: jest.fn().mockResolvedValue(true),
        createTopic: jest.fn().mockResolvedValue(true),
        deleteTopic: jest.fn().mockResolvedValue(true),
        subscribe: jest.fn().mockResolvedValue(true),
        unsubscribe: jest.fn().mockResolvedValue(true),
    },
    ses: {
        sendEmail: jest.fn().mockResolvedValue(true),
        sendBulkEmail: jest.fn().mockResolvedValue(true),
        createTemplate: jest.fn().mockResolvedValue(true),
        deleteTemplate: jest.fn().mockResolvedValue(true),
    },
    healthCheck: jest.fn().mockResolvedValue({ status: 'SERVING' }),
    productValidation: {
        validateProduct: jest.fn(),
        getProductById: jest.fn(),
        checkProductExists: jest.fn(),
    },
    NotificationTypeEnum: {
        REGISTRATION: 'REGISTRATION',
        PRICE_ALERT: 'PRICE_ALERT',
        PROMOTION: 'PROMOTION',
        SYSTEM: 'SYSTEM',
        ORDER: 'ORDER',
        PAYMENT: 'PAYMENT',
    },
    AdminNotificationStatusEnum: {
        SCHEDULED: 'SCHEDULED',
        SENT: 'SENT',
        FAILED: 'FAILED',
        CANCELLED: 'CANCELLED',
        PENDING: 'PENDING',
    },
    ChannelEnum: {
        EMAIL: 'EMAIL',
        SMS: 'SMS',
        PUSH: 'PUSH',
        IN_APP: 'IN_APP',
    },
    UserRoleEnum: {
        ADMIN: 'ADMIN',
        USER: 'USER',
        MODERATOR: 'MODERATOR',
    },
};
