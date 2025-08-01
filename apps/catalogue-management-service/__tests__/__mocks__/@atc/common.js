// Auto-generated mock file for @atc/common
module.exports = {
  errorMessage: {
    ADVERTISEMENT: {
      ADVERTISEMENT_ITEM_NOT_FOUND: 'Advertisement Item Not Found',
      AD_IMAGE_NOT_FOUND: 'Ad Image Not Found',
      CANNOT_TOGGLE_TO_MATCHED: 'Cannot Toggle To Matched',
      NOT_FOUND: 'Not Found',
    },
    BRAND: {
      NOT_FOUND: 'Not Found',
    },
    DATE: {
      DATE_BEFORE_START: 'Date Before Start',
    },
    OTHER: {
      INVALID_MIME_TYPE: 'Invalid Mime Type',
      SOMETHING_WENT_WRONG: 'Something Went Wrong',
    },
    PRODUCT: {
      NOT_FOUND: 'Not Found',
    },
    PRODUCT_GROUP: {
      NOT_FOUND: 'Not Found',
      PRODUCT_IDS_REQUIRED: 'Product Ids Required',
      PRODUCT_IDS_UNIQUE: 'Product Ids Unique',
    },
    RETAILER: {
      NOT_FOUND: 'Not Found',
    },
    WIDGET: {
      INVALID_DATE_FORMAT: 'Invalid Date Format',
    },
  },
  responseMessage: {
    ADVERTISEMENT: {
      ADVERTISEMENT_COMPLETED: 'Advertisement Completed successfully',
      ADVERTISEMENT_ITEM_ADDED: 'Advertisement Item Added successfully',
      ADVERTISEMENT_ITEM_MATCHED: 'Advertisement Item Matched successfully',
      ADVERTISEMENT_ITEM_UPDATED: 'Advertisement Item Updated successfully',
      CREATED: 'Created successfully',
      DELETED: 'Deleted successfully',
      FINISHED_LATER: 'Finished Later successfully',
      RETRIEVED: 'Retrieved successfully',
      UPDATED: 'Updated successfully',
    },
    EMAIL: {
      MAIL_SENT: 'Mail Sent successfully',
    },
    PRODUCT_GROUP: {
      CREATED: 'Created successfully',
      DELETED: 'Deleted successfully',
      PRODUCTS_ATTACHED: 'Products Attached successfully',
      PRODUCTS_REMOVED: 'Products Removed successfully',
      PRODUCTS_RETRIEVED: 'Products Retrieved successfully',
      RETRIEVED: 'Retrieved successfully',
      UPDATED: 'Updated successfully',
    },
  },
  UserRoleEnum: {
    ADMIN: 'ADMIN',
  },
  ProductMatch: {
    IN_PROGRESS: 'IN_PROGRESS',
    MATCHED: 'MATCHED',
    NOT_MATCHED: 'NOT_MATCHED',
  },
  AdItemMatchType: {
    BRAND: 'BRAND',
    PRODUCT: 'PRODUCT',
    PRODUCT_GROUP: 'PRODUCT_GROUP',
  },
  catalogueValidation: jest.fn(),
  healthCheck: jest.fn(),
  startAllWorkers: jest.fn(),
  utilFns: jest.fn(),
};
