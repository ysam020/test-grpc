// apps/notification-management-service/__tests__/__mocks__/@atc/common.js
module.exports = {
    utilFns: {
        removeEmptyFields: jest.fn(),
        formatError: jest.fn(),
        generateUUID: jest.fn(),
        validateEmail: jest.fn(),
        parseDate: jest.fn(),
    },
    errorMessage: {
        ADMIN_NOTIFICATION: {
            NOT_FOUND: 'Admin notification not found',
            INVALID_ID: 'Invalid admin notification ID',
            CREATION_FAILED: 'Failed to create admin notification',
            UPDATE_FAILED: 'Failed to update admin notification',
            DELETE_FAILED: 'Failed to delete admin notification',
        },
        NOTIFICATION: {
            NOT_FOUND: 'Notification not found',
            CREATION_FAILED: 'Failed to create notification',
            INVALID_TYPE: 'Invalid notification type',
        },
        PRICE_ALERT: {
            NOT_FOUND: 'Price alert not found',
            ALREADY_EXISTS: 'Price alert already exists',
            CREATION_FAILED: 'Failed to create price alert',
            DELETE_FAILED: 'Failed to delete price alert',
        },
        USER: {
            NOT_FOUND: 'User not found',
            INVALID_ID: 'Invalid user ID',
            UNAUTHORIZED: 'User not authorized',
        },
        PRODUCT: {
            NOT_FOUND: 'Product not found',
            INVALID_ID: 'Invalid product ID',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
            INVALID_REQUEST: 'Invalid request',
            VALIDATION_ERROR: 'Validation error',
            INTERNAL_ERROR: 'Internal server error',
        },
    },
    responseMessage: {
        ADMIN_NOTIFICATION: {
            CREATED: 'Admin notification created successfully',
            UPDATED: 'Admin notification updated successfully',
            DELETED: 'Admin notification deleted successfully',
            FETCHED: 'Admin notifications fetched successfully',
            SINGLE_FETCHED: 'Admin notification fetched successfully',
            RETRY_SUCCESS: 'Admin notification retry successful',
        },
        NOTIFICATION: {
            CREATED: 'Notification created successfully',
            FETCHED: 'Notifications fetched successfully',
            UPDATED: 'Notification updated successfully',
            DELETED: 'Notification deleted successfully',
            MARKED_READ: 'Notification marked as read',
        },
        PRICE_ALERT: {
            CREATED: 'Price alert created successfully',
            DELETED: 'Price alert deleted successfully',
            FETCHED: 'Price alerts fetched successfully',
        },
        AVERAGE_COUNT: {
            FETCHED: 'Average notification count fetched successfully',
        },
    },
    eventBridge: {
        createEventBridgeSchedule: jest.fn(),
        deleteEventBridgeSchedule: jest.fn(),
        updateEventBridgeSchedule: jest.fn(),
        getEventBridgeSchedule: jest.fn(),
    },
    sns: {
        publishMessage: jest.fn(),
        createTopic: jest.fn(),
        deleteTopic: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
    },
    ses: {
        sendEmail: jest.fn(),
        sendBulkEmail: jest.fn(),
        createTemplate: jest.fn(),
        deleteTemplate: jest.fn(),
    },
    productValidation: {
        validateProduct: jest.fn(),
        getProductById: jest.fn(),
        checkProductExists: jest.fn(),
    },
    healthCheck: {
        checkService: jest.fn(),
        getServiceStatus: jest.fn(),
    },
    UserRoleEnum: {
        ADMIN: 'ADMIN',
        USER: 'USER',
        MODERATOR: 'MODERATOR',
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
};
