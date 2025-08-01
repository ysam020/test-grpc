

// Mock dependencies first, before any imports
jest.mock('@atc/common', () => ({
    catalogueValidation: {
        createProductGroupSchema: {
            partial: jest.fn().mockReturnValue({
                extend: jest.fn().mockReturnValue({
                    parse: jest.fn(),
                    safeParse: jest.fn(),
                }),
            }),
        },
        addAdvertisementItemSchema: {
            parse: jest.fn(),
            safeParse: jest.fn(),
        },
    },
    constants: {
        DATE_REGEX: /^\d{4}-\d{2}-\d{2}$/,
        MIME_TYPE_REGEX: /^(image|video)\/(png|jpg|jpeg|gif|mp4|mov|avi)$/,
    },
    errorMessage: {
        PRODUCT_GROUP: {
            PRODUCT_IDS_REQUIRED: 'Product IDs are required',
            PRODUCT_IDS_UNIQUE: 'Product IDs must be unique',
        },
        WIDGET: {
            INVALID_DATE_FORMAT: 'Invalid date format',
        },
        OTHER: {
            INVALID_MIME_TYPE: 'Invalid mime type',
        },
        DATE: {
            DATE_BEFORE_START: 'End date cannot be before start date',
        },
    },
    AdItemMatchType: {
        EXACT: 'EXACT',
        PARTIAL: 'PARTIAL',
        NO_MATCH: 'NO_MATCH',
    },
    ProductMatch: {
        MATCHED: 'MATCHED',
        UNMATCHED: 'UNMATCHED',
        PARTIALLY_MATCHED: 'PARTIALLY_MATCHED',
    },
}));

jest.mock('@atc/db', () => ({
    prismaClient: {
        AdvertisementType: {
            BANNER: 'BANNER',
            VIDEO: 'VIDEO',
            CAROUSEL: 'CAROUSEL',
        },
    },
}));

// Now import the schemas after mocks are set up
import {
    productGroupIDSchema,
    attachProductsToGroupSchema,
    getAttachedProductsSchema,
    removeProductsFromGroupSchema,
    exportToExcelSchema,
    getAllProductGroupsSchema,
    createAdvertisementSchema,
    getAdvertisementsSchema,
    getSingleAdvertisementSchema,
    updateAdvertisementSchema,
    exportToExcelAdvertisementsSchema,
    matchAdvertisementItemSchema,
} from '../../../src/validations/index';

describe('Validation Schemas', () => {
    describe('productGroupIDSchema', () => {
        it('should validate valid UUID group_id', () => {
            const validData = {
                group_id: '123e4567-e89b-12d3-a456-426614174000',
            };

            const result = productGroupIDSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject invalid UUID', () => {
            const invalidData = {
                group_id: 'invalid-uuid',
            };

            const result = productGroupIDSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject empty string', () => {
            const invalidData = {
                group_id: '',
            };

            const result = productGroupIDSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should trim whitespace from group_id', () => {
            const dataWithWhitespace = {
                group_id: '  123e4567-e89b-12d3-a456-426614174000  ',
            };

            const result = productGroupIDSchema.safeParse(dataWithWhitespace);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.group_id).toBe('123e4567-e89b-12d3-a456-426614174000');
            }
        });
    });

    describe('attachProductsToGroupSchema', () => {
        const validGroupId = '123e4567-e89b-12d3-a456-426614174000';
        const validProductIds = [
            '223e4567-e89b-12d3-a456-426614174000',
            '323e4567-e89b-12d3-a456-426614174000',
        ];

        it('should validate valid data', () => {
            const validData = {
                group_id: validGroupId,
                product_ids: validProductIds,
            };

            const result = attachProductsToGroupSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject empty product_ids array', () => {
            const invalidData = {
                group_id: validGroupId,
                product_ids: [],
            };

            const result = attachProductsToGroupSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject duplicate product_ids', () => {
            const invalidData = {
                group_id: validGroupId,
                product_ids: [validProductIds[0], validProductIds[0]],
            };

            const result = attachProductsToGroupSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject invalid UUIDs in product_ids', () => {
            const invalidData = {
                group_id: validGroupId,
                product_ids: ['invalid-uuid'],
            };

            const result = attachProductsToGroupSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject extra properties', () => {
            const invalidData = {
                group_id: validGroupId,
                product_ids: validProductIds,
                extra_field: 'not allowed',
            };

            const result = attachProductsToGroupSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('getAttachedProductsSchema', () => {
        const validGroupId = '123e4567-e89b-12d3-a456-426614174000';

        it('should validate with only group_id', () => {
            const validData = {
                group_id: validGroupId,
            };

            const result = getAttachedProductsSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should validate with pagination parameters', () => {
            const validData = {
                group_id: validGroupId,
                page: 1,
                limit: 10,
            };

            const result = getAttachedProductsSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject decimal numbers for page and limit', () => {
            const dataWithDecimals = {
                group_id: validGroupId,
                page: 1.7,
                limit: 10.9,
            };

            const result = getAttachedProductsSchema.safeParse(dataWithDecimals);
            expect(result.success).toBe(false);
        });

        it('should allow optional page and limit', () => {
            const validData = {
                group_id: validGroupId,
            };

            const result = getAttachedProductsSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.page).toBeUndefined();
                expect(result.data.limit).toBeUndefined();
            }
        });

        it('should reject extra properties', () => {
            const invalidData = {
                group_id: validGroupId,
                extra_field: 'not allowed',
            };

            const result = getAttachedProductsSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('removeProductsFromGroupSchema', () => {
        const validGroupId = '123e4567-e89b-12d3-a456-426614174000';
        const validProductIds = ['223e4567-e89b-12d3-a456-426614174000'];

        it('should validate valid data', () => {
            const validData = {
                group_id: validGroupId,
                product_ids: validProductIds,
            };

            const result = removeProductsFromGroupSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject empty product_ids array', () => {
            const invalidData = {
                group_id: validGroupId,
                product_ids: [],
            };

            const result = removeProductsFromGroupSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject extra properties', () => {
            const invalidData = {
                group_id: validGroupId,
                product_ids: validProductIds,
                extra_field: 'not allowed',
            };

            const result = removeProductsFromGroupSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('exportToExcelSchema', () => {
        const validGroupId = '123e4567-e89b-12d3-a456-426614174000';
        const validEmail = 'test@example.com';

        it('should validate valid data', () => {
            const validData = {
                group_id: validGroupId,
                email: validEmail,
            };

            const result = exportToExcelSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject invalid email', () => {
            const invalidData = {
                group_id: validGroupId,
                email: 'invalid-email',
            };

            const result = exportToExcelSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should trim whitespace from email', () => {
            const dataWithWhitespace = {
                group_id: validGroupId,
                email: '  test@example.com  ',
            };

            const result = exportToExcelSchema.safeParse(dataWithWhitespace);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('test@example.com');
            }
        });

        it('should reject extra properties', () => {
            const invalidData = {
                group_id: validGroupId,
                email: validEmail,
                extra_field: 'not allowed',
            };

            const result = exportToExcelSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('getAllProductGroupsSchema', () => {
        it('should validate with required pagination fields', () => {
            const validData = {
                page: 1,
                limit: 10,
            };

            const result = getAllProductGroupsSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should validate with all optional fields', () => {
            const validData = {
                keyword: 'test',
                brand_id: '123e4567-e89b-12d3-a456-426614174000',
                page: 1,
                limit: 10,
            };

            const result = getAllProductGroupsSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject decimal numbers for page and limit', () => {
            const dataWithDecimals = {
                page: 1.9,
                limit: 10.1,
            };

            const result = getAllProductGroupsSchema.safeParse(dataWithDecimals);
            expect(result.success).toBe(false);
        });

        it('should reject zero or negative page', () => {
            const invalidData = {
                page: 0,
                limit: 10,
            };

            const result = getAllProductGroupsSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject zero or negative limit', () => {
            const invalidData = {
                page: 1,
                limit: 0,
            };

            const result = getAllProductGroupsSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should trim whitespace from keyword', () => {
            const dataWithWhitespace = {
                keyword: '  test keyword  ',
                page: 1,
                limit: 10,
            };

            const result = getAllProductGroupsSchema.safeParse(dataWithWhitespace);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.keyword).toBe('test keyword');
            }
        });
    });

    describe('createAdvertisementSchema', () => {
        const validRetailerId = '123e4567-e89b-12d3-a456-426614174000';
        const validFiles = [
            {
                name: 'test.jpg',
                buffer: Buffer.from('test'),
                mime_type: 'image/jpeg',
                content_length: 1000,
            },
        ];

        it('should validate valid advertisement data', () => {
            const validData = {
                title: 'Test Ad',
                keyword: 'test',
                retailer_id: validRetailerId,
                advertisement_type: 'BANNER',
                start_date: '2024-01-01',
                end_date: '2024-01-31',
                files: validFiles,
            };

            const result = createAdvertisementSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.title).toBe('Test Ad');
                expect(result.data.start_date).toBeInstanceOf(Date);
                expect(result.data.end_date).toBeInstanceOf(Date);
            }
        });

        it('should reject end_date before start_date', () => {
            const invalidData = {
                title: 'Test Ad',
                retailer_id: validRetailerId,
                advertisement_type: 'BANNER',
                start_date: '2024-01-31',
                end_date: '2024-01-01',
                files: validFiles,
            };

            const result = createAdvertisementSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject invalid date format', () => {
            const invalidData = {
                title: 'Test Ad',
                retailer_id: validRetailerId,
                advertisement_type: 'BANNER',
                start_date: '01-01-2024',
                end_date: '2024-01-31',
                files: validFiles,
            };

            const result = createAdvertisementSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject keyword longer than 50 characters', () => {
            const invalidData = {
                title: 'Test Ad',
                keyword: 'a'.repeat(51),
                retailer_id: validRetailerId,
                advertisement_type: 'BANNER',
                start_date: '2024-01-01',
                end_date: '2024-01-31',
                files: validFiles,
            };

            const result = createAdvertisementSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject invalid mime type', () => {
            const invalidData = {
                title: 'Test Ad',
                retailer_id: validRetailerId,
                advertisement_type: 'BANNER',
                start_date: '2024-01-01',
                end_date: '2024-01-31',
                files: [
                    {
                        name: 'test.txt',
                        buffer: Buffer.from('test'),
                        mime_type: 'text/plain',
                    },
                ],
            };

            const result = createAdvertisementSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should allow same start and end date', () => {
            const validData = {
                title: 'Test Ad',
                retailer_id: validRetailerId,
                advertisement_type: 'BANNER',
                start_date: '2024-01-01',
                end_date: '2024-01-01',
                files: validFiles,
            };

            const result = createAdvertisementSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.start_date.getTime()).toBe(result.data.end_date.getTime());
            }
        });
    });

    describe('getAdvertisementsSchema', () => {
        it('should validate with required pagination fields', () => {
            const validData = {
                page: 1,
                limit: 10,
            };

            const result = getAdvertisementsSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should validate with all optional fields', () => {
            const validData = {
                page: 1,
                limit: 10,
                retailer_id: '123e4567-e89b-12d3-a456-426614174000',
                advertisement_type: 'BANNER',
                year: 2024,
                month: 1,
                product_match: 'MATCHED',
                keyword: 'test',
            };

            const result = getAdvertisementsSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject decimal numbers for page and limit', () => {
            const dataWithDecimals = {
                page: 1.9,
                limit: 10.1,
            };

            const result = getAdvertisementsSchema.safeParse(dataWithDecimals);
            expect(result.success).toBe(false);
        });

        it('should reject zero or negative pagination values', () => {
            const invalidData = {
                page: 0,
                limit: 10,
            };

            const result = getAdvertisementsSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('getSingleAdvertisementSchema', () => {
        it('should validate valid data', () => {
            const validData = {
                advertisement_id: '123e4567-e89b-12d3-a456-426614174000',
                page: 1,
            };

            const result = getSingleAdvertisementSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject invalid UUID', () => {
            const invalidData = {
                advertisement_id: 'invalid-uuid',
                page: 1,
            };

            const result = getSingleAdvertisementSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject zero or negative page', () => {
            const invalidData = {
                advertisement_id: '123e4567-e89b-12d3-a456-426614174000',
                page: 0,
            };

            const result = getSingleAdvertisementSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('updateAdvertisementSchema', () => {
        const validAdId = '123e4567-e89b-12d3-a456-426614174000';

        it('should validate with only advertisement_id', () => {
            const validData = {
                advertisement_id: validAdId,
            };

            const result = updateAdvertisementSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should validate with all optional fields', () => {
            const validData = {
                advertisement_id: validAdId,
                title: 'Updated Title',
                retailer_id: '223e4567-e89b-12d3-a456-426614174000',
                keyword: 'updated',
                advertisement_type: 'VIDEO',
                start_date: '2024-02-01',
                end_date: '2024-02-28',
            };

            const result = updateAdvertisementSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.title).toBe('Updated Title');
                expect(result.data.start_date).toBeInstanceOf(Date);
                expect(result.data.end_date).toBeInstanceOf(Date);
            }
        });

        it('should reject end_date before start_date', () => {
            const invalidData = {
                advertisement_id: validAdId,
                start_date: '2024-02-28',
                end_date: '2024-02-01',
            };

            const result = updateAdvertisementSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject keyword longer than 50 characters', () => {
            const invalidData = {
                advertisement_id: validAdId,
                keyword: 'a'.repeat(51),
            };

            const result = updateAdvertisementSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('exportToExcelAdvertisementsSchema', () => {
        it('should validate with only email', () => {
            const validData = {
                email: 'test@example.com',
            };

            const result = exportToExcelAdvertisementsSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should validate with all optional fields', () => {
            const validData = {
                email: 'test@example.com',
                retailer_id: '123e4567-e89b-12d3-a456-426614174000',
                advertisement_type: 'BANNER',
                year: 2024,
                month: 1,
                product_match: 'MATCHED',
            };

            const result = exportToExcelAdvertisementsSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject invalid email', () => {
            const invalidData = {
                email: 'invalid-email',
            };

            const result = exportToExcelAdvertisementsSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('matchAdvertisementItemSchema', () => {
        it('should validate valid data', () => {
            const validData = {
                ad_item_id: '123e4567-e89b-12d3-a456-426614174000',
                match_type: 'EXACT',
                match_id: '223e4567-e89b-12d3-a456-426614174000',
            };

            const result = matchAdvertisementItemSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject invalid UUIDs', () => {
            const invalidData = {
                ad_item_id: 'invalid-uuid',
                match_type: 'EXACT',
                match_id: '223e4567-e89b-12d3-a456-426614174000',
            };

            const result = matchAdvertisementItemSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject invalid match_type', () => {
            const invalidData = {
                ad_item_id: '123e4567-e89b-12d3-a456-426614174000',
                match_type: 'INVALID_TYPE',
                match_id: '223e4567-e89b-12d3-a456-426614174000',
            };

            const result = matchAdvertisementItemSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should trim whitespace from all fields', () => {
            const dataWithWhitespace = {
                ad_item_id: '  123e4567-e89b-12d3-a456-426614174000  ',
                match_type: 'EXACT',
                match_id: '  223e4567-e89b-12d3-a456-426614174000  ',
            };

            const result = matchAdvertisementItemSchema.safeParse(dataWithWhitespace);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.ad_item_id).toBe('123e4567-e89b-12d3-a456-426614174000');
                expect(result.data.match_id).toBe('223e4567-e89b-12d3-a456-426614174000');
            }
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle undefined values appropriately', () => {
            const result1 = productGroupIDSchema.safeParse(undefined);
            expect(result1.success).toBe(false);

            const result2 = productGroupIDSchema.safeParse({});
            expect(result2.success).toBe(false);

            const result3 = productGroupIDSchema.safeParse({ group_id: undefined });
            expect(result3.success).toBe(false);
        });

        it('should handle null values appropriately', () => {
            const result1 = productGroupIDSchema.safeParse(null);
            expect(result1.success).toBe(false);

            const result2 = productGroupIDSchema.safeParse({ group_id: null });
            expect(result2.success).toBe(false);
        });

        it('should handle non-object inputs', () => {
            const result1 = productGroupIDSchema.safeParse('string');
            expect(result1.success).toBe(false);

            const result2 = productGroupIDSchema.safeParse(123);
            expect(result2.success).toBe(false);

            const result3 = productGroupIDSchema.safeParse([]);
            expect(result3.success).toBe(false);
        });
    });
});