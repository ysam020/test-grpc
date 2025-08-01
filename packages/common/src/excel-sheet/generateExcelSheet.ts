import xlsx from 'xlsx';
import { ExcelReportType } from '../types/sample.types';
import { ReportType } from '../types';

interface OptionData {
    option: string | null;
    count: number;
    average: number;
}

interface QuestionData {
    question: string;
    total_answered: string;
    no_of_days: string;
    option_data: OptionData[];
}

interface SheetData {
    name: string;
    maximum_sample: number;
    sample_completed_count: number;
    sample_completed_average: number;
    survey_completed_count: number;
    survey_completed_average: number;
    sample_sent_count: number;
    sample_sent_average: number;
    question_data: QuestionData[];
    start_date: string | Date;
    end_date: string | Date;
}

interface SampleSheetData {
    name: string;
    maximum_sample: number;
    total_answered: string;
    no_of_days: string;
    sample_completed_count: number;
    sample_completed_average: number;
    survey_completed_count: number;
    survey_completed_average: number;
    sample_sent_count: number;
    sample_sent_average: number;
}

interface QuestionSheetData {
    name: string;
    question: string;
    total_answered: string;
    no_of_days: string;
    option_data: OptionData[];
}

interface RetailerListData {
    retailer_name: string;
    id: string;
}

interface CategoryListData {
    parent_category_name: string;
    category_name: string;
    id: string;
}

interface NewProductMatchData {
    product_to_match: {
        product_name: string;
        brand_name: string;
        retailer_name: string;
        price: string;
        category_name: string;
        barcode: string;
        pack_size: string;
        image_url: string;
    };
}

interface RetailerListData {
    retailer_name: string;
    retailer_code: string;
}

interface MasterProductListData {
    brand_name: string;
    barcode: string;
    a2c_size: string;
    private_label: boolean;
    product_name: string;
    category_name: string;
    pack_size: string;
    image_url: string;
    retailers_data: RetailerListData[];
}

interface ProductGroupProducts {
    product_name: string;
    barcode: string;
    pack_size: string;
    rrp: number;
    brand_name: string;
    category_name: string;
}

interface SupplierList {
    id: string;
    supplier_name: string;
    brands: { id: string; brand_name: string }[];
}

interface BrandList {
    id: string;
    brand_name: string;
    private_label: boolean;
    Supplier: { supplier_name: string };
}

interface AdvertisementData {
    id: string;
    title: string;
    retailer_name: string;
    advertisement_type: string;
    start_date: string;
    end_date: string;
    status: string;
    product_match: string;
}

async function generateExcelSheet(
    data:
        | SheetData[]
        | SampleSheetData[]
        | QuestionSheetData[]
        | RetailerListData[]
        | CategoryListData[]
        | NewProductMatchData[]
        | MasterProductListData[]
        | ProductGroupProducts[]
        | SupplierList[]
        | BrandList[]
        | AdvertisementData[],
    type: ExcelReportType,
) {
    const headers: string[] = getHeadersForReportType(type, data);

    let transformedData: (string | number | { f: string })[][] = [];

    if (type === ExcelReportType.ALL_SAMPLE_REPORT) {
        transformedData = transformAllSampleReport(data as SheetData[]);
    }

    if (type === ExcelReportType.SAMPLE_REPORT) {
        transformedData = transformSampleReport(data as SampleSheetData[]);
    }

    if (type === ExcelReportType.QUESTION_REPORT) {
        transformedData = transformQuestionReport(data as QuestionSheetData[]);
    }

    if (type === ExcelReportType.RETAILER_LIST) {
        transformedData = transformRetailerListReport(
            data as RetailerListData[],
        );
    }

    if (type === ExcelReportType.CATEGORY_LIST) {
        transformedData = transformCategoryListReport(
            data as CategoryListData[],
        );
    }

    if (type === ExcelReportType.NEW_PRODUCT_MATCH) {
        transformedData = transformNewProductMatchReport(
            data as NewProductMatchData[],
        );
    }

    if (type === ExcelReportType.MASTER_PRODUCT_LIST) {
        transformedData = transformMasterProductListReport(
            data as MasterProductListData[],
        );
    }

    if (type === ExcelReportType.PRODUCT_GROUP) {
        transformedData = (data as ProductGroupProducts[]).map((product) => [
            product.product_name,
            product.barcode,
            product.pack_size,
            product.rrp,
            product.brand_name,
            product.category_name,
        ]);
    }

    if (type === ExcelReportType.SUPPLIER_LIST) {
        transformedData = transformSupplierListReport(data as SupplierList[]);
    }

    if (type === ExcelReportType.BRAND_LIST) {
        transformedData = transformBrandListReport(data as BrandList[]);
    }

    if (type === ExcelReportType.ADVERTISEMENT) {
        transformedData = (data as AdvertisementData[]).map((item) => [
            item.title,
            item.retailer_name,
            item.advertisement_type,
            item.start_date,
            item.end_date,
            item.status,
            item.product_match,
            {
                f: `HYPERLINK("https://d261hgj2e0u7n.cloudfront.net/advertisement_images/${item.id}/${item.id}", "Media")`,
            },
        ]);
    }

    const sheetData = [headers, ...transformedData];

    const workSheet = xlsx.utils.aoa_to_sheet(sheetData);
    const workBook = xlsx.utils.book_new();

    xlsx.utils.book_append_sheet(workBook, workSheet, 'Sheet 1');

    return xlsx.write(workBook, { type: 'buffer', bookType: 'xlsx' });
}

function getHeadersForReportType(type: ExcelReportType, data?: any): string[] {
    switch (type) {
        case ExcelReportType.SAMPLE_REPORT:
            return [
                'Name',
                'Maximum Samples',
                'Samples Completed (Count)',
                'Samples Completed (Average %)',
                'Surveys Completed (Count)',
                'Surveys Completed (Average %)',
                'Samples Sent (Count)',
                'Samples Sent (Average %)',
                'Total Answered',
                'Duration (Days)',
            ];

        case ExcelReportType.QUESTION_REPORT:
            return [
                'Name',
                'Question',
                'Option',
                'Option (Count)',
                'Option (Average %)',
                'Total Answered',
                'Duration (Days)',
            ];

        case ExcelReportType.RETAILER_LIST:
            return ['Retailer Id', 'Retailer Name', 'Retailer Image'];

        case ExcelReportType.CATEGORY_LIST:
            return [
                'Category Id',
                'Category Name',
                'Parent Category Name',
                'Category Image',
            ];

        case ExcelReportType.NEW_PRODUCT_MATCH:
            return [
                'Product name',
                'Brand',
                'Retailer Name',
                'Retail Price',
                'Category',
                'Barcode',
                'Size',
                'Image',
            ];

        case ExcelReportType.MASTER_PRODUCT_LIST:
            const retailersMap: { [key: string]: string } = data.reduce(
                (acc: any, product: any) => {
                    product.retailers_data.forEach((retailer: any) => {
                        if (!acc[retailer.retailer_id]) {
                            acc[retailer.retailer_id] = retailer.retailer_name;
                        }
                    });
                    return acc;
                },
                {},
            );

            const retailerHeaders = Object.values(retailersMap);
            return [
                'Product Name',
                'Barcode',
                'A2C Size',
                'Private Label',
                'Brand',
                'Pack Size',
                'Category',
                ...retailerHeaders,
            ];

        case ExcelReportType.PRODUCT_GROUP:
            return [
                'Product Name',
                'Barcode',
                'Pack Size',
                'RRP',
                'Brand',
                'Category',
            ];

        case ExcelReportType.SUPPLIER_LIST:
            return ['Supplier Id', 'Supplier Name', 'Brands', 'Supplier Image'];

        case ExcelReportType.BRAND_LIST:
            return [
                'Brand Id',
                'Brand Name',
                'Private Label',
                'Supplier Name',
                'Brand Image',
            ];

        case ExcelReportType.ADVERTISEMENT:
            return [
                'Title',
                'Retailer Name',
                'Advertisement Type',
                'Start Date',
                'End Date',
                'Status',
                'Product Match',
                'Media',
            ];

        default:
            return [
                'Name',
                'Maximum Samples',
                'Samples Completed (Count)',
                'Samples Completed (Average %)',
                'Surveys Completed (Count)',
                'Surveys Completed (Average %)',
                'Samples Sent (Count)',
                'Samples Sent (Average %)',
                'Question',
                'Option',
                'Option (Count)',
                'Option (Average %)',
                'Total Answered',
                'Duration (Days)',
            ];
    }
}

function transformAllSampleReport(data: SheetData[]): (string | number)[][] {
    return data.flatMap((item) => {
        return item.question_data.flatMap((q, questionIndex) => {
            if (q.option_data.length === 0) {
                return [
                    [
                        questionIndex === 0 ? item.name : '',
                        item.maximum_sample || 0,
                        item.sample_completed_count || 0,
                        item.sample_completed_average || 0,
                        item.survey_completed_count || 0,
                        item.survey_completed_average || 0,
                        item.sample_sent_count || 0,
                        item.sample_sent_average || 0,
                        q.question || '',
                        '',
                        0,
                        0,
                        q.total_answered || '',
                        q.no_of_days || '',
                    ],
                ];
            }

            return q.option_data.map((option, optionIndex) => [
                questionIndex === 0 && optionIndex === 0 ? item.name : '',
                questionIndex === 0 && optionIndex === 0
                    ? item.maximum_sample
                    : '',
                questionIndex === 0 && optionIndex === 0
                    ? item.sample_completed_count
                    : '',
                questionIndex === 0 && optionIndex === 0
                    ? item.sample_completed_average
                    : '',
                questionIndex === 0 && optionIndex === 0
                    ? item.survey_completed_count
                    : '',
                questionIndex === 0 && optionIndex === 0
                    ? item.survey_completed_average
                    : '',
                questionIndex === 0 && optionIndex === 0
                    ? item.sample_sent_count
                    : '',
                questionIndex === 0 && optionIndex === 0
                    ? item.sample_sent_average
                    : '',
                optionIndex === 0 ? q.question : '',
                option.option || '',
                option.count || 0,
                option.average || 0,
                optionIndex === 0 ? q.total_answered : '',
                optionIndex === 0 ? q.no_of_days : '',
            ]);
        });
    });
}

function transformSampleReport(data: SampleSheetData[]): (string | number)[][] {
    return data.map((item) => [
        item.name,
        item.maximum_sample,
        item.sample_completed_count,
        item.sample_completed_average,
        item.survey_completed_count,
        item.survey_completed_average,
        item.sample_sent_count,
        item.sample_sent_average,
        item.total_answered,
        item.no_of_days,
    ]);
}

function transformQuestionReport(
    data: QuestionSheetData[],
): (string | number)[][] {
    return data.flatMap((item) => {
        if (item.option_data.length === 0) {
            return [
                [
                    item.name || '',
                    item.question || '',
                    '',
                    0,
                    0,
                    item.total_answered || '',
                    item.no_of_days || '',
                ],
            ];
        }

        return item.option_data.map((option, optionIndex) => [
            optionIndex === 0 ? item.name : '',
            optionIndex === 0 ? item.question : '',
            option.option || '',
            option.count || 0,
            option.average || 0,
            optionIndex === 0 ? item.total_answered : '',
            optionIndex === 0 ? item.no_of_days : '',
        ]);
    });
}

function transformRetailerListReport(data: RetailerListData[]) {
    return data.flatMap((item) => {
        return [
            [
                item.id,
                item.retailer_name,
                {
                    f: `HYPERLINK("https://d261hgj2e0u7n.cloudfront.net/retailer_images/${item.id}", "Retailer Image")`,
                },
            ],
        ];
    });
}

function transformCategoryListReport(data: CategoryListData[]) {
    return data.flatMap((item) => {
        return [
            [
                item.id,
                item.category_name,
                item.parent_category_name,
                {
                    f: `HYPERLINK("https://d261hgj2e0u7n.cloudfront.net/category_pics/${item.id}", "Category Image")`,
                },
            ],
        ];
    });
}

function transformNewProductMatchReport(data: NewProductMatchData[]) {
    return data.map((item) => {
        return [
            item.product_to_match.product_name,
            item.product_to_match.brand_name,
            item.product_to_match.retailer_name,
            item.product_to_match.price,
            item.product_to_match.category_name,
            item.product_to_match.barcode,
            item.product_to_match.pack_size,
            {
                f: `HYPERLINK("${item.product_to_match.image_url}", "Product Image")`,
            },
        ];
    });
}

function transformMasterProductListReport(data: MasterProductListData[]) {
    const retailersMap: { [key: string]: string } = data.reduce(
        (acc: any, product: any) => {
            product.retailers_data.forEach((retailer: any) => {
                if (!acc[retailer.retailer_id]) {
                    acc[retailer.retailer_id] = retailer.retailer_name;
                }
            });
            return acc;
        },
        {},
    );

    return data.map((product) => {
        const retailerCodes = Object.keys(retailersMap).map((retailerId) => {
            const retailer = product.retailers_data.find(
                (r: any) => r.retailer_id === retailerId,
            );
            return retailer ? retailer.retailer_code : '';
        });

        return [
            product.product_name,
            product.barcode,
            product.a2c_size,
            product.private_label.toString(),
            product.brand_name,
            product.pack_size,
            product.category_name,
            ...retailerCodes,
        ];
    });
}

function transformSupplierListReport(data: SupplierList[]) {
    return data.map((item) => {
        return [
            item.id,
            item.supplier_name,
            item.brands.map((b) => b.brand_name).join(', '),
            {
                f: `HYPERLINK("https://d261hgj2e0u7n.cloudfront.net/supplier_images/${item.id}", "Supplier Image")`,
            },
        ];
    });
}

function transformBrandListReport(data: BrandList[]) {
    return data.map((item) => {
        return [
            item.id,
            item.brand_name,
            item.private_label.toString(),
            item?.Supplier?.supplier_name || '',
            {
                f: `HYPERLINK("https://d261hgj2e0u7n.cloudfront.net/brand_images/${item.id}", "Brand Image")`,
            },
        ];
    });
}

async function generateFileName(
    type: string,
    start_date?: string,
    end_date?: string,
) {
    let prefix = 'excel-sheet';

    if (type === ReportType.SAMPLE) {
        prefix = 'sample-response';
    }

    if (type === ReportType.SURVEY) {
        prefix = 'survey-response';
    }

    if (type === ReportType.RETAILER) {
        prefix = 'retailer-list';
    }

    if (type === ReportType.CATEGORY) {
        prefix = 'category-list';
    }

    if (type === ReportType.NEW_PRODUCT_MATCH) {
        prefix = 'new-product-match';
    }

    if (type === ReportType.MASTER_PRODUCT_LIST) {
        prefix = 'master-product-list';
    }

    if (type === ReportType.BRAND) {
        prefix = 'brand-list';
    }

    if (type === ReportType.SUPPLIER) {
        prefix = 'supplier-list';
    }

    if (type === ReportType.ADVERTISEMENT) {
        prefix = 'advertisement';
    }

    let fileName = `${prefix}-${new Date().toISOString().replace(/-/g, '').slice(0, 8)}-${new Date().toISOString().replace(/-/g, '').slice(0, 8)}`;

    if (start_date && end_date) {
        const startDate = start_date.replace(/-/g, '') || '';
        const endDate = end_date.replace(/-/g, '');

        if (startDate && endDate) {
            fileName = `${prefix}-response-${startDate}-${endDate}`;
        }
    }

    return fileName;
}

export { generateExcelSheet, generateFileName };
