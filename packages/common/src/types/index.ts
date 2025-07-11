interface EmailContent {
    subject: string;
    text: string;
    html?: string;
}

interface ExcelContent {
    buffer: Buffer;
    fileName: string;
}

interface PhoneNumberFormat {
    regex: RegExp;
    format: string;
}

type Countries = 'IN' | 'AU';

enum ChartType {
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY',
    WEEKLY = 'WEEKLY',
}

enum ReportType {
    SURVEY = 'survey',
    SAMPLE = 'sample',
    RETAILER = 'retailer',
    CATEGORY = 'category',
    NEW_PRODUCT_MATCH = 'new-product-match',
    MASTER_PRODUCT_LIST = 'master-product-list',
    BRAND = 'brand',
    SUPPLIER = 'supplier',
    ADVERTISEMENT = 'advertisement',
}

export { ChartType, ReportType };

export type { EmailContent, PhoneNumberFormat, Countries, ExcelContent };
