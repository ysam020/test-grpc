// Auto-generated mock file for @atc/db
module.exports = {
  dbClient: {
    $transaction: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    basket: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    basketItem: {
      delete: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
    masterProduct: {
      findUnique: jest.fn(),
    },
    postcode: {
      findFirst: jest.fn(),
    },
    preference: {
      upsert: jest.fn(),
    },
    priceAlert: {
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
  prismaClient: {
    Prisma: {
      UserUpdateInput: {},
    },
  }
};
