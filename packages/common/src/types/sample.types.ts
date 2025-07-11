enum AnswerType {
    MULTI = 'MULTI',
    SINGLE = 'SINGLE',
    TEXT = 'TEXT',
}

enum SampleStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    INACTIVE = 'INACTIVE',
}

enum SampleType {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    WIDGET = 'widget',
}

enum ReviewType {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
}

enum UserSampleStatus {
    NOT_FOUND = 'NOT_FOUND',
    NEW_SAMPLE = 'NEW_SAMPLE',
    TO_REVIEW = 'TO_REVIEW',
    PAST_REVIEW = 'PAST_REVIEW',
}

enum ExcelReportType {
    ALL_SAMPLE_REPORT = 'all-sample-report',
    QUESTION_REPORT = 'question-report',
    SAMPLE_REPORT = 'sample-report',
    RETAILER_LIST = 'retailer-list',
    CATEGORY_LIST = 'category-list',
    NEW_PRODUCT_MATCH = 'new-product-match',
    MASTER_PRODUCT_LIST = 'master-product-list',
    PRODUCT_GROUP = 'product-group',
    BRAND_LIST = 'brand-list',
    SUPPLIER_LIST = 'supplier-list',
    ADVERTISEMENT = 'advertisement',
}

export {
    AnswerType,
    SampleStatus,
    SampleType,
    ReviewType,
    UserSampleStatus,
    ExcelReportType,
};
