// Auto-generated mock file for @atc/db
module.exports = {
  dbClient: {
    $transaction: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    sample: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    sampleOption: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    sampleProduct: {
      upsert: jest.fn(),
    },
    sampleQuestion: {
      count: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    sampleResponse: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
    },
    sampleReview: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    sampleUser: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
  prismaClient: {
    Prisma: {
    },
  }
};
