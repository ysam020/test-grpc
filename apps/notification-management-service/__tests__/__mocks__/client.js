// apps/notification-management-service/__tests__/__mocks__/clients.js
module.exports = {
    userStub: {
        GetUser: jest.fn(),
        GetUsers: jest.fn(),
        CreateUser: jest.fn(),
        UpdateUser: jest.fn(),
        DeleteUser: jest.fn(),
        ValidateUser: jest.fn(),
        GetUsersByRole: jest.fn(),
        GetUserPreferences: jest.fn(),
        UpdateUserPreferences: jest.fn(),
    },

    productStub: {
        GetProduct: jest.fn(),
        GetProducts: jest.fn(),
        CreateProduct: jest.fn(),
        UpdateProduct: jest.fn(),
        DeleteProduct: jest.fn(),
        GetProductPrice: jest.fn(),
        UpdateProductPrice: jest.fn(),
    },

    notificationStub: {
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
