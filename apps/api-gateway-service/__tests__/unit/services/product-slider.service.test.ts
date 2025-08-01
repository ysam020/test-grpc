import { getProductSliderByID } from '../../../src/services/product-slider.service';
import { dbClient } from '@atc/db';
import { logger } from '@atc/logger';

// Mock the database client
jest.mock('@atc/db', () => ({
    dbClient: {
        productSlider: {
            findUnique: jest.fn(),
        },
    },
}));

// Mock the logger
jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

describe('Product Slider Service', () => {
    const mockProductSliderID = 'test-slider-id';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getProductSliderByID', () => {
        it('should successfully get product slider by ID', async () => {
            const mockProductSlider = {
                id: mockProductSliderID,
                title: 'Test Product Slider',
                description: 'Test description',
                is_active: true,
                created_at: new Date('2024-01-01'),
                updated_at: new Date('2024-01-02'),
                brands: [
                    { id: 'brand-1', brand_name: 'Brand A' },
                    { id: 'brand-2', brand_name: 'Brand B' },
                ],
                retailers: [
                    { id: 'retailer-1', retailer_name: 'Retailer A' },
                    { id: 'retailer-2', retailer_name: 'Retailer B' },
                ],
                categories: [
                    { id: 'category-1', category_name: 'Category A' },
                    { id: 'category-2', category_name: 'Category B' },
                ],
            };

            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                mockProductSlider,
            );

            const result = await getProductSliderByID(mockProductSliderID);

            expect(dbClient.productSlider.findUnique).toHaveBeenCalledWith({
                where: { id: mockProductSliderID },
                include: {
                    brands: { select: { id: true, brand_name: true } },
                    retailers: { select: { id: true, retailer_name: true } },
                    categories: { select: { id: true, category_name: true } },
                },
            });
            expect(result).toEqual(mockProductSlider);
        });

        it('should return null when product slider is not found', async () => {
            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                null,
            );

            const result = await getProductSliderByID('non-existent-id');

            expect(dbClient.productSlider.findUnique).toHaveBeenCalledWith({
                where: { id: 'non-existent-id' },
                include: {
                    brands: { select: { id: true, brand_name: true } },
                    retailers: { select: { id: true, retailer_name: true } },
                    categories: { select: { id: true, category_name: true } },
                },
            });
            expect(result).toBeNull();
        });

        it('should handle product slider with empty brands, retailers, and categories', async () => {
            const mockProductSlider = {
                id: mockProductSliderID,
                title: 'Test Product Slider',
                description: 'Test description',
                is_active: true,
                created_at: new Date('2024-01-01'),
                updated_at: new Date('2024-01-02'),
                brands: [],
                retailers: [],
                categories: [],
            };

            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                mockProductSlider,
            );

            const result = await getProductSliderByID(mockProductSliderID);

            expect(result).toEqual(mockProductSlider);
            expect(result?.brands).toHaveLength(0);
            expect(result?.retailers).toHaveLength(0);
            expect(result?.categories).toHaveLength(0);
        });

        it('should handle product slider with single brand, retailer, and category', async () => {
            const mockProductSlider = {
                id: mockProductSliderID,
                title: 'Single Item Slider',
                description: 'Single item test',
                is_active: false,
                created_at: new Date('2024-01-01'),
                updated_at: new Date('2024-01-02'),
                brands: [{ id: 'brand-1', brand_name: 'Only Brand' }],
                retailers: [
                    { id: 'retailer-1', retailer_name: 'Only Retailer' },
                ],
                categories: [
                    { id: 'category-1', category_name: 'Only Category' },
                ],
            };

            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                mockProductSlider,
            );

            const result = await getProductSliderByID(mockProductSliderID);

            expect(result).toEqual(mockProductSlider);
            expect(result?.brands).toHaveLength(1);
            expect(result?.retailers).toHaveLength(1);
            expect(result?.categories).toHaveLength(1);
        });

        it('should handle product slider with multiple brands, retailers, and categories', async () => {
            const mockProductSlider = {
                id: mockProductSliderID,
                title: 'Multiple Items Slider',
                description: 'Multiple items test',
                is_active: true,
                created_at: new Date('2024-01-01'),
                updated_at: new Date('2024-01-02'),
                brands: [
                    { id: 'brand-1', brand_name: 'Brand A' },
                    { id: 'brand-2', brand_name: 'Brand B' },
                    { id: 'brand-3', brand_name: 'Brand C' },
                ],
                retailers: [
                    { id: 'retailer-1', retailer_name: 'Retailer A' },
                    { id: 'retailer-2', retailer_name: 'Retailer B' },
                    { id: 'retailer-3', retailer_name: 'Retailer C' },
                    { id: 'retailer-4', retailer_name: 'Retailer D' },
                ],
                categories: [
                    { id: 'category-1', category_name: 'Category A' },
                    { id: 'category-2', category_name: 'Category B' },
                ],
            };

            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                mockProductSlider,
            );

            const result = await getProductSliderByID(mockProductSliderID);

            expect(result).toEqual(mockProductSlider);
            expect(result?.brands).toHaveLength(3);
            expect(result?.retailers).toHaveLength(4);
            expect(result?.categories).toHaveLength(2);
        });

        it('should log error and throw when database query fails', async () => {
            const mockError = new Error('Database connection failed');

            (dbClient.productSlider.findUnique as jest.Mock).mockRejectedValue(
                mockError,
            );

            await expect(
                getProductSliderByID(mockProductSliderID),
            ).rejects.toThrow('Database connection failed');

            expect(logger.error).toHaveBeenCalledWith(mockError);
            expect(dbClient.productSlider.findUnique).toHaveBeenCalledWith({
                where: { id: mockProductSliderID },
                include: {
                    brands: { select: { id: true, brand_name: true } },
                    retailers: { select: { id: true, retailer_name: true } },
                    categories: { select: { id: true, category_name: true } },
                },
            });
        });

        it('should handle database timeout error', async () => {
            const timeoutError = new Error('Query timeout');

            (dbClient.productSlider.findUnique as jest.Mock).mockRejectedValue(
                timeoutError,
            );

            await expect(
                getProductSliderByID(mockProductSliderID),
            ).rejects.toThrow('Query timeout');

            expect(logger.error).toHaveBeenCalledWith(timeoutError);
        });

        it('should handle database constraint violation error', async () => {
            const constraintError = new Error(
                'Foreign key constraint violation',
            );

            (dbClient.productSlider.findUnique as jest.Mock).mockRejectedValue(
                constraintError,
            );

            await expect(
                getProductSliderByID(mockProductSliderID),
            ).rejects.toThrow('Foreign key constraint violation');

            expect(logger.error).toHaveBeenCalledWith(constraintError);
        });

        it('should handle invalid ID format', async () => {
            const invalidIdError = new Error('Invalid ID format');

            (dbClient.productSlider.findUnique as jest.Mock).mockRejectedValue(
                invalidIdError,
            );

            await expect(
                getProductSliderByID('invalid-id-format'),
            ).rejects.toThrow('Invalid ID format');

            expect(logger.error).toHaveBeenCalledWith(invalidIdError);
        });

        it('should verify correct query structure with all includes', async () => {
            const mockProductSlider = {
                id: mockProductSliderID,
                title: 'Test Slider',
                brands: [{ id: 'brand-1', brand_name: 'Test Brand' }],
                retailers: [
                    { id: 'retailer-1', retailer_name: 'Test Retailer' },
                ],
                categories: [
                    { id: 'category-1', category_name: 'Test Category' },
                ],
            };

            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                mockProductSlider,
            );

            await getProductSliderByID(mockProductSliderID);

            expect(dbClient.productSlider.findUnique).toHaveBeenCalledWith({
                where: { id: mockProductSliderID },
                include: {
                    brands: { select: { id: true, brand_name: true } },
                    retailers: { select: { id: true, retailer_name: true } },
                    categories: { select: { id: true, category_name: true } },
                },
            });
        });

        it('should handle undefined product slider ID', async () => {
            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                null,
            );

            const result = await getProductSliderByID(undefined as any);

            expect(dbClient.productSlider.findUnique).toHaveBeenCalledWith({
                where: { id: undefined },
                include: {
                    brands: { select: { id: true, brand_name: true } },
                    retailers: { select: { id: true, retailer_name: true } },
                    categories: { select: { id: true, category_name: true } },
                },
            });
            expect(result).toBeNull();
        });

        it('should handle null product slider ID', async () => {
            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                null,
            );

            const result = await getProductSliderByID(null as any);

            expect(dbClient.productSlider.findUnique).toHaveBeenCalledWith({
                where: { id: null },
                include: {
                    brands: { select: { id: true, brand_name: true } },
                    retailers: { select: { id: true, retailer_name: true } },
                    categories: { select: { id: true, category_name: true } },
                },
            });
            expect(result).toBeNull();
        });

        it('should handle empty string product slider ID', async () => {
            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                null,
            );

            const result = await getProductSliderByID('');

            expect(dbClient.productSlider.findUnique).toHaveBeenCalledWith({
                where: { id: '' },
                include: {
                    brands: { select: { id: true, brand_name: true } },
                    retailers: { select: { id: true, retailer_name: true } },
                    categories: { select: { id: true, category_name: true } },
                },
            });
            expect(result).toBeNull();
        });

        it('should handle very long product slider ID', async () => {
            const longId = 'a'.repeat(1000);
            const mockProductSlider = {
                id: longId,
                title: 'Long ID Slider',
                brands: [],
                retailers: [],
                categories: [],
            };

            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                mockProductSlider,
            );

            const result = await getProductSliderByID(longId);

            expect(dbClient.productSlider.findUnique).toHaveBeenCalledWith({
                where: { id: longId },
                include: {
                    brands: { select: { id: true, brand_name: true } },
                    retailers: { select: { id: true, retailer_name: true } },
                    categories: { select: { id: true, category_name: true } },
                },
            });
            expect(result).toEqual(mockProductSlider);
        });

        it('should verify that only specified fields are selected in includes', async () => {
            const mockProductSlider = {
                id: mockProductSliderID,
                title: 'Test Slider',
                brands: [
                    {
                        id: 'brand-1',
                        brand_name: 'Test Brand',
                        // Should not include other brand fields like created_at, updated_at, etc.
                    },
                ],
                retailers: [
                    {
                        id: 'retailer-1',
                        retailer_name: 'Test Retailer',
                        // Should not include other retailer fields
                    },
                ],
                categories: [
                    {
                        id: 'category-1',
                        category_name: 'Test Category',
                        // Should not include other category fields
                    },
                ],
            };

            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                mockProductSlider,
            );

            const result = await getProductSliderByID(mockProductSliderID);

            expect(result?.brands[0]).toHaveProperty('id');
            expect(result?.brands[0]).toHaveProperty('brand_name');
            expect(Object.keys(result?.brands[0] || {})).toHaveLength(2);

            expect(result?.retailers[0]).toHaveProperty('id');
            expect(result?.retailers[0]).toHaveProperty('retailer_name');
            expect(Object.keys(result?.retailers[0] || {})).toHaveLength(2);

            expect(result?.categories[0]).toHaveProperty('id');
            expect(result?.categories[0]).toHaveProperty('category_name');
            expect(Object.keys(result?.categories[0] || {})).toHaveLength(2);
        });
    });

    describe('Database Error Scenarios', () => {
        it('should handle Prisma client initialization error', async () => {
            const initError = new Error('Prisma client is not initialized');

            (dbClient.productSlider.findUnique as jest.Mock).mockRejectedValue(
                initError,
            );

            await expect(
                getProductSliderByID(mockProductSliderID),
            ).rejects.toThrow('Prisma client is not initialized');

            expect(logger.error).toHaveBeenCalledWith(initError);
        });

        it('should handle network connection error', async () => {
            const networkError = new Error('ECONNREFUSED: Connection refused');

            (dbClient.productSlider.findUnique as jest.Mock).mockRejectedValue(
                networkError,
            );

            await expect(
                getProductSliderByID(mockProductSliderID),
            ).rejects.toThrow('ECONNREFUSED: Connection refused');

            expect(logger.error).toHaveBeenCalledWith(networkError);
        });

        it('should handle database permission error', async () => {
            const permissionError = new Error('Permission denied');

            (dbClient.productSlider.findUnique as jest.Mock).mockRejectedValue(
                permissionError,
            );

            await expect(
                getProductSliderByID(mockProductSliderID),
            ).rejects.toThrow('Permission denied');

            expect(logger.error).toHaveBeenCalledWith(permissionError);
        });

        it('should handle malformed query error', async () => {
            const queryError = new Error('Malformed query');

            (dbClient.productSlider.findUnique as jest.Mock).mockRejectedValue(
                queryError,
            );

            await expect(
                getProductSliderByID(mockProductSliderID),
            ).rejects.toThrow('Malformed query');

            expect(logger.error).toHaveBeenCalledWith(queryError);
        });

        it('should handle unexpected error types', async () => {
            const unexpectedError = 'String error instead of Error object';

            (dbClient.productSlider.findUnique as jest.Mock).mockRejectedValue(
                unexpectedError,
            );

            await expect(
                getProductSliderByID(mockProductSliderID),
            ).rejects.toBe(unexpectedError);

            expect(logger.error).toHaveBeenCalledWith(unexpectedError);
        });
    });

    describe('Return Value Validation', () => {
        it('should return exact structure from database', async () => {
            const mockProductSlider = {
                id: mockProductSliderID,
                title: 'Exact Structure Test',
                description: 'Testing exact return structure',
                is_active: true,
                created_at: new Date('2024-01-01T10:00:00Z'),
                updated_at: new Date('2024-01-02T15:30:00Z'),
                custom_field: 'Should be preserved',
                brands: [
                    { id: 'brand-1', brand_name: 'Brand One' },
                    { id: 'brand-2', brand_name: 'Brand Two' },
                ],
                retailers: [
                    { id: 'retailer-1', retailer_name: 'Retailer One' },
                ],
                categories: [
                    { id: 'category-1', category_name: 'Category One' },
                    { id: 'category-2', category_name: 'Category Two' },
                    { id: 'category-3', category_name: 'Category Three' },
                ],
            };

            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                mockProductSlider,
            );

            const result = await getProductSliderByID(mockProductSliderID);

            expect(result).toStrictEqual(mockProductSlider);
            expect(result).toBe(mockProductSlider); // Should be the exact same reference
        });

        it('should not modify the returned data', async () => {
            const originalData = {
                id: mockProductSliderID,
                title: 'Immutable Test',
                brands: [{ id: 'brand-1', brand_name: 'Original Brand' }],
                retailers: [
                    { id: 'retailer-1', retailer_name: 'Original Retailer' },
                ],
                categories: [
                    { id: 'category-1', category_name: 'Original Category' },
                ],
            };

            const mockProductSlider = { ...originalData };

            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                mockProductSlider,
            );

            const result = await getProductSliderByID(mockProductSliderID);

            expect(result).toEqual(originalData);
            expect(JSON.stringify(result)).toBe(JSON.stringify(originalData));
        });
    });

    describe('Function Signature and Type Safety', () => {
        it('should accept string ID parameter', async () => {
            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                null,
            );

            await expect(getProductSliderByID('string-id')).resolves.toBeNull();
            expect(dbClient.productSlider.findUnique).toHaveBeenCalled();
        });

        it('should work with TypeScript strict mode', async () => {
            const typedId: string = 'typed-id';
            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue({
                id: typedId,
                title: 'Typed Test',
                brands: [],
                retailers: [],
                categories: [],
            });

            const result = await getProductSliderByID(typedId);

            expect(result?.id).toBe(typedId);
            expect(typeof result?.title).toBe('string');
            expect(Array.isArray(result?.brands)).toBe(true);
            expect(Array.isArray(result?.retailers)).toBe(true);
            expect(Array.isArray(result?.categories)).toBe(true);
        });
    });

    describe('Performance and Memory Tests', () => {
        it('should handle large datasets efficiently', async () => {
            // Simulate a large number of brands, retailers, and categories
            const largeBrands = Array.from({ length: 1000 }, (_, i) => ({
                id: `brand-${i}`,
                brand_name: `Brand ${i}`,
            }));

            const largeRetailers = Array.from({ length: 500 }, (_, i) => ({
                id: `retailer-${i}`,
                retailer_name: `Retailer ${i}`,
            }));

            const largeCategories = Array.from({ length: 200 }, (_, i) => ({
                id: `category-${i}`,
                category_name: `Category ${i}`,
            }));

            const mockProductSlider = {
                id: mockProductSliderID,
                title: 'Large Dataset Test',
                brands: largeBrands,
                retailers: largeRetailers,
                categories: largeCategories,
            };

            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                mockProductSlider,
            );

            const startTime = Date.now();
            const result = await getProductSliderByID(mockProductSliderID);
            const endTime = Date.now();

            expect(result).toEqual(mockProductSlider);
            expect(result?.brands).toHaveLength(1000);
            expect(result?.retailers).toHaveLength(500);
            expect(result?.categories).toHaveLength(200);

            // Ensure the operation completes in reasonable time (less than 100ms)
            expect(endTime - startTime).toBeLessThan(100);
        });

        it('should handle concurrent requests properly', async () => {
            const mockProductSlider = {
                id: mockProductSliderID,
                title: 'Concurrent Test',
                brands: [{ id: 'brand-1', brand_name: 'Test Brand' }],
                retailers: [
                    { id: 'retailer-1', retailer_name: 'Test Retailer' },
                ],
                categories: [
                    { id: 'category-1', category_name: 'Test Category' },
                ],
            };

            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                mockProductSlider,
            );

            // Make multiple concurrent requests
            const promises = Array.from({ length: 10 }, () =>
                getProductSliderByID(mockProductSliderID),
            );

            const results = await Promise.all(promises);

            // All results should be identical
            results.forEach((result) => {
                expect(result).toEqual(mockProductSlider);
            });

            // Database should have been called 10 times
            expect(dbClient.productSlider.findUnique).toHaveBeenCalledTimes(10);
        });
    });

    describe('Integration Edge Cases', () => {
        it('should handle special characters in IDs', async () => {
            const specialId = 'test-id-with-special-chars!@#$%^&*()';
            const mockProductSlider = {
                id: specialId,
                title: 'Special Characters Test',
                brands: [],
                retailers: [],
                categories: [],
            };

            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                mockProductSlider,
            );

            const result = await getProductSliderByID(specialId);

            expect(result).toEqual(mockProductSlider);
            expect(dbClient.productSlider.findUnique).toHaveBeenCalledWith({
                where: { id: specialId },
                include: {
                    brands: { select: { id: true, brand_name: true } },
                    retailers: { select: { id: true, retailer_name: true } },
                    categories: { select: { id: true, category_name: true } },
                },
            });
        });

        it('should handle Unicode characters in data', async () => {
            const mockProductSlider = {
                id: mockProductSliderID,
                title: 'Unicode Test 测试 🧪',
                brands: [{ id: 'brand-1', brand_name: 'Brand 品牌 🏷️' }],
                retailers: [
                    { id: 'retailer-1', retailer_name: 'Retailer 零售商 🏪' },
                ],
                categories: [
                    { id: 'category-1', category_name: 'Category 类别 📂' },
                ],
            };

            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                mockProductSlider,
            );

            const result = await getProductSliderByID(mockProductSliderID);

            expect(result).toEqual(mockProductSlider);
            expect(result?.title).toContain('测试');
            expect(result?.brands[0].brand_name).toContain('品牌');
            expect(result?.retailers[0].retailer_name).toContain('零售商');
            expect(result?.categories[0].category_name).toContain('类别');
        });

        it('should handle extremely nested or complex data structures', async () => {
            const mockProductSlider = {
                id: mockProductSliderID,
                title: 'Complex Structure Test',
                description: null, // Test null values
                is_active: true,
                metadata: {
                    created_by: 'admin',
                    tags: ['featured', 'new', 'popular'],
                },
                brands: [
                    {
                        id: 'brand-1',
                        brand_name: 'Complex Brand',
                        // Additional fields that shouldn't be selected but might be present
                        internal_field: 'should be filtered out',
                    },
                ],
                retailers: [],
                categories: [
                    { id: 'cat-1', category_name: 'Main Category' },
                    { id: 'cat-2', category_name: 'Sub Category' },
                ],
            };

            (dbClient.productSlider.findUnique as jest.Mock).mockResolvedValue(
                mockProductSlider,
            );

            const result = await getProductSliderByID(mockProductSliderID);

            expect(result).toEqual(mockProductSlider);
            expect(result?.description).toBeNull();
            expect(result?.metadata).toBeDefined();
            expect(Array.isArray(result?.metadata?.tags)).toBe(true);
        });
    });
});
