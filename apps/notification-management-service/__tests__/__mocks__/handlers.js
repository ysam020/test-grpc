// apps/notification-management-service/__tests__/__mocks__/handlers.js
module.exports = {
    // Admin Notification Handlers
    createAdminNotification: jest.fn(),
    updateAdminNotification: jest.fn(),
    getAdminNotifications: jest.fn(),
    getSingleAdminNotification: jest.fn(),
    deleteAdminNotification: jest.fn(),
    retryAdminNotification: jest.fn(),

    // Regular Notification Handlers
    createNotification: jest.fn(),
    getNotifications: jest.fn(),
    getAverageNotificationCount: jest.fn(),

    // Price Alert Handlers
    addPriceAlert: jest.fn(),
    getPriceAlerts: jest.fn(),
    deletePriceAlert: jest.fn(),

    // Handler collections
    handlers: {
        CreateAdminNotification: jest.fn(),
        UpdateAdminNotification: jest.fn(),
        GetAdminNotifications: jest.fn(),
        GetSingleAdminNotification: jest.fn(),
        DeleteAdminNotification: jest.fn(),
        AddPriceAlert: jest.fn(),
        GetPriceAlerts: jest.fn(),
        DeletePriceAlert: jest.fn(),
        GetNotifications: jest.fn(),
        CreateNotification: jest.fn(),
        RetryAdminNotification: jest.fn(),
        GetAverageNotificationCount: jest.fn(),
    },
};
