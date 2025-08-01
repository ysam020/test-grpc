// apps/notification-management-service/__tests__/__mocks__/model.service.js
module.exports = {
    // Admin Notification Services
    addAdminNotification: jest.fn(),
    getAdminNotificationByID: jest.fn(),
    updateAdminNotificationByID: jest.fn(),
    deleteAdminNotificationByID: jest.fn(),
    getAllAdminNotifications: jest.fn(),
    getAdminNotificationsWithPagination: jest.fn(),
    getAdminNotificationCount: jest.fn(),

    // Regular Notification Services
    addNewNotification: jest.fn(),
    getNotificationByID: jest.fn(),
    updateNotificationByID: jest.fn(),
    deleteNotificationByID: jest.fn(),
    markNotificationAsRead: jest.fn(),
    getUnreadNotificationCount: jest.fn(),
    getNotificationsByUser: jest.fn(),
    getNotificationsByType: jest.fn(),

    // Price Alert Services
    addPriceAlert: jest.fn(),
    getPriceAlertByID: jest.fn(),
    deletePriceAlertByID: jest.fn(),
    getPriceAlertsByUser: jest.fn(),
    getPriceAlertsWithPagination: jest.fn(),
    checkExistingPriceAlert: jest.fn(),
    updatePriceAlertStatus: jest.fn(),

    // Analytics Services
    getAverageNotificationCount: jest.fn(),
    getNotificationStatistics: jest.fn(),
    getAdminNotificationStatistics: jest.fn(),
    getPriceAlertStatistics: jest.fn(),

    // User Services
    getUserById: jest.fn(),
    getUsersByRole: jest.fn(),
    validateUserExists: jest.fn(),

    // Product Services
    getProductById: jest.fn(),
    validateProductExists: jest.fn(),
    getProductPrice: jest.fn(),
};
