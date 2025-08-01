// Auto-generated mock file for @atc/db
module.exports = {
  dbClient: {
    $transaction: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    banner: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    brand: {
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    productSlider: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    retailer: {
      findMany: jest.fn(),
    },
    survey: {
      findMany: jest.fn(),
    },
    widget: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    widgetComponent: {
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  },
  prismaClient: {
    BannerLinkType: {
      EXTERNAL: "EXTERNAL",
      INTERNAL: "INTERNAL",
    },
    InternalLinkType: {
      PRODUCT: "PRODUCT",
      SAMPLE: "SAMPLE",
    },
    PromotionTypeEnum: {
    },
    ReferenceModelType: {
      BANNER: "BANNER",
      PRODUCT_SLIDER: "PRODUCT_SLIDER",
      SURVEY: "SURVEY",
    },
    WidgetComponentType: {
      BANNER: "BANNER",
      PRODUCT_SLIDER: "PRODUCT_SLIDER",
      SURVEY: "SURVEY",
    },
    WidgetStatusEnum: {
      ACTIVE: "ACTIVE",
      PUBLISH: "PUBLISH",
    },
    Prisma: {
      BannerUpdateInput: {},
    },
  }
};
