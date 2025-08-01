import { dbClient, prismaClient } from '@atc/db';
import { logger } from '@atc/logger';
import XLSX from 'xlsx';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import {
    brandExcelSchema,
    categoryExcelSchema,
    masterProductExcelSchema,
    productRetailerExcelSchema,
    retailerExcelSchema,
    supplierExcelSchema,
} from '../validations/product.validation';
import { status } from '@grpc/grpc-js';

const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, '');

const getAllCategories = async function (dbClient: prismaClient.PrismaClient) {
    const categories = await dbClient.category.findMany({
        select: {
            id: true,
            category_name: true,
            parent_category_id: true,
        },
    });

    return categories.reduce(
        (acc, category) => {
            const normalizedName = normalize(category.category_name);
            if (!acc[normalizedName]) {
                acc[normalizedName] = [];
            }

            acc[normalizedName].push({
                id: category.id,
                parent_category_id: category.parent_category_id,
            });

            return acc;
        },
        {} as Record<
            string,
            { id: string; parent_category_id: string | null }[]
        >,
    );
};

const findCategoryID = (
    categories: Record<
        string,
        { id: string; parent_category_id: string | null }[]
    >,
    categoryHierarchy: string,
): string | null => {
    const categoryList = categoryHierarchy
        .split('>')
        .map((item) => item.trim().toLowerCase().replace(/\s+/g, ''))
        .reverse();

    for (let i = 0; i < categoryList.length; i++) {
        const currentCategory = categoryList[i];
        const potentialMatches = categories[currentCategory!];

        if (!potentialMatches || potentialMatches.length === 0) continue;

        if (i === categoryList.length - 1) {
            return potentialMatches[0]!.id;
        }

        const parentCategory = categoryList[i + 1];
        const parentMatches = categories[parentCategory!];
        if (!parentMatches || parentMatches.length === 0) continue;

        const parentIDs = new Set(parentMatches.map((p) => p.id));
        for (const match of potentialMatches) {
            if (
                match.parent_category_id &&
                parentIDs.has(match.parent_category_id)
            ) {
                return match.id;
            }
        }

        return potentialMatches[0]!.id;
    }

    return categories['home']?.[0]?.id || null;
};

const getMappings = async (dbClient: prismaClient.PrismaClient) => {
    const rows = await dbClient.$queryRawUnsafe<
        {
            type: 'brand' | 'retailer' | 'category';
            id: string;
            name: string;
            parent_id: string | null;
        }[]
    >(`
        SELECT 'brand' AS type, id::text, brand_name AS name, NULL::text AS parent_id FROM "Brand"
        UNION ALL
        SELECT 'retailer' AS type, id::text, retailer_name AS name, NULL::text AS parent_id FROM "Retailer"
        UNION ALL
        SELECT 'category' AS type, id::text, category_name AS name, parent_category_id::text AS parent_id FROM "Category"
  `);

    const brandMap = new Map<string, string>();
    const retailerMap = new Map<string, string>();
    const categoryMap: Record<
        string,
        { id: string; parent_category_id: string | null }[]
    > = {};

    for (const row of rows) {
        const normalized = normalize(row.name);

        if (row.type === 'brand') {
            brandMap.set(normalized, row.id);
        } else if (row.type === 'retailer') {
            retailerMap.set(normalized, row.id);
        } else if (row.type === 'category') {
            if (!categoryMap[normalized]) {
                categoryMap[normalized] = [];
            }
            categoryMap[normalized].push({
                id: row.id,
                parent_category_id: row.parent_id,
            });
        }
    }

    return { brandMap, retailerMap, categoryMap };
};

export enum ImportModel {
    MASTER_PRODUCT = 'master-product',
    RETAILER = 'retailer',
    SUPPLIER = 'supplier',
    BRAND = 'brand',
    CATEGORY = 'category',
}

const schemas = {
    [ImportModel.MASTER_PRODUCT]: masterProductExcelSchema,
    [ImportModel.RETAILER]: retailerExcelSchema,
    [ImportModel.SUPPLIER]: supplierExcelSchema,
    [ImportModel.BRAND]: brandExcelSchema,
    [ImportModel.CATEGORY]: categoryExcelSchema,
} as const;

export const importExcelToDB = async function (
    model: ImportModel,
    buffer: Buffer,
) {
    try {
        const schema = schemas[model];
        if (!schema) {
            return {
                status: 400,
                message: `Model ${model} is not supported`,
            };
        }

        // Read Excel file from buffer
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        if (model === ImportModel.MASTER_PRODUCT) {
            const productSheetName = workbook.SheetNames[0];
            const retailerSheetName = workbook.SheetNames[1];

            if (!productSheetName || !retailerSheetName) {
                return {
                    status: status.INVALID_ARGUMENT,
                    message:
                        'Required sheet names are missing in the Excel file.',
                };
            }

            const productWorksheet = workbook.Sheets[productSheetName];
            const retailerWorksheet = workbook.Sheets[retailerSheetName];

            if (!productWorksheet || !retailerWorksheet) {
                return {
                    status: status.INVALID_ARGUMENT,
                    message:
                        'Required sheet names are missing in the Excel file.',
                };
            }

            const productData = XLSX.utils.sheet_to_json(productWorksheet, {
                raw: false,
            });
            const retailerData = XLSX.utils.sheet_to_json(retailerWorksheet, {
                raw: false,
            });

            let productResult;
            let retailerResult;

            try {
                productResult = masterProductExcelSchema.parse({
                    data: productData,
                });
                retailerResult = productRetailerExcelSchema.parse({
                    data: retailerData,
                });
            } catch (error) {
                if (error instanceof ZodError) {
                    return {
                        status: status.INVALID_ARGUMENT,
                        message: fromZodError(error).toString(),
                    };
                } else {
                    return {
                        status: status.INVALID_ARGUMENT,
                        message: 'Invalid data format',
                    };
                }
            }

            const { brandMap, retailerMap, categoryMap } =
                await getMappings(dbClient);

            const masterProductsToInsert: prismaClient.Prisma.MasterProductCreateManyInput[] =
                [];
            for (const product of productResult.data) {
                const brand_id = brandMap.get(normalize(product.brand_name));
                if (!brand_id) {
                    return {
                        status: status.NOT_FOUND,
                        message: `Brand not found: ${product.brand_name}`,
                    };
                }

                const category_id = findCategoryID(
                    categoryMap,
                    product.category_hierarchy,
                );
                if (!category_id) {
                    return {
                        status: status.NOT_FOUND,
                        message: `Category not found: ${product.category_hierarchy}`,
                    };
                }

                masterProductsToInsert.push({
                    product_name: product.product_name,
                    barcode: product.barcode,
                    brand_id,
                    category_id,
                    pack_size: product.pack_size,
                    rrp: product.rrp,
                    image_url: product.image_url ?? '',
                });
            }

            await dbClient.$transaction(async (tx) => {
                await tx.masterProduct.createMany({
                    data: masterProductsToInsert,
                    skipDuplicates: true,
                });

                const productIDs = await tx.masterProduct.findMany({
                    where: {
                        barcode: {
                            in: masterProductsToInsert.map((p) => p.barcode),
                        },
                    },
                    select: {
                        id: true,
                        barcode: true,
                    },
                });

                const barcodeToProductID = new Map(
                    productIDs.map((p) => [p.barcode, p.id]),
                );

                const retailerDetailsToInsert: prismaClient.Prisma.RetailerCurrentPricingCreateManyInput[] =
                    [];

                for (const retailer of retailerResult.data) {
                    const productID = barcodeToProductID.get(retailer.barcode);
                    if (!productID) {
                        return {
                            status: status.NOT_FOUND,
                            message: `Product not found: ${retailer.barcode}`,
                        };
                    }

                    const retailer_id = retailerMap.get(
                        normalize(retailer.retailer_name),
                    );
                    if (!retailer_id) {
                        return {
                            status: status.NOT_FOUND,
                            message: `Retailer not found: ${retailer.retailer_name}`,
                        };
                    }

                    retailerDetailsToInsert.push({
                        product_id: productID,
                        barcode: retailer.barcode,
                        retailer_id,
                        current_price: retailer.price,
                        was_price: retailer.price,
                        retailer_code: retailer.retailer_code,
                        per_unit_price: retailer.per_unit_price,
                        offer_info: retailer.offer_info,
                        product_url: retailer.product_url,
                        promotion_type: retailer.promotion_type,
                    });
                }

                await tx.retailerCurrentPricing.createMany({
                    data: retailerDetailsToInsert,
                    skipDuplicates: true,
                });
            });

            return {
                status: status.OK,
                message: 'Data imported successfully',
            };
        }

        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            return {
                status: status.INVALID_ARGUMENT,
                message: 'No sheet found in the Excel file.',
            };
        }
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            return {
                status: status.INVALID_ARGUMENT,
                message: 'Worksheet not found in the Excel file.',
            };
        }
        const arrayData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        // Validate with Zod
        let result;
        try {
            result = schema.parse({ data: arrayData });
        } catch (error) {
            if (error instanceof ZodError) {
                return {
                    status: status.INVALID_ARGUMENT,
                    message: fromZodError(error).toString(),
                };
            } else {
                return {
                    status: status.INVALID_ARGUMENT,
                    message: 'Invalid data format',
                };
            }
        }

        switch (model) {
            case ImportModel.RETAILER:
                const retailers = await dbClient.$queryRaw<
                    { id: string; retailer_name: string; site_url?: string }[]
                >`SELECT id, retailer_name, site_url FROM "Retailer"`;

                const existingRetailerNames = new Set(
                    retailers.map((r) => normalize(r.retailer_name)),
                );

                const retailerData = result.data
                    .filter(
                        (retailer: any) =>
                            !existingRetailerNames.has(
                                normalize(retailer.retailer_name),
                            ),
                    )
                    .map((retailer: any) => ({
                        retailer_name: retailer.retailer_name,
                        site_url: retailer.site_url || '',
                    }));

                await dbClient.retailer.createMany({
                    data: retailerData,
                    skipDuplicates: true,
                });
                break;

            case ImportModel.SUPPLIER: {
                const existingSuppliers = await dbClient.supplier.findMany({
                    select: { supplier_name: true },
                });
                const existingNames = new Set(
                    existingSuppliers.map((s) => normalize(s.supplier_name)),
                );

                const rawSuppliers = result.data as any[];
                const newSuppliers = rawSuppliers.filter(
                    (s) => !existingNames.has(normalize(s.supplier_name)),
                );
                if (newSuppliers.length === 0) break;

                const supplierNames = newSuppliers.map((s) => s.supplier_name);
                const valuesSql = supplierNames
                    .map(
                        (_, i) =>
                            `($${i + 1}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                    )
                    .join(', ');
                const insertedSuppliers = await dbClient.$queryRawUnsafe<
                    { id: string; supplier_name: string }[]
                >(
                    `
                        INSERT INTO "Supplier" (supplier_name, "createdAt", "updatedAt")
                        VALUES ${valuesSql}
                        RETURNING id, supplier_name
                    `,
                    ...supplierNames,
                );

                const supplierMap = new Map<string, string>(
                    insertedSuppliers.map((s) => [
                        normalize(s.supplier_name),
                        s.id,
                    ]),
                );

                // flatten all brand_name, supplier_id pairs
                const brandSupplierPairs: {
                    brand_name: string;
                    supplier_id: string;
                }[] = [];
                for (const s of newSuppliers) {
                    const sid = supplierMap.get(normalize(s.supplier_name));
                    if (!sid) continue;
                    for (const b of s.brand_names as string[]) {
                        brandSupplierPairs.push({
                            brand_name: b,
                            supplier_id: sid,
                        });
                    }
                }
                if (brandSupplierPairs.length === 0) break;

                const normalizedBrandNames = Array.from(
                    new Set(
                        brandSupplierPairs.map((p) => normalize(p.brand_name)),
                    ),
                );
                const brands = await dbClient.$queryRaw<
                    { id: string; brand_name: string }[]
                >`
                    SELECT id, brand_name FROM "Brand"
                    WHERE LOWER(REPLACE(brand_name, ' ', '')) = ANY(${normalizedBrandNames}::text[])
                `;

                const brandMap = new Map<string, string>(
                    brands.map((b) => [normalize(b.brand_name), b.id]),
                );

                const updates = brandSupplierPairs
                    .map((p) => {
                        const bid = brandMap.get(normalize(p.brand_name));
                        return bid
                            ? { brand_id: bid, supplier_id: p.supplier_id }
                            : null;
                    })
                    .filter(
                        (u): u is { brand_id: string; supplier_id: string } =>
                            !!u,
                    );

                if (updates.length) {
                    const caseLines = updates
                        .map(
                            (_u, i) =>
                                `WHEN id = $${i * 2 + 1}::uuid THEN $${i * 2 + 2}::uuid`,
                        )
                        .join('\n');

                    const idPlaceholders = updates
                        .map((_, i) => `$${i * 2 + 1}::uuid`)
                        .join(', ');

                    const params = updates.flatMap((u) => [
                        u.brand_id,
                        u.supplier_id,
                    ]);

                    await dbClient.$executeRawUnsafe(
                        `
                            UPDATE "Brand"
                            SET supplier_id = CASE
                                ${caseLines}
                            END
                            WHERE id IN (${idPlaceholders});
                        `,
                        ...params,
                    );
                }
                break;
            }

            case ImportModel.BRAND:
                const suppliers = await dbClient.supplier.findMany({
                    select: { id: true, supplier_name: true },
                });

                const supplierMap = new Map(
                    suppliers.map((s) => [normalize(s.supplier_name), s.id]),
                );

                const brandData = result.data.map((b: any) => {
                    const supplier_id = b.supplier_name
                        ? (supplierMap.get(normalize(b.supplier_name)) ?? null)
                        : null;

                    return {
                        brand_name: b.brand_name,
                        private_label: b.private_label,
                        supplier_id,
                    };
                });

                await dbClient.brand.createMany({
                    data: brandData,
                    skipDuplicates: true,
                });
                break;

            case ImportModel.CATEGORY:
                let categories = await getAllCategories(dbClient);

                for (const row of result.data as any[]) {
                    const hierarchy = row.category_hierarchy
                        .split('>')
                        .map((s: string) => s.trim());
                    let parentID: string | null = null;

                    for (const categoryName of hierarchy) {
                        const normalizedCategoryName = normalize(categoryName);

                        const matches =
                            categories[normalizedCategoryName] || [];
                        let categoryID: string | null = null;

                        if (matches.length > 0) {
                            const match = matches.find(
                                (cat) =>
                                    cat.parent_category_id === parentID ||
                                    (cat.parent_category_id == null &&
                                        parentID == null),
                            );
                            if (match) {
                                categoryID = match.id;
                            }
                        }

                        if (!categoryID) {
                            const created: prismaClient.Category =
                                await dbClient.category.create({
                                    data: {
                                        category_name: categoryName,
                                        parent_category_id: parentID,
                                    },
                                });
                            categoryID = created.id;

                            if (!categories[normalizedCategoryName]) {
                                categories[normalizedCategoryName] = [];
                            }
                            categories[normalizedCategoryName].push({
                                id: categoryID,
                                parent_category_id: parentID || null,
                            });
                        }

                        parentID = categoryID;
                    }
                }
                break;

            default:
                return {
                    status: status.INVALID_ARGUMENT,
                    message: 'Invalid model',
                };
        }

        return {
            status: status.OK,
            message: 'Data imported successfully',
        };
    } catch (error) {
        logger.error('Error importing Excel:', error);
        throw error;
    }
};
