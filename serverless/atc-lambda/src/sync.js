const { getDevDBConnection } = require('../database/devDB');
const { getRawDBConnection } = require('../database/rawDB');
const AWS = require('aws-sdk');
const {
    areEquivalent,
    insertMasterProduct,
    parsePackSize,
    makeA2C,
    insertPriceHistory,
} = require('./helper');

const calculateConfidence = (rrpScore, packSizeScore, productNameScore) => {
    return rrpScore * 0.4 + packSizeScore * 0.4 + productNameScore * 0.2;
};

const getAllCategories = async (devDBClient) => {
    const categoryQuery = `SELECT id, LOWER(REPLACE(category_name, ' ', '')) AS normalized_name, parent_category_id FROM public."Category"`;
    const categoryResult = await devDBClient.query(categoryQuery);

    return categoryResult.rows.reduce((acc, row) => {
        if (!acc[row.normalized_name]) {
            acc[row.normalized_name] = [];
        }
        acc[row.normalized_name].push({
            id: row.id,
            parent_category_id: row.parent_category_id,
        });
        return acc;
    }, {});
};

const findCategoryID = (categories, categoryHierarchy) => {
    const categoryList = categoryHierarchy
        .split('>')
        .map((item) => item.trim().toLowerCase().replace(/\s+/g, ''))
        .reverse();

    for (let i = 0; i < categoryList.length; i++) {
        const currentCategory = categoryList[i];
        const potentialMatches = categories[currentCategory];

        if (!potentialMatches || potentialMatches.length === 0) continue;

        // No parent to check
        if (i === categoryList.length - 1) {
            return potentialMatches[0].id;
        }

        const parentCategory = categoryList[i + 1];
        const parentMatches = categories[parentCategory];

        if (!parentMatches || parentMatches.length === 0) continue;

        const parentIds = new Set(parentMatches.map((p) => p.id));

        for (const match of potentialMatches) {
            if (
                match.parent_category_id &&
                parentIds.has(match.parent_category_id)
            ) {
                return match.id;
            }
        }

        // If no parent match, fallback to first match
        return potentialMatches[0].id;
    }

    return categories['home']?.[0]?.id || null;
};

const PromotionTypeEnum = {
    BRAND: 'BRAND',
    RETAILER: 'RETAILER',
};

const insertNewRetailerPricingQuery = `
        INSERT INTO public."RetailerCurrentPricing" (
            product_id,
            barcode,
            retailer_id,
            retailer_code,
            current_price,
            was_price,
            per_unit_price,
            offer_info,
            product_url,
            "createdAt",
            "updatedAt",
            promotion_type,
            match_type
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $10, 'DIRECT'
        )
        ON CONFLICT (barcode, retailer_id, retailer_code)
        DO UPDATE SET
            current_price = EXCLUDED.current_price,
            was_price = COALESCE(public."RetailerCurrentPricing".current_price, EXCLUDED.current_price),
            per_unit_price = EXCLUDED.per_unit_price,
            offer_info = EXCLUDED.offer_info,
            "updatedAt" = CURRENT_TIMESTAMP
        RETURNING id;
    `;

exports.syncDB = async (req, res) => {
    let devDBClient, rawDBClient;

    try {
        const devDBPool = await getDevDBConnection();
        devDBClient = await devDBPool.connect();

        const rawDBPool = await getRawDBConnection();
        rawDBClient = await rawDBPool.connect();

        const categories = await getAllCategories(devDBClient);

        let processedCount = 0;
        let failedCount = 0;

        while (true) {
            const rawDataQuery = `SELECT * FROM public."rawData" WHERE status = 0 AND is_available = true LIMIT 200`;
            const rawDataResult = await rawDBClient.query(rawDataQuery);

            if (rawDataResult.rows.length === 0) {
                console.log('Done');
                break;
            }

            for (const rawRecord of rawDataResult.rows) {
                const updateRawDataQuery = `UPDATE public."rawData" SET status = 1 WHERE id = $1`;
                try {
                    if (!rawRecord.brandName) {
                        await rawDBClient.query(
                            `UPDATE public."rawData" SET status = 3 WHERE id = $1`,
                            [rawRecord.id],
                        );
                        failedCount++;
                        continue;
                    }

                    let existingProductResult;
                    try {
                        if (rawRecord.barcode) {
                            const existingProductQuery = `
                                SELECT id, product_id, barcode, retailer_id, current_price, retailer_code FROM public."RetailerCurrentPricing"
                                WHERE TRIM(LEADING '0' FROM barcode) = TRIM(LEADING '0' FROM $1);
                            `;
                            existingProductResult = await devDBClient.query(
                                existingProductQuery,
                                [rawRecord.barcode],
                            );
                        } else {
                            const existingProductQuery = `
                                SELECT id, product_id, barcode, retailer_id, current_price, retailer_code FROM public."RetailerCurrentPricing"
                                WHERE product_id = (
                                    SELECT product_id 
                                    FROM public."RetailerCurrentPricing"
                                    WHERE retailer_id = $1 AND retailer_code = $2
                                );
                            `;
                            existingProductResult = await devDBClient.query(
                                existingProductQuery,
                                [rawRecord.retailerID, rawRecord.productCode],
                            );
                        }
                    } catch (error) {
                        console.error(
                            `Error getting existing product for retailer_code ${rawRecord.productCode}:`,
                            error,
                        );
                        await rawDBClient.query(
                            `UPDATE public."rawData" SET status = 4 WHERE id = $1`,
                            [rawRecord.id],
                        );
                        failedCount++;
                        continue;
                    }

                    const { size, unit, configuration } = parsePackSize(
                        rawRecord.packSize || '',
                    );
                    const a2cSize = makeA2C({
                        size,
                        unit,
                        configuration,
                    });

                    if (
                        rawRecord.barcode &&
                        !existingProductResult.rows.length
                    ) {
                        const categoryID = await findCategoryID(
                            categories,
                            rawRecord.categoryHierarchy,
                        );

                        try {
                            await insertMasterProduct(
                                {
                                    ...rawRecord,
                                    categoryID,
                                    size,
                                    unit,
                                    configuration,
                                    a2cSize,
                                },
                                devDBClient,
                            );
                        } catch (error) {
                            console.error(
                                `Error inserting master product for barcode ${rawRecord.barcode}:`,
                                error,
                            );
                            await rawDBClient.query(
                                `UPDATE public."rawData" SET status = 2 WHERE id = $1`,
                                [rawRecord.id],
                            );
                            failedCount++;
                            continue;
                        }

                        await rawDBClient.query(updateRawDataQuery, [
                            rawRecord.id,
                        ]);
                        processedCount++;
                        continue;
                    }

                    if (existingProductResult.rows.length) {
                        const existingRecord = existingProductResult.rows[0];

                        if (
                            existingProductResult.rows.some(
                                (record) =>
                                    record.retailer_id ===
                                        rawRecord.retailerID &&
                                    record.retailer_code ===
                                        rawRecord.productCode,
                            )
                        ) {
                            const matchedRetailerData =
                                existingProductResult.rows.find(
                                    (record) =>
                                        record.retailer_id ===
                                            rawRecord.retailerID &&
                                        record.retailer_code ===
                                            rawRecord.productCode,
                                );

                            if (
                                matchedRetailerData.current_price !==
                                rawRecord.price
                            ) {
                                const updateProductQuery = `
                                    UPDATE public."RetailerCurrentPricing"
                                    SET current_price = $1, was_price = $2, "updatedAt" = CURRENT_TIMESTAMP
                                    WHERE id = $3;
                                `;

                                await devDBClient.query(updateProductQuery, [
                                    rawRecord.price,
                                    matchedRetailerData.current_price,
                                    matchedRetailerData.id,
                                ]);

                                await insertPriceHistory(
                                    devDBClient,
                                    matchedRetailerData.id,
                                    rawRecord.price,
                                    rawRecord.rrp,
                                    rawRecord.createdAt,
                                );

                                if (
                                    Number(rawRecord.price) <
                                    Number(matchedRetailerData.current_price)
                                ) {
                                    const lambda = new AWS.Lambda({
                                        region: process.env.AWS_REGION,
                                    });

                                    const params = {
                                        FunctionName: 'atc-price-alert-dev-api',
                                        InvocationType: 'Event',
                                        Payload: JSON.stringify({
                                            productIDs: [
                                                matchedRetailerData.product_id,
                                            ],
                                        }),
                                    };

                                    lambda.invoke(params, (error, data) => {
                                        if (error) {
                                            console.error(
                                                'Error invoking Lambda:',
                                                error,
                                            );
                                        } else {
                                            console.log(
                                                'Lambda invoked successfully:',
                                                data,
                                            );
                                        }
                                    });
                                }

                                processedCount++;
                                await rawDBClient.query(updateRawDataQuery, [
                                    rawRecord.id,
                                ]);
                                continue;
                            } else {
                                processedCount++;
                                await rawDBClient.query(updateRawDataQuery, [
                                    rawRecord.id,
                                ]);
                                continue;
                            }
                        } else {
                            let validatedPromoType = PromotionTypeEnum.RETAILER;

                            if (
                                rawRecord.promoType &&
                                Object.values(PromotionTypeEnum).includes(
                                    rawRecord.promoType,
                                )
                            ) {
                                validatedPromoType = rawRecord.promoType;
                            }

                            const insertResult = await devDBClient.query(
                                insertNewRetailerPricingQuery,
                                [
                                    existingRecord.product_id,
                                    rawRecord.barcode,
                                    rawRecord.retailerID,
                                    rawRecord.productCode,
                                    rawRecord.price,
                                    rawRecord.wasPrice || rawRecord.price,
                                    rawRecord.perUnitPrice || '',
                                    rawRecord.offerInfo || '',
                                    rawRecord.productURL || '',
                                    validatedPromoType,
                                ],
                            );

                            const insertedID = insertResult.rows[0]?.id;
                            if (insertedID) {
                                await insertPriceHistory(
                                    devDBClient,
                                    insertedID,
                                    rawRecord.price,
                                    rawRecord.rrp,
                                    rawRecord.createdAt,
                                );
                            }

                            processedCount++;
                            await rawDBClient.query(updateRawDataQuery, [
                                rawRecord.id,
                            ]);
                            continue;
                        }
                    }

                    const categoryID = await findCategoryID(
                        categories,
                        rawRecord.categoryHierarchy,
                    );

                    const masterProductQuery = `
                        SELECT mp.id, mp.barcode, mp.product_name, mp.pack_size, mp.rrp,
                            b.brand_name, similarity($1, mp.product_name) AS "productNameSimilarity",
                            similarity($2, mp.pack_size) AS "packSizeSimilarity"
                        FROM public."MasterProduct" mp
                        INNER JOIN public."Brand" b ON mp.brand_id = b.id
                        WHERE REPLACE(LOWER(TRIM(b.brand_name)), ' ', '') = REPLACE(LOWER(TRIM($3)), ' ', '')
                        ORDER BY "productNameSimilarity" DESC, "packSizeSimilarity" DESC
                        LIMIT 3
                    `;
                    const masterProductResult = await devDBClient.query(
                        masterProductQuery,
                        [
                            rawRecord.productName,
                            rawRecord.packSize,
                            rawRecord.brandName,
                        ],
                    );

                    let suggestions = [];
                    for (const product of masterProductResult.rows) {
                        const rrpScore =
                            Math.abs(
                                Number(product.rrp) - Number(rawRecord.rrp),
                            ) <=
                            Number(product.rrp) * 0.05
                                ? 100
                                : 0;

                        const packSizeScore = areEquivalent(
                            product.pack_size,
                            rawRecord.packSize || '',
                        )
                            ? 100
                            : 0;

                        const productNameScore = product.productNameSimilarity
                            ? product.productNameSimilarity * 100
                            : 0;

                        const confidence = calculateConfidence(
                            rrpScore,
                            packSizeScore,
                            productNameScore,
                        );

                        if (confidence === 100) {
                            let validatedPromoType = PromotionTypeEnum.RETAILER;
                            if (
                                rawRecord.promoType &&
                                Object.values(PromotionTypeEnum).includes(
                                    rawRecord.promoType,
                                )
                            ) {
                                validatedPromoType = rawRecord.promoType;
                            }

                            const matchInsertResult = await devDBClient.query(
                                insertNewRetailerPricingQuery,
                                [
                                    product.id,
                                    product.barcode,
                                    rawRecord.retailerID,
                                    rawRecord.productCode,
                                    rawRecord.price,
                                    rawRecord.wasPrice || rawRecord.price,
                                    rawRecord.perUnitPrice || '',
                                    rawRecord.offerInfo || '',
                                    rawRecord.productURL || '',
                                    validatedPromoType,
                                ],
                            );

                            const insertedMatchID =
                                matchInsertResult.rows[0].id;
                            if (insertedMatchID) {
                                await insertPriceHistory(
                                    devDBClient,
                                    insertedMatchID,
                                    rawRecord.price,
                                    rawRecord.rrp,
                                    rawRecord.createdAt,
                                );
                            }

                            await rawDBClient.query(updateRawDataQuery, [
                                rawRecord.id,
                            ]);
                            processedCount++;
                            continue;
                        }

                        suggestions.push({ product, confidence });
                    }

                    let validatedPromoType = PromotionTypeEnum.RETAILER;
                    if (
                        rawRecord.promoType &&
                        Object.values(PromotionTypeEnum).includes(
                            rawRecord.promoType,
                        )
                    ) {
                        validatedPromoType = rawRecord.promoType;
                    }

                    const insertSuggestionsQuery = `
                        INSERT INTO public."suggestionDetails" (
                            brand_name,
                            category_id,
                            retailer_id,
                            product_name,
                            barcode,
                            current_price,
                            per_unit_price,
                            rrp,
                            pack_size,
                            retailer_code,
                            offer_info,
                            promotion_type,
                            product_url,
                            image_url,
                            "createdAt",
                            size,
                            unit,
                            configuration,
                            a2c_size
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, $15, $16, $17, $18
                        )
                        ON CONFLICT (retailer_id, retailer_code)
                        DO UPDATE SET
                            brand_name = EXCLUDED.brand_name,
                            category_id = EXCLUDED.category_id,
                            product_name = EXCLUDED.product_name,
                            barcode = EXCLUDED.barcode,
                            current_price = EXCLUDED.current_price,
                            per_unit_price = EXCLUDED.per_unit_price,
                            rrp = EXCLUDED.rrp,
                            pack_size = EXCLUDED.pack_size,
                            offer_info = EXCLUDED.offer_info,
                            promotion_type = EXCLUDED.promotion_type,
                            product_url = EXCLUDED.product_url,
                            image_url = EXCLUDED.image_url,
                            size = EXCLUDED.size,
                            unit = EXCLUDED.unit,
                            configuration = EXCLUDED.configuration,
                            a2c_size = EXCLUDED.a2c_size,
                            "createdAt" = CURRENT_TIMESTAMP
                        RETURNING id;
                    `;
                    const suggestionDetailsResult = await devDBClient.query(
                        insertSuggestionsQuery,
                        [
                            rawRecord.brandName,
                            categoryID,
                            rawRecord.retailerID,
                            rawRecord.productName,
                            rawRecord.barcode || '',
                            rawRecord.price,
                            rawRecord.perUnitPrice || '',
                            rawRecord.rrp,
                            rawRecord.packSize || '',
                            rawRecord.productCode,
                            rawRecord.offerInfo || '',
                            validatedPromoType,
                            rawRecord.productURL,
                            rawRecord.primaryimage,
                            size,
                            unit,
                            configuration || '',
                            a2cSize || '',
                        ],
                    );

                    if (suggestions.length > 0) {
                        const suggestionID = suggestionDetailsResult.rows[0].id;

                        const insertMatchSuggestionQuery = `
                            INSERT INTO public."matchSuggestion"
                            (suggestion_details_id, matched_product_pricing_id, match_confidence, retailer_id, date_matched)
                            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP);
                        `;

                        for (const suggestion of suggestions) {
                            await devDBClient.query(
                                insertMatchSuggestionQuery,
                                [
                                    suggestionID,
                                    suggestion.product.id,
                                    suggestion.confidence / 100,
                                    rawRecord.retailerID,
                                ],
                            );
                        }
                    }

                    await rawDBClient.query(updateRawDataQuery, [rawRecord.id]);
                    processedCount++;
                } catch (error) {
                    await rawDBClient.query(
                        `UPDATE public."rawData" SET status = 2 WHERE id = $1`,
                        [rawRecord.id],
                    );
                    console.error(
                        `Error processing rawRecord ID: ${rawRecord.id}`,
                        error,
                    );
                    failedCount++;
                }
            }
        }

        return res.status(200).json({
            message: `Processed ${processedCount} records successfully. Failed ${failedCount} records.`,
        });
    } catch (error) {
        console.error('Error in syncDB handler:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        if (devDBClient) devDBClient.release();
        if (rawDBClient) rawDBClient.release();
    }
};
