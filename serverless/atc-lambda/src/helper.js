const unitEquivalents = {
    g: 'g',
    gm: 'g',
    gram: 'g',
    grams: 'g',
    ml: 'g',
    milliliter: 'g',
    milliliters: 'g',
    kg: 'kg',
    kilogram: 'kg',
    kilograms: 'kg',
    l: 'kg',
    liters: 'kg',
    liter: 'kg',
    tablet: 'pack',
    tablets: 'pack',
    capsules: 'pack',
};

// Normalize and convert value + unit
function convertValue(numValue, unit) {
    unit = unit.toLowerCase();
    return {
        numValue: numValue,
        unit: unitEquivalents[unit] || unit, // Convert to equivalent unit if applicable
    };
}

// Parse arithmetic expressions with units
function parseArithmeticValue(str) {
    let replaced = str.replace(/\s+/g, '').replace(/(\d)x(\d)/gi, '$1*$2');

    const unitMatches = replaced.match(/[a-zA-Z]+/g);
    let unit = unitMatches ? unitMatches[0].toLowerCase() : '';

    for (const u of unitMatches || []) {
        if (unitEquivalents[u.toLowerCase()] !== unitEquivalents[unit])
            return null; // Conflicting units
    }

    const numericExpression = replaced.replace(/[a-zA-Z]+/g, '');
    let numValue;
    try {
        numValue = eval(numericExpression);
    } catch (e) {
        return null;
    }
    return { numValue, unit: unitEquivalents[unit] || unit };
}

// Parse "Pack" format
function parseValue(str) {
    if (/pack/i.test(str)) {
        const fullPackRegex = /^\s*(.+?)(?:\s*[x\*]\s*(\d+(?:\.\d+)?))\s*pack/i;
        let match = str.match(fullPackRegex);
        if (match) {
            let baseStr = match[1].trim().replace(/x$/i, '');
            const multiplier = parseFloat(match[2]);
            const baseParsed = parseArithmeticValue(baseStr);
            return baseParsed
                ? {
                      numValue: baseParsed.numValue * multiplier,
                      unit: baseParsed.unit,
                  }
                : null;
        }
    }
    return parseArithmeticValue(str);
}

function areEquivalent(value1, value2) {
    const parsed1 = parseValue(value1);
    const parsed2 = parseValue(value2);
    if (!parsed1 || !parsed2) return false;

    const converted1 = convertValue(parsed1.numValue, parsed1.unit);
    const converted2 = convertValue(parsed2.numValue, parsed2.unit);

    return (
        converted1.unit === converted2.unit &&
        converted1.numValue === converted2.numValue
    );
}

const PromotionTypeEnum = {
    BRAND: 'BRAND',
    RETAILER: 'RETAILER',
};

const insertPriceHistory = async (
    client,
    retailerCurrentPricingID,
    currentPrice,
    rrp,
    date,
) => {
    const query = `
        INSERT INTO public."PriceHistory" (
            retailer_current_pricing_id,
            rrp,
            current_price,
            date,
            "createdAt"
        ) VALUES (
            $1, $2, $3, $4, CURRENT_TIMESTAMP
        );
    `;
    await client.query(query, [
        retailerCurrentPricingID,
        rrp,
        currentPrice,
        date,
    ]);
};

async function insertMasterProduct(productData, devDBClient) {
    try {
        const {
            productURL,
            productCode,
            productName,
            price,
            wasPrice,
            offerInfo,
            packSize,
            barcode,
            brandName,
            promoType,
            primaryimage,
            retailerID,
            perUnitPrice,
            rrp,
            categoryID,
            size,
            unit,
            configuration,
            a2cSize,
        } = productData;

        let validatedPromoType = PromotionTypeEnum.RETAILER;

        if (promoType && Object.values(PromotionTypeEnum).includes(promoType)) {
            validatedPromoType = rawRecord.promoType;
        }

        let brandID;
        const brandQuery = `SELECT id FROM public."Brand" WHERE LOWER(REPLACE(brand_name, ' ', '')) = LOWER(REPLACE($1, ' ', ''))`;
        const brandDetails = await devDBClient.query(brandQuery, [brandName]);

        if (brandDetails.rows.length > 0) {
            brandID = brandDetails.rows[0].id;
        } else {
            const insertBrandQuery = `
                INSERT INTO public."Brand"(brand_name) VALUES ($1)
                RETURNING id;
            `;
            const brandInsertResult = await devDBClient.query(
                insertBrandQuery,
                [brandName],
            );
            brandID = brandInsertResult.rows[0].id;
        }

        const insertMasterProductQuery = `
            INSERT INTO public."MasterProduct"(
            barcode,
            product_name,
            pack_size,
            brand_id,
            category_id,
            image_url,
            rrp,
            "createdAt",
            "updatedAt",
            size,
            unit,
            configuration,
            a2c_size
            ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $8, $9, $10, $11
            )
            RETURNING id;
        `;
        const masterProductInsertResult = await devDBClient.query(
            insertMasterProductQuery,
            [
                barcode,
                productName,
                packSize || '',
                brandID,
                categoryID,
                primaryimage,
                rrp,
                size,
                unit,
                configuration || '',
                a2cSize || '',
            ],
        );

        const masterProductID = masterProductInsertResult.rows[0].id;

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
            ) RETURNING id;
        `;
        const retailerPricingInsertResult = await devDBClient.query(
            insertNewRetailerPricingQuery,
            [
                masterProductID,
                barcode,
                retailerID,
                productCode,
                price,
                wasPrice || price,
                perUnitPrice || '',
                offerInfo || '',
                productURL,
                validatedPromoType,
            ],
        );

        const retailerCurrentPricingID = retailerPricingInsertResult.rows[0].id;
        await insertPriceHistory(
            devDBClient,
            retailerCurrentPricingID,
            price,
            rrp,
            productData.createdAt,
        );

        return true;
    } catch (error) {
        console.error('Error inserting master product:', error);
        throw error;
    }
}

function normalizeUnit(rawUnit) {
    const unit = rawUnit.toLowerCase();
    const unitMap = {
        g: 'GM',
        gram: 'GM',
        grams: 'GM',
        gm: 'GM',

        kg: 'KG',
        kilogram: 'KG',
        kilograms: 'KG',

        ml: 'ML',
        milliliter: 'ML',
        milliliters: 'ML',

        l: 'LTR',
        liter: 'LTR',
        litre: 'LTR',
        liters: 'LTR',
        ltr: 'LTR',

        mg: 'MG',

        tablet: 'PACK',
        tablets: 'PACK',
        capsules: 'PACK',
        pack: 'PACK',
        each: 'PACK',
        ea: 'PACK',

        cm: 'CM',

        mm: 'MM',

        metre: 'M',
        meter: 'M',
        m: 'M',

        v: 'V',
        w: 'W',

        oz: 'OZ',
    };

    return unitMap[unit] || 'PACK';
}

function parsePackSize(input) {
    const s = input.trim().toLowerCase();

    // <size> <unit> + <count> <config>
    let m = s.match(/^(\d+(?:\.\d+)?)[\s]*([a-z]+)\s*\+\s*(\d+)\s*([a-z]+)$/i);
    if (m) {
        return {
            size: parseFloat(m[1]),
            unit: normalizeUnit(m[2]),
            configuration: `${m[3]} ${m[4]}`,
        };
    }

    // <a> + <b> <config>
    m = s.match(/^(\d+)\s*\+\s*(\d+)\s*([a-z]+)$/i);
    if (m) {
        return {
            size: parseFloat(m[1]),
            unit: null,
            configuration: `${m[2]} ${m[3]}`,
        };
    }

    // <size> <unit> x <count> <config>
    m = s.match(/^(\d+(?:\.\d+)?)[\s]*([a-z]+)\s*[xX×*]\s*(\d+)\s*([a-z]+)?$/i);
    if (m) {
        return {
            size: parseFloat(m[1]),
            unit: normalizeUnit(m[2]),
            configuration: m[4] ? `${m[3]} ${m[4]}` : `${m[3]}`,
        };
    }

    // <count> x <size> <unit> [config (optional, must be space-separated)]
    m = s.match(
        /^(\d+)\s*[xX×*]\s*(\d+(?:\.\d+)?)[\s]*([a-z]+)(?:\s+([a-z]+))?$/i,
    );
    if (m) {
        return {
            size: parseFloat(m[2]),
            unit: normalizeUnit(m[3]),
            configuration: m[4] ? `${m[1]} ${m[4]}` : `${m[1]}`,
        };
    }

    // <size> <unit>
    m = s.match(/^(\d+(?:\.\d+)?)[\s]*([a-z]+)$/i);
    if (m) {
        return {
            size: parseFloat(m[1]),
            unit: normalizeUnit(m[2]),
            configuration: null,
        };
    }

    // <unit> <size> (space optional)
    m = s.match(/^([a-z]+)\s*(\d+(?:\.\d+)?)$/i);
    if (m) {
        return {
            size: parseFloat(m[2]),
            unit: normalizeUnit(m[1]),
            configuration: null,
        };
    }

    // fallback
    return {
        size: null,
        unit: null,
        configuration: s,
    };
}

function makeA2C(input) {
    if (input.configuration && !input.size && !input.unit) {
        return input.configuration.trim().toLowerCase();
    } else if (!input.configuration && input.size && input.unit) {
        return `${input.size}${input.unit}`.trim().toLowerCase();
    } else if (!input.configuration && !input.size && !input.unit) {
        return '';
    }
    return `${input.size || ''}${input.unit || ''} x ${input.configuration || ''}`
        .trim()
        .toLowerCase();
}

module.exports = {
    areEquivalent,
    insertPriceHistory,
    insertMasterProduct,
    parsePackSize,
    makeA2C,
};
