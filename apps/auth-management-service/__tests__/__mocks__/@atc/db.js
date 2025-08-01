// Auto-generated mock file for @atc/db
module.exports = {
  dbClient: {
    $transaction: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    preference: {
      upsert: jest.fn(),
    },
    retailer: {
      findMany: jest.fn(),
    },
    user: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userLoginActivity: {
      create: jest.fn(),
    },
  },
  prismaClient: {
    NotificationType: {
      REGISTRATION: "REGISTRATION",
    },
    Prisma: {
    },
  }
};
