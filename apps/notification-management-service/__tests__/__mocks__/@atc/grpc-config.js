// apps/notification-management-service/__tests__/__mocks__/@atc/grpc-config.js
module.exports = {
    serviceDefinitions: {
        userPackageDefinition: {
            user: {
                UserService: function UserService(address, credentials) {
                    this.GetUser = jest.fn();
                    this.GetUsers = jest.fn();
                    this.ValidateUser = jest.fn();
                    this.GetUsersByRole = jest.fn();
                    this.GetUserPreferences = jest.fn();
                    this.UpdateUserPreferences = jest.fn();
                    return this;
                },
            },
        },
        productPackageDefinition: {
            product: {
                ProductService: function ProductService(address, credentials) {
                    this.GetProduct = jest.fn();
                    this.GetProducts = jest.fn();
                    this.CreateProduct = jest.fn();
                    this.UpdateProduct = jest.fn();
                    this.DeleteProduct = jest.fn();
                    this.GetProductPrice = jest.fn();
                    this.UpdateProductPrice = jest.fn();
                    return this;
                },
            },
        },
        notificationPackageDefinition: {
            notification: {
                NotificationService: {
                    service: {
                        CreateAdminNotification: {},
                        UpdateAdminNotification: {},
                        GetAdminNotifications: {},
                        GetSingleAdminNotification: {},
                        DeleteAdminNotification: {},
                        AddPriceAlert: {},
                        DeletePriceAlert: {},
                        GetPriceAlerts: {},
                        GetNotifications: {},
                        CreateNotification: {},
                        RetryAdminNotification: {},
                        GetAverageNotificationCount: {},
                    },
                },
            },
        },
        healthPackageDefinition: {
            health: {
                HealthService: {
                    service: {
                        healthCheck: {},
                    },
                },
            },
        },
    },
};
