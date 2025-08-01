const { getDevDBConnection } = require('../database/devDB');
const { getRawDBConnection } = require('../database/rawDB');

const findCategoryID = async (dbCategories, categoryHierarchy) => {
    try {
        const categories = categoryHierarchy
            .split('>')
            .map((item) => item.trim().toLowerCase().replace(/[^\w]/g, ''));

        let categoryData;

        for (let i = categories.length - 1; i >= 0; i--) {
            const category = categories[i];
            const categoryResult = findCategoryData(category, dbCategories);

            if (categoryResult) {
                categoryData = categoryResult.id;
                break;
            }
        }

        if (!categoryData) {
            const generalCategoryResult = findCategoryData(
                'home',
                dbCategories,
            );
            console.log({ generalCategoryResult });

            categoryData = generalCategoryResult.id || null;
        }

        return categoryData;
    } catch (err) {
        console.log('category data:', err.message);
        return;
    }
};

function findCategoryData(categoryName, categoryData) {
    return categoryData.find(
        (cat) =>
            cat.category_name.toLowerCase().replace(/[^\w]/g, '') ===
            categoryName,
    );
}

exports.dump = async (req, res) => {
    let devDBClient, rawDBClient;

    try {
        const { retailer } = req.query;

        const devDBPool = await getDevDBConnection();
        devDBClient = await devDBPool.connect();

        const rawDBPool = await getRawDBConnection();
        rawDBClient = await rawDBPool.connect();

        let processedCount = 0;
        let failedCount = 0;
        let failedIDs = [];

        let retailerQuery = '';

        if (retailer) {
            retailerQuery = `AND "rawData"."retailerName" = '${retailer}' AND "rawData"."createdAt" = '2025-03-05 07:04:42.868'`;
        }

        const rawDataQuery = `SELECT * FROM public."rawData" WHERE status = 0 ${retailerQuery} LIMIT 5000`;
        const rawDataResult = await rawDBClient.query(rawDataQuery);
        console.log({ rawDataQuery, rawDataResult });

        const brandData = `SELECT * FROM "public"."Brand"`;
        const brandDataResult = await devDBClient.query(brandData);

        const categoryData = `SELECT * FROM "public"."Category"`;
        const categoryDataResult = await devDBClient.query(categoryData);

        await devDBClient.query('BEGIN');

        const updateRawDataQuery = `UPDATE public."rawData" SET status = 1 WHERE id = $1 `;
        const updateRawDataQueryFailed = `UPDATE public."rawData" SET status = 2 WHERE id = $1 `;
        for (const rawRecord of rawDataResult.rows) {
            try {
                const exsistingProductQuery = `
                        SELECT
                            id,
                            product_id,
                            barcode,
                            retailer_id,
                            current_price
                        from public."RetailerCurrentPricing"
                        WHERE barcode = $1 AND retailer_id = $2;
                    `;
                const exsistingProductResult = await devDBClient.query(
                    exsistingProductQuery,
                    [rawRecord.barcode, rawRecord.retailerID],
                );

                if (
                    exsistingProductResult.rows.length &&
                    exsistingProductResult.rows[0].id
                )
                    continue;

                const categoryID = await findCategoryID(
                    categoryDataResult.rows,
                    rawRecord.categoryHierarchy,
                );

                const brandID = brandDataResult.rows.find(
                    (brd) => brd.brand_name === rawRecord.brandName,
                );

                if (!brandID) continue;

                const insertDatainMasterProductQuery = `
                        INSERT INTO public."MasterProduct" (
                            barcode, product_name, pack_size, brand_id, category_id, image_url, rrp, "createdAt", "updatedAt"
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                        )
                        ON CONFLICT (barcode) DO NOTHING
                        RETURNING id AS product_id, barcode
                    `;

                console.log(
                    `insertDatainMasterProductQuery ==> Count: ${processedCount}`,
                    insertDatainMasterProductQuery,
                );

                const masterProductData = await devDBClient.query(
                    insertDatainMasterProductQuery,
                    [
                        rawRecord.barcode,
                        rawRecord.productName,
                        rawRecord.packSize,
                        brandID.id,
                        categoryID,
                        rawRecord.primaryimage,
                        rawRecord.rrp,
                    ],
                );

                // Insert into RetailerCurrentPricing table
                const insertDataInRCP = `
                INSERT INTO public."RetailerCurrentPricing" (
                    product_id,
                    barcode,
                    retailer_id,
                    retailer_code,
                    current_price,
                    was_price,
                    per_unit_price,
                    offer_info,
                    promotion_type,
                    product_url,
                    "createdAt",
                    "updatedAt"
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, 
                    'RETAILER'::public."PromotionTypeEnum", $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
                ON CONFLICT (barcode, retailer_id)
                DO UPDATE SET current_price = $5, "updatedAt" = CURRENT_TIMESTAMP;
                `;

                await devDBClient.query(insertDataInRCP, [
                    masterProductData.rows[0].product_id,
                    masterProductData.rows[0].barcode,
                    rawRecord.retailerID,
                    rawRecord.productCode,
                    rawRecord.price,
                    rawRecord.wasPrice || rawRecord.price,
                    rawRecord.perUnitPrice || '',
                    rawRecord.offerInfo,
                    rawRecord.productURL,
                ]);

                await rawDBClient.query(updateRawDataQuery, [rawRecord.id]);
                processedCount++;
            } catch (err) {
                console.log(err.message);
                console.error(
                    `Error processing rawRecord ID: ${rawRecord.id}`,
                    err,
                );
                await rawDBClient.query(updateRawDataQueryFailed, [
                    rawRecord.id,
                ]);
                failedCount++;
                failedIDs.push({ id: rawRecord.id, error: err.message });
            }
        }
        await devDBClient.query('COMMIT');

        return res.status(200).json({
            message: `Processed ${processedCount} records successfully. Failed ${failedCount} records. ${JSON.stringify(failedIDs)}`,
        });
    } catch (error) {
        await devDBClient.query('ROLLBACK');
        console.error('Error in syncDB handler:', error);
        return res.status(500).json({ error: error.message });
    } finally {
        if (devDBClient) devDBClient.release();
        if (rawDBClient) rawDBClient.release();
    }
};
