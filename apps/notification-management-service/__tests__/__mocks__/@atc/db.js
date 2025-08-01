// Auto-generated mock file for @atc/db
module.exports = {
  dbClient: {
    $transaction: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    adminNotification: {
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    masterProduct: {
      findUnique: jest.fn(),
    },
    notification: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    priceAlert: {
      count: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
  prismaClient: {
    AdminNotificationStatus: {
      FAILED: "FAILED",
      PENDING: "PENDING",
      SENT: "SENT",
    },
    NotificationChannel: {
      WHATSAPP: "WHATSAPP",
    },
    NotificationType: {
      ADMIN_NOTIFICATION: "ADMIN_NOTIFICATION",
      REGISTRATION: "REGISTRATION",
    },
    Prisma: {
      AdminNotificationCreateInput: {},
      AdminNotificationUpdateInput: {},
      NotificationCreateInput: {},
      PriceAlertCreateInput: {},
    },
  }
};
