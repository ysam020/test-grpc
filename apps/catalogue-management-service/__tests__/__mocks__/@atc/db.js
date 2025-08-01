// Auto-generated mock file for @atc/db
module.exports = {
  dbClient: {
    $transaction: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    adSuggestedBrand: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    adSuggestedGroup: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    adSuggestedProduct: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    advertisement: {
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    advertisementImage: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    advertisementItem: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    brand: {
      findMany: jest.fn(),
    },
    productGroup: {
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    productGroupProduct: {
      count: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    retailer: {
      findUnique: jest.fn(),
    },
  },
  prismaClient: {
    AdvertisementStatus: {
      COMPLETED: "COMPLETED",
      NEEDS_REVIEW: "NEEDS_REVIEW",
    },
    AdvertisementType: {
    },
    Prisma: {
      AdSuggestedBrandUpdateInput: {},
      AdSuggestedGroupUpdateInput: {},
      AdSuggestedProductUpdateInput: {},
      AdvertisementCreateInput: {},
      AdvertisementItemCreateInput: {},
      AdvertisementItemUpdateInput: {},
      AdvertisementUpdateInput: {},
      ProductGroupCreateInput: {},
      ProductGroupUpdateInput: {},
    },
  }
};
