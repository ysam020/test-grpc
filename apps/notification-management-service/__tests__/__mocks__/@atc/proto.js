// apps/notification-management-service/__tests__/__mocks__/@atc/proto.js
module.exports = {
    // Admin Notification Types
    CreateAdminNotificationRequest__Output: {},
    CreateAdminNotificationResponse: {},
    CreateAdminNotificationResponse__Output: {},
    UpdateAdminNotificationRequest__Output: {},
    UpdateAdminNotificationResponse: {},
    UpdateAdminNotificationResponse__Output: {},
    GetAdminNotificationsRequest__Output: {},
    GetAdminNotificationsResponse: {},
    GetAdminNotificationsResponse__Output: {},
    GetSingleAdminNotificationRequest__Output: {},
    GetSingleAdminNotificationResponse: {},
    GetSingleAdminNotificationResponse__Output: {},
    DeleteAdminNotificationRequest__Output: {},
    DeleteAdminNotificationResponse: {},
    DeleteAdminNotificationResponse__Output: {},
    RetryAdminNotificationRequest__Output: {},
    RetryAdminNotificationResponse: {},
    RetryAdminNotificationResponse__Output: {},

    // Regular Notification Types
    CreateNotificationRequest__Output: {},
    CreateNotificationResponse: {},
    CreateNotificationResponse__Output: {},
    GetNotificationsRequest__Output: {},
    GetNotificationsResponse: {},
    GetNotificationsResponse__Output: {},

    // Price Alert Types
    AddPriceAlertRequest__Output: {},
    AddPriceAlertResponse: {},
    AddPriceAlertResponse__Output: {},
    GetPriceAlertsRequest__Output: {},
    GetPriceAlertsResponse: {},
    GetPriceAlertsResponse__Output: {},
    DeletePriceAlertRequest__Output: {},
    DeletePriceAlertResponse: {},
    DeletePriceAlertResponse__Output: {},

    // Other Types
    GetAverageNotificationCountRequest__Output: {},
    GetAverageNotificationCountResponse: {},
    GetAverageNotificationCountResponse__Output: {},
    TargetUsers__Output: {},
    NotificationData__Output: {},
    AdminNotificationData__Output: {},
    PriceAlertData__Output: {},

    // Health Check Types
    HealthCheckRequest__Output: {},
    HealthCheckResponse: {},
    HealthCheckResponse__Output: {},

    // Service Handlers
    NotificationServiceHandlers: {},

    // Enums
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
