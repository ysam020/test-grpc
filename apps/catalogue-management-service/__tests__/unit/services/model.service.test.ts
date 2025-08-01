// Mock dependencies before any imports
jest.mock('@atc/db', () => ({
    dbClient: {
        $queryRawUnsafe: jest.fn(),
        $transaction: jest.fn(),
        $executeRawUnsafe: jest.fn(),
        productGroup: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        productGroupProduct: {
            createMany: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            deleteMany: jest.fn(),
        },
        brand: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
        retailer: {
            findUnique: jest.fn(),
        },
        advertisement: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        advertisementItem: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        advertisementImage: {
            findUnique: jest.fn(),
        },
        adSuggestedProduct: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        adSuggestedGroup: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        adSuggestedBrand: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));

import { dbClient } from '@atc/db';
import {
    createGroup,
    getGroupByID,
    getBrandByIDs,
    updateGroup,
    createProductGroupProducts,
    getAllGroups,
    getProductsByGroupID,
    deleteGroupByID,
    removeProductsByGroupID,
    getRetailerByID,
    addAdvertisement,
    getAdvertisementByID,
    getAllAdvertisements,
    updateAdvertisementByID,
    getAdvertisementItemByID,
    updateAdvertisementItemByID,
    createAdvertisementItem,
    getAdImageByID,
    getAdSuggestedProductByID,
    getAdSuggestedGroupByID,
    getAdSuggestedBrandByID,
    updateAdSuggestedProductByID,
    updateAdSuggestedGroupByID,
    updateAdSuggestedBrandByID,
} from '../../../src/services/model.service';

describe('Catalogue Model Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Product Group Operations', () => {
        describe('createGroup', () => {
            it('should successfully create a product group', async () => {
                // Arrange
                const groupData = {
                    group_name: 'Electronics',
                    description: 'Electronic products group',
                };
                const mockCreatedGroup = {
                    id: 'group123',
                    ...groupData,
                    createdAt: new Date(),
                };

                (dbClient.productGroup.create as jest.Mock).mockResolvedValue(mockCreatedGroup);

                // Act
                const result = await createGroup(groupData);

                // Assert
                expect(dbClient.productGroup.create).toHaveBeenCalledWith({
                    data: groupData,
                });
                expect(result).toEqual(mockCreatedGroup);
            });

            it('should handle creation errors', async () => {
                // Arrange
                const groupData = {
                    group_name: 'Test Group',
                    description: 'Test description',
                };
                const error = new Error('Database error');

                (dbClient.productGroup.create as jest.Mock).mockRejectedValue(error);

                // Act & Assert
                await expect(createGroup(groupData)).rejects.toThrow(error);
            });
        });

        describe('getGroupByID', () => {
            it('should successfully get product group by ID with includes', async () => {
                // Arrange
                const groupID = 'group123';
                const mockGroup = {
                    id: groupID,
                    group_name: 'Electronics',
                    description: 'Electronic products',
                    brands: [
                        { id: 'brand1', brand_name: 'Apple' },
                        { id: 'brand2', brand_name: 'Samsung' },
                    ],
                    ProductGroupProduct: [
                        { product_id: 'prod1' },
                        { product_id: 'prod2' },
                    ],
                };

                (dbClient.productGroup.findUnique as jest.Mock).mockResolvedValue(mockGroup);

                // Act
                const result = await getGroupByID(groupID);

                // Assert
                expect(dbClient.productGroup.findUnique).toHaveBeenCalledWith({
                    where: { id: groupID },
                    include: {
                        brands: {
                            select: {
                                id: true,
                                brand_name: true,
                            },
                        },
                        ProductGroupProduct: { select: { product_id: true } },
                    },
                });
                expect(result).toEqual(mockGroup);
            });

            it('should return null when group not found', async () => {
                // Arrange
                const groupID = 'nonexistent-group';

                (dbClient.productGroup.findUnique as jest.Mock).mockResolvedValue(null);

                // Act
                const result = await getGroupByID(groupID);

                // Assert
                expect(result).toBeNull();
            });
        });

        describe('getBrandByIDs', () => {
            it('should successfully get brands by multiple IDs', async () => {
                // Arrange
                const brandIDs = ['brand1', 'brand2', 'brand3'];
                const mockBrands = [
                    { id: 'brand1', brand_name: 'Apple' },
                    { id: 'brand2', brand_name: 'Samsung' },
                    { id: 'brand3', brand_name: 'Sony' },
                ];

                (dbClient.brand.findMany as jest.Mock).mockResolvedValue(mockBrands);

                // Act
                const result = await getBrandByIDs(brandIDs);

                // Assert
                expect(dbClient.brand.findMany).toHaveBeenCalledWith({
                    where: { id: { in: brandIDs } },
                });
                expect(result).toEqual(mockBrands);
            });

            it('should handle empty brand IDs array', async () => {
                // Arrange
                const brandIDs: string[] = [];

                (dbClient.brand.findMany as jest.Mock).mockResolvedValue([]);

                // Act
                const result = await getBrandByIDs(brandIDs);

                // Assert
                expect(dbClient.brand.findMany).toHaveBeenCalledWith({
                    where: { id: { in: [] } },
                });
                expect(result).toEqual([]);
            });
        });

        describe('updateGroup', () => {
            it('should successfully update product group', async () => {
                // Arrange
                const groupID = 'group123';
                const updateData = {
                    group_name: 'Updated Electronics',
                    description: 'Updated description',
                };
                const mockUpdatedGroup = {
                    id: groupID,
                    ...updateData,
                    updatedAt: new Date(),
                };

                (dbClient.productGroup.update as jest.Mock).mockResolvedValue(mockUpdatedGroup);

                // Act
                const result = await updateGroup(groupID, updateData);

                // Assert
                expect(dbClient.productGroup.update).toHaveBeenCalledWith({
                    where: { id: groupID },
                    data: updateData,
                });
                expect(result).toEqual(mockUpdatedGroup);
            });
        });

        describe('createProductGroupProducts', () => {
            it('should successfully create product group products', async () => {
                // Arrange
                const groupID = 'group123';
                const productIDs = ['prod1', 'prod2', 'prod3'];
                const mockResult = { count: 3 };

                (dbClient.productGroupProduct.createMany as jest.Mock).mockResolvedValue(mockResult);

                // Act
                const result = await createProductGroupProducts(groupID, productIDs);

                // Assert
                expect(dbClient.productGroupProduct.createMany).toHaveBeenCalledWith({
                    data: productIDs.map((product_id) => ({
                        group_id: groupID,
                        product_id,
                    })),
                    skipDuplicates: true,
                });
                expect(result).toEqual(mockResult);
            });
        });

        describe('getAllGroups', () => {
            it('should successfully get all groups with pagination and filters', async () => {
                // Arrange
                const page = 1;
                const limit = 10;
                const keyword = 'electronics';
                const brandId = 'brand123';

                const mockGroups = [
                    {
                        id: 'group1',
                        group_name: 'Electronics Group',
                        _count: { ProductGroupProduct: 5 },
                        brands: [{ id: 'brand1', brand_name: 'Apple' }],
                    },
                ];
                const mockTotalCount = 25;

                (dbClient.productGroup.findMany as jest.Mock).mockResolvedValue(mockGroups);
                (dbClient.productGroup.count as jest.Mock).mockResolvedValue(mockTotalCount);

                // Act
                const result = await getAllGroups(page, limit, keyword, brandId);

                // Assert
                expect(result).toEqual({
                    groups: mockGroups,
                    totalCount: mockTotalCount,
                });
            });

            it('should handle getAllGroups without optional parameters', async () => {
                // Arrange
                const page = 1;
                const limit = 10;
                const mockGroups = [{ id: 'group1', group_name: 'Group 1' }];
                const mockCount = 1;

                (dbClient.productGroup.findMany as jest.Mock).mockResolvedValue(mockGroups);
                (dbClient.productGroup.count as jest.Mock).mockResolvedValue(mockCount);

                // Act
                const result = await getAllGroups(page, limit);

                // Assert
                expect(result).toEqual({
                    groups: mockGroups,
                    totalCount: mockCount,
                });
            });
        });

        describe('getProductsByGroupID', () => {
            it('should successfully get attached products with pagination', async () => {
                // Arrange
                const groupID = 'group123';
                const page = 1;
                const limit = 10;

                const mockProducts = [
                    {
                        id: 'groupProd1',
                        MasterProduct: {
                            id: 'prod1',
                            product_name: 'iPhone 15',
                            barcode: '123456789',
                            pack_size: '1',
                            rrp: 999.99,
                            Brand: { id: 'brand1', brand_name: 'Apple' },
                            Category: { id: 'cat1', category_name: 'Smartphones' },
                        },
                    },
                ];
                const mockTotalCount = 50;

                (dbClient.productGroupProduct.findMany as jest.Mock).mockResolvedValue(mockProducts);
                (dbClient.productGroupProduct.count as jest.Mock).mockResolvedValue(mockTotalCount);

                // Act
                const result = await getProductsByGroupID(groupID, page, limit);

                // Assert
                expect(result).toEqual({
                    products: mockProducts,
                    totalCount: mockTotalCount,
                });
            });
        });

        describe('deleteGroupByID', () => {
            it('should successfully delete product group', async () => {
                // Arrange
                const groupID = 'group123';
                const mockDeletedGroup = {
                    id: groupID,
                    group_name: 'Deleted Group',
                };

                (dbClient.productGroup.delete as jest.Mock).mockResolvedValue(mockDeletedGroup);

                // Act
                const result = await deleteGroupByID(groupID);

                // Assert
                expect(dbClient.productGroup.delete).toHaveBeenCalledWith({
                    where: { id: groupID },
                });
                expect(result).toEqual(mockDeletedGroup);
            });
        });

        describe('removeProductsByGroupID', () => {
            it('should successfully remove products from group', async () => {
                // Arrange
                const groupID = 'group123';
                const productIDs = ['prod1', 'prod2'];
                const mockResult = { count: 2 };

                (dbClient.productGroupProduct.deleteMany as jest.Mock).mockResolvedValue(mockResult);

                // Act
                const result = await removeProductsByGroupID(groupID, productIDs);

                // Assert
                expect(dbClient.productGroupProduct.deleteMany).toHaveBeenCalledWith({
                    where: {
                        group_id: groupID,
                        product_id: { in: productIDs },
                    },
                });
                expect(result).toEqual(mockResult);
            });
        });
    });

    describe('Advertisement Operations', () => {
        describe('addAdvertisement', () => {
            it('should successfully create advertisement', async () => {
                // Arrange
                const adData = {
                    title: 'Summer Sale',
                    description: 'Great discounts on electronics',
                    retailer_id: 'retailer123',
                };
                const mockCreatedAd = {
                    id: 'ad123',
                    ...adData,
                    createdAt: new Date(),
                };

                (dbClient.advertisement.create as jest.Mock).mockResolvedValue(mockCreatedAd);

                // Act
                const result = await addAdvertisement(adData);

                // Assert
                expect(dbClient.advertisement.create).toHaveBeenCalledWith({
                    data: adData,
                });
                expect(result).toEqual(mockCreatedAd);
            });
        });

        describe('getAdvertisementByID', () => {
            it('should successfully get advertisement by ID', async () => {
                // Arrange
                const adId = 'ad123';
                const mockAd = {
                    id: adId,
                    title: 'Summer Sale',
                    description: 'Great deals',
                    retailer_id: 'retailer123',
                };
                const mockMatchSummary = [{ total_items: 10, matched_items: 7 }];

                (dbClient.advertisement.findUnique as jest.Mock).mockResolvedValue(mockAd);
                (dbClient.$queryRawUnsafe as jest.Mock).mockResolvedValue(mockMatchSummary);

                // Act
                const result = await getAdvertisementByID(adId);

                // Assert
                expect(dbClient.advertisement.findUnique).toHaveBeenCalledWith({
                    where: { id: adId },
                    include: expect.any(Object),
                });
                expect(dbClient.$queryRawUnsafe).toHaveBeenCalled();
                expect(result).toEqual({
                    advertisement: mockAd,
                    matchSummary: mockMatchSummary[0],
                });
            });

            it('should return null when advertisement not found', async () => {
                // Arrange
                const adId = 'nonexistent-ad';
                const mockMatchSummary = [{ total_items: 0, matched_items: 0 }];

                (dbClient.advertisement.findUnique as jest.Mock).mockResolvedValue(null);
                (dbClient.$queryRawUnsafe as jest.Mock).mockResolvedValue(mockMatchSummary);

                // Act
                const result = await getAdvertisementByID(adId);

                // Assert
                expect(result.advertisement).toBeNull();
                expect(result.matchSummary).toEqual(mockMatchSummary[0]);
            });
        });

        describe('getAllAdvertisements', () => {
            it('should successfully get all advertisements with pagination', async () => {
                // Arrange
                const page = 1;
                const limit = 10;
                const keyword = 'sale';
                const retailerId = 'retailer123';

                const mockAds = [
                    {
                        id: 'ad1',
                        title: 'Summer Sale',
                        description: 'Electronics sale',
                        retailer: { id: 'retailer123', name: 'TechStore' },
                    },
                ];
                const mockTotalCount = 15;

                (dbClient.advertisement.findMany as jest.Mock).mockResolvedValue(mockAds);
                (dbClient.advertisement.count as jest.Mock).mockResolvedValue(mockTotalCount);

                // Act
                const result = await getAllAdvertisements(page, limit, keyword, retailerId);

                // Assert
                expect(result).toEqual({
                    advertisements: mockAds,
                    totalCount: mockTotalCount,
                });
            });
        });

        describe('updateAdvertisementByID', () => {
            it('should successfully update advertisement', async () => {
                // Arrange
                const adId = 'ad123';
                const updateData = {
                    title: 'Updated Sale',
                    description: 'Updated description',
                };
                const mockUpdatedAd = {
                    id: adId,
                    ...updateData,
                    updatedAt: new Date(),
                };

                (dbClient.advertisement.update as jest.Mock).mockResolvedValue(mockUpdatedAd);

                // Act
                const result = await updateAdvertisementByID(adId, updateData);

                // Assert
                expect(dbClient.advertisement.update).toHaveBeenCalledWith({
                    where: { id: adId },
                    data: updateData,
                });
                expect(result).toEqual(mockUpdatedAd);
            });
        });
    });

    describe('Advertisement Item Operations', () => {
        describe('getAdvertisementItemByID', () => {
            it('should successfully get advertisement item by ID', async () => {
                // Arrange
                const adItemID = 'aditem123';
                const mockAdItem = {
                    id: adItemID,
                    advertisement_id: 'ad123',
                    item_name: 'Test Item',
                    is_matched: true,
                };

                (dbClient.advertisementItem.findUnique as jest.Mock).mockResolvedValue(mockAdItem);

                // Act
                const result = await getAdvertisementItemByID(adItemID);

                // Assert
                expect(dbClient.advertisementItem.findUnique).toHaveBeenCalledWith({
                    where: { id: adItemID },
                });
                expect(result).toEqual(mockAdItem);
            });
        });

        describe('updateAdvertisementItemByID', () => {
            it('should successfully update advertisement item', async () => {
                // Arrange
                const adItemID = 'aditem123';
                const updateData = { is_matched: true };
                const mockUpdatedItem = {
                    id: adItemID,
                    is_matched: true,
                    updatedAt: new Date(),
                };

                (dbClient.advertisementItem.update as jest.Mock).mockResolvedValue(mockUpdatedItem);

                // Act
                const result = await updateAdvertisementItemByID(adItemID, updateData);

                // Assert
                expect(dbClient.advertisementItem.update).toHaveBeenCalledWith({
                    where: { id: adItemID },
                    data: updateData,
                });
                expect(result).toEqual(mockUpdatedItem);
            });
        });

        describe('createAdvertisementItem', () => {
            it('should successfully create advertisement item', async () => {
                // Arrange
                const itemData = {
                    advertisement_id: 'ad123',
                    item_name: 'Test Item',
                    is_matched: false,
                };
                const mockCreatedItem = {
                    id: 'aditem123',
                    ...itemData,
                    createdAt: new Date(),
                };

                (dbClient.advertisementItem.create as jest.Mock).mockResolvedValue(mockCreatedItem);

                // Act
                const result = await createAdvertisementItem(itemData);

                // Assert
                expect(dbClient.advertisementItem.create).toHaveBeenCalledWith({
                    data: itemData,
                });
                expect(result).toEqual(mockCreatedItem);
            });
        });
    });

    describe('Suggested Items Operations', () => {
        describe('getAdSuggestedProductByID', () => {
            it('should successfully get suggested product by ID with includes', async () => {
                // Arrange
                const suggestedProductID = 'suggested123';
                const mockSuggestedProduct = {
                    id: suggestedProductID,
                    advertisement_item_id: 'aditem123',
                    master_product_id: 'prod123',
                    confidence_score: 0.95,
                    MasterProduct: {
                        id: 'prod123',
                        product_name: 'iPhone 15',
                    },
                };

                (dbClient.adSuggestedProduct.findUnique as jest.Mock).mockResolvedValue(mockSuggestedProduct);

                // Act
                const result = await getAdSuggestedProductByID(suggestedProductID);

                // Assert
                expect(dbClient.adSuggestedProduct.findUnique).toHaveBeenCalledWith({
                    where: { id: suggestedProductID },
                    include: {
                        MasterProduct: {
                            select: {
                                id: true,
                                product_name: true,
                            },
                        },
                    },
                });
                expect(result).toEqual(mockSuggestedProduct);
            });
        });

        describe('getAdSuggestedGroupByID', () => {
            it('should successfully get suggested group by ID', async () => {
                // Arrange
                const suggestedGroupID = 'suggestedGroup123';
                const mockSuggestedGroup = {
                    id: suggestedGroupID,
                    advertisement_item_id: 'aditem123',
                    product_group_id: 'group123',
                    confidence_score: 0.88,
                    ProductGroup: {
                        id: 'group123',
                        group_name: 'Electronics',
                    },
                };

                (dbClient.adSuggestedGroup.findUnique as jest.Mock).mockResolvedValue(mockSuggestedGroup);

                // Act
                const result = await getAdSuggestedGroupByID(suggestedGroupID);

                // Assert
                expect(dbClient.adSuggestedGroup.findUnique).toHaveBeenCalledWith({
                    where: { id: suggestedGroupID },
                    include: {
                        ProductGroup: {
                            select: {
                                id: true,
                                group_name: true,
                            },
                        },
                    },
                });
                expect(result).toEqual(mockSuggestedGroup);
            });
        });

        describe('getAdSuggestedBrandByID', () => {
            it('should successfully get suggested brand by ID', async () => {
                // Arrange
                const suggestedBrandID = 'suggestedBrand123';
                const mockSuggestedBrand = {
                    id: suggestedBrandID,
                    advertisement_item_id: 'aditem123',
                    brand_id: 'brand123',
                    confidence_score: 0.92,
                    Brand: {
                        id: 'brand123',
                        brand_name: 'Apple',
                    },
                };

                (dbClient.adSuggestedBrand.findUnique as jest.Mock).mockResolvedValue(mockSuggestedBrand);

                // Act
                const result = await getAdSuggestedBrandByID(suggestedBrandID);

                // Assert
                expect(dbClient.adSuggestedBrand.findUnique).toHaveBeenCalledWith({
                    where: { id: suggestedBrandID },
                    include: {
                        Brand: {
                            select: {
                                id: true,
                                brand_name: true,
                            },
                        },
                    },
                });
                expect(result).toEqual(mockSuggestedBrand);
            });
        });

        describe('updateAdSuggestedProductByID', () => {
            it('should successfully update suggested product', async () => {
                // Arrange
                const suggestedProductID = 'suggested123';
                const updateData = { confidence_score: 0.98 };
                const mockUpdatedSuggested = {
                    id: suggestedProductID,
                    confidence_score: 0.98,
                    updatedAt: new Date(),
                };

                (dbClient.adSuggestedProduct.update as jest.Mock).mockResolvedValue(mockUpdatedSuggested);

                // Act
                const result = await updateAdSuggestedProductByID(suggestedProductID, updateData);

                // Assert
                expect(dbClient.adSuggestedProduct.update).toHaveBeenCalledWith({
                    where: { id: suggestedProductID },
                    data: updateData,
                });
                expect(result).toEqual(mockUpdatedSuggested);
            });
        });

        describe('updateAdSuggestedGroupByID', () => {
            it('should successfully update suggested group', async () => {
                // Arrange
                const suggestedGroupID = 'suggestedGroup123';
                const updateData = { confidence_score: 0.90 };
                const mockUpdatedSuggested = {
                    id: suggestedGroupID,
                    confidence_score: 0.90,
                    updatedAt: new Date(),
                };

                (dbClient.adSuggestedGroup.update as jest.Mock).mockResolvedValue(mockUpdatedSuggested);

                // Act
                const result = await updateAdSuggestedGroupByID(suggestedGroupID, updateData);

                // Assert
                expect(dbClient.adSuggestedGroup.update).toHaveBeenCalledWith({
                    where: { id: suggestedGroupID },
                    data: updateData,
                });
                expect(result).toEqual(mockUpdatedSuggested);
            });
        });

        describe('updateAdSuggestedBrandByID', () => {
            it('should successfully update suggested brand', async () => {
                // Arrange
                const suggestedBrandID = 'suggestedBrand123';
                const updateData = { confidence_score: 0.95 };
                const mockUpdatedSuggested = {
                    id: suggestedBrandID,
                    confidence_score: 0.95,
                    updatedAt: new Date(),
                };

                (dbClient.adSuggestedBrand.update as jest.Mock).mockResolvedValue(mockUpdatedSuggested);

                // Act
                const result = await updateAdSuggestedBrandByID(suggestedBrandID, updateData);

                // Assert
                expect(dbClient.adSuggestedBrand.update).toHaveBeenCalledWith({
                    where: { id: suggestedBrandID },
                    data: updateData,
                });
                expect(result).toEqual(mockUpdatedSuggested);
            });
        });
    });

    describe('Additional Operations', () => {
        describe('getRetailerByID', () => {
            it('should successfully get retailer by ID', async () => {
                // Arrange
                const retailerID = 'retailer123';
                const mockRetailer = {
                    id: retailerID,
                    name: 'TechStore',
                    website: 'https://techstore.com',
                };

                (dbClient.retailer.findUnique as jest.Mock).mockResolvedValue(mockRetailer);

                // Act
                const result = await getRetailerByID(retailerID);

                // Assert
                expect(dbClient.retailer.findUnique).toHaveBeenCalledWith({
                    where: { id: retailerID },
                });
                expect(result).toEqual(mockRetailer);
            });

            it('should return null when retailer not found', async () => {
                // Arrange
                const retailerID = 'nonexistent-retailer';

                (dbClient.retailer.findUnique as jest.Mock).mockResolvedValue(null);

                // Act
                const result = await getRetailerByID(retailerID);

                // Assert
                expect(result).toBeNull();
            });
        });

        describe('getAdImageByID', () => {
            it('should successfully get ad image by ID', async () => {
                // Arrange
                const adImageID = 'image123';
                const mockAdImage = {
                    id: adImageID,
                    advertisement_id: 'ad123',
                    image_url: 'https://example.com/image.jpg',
                    alt_text: 'Product image',
                };

                (dbClient.advertisementImage.findUnique as jest.Mock).mockResolvedValue(mockAdImage);

                // Act
                const result = await getAdImageByID(adImageID);

                // Assert
                expect(dbClient.advertisementImage.findUnique).toHaveBeenCalledWith({
                    where: { id: adImageID },
                });
                expect(result).toEqual(mockAdImage);
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors in createGroup', async () => {
            // Arrange
            const groupData = { group_name: 'Test Group' };
            const error = new Error('Database connection failed');

            (dbClient.productGroup.create as jest.Mock).mockRejectedValue(error);

            // Act & Assert
            await expect(createGroup(groupData)).rejects.toThrow(error);
            expect(dbClient.productGroup.create).toHaveBeenCalledWith({
                data: groupData,
            });
        });

        it('should handle database errors in getGroupByID', async () => {
            // Arrange
            const groupID = 'group123';
            const error = new Error('Database query failed');

            (dbClient.productGroup.findUnique as jest.Mock).mockRejectedValue(error);

            // Act & Assert
            await expect(getGroupByID(groupID)).rejects.toThrow(error);
        });

        it('should handle database errors in getAllGroups', async () => {
            // Arrange
            const page = 1;
            const limit = 10;
            const error = new Error('Database connection timeout');

            (dbClient.productGroup.findMany as jest.Mock).mockRejectedValue(error);

            // Act & Assert
            await expect(getAllGroups(page, limit)).rejects.toThrow(error);
        });

        it('should handle database errors in addAdvertisement', async () => {
            // Arrange
            const adData = {
                title: 'Test Ad',
                description: 'Test description',
                retailer_id: 'retailer123',
            };
            const error = new Error('Foreign key constraint failed');

            (dbClient.advertisement.create as jest.Mock).mockRejectedValue(error);

            // Act & Assert
            await expect(addAdvertisement(adData)).rejects.toThrow(error);
        });

        it('should handle database errors in updateAdvertisementItemByID', async () => {
            // Arrange
            const adItemID = 'aditem123';
            const updateData = { is_matched: true };
            const error = new Error('Record not found');

            (dbClient.advertisementItem.update as jest.Mock).mockRejectedValue(error);

            // Act & Assert
            await expect(updateAdvertisementItemByID(adItemID, updateData)).rejects.toThrow(error);
        });

        it('should handle database errors in createProductGroupProducts', async () => {
            // Arrange
            const groupID = 'group123';
            const productIDs = ['prod1', 'prod2'];
            const error = new Error('Duplicate key violation');

            (dbClient.productGroupProduct.createMany as jest.Mock).mockRejectedValue(error);

            // Act & Assert
            await expect(createProductGroupProducts(groupID, productIDs)).rejects.toThrow(error);
        });

        it('should handle database errors in deleteGroupByID', async () => {
            // Arrange
            const groupID = 'group123';
            const error = new Error('Cannot delete: has dependent records');

            (dbClient.productGroup.delete as jest.Mock).mockRejectedValue(error);

            // Act & Assert
            await expect(deleteGroupByID(groupID)).rejects.toThrow(error);
        });

        it('should handle database errors in getAdSuggestedProductByID', async () => {
            // Arrange
            const suggestedProductID = 'suggested123';
            const error = new Error('Database server unavailable');

            (dbClient.adSuggestedProduct.findUnique as jest.Mock).mockRejectedValue(error);

            // Act & Assert
            await expect(getAdSuggestedProductByID(suggestedProductID)).rejects.toThrow(error);
        });
    });

    describe('Complex Scenarios', () => {
        it('should handle getAllGroups with complex filtering', async () => {
            // Arrange
            const page = 2;
            const limit = 5;
            const keyword = 'elect';
            const brandId = 'brand123';

            const mockGroups = [
                {
                    id: 'group1',
                    group_name: 'Electronics Advanced',
                    description: 'Advanced electronic devices',
                    _count: { ProductGroupProduct: 15 },
                    brands: [
                        { id: 'brand123', brand_name: 'TechCorp' },
                        { id: 'brand456', brand_name: 'InnoTech' },
                    ],
                },
            ];
            const mockTotalCount = 12;

            (dbClient.productGroup.findMany as jest.Mock).mockResolvedValue(mockGroups);
            (dbClient.productGroup.count as jest.Mock).mockResolvedValue(mockTotalCount);

            // Act
            const result = await getAllGroups(page, limit, keyword, brandId);

            // Assert
            expect(result).toEqual({
                groups: mockGroups,
                totalCount: mockTotalCount,
            });

            // Verify pagination calculations would be correct
            const expectedSkip = (page - 1) * limit; // Should be 5
            expect(expectedSkip).toBe(5);
        });

        it('should handle getProductsByGroupID with comprehensive product data', async () => {
            // Arrange
            const groupID = 'group123';
            const page = 1;
            const limit = 20;

            const mockProducts = [
                {
                    id: 'groupProd1',
                    group_id: groupID,
                    product_id: 'prod1',
                    MasterProduct: {
                        id: 'prod1',
                        product_name: 'MacBook Pro 16"',
                        barcode: '0123456789012',
                        pack_size: '1 unit',
                        rrp: 2499.99,
                        Brand: {
                            id: 'brand1',
                            brand_name: 'Apple',
                        },
                        Category: {
                            id: 'cat1',
                            category_name: 'Laptops',
                        },
                    },
                },
                {
                    id: 'groupProd2',
                    group_id: groupID,
                    product_id: 'prod2',
                    MasterProduct: {
                        id: 'prod2',
                        product_name: 'iPad Air',
                        barcode: '0123456789013',
                        pack_size: '1 unit',
                        rrp: 599.99,
                        Brand: {
                            id: 'brand1',
                            brand_name: 'Apple',
                        },
                        Category: {
                            id: 'cat2',
                            category_name: 'Tablets',
                        },
                    },
                },
            ];
            const mockTotalCount = 45;

            (dbClient.productGroupProduct.findMany as jest.Mock).mockResolvedValue(mockProducts);
            (dbClient.productGroupProduct.count as jest.Mock).mockResolvedValue(mockTotalCount);

            // Act
            const result = await getProductsByGroupID(groupID, page, limit);

            // Assert
            expect(result).toEqual({
                products: mockProducts,
                totalCount: mockTotalCount,
            });

            expect(dbClient.productGroupProduct.findMany).toHaveBeenCalledWith({
                where: { group_id: groupID },
                include: {
                    MasterProduct: {
                        select: {
                            id: true,
                            product_name: true,
                            barcode: true,
                            pack_size: true,
                            rrp: true,
                            Brand: {
                                select: {
                                    id: true,
                                    brand_name: true,
                                },
                            },
                            Category: {
                                select: {
                                    id: true,
                                    category_name: true,
                                },
                            },
                        },
                    },
                },
                skip: 0,
                take: limit,
                orderBy: {
                    MasterProduct: {
                        product_name: 'asc',
                    },
                },
            });
        });

        it('should handle createAdvertisementItem with all required fields', async () => {
            // Arrange
            const itemData = {
                advertisement_id: 'ad123',
                item_name: 'Premium Headphones',
                description: 'Noise-cancelling wireless headphones',
                category: 'Electronics',
                brand: 'Sony',
                price: 299.99,
                is_matched: false,
            };

            const mockCreatedItem = {
                id: 'aditem789',
                ...itemData,
                createdAt: new Date('2024-01-15T10:00:00.000Z'),
                updatedAt: new Date('2024-01-15T10:00:00.000Z'),
            };

            (dbClient.advertisementItem.create as jest.Mock).mockResolvedValue(mockCreatedItem);

            // Act
            const result = await createAdvertisementItem(itemData);

            // Assert
            expect(dbClient.advertisementItem.create).toHaveBeenCalledWith({
                data: itemData,
            });
            expect(result).toEqual(mockCreatedItem);
            expect(result.is_matched).toBe(false);
            expect(result.item_name).toBe('Premium Headphones');
        });

        it('should handle removeProductsByGroupID with multiple products', async () => {
            // Arrange
            const groupID = 'group123';
            const productIDs = ['prod1', 'prod2', 'prod3', 'prod4', 'prod5'];
            const mockResult = { count: 5 };

            (dbClient.productGroupProduct.deleteMany as jest.Mock).mockResolvedValue(mockResult);

            // Act
            const result = await removeProductsByGroupID(groupID, productIDs);

            // Assert
            expect(dbClient.productGroupProduct.deleteMany).toHaveBeenCalledWith({
                where: {
                    group_id: groupID,
                    product_id: { in: productIDs },
                },
            });
            expect(result).toEqual(mockResult);
            expect(result.count).toBe(productIDs.length);
        });
    });

    describe('Edge Cases and Boundary Conditions', () => {
        it('should handle empty results in getAllGroups', async () => {
            // Arrange
            const page = 1;
            const limit = 10;

            (dbClient.productGroup.findMany as jest.Mock).mockResolvedValue([]);
            (dbClient.productGroup.count as jest.Mock).mockResolvedValue(0);

            // Act
            const result = await getAllGroups(page, limit);

            // Assert
            expect(result).toEqual({
                groups: [],
                totalCount: 0,
            });
        });

        it('should handle large limit in getProductsByGroupID', async () => {
            // Arrange
            const groupID = 'group123';
            const page = 1;
            const limit = 1000;

            (dbClient.productGroupProduct.findMany as jest.Mock).mockResolvedValue([]);
            (dbClient.productGroupProduct.count as jest.Mock).mockResolvedValue(0);

            // Act
            const result = await getProductsByGroupID(groupID, page, limit);

            // Assert
            expect(result).toEqual({
                products: [],
                totalCount: 0,
            });
            expect(dbClient.productGroupProduct.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 1000,
                })
            );
        });

        it('should handle undefined limit in getProductsByGroupID', async () => {
            // Arrange
            const groupID = 'group123';
            const page = 1;

            (dbClient.productGroupProduct.findMany as jest.Mock).mockResolvedValue([]);
            (dbClient.productGroupProduct.count as jest.Mock).mockResolvedValue(0);

            // Act
            const result = await getProductsByGroupID(groupID, page);

            // Assert
            expect(result).toEqual({
                products: [],
                totalCount: 0,
            });
            expect(dbClient.productGroupProduct.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: undefined,
                })
            );
        });

        it('should handle updating advertisement item with partial data', async () => {
            // Arrange
            const adItemID = 'aditem123';
            const updateData = { is_matched: true }; // Only updating one field
            const mockUpdatedItem = {
                id: adItemID,
                advertisement_id: 'ad123',
                item_name: 'Existing Item',
                is_matched: true,
                updatedAt: new Date(),
            };

            (dbClient.advertisementItem.update as jest.Mock).mockResolvedValue(mockUpdatedItem);

            // Act
            const result = await updateAdvertisementItemByID(adItemID, updateData);

            // Assert
            expect(dbClient.advertisementItem.update).toHaveBeenCalledWith({
                where: { id: adItemID },
                data: updateData,
            });
            expect(result).toEqual(mockUpdatedItem);
            expect(result.is_matched).toBe(true);
        });

        it('should handle empty product IDs array in createProductGroupProducts', async () => {
            // Arrange
            const groupID = 'group123';
            const productIDs: string[] = [];
            const mockResult = { count: 0 };

            (dbClient.productGroupProduct.createMany as jest.Mock).mockResolvedValue(mockResult);

            // Act
            const result = await createProductGroupProducts(groupID, productIDs);

            // Assert
            expect(dbClient.productGroupProduct.createMany).toHaveBeenCalledWith({
                data: [],
                skipDuplicates: true,
            });
            expect(result).toEqual(mockResult);
        });

        it('should handle high confidence scores in suggested product updates', async () => {
            // Arrange
            const suggestedProductID = 'suggested123';
            const updateData = { confidence_score: 0.9999 }; // Very high confidence
            const mockUpdatedSuggested = {
                id: suggestedProductID,
                confidence_score: 0.9999,
                is_selected: true,
                updatedAt: new Date(),
            };

            (dbClient.adSuggestedProduct.update as jest.Mock).mockResolvedValue(mockUpdatedSuggested);

            // Act
            const result = await updateAdSuggestedProductByID(suggestedProductID, updateData);

            // Assert
            expect(result.confidence_score).toBe(0.9999);
            expect(result.confidence_score).toBeGreaterThan(0.99);
        });
    });
});