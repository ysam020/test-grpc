enum SortByField {
    PRICE = 'price',
    NAME = 'name',
    SAVING_PERCENTAGE = 'saving_percentage',
}

enum SortByOrder {
    ASC = 'asc',
    DESC = 'desc',
}

interface GroupedProduct {
    product_to_match: {
        id: string;
        barcode: string;
        product_name: string;
        brand_name: string;
        category_name: string;
        image_url: string;
        product_url: string;
        retailer_id: string;
        retailer_name: string;
        retailer_code: string;
        price: string;
        offer_info: string;
        promotion_type: string;
        per_unit_price: string;
        pack_size: string;
        category_id: string;
        barcodes: string[];
        intervention: boolean;
        size: number;
        unit: string;
        configuration: string;
        a2c_size: string;
        current_price: string;
        potential_matches: {
            id: string;
            barcode: string;
            product_name: string;
            brand_name: string;
            category_name: string;
            image_url: string;
            retailers: {
                retailer_id: string;
                retailer_name: string;
                retailer_code: string;
            }[];
            price: string;
            match_confidence: string;
            pack_size: string;
            a2c_size: string;
        }[];
    };
}

interface GetAllProducts {
    id: string;
    barcode: string;
    product_name: string;
    image_url: string;
    category_id: string;
    basket_quantity: number;
    price_alert: boolean;
    rrp: number;
    Brand: {
        brand_name: string;
    };
    retailerCurrentPricing: {
        current_price: string;
        offer_info: string;
        promotion_type: string;
        product_url: string;
        per_unit_price: string;
        Retailer: {
            retailer_name: string;
            site_url: string;
        };
    }[];
}

enum SortByFieldBrandList {
    BRAND_NAME = 'brand_name',
    SUPPLIER_NAME = 'supplier_name',
}

export type { GroupedProduct, GetAllProducts };
export { SortByField, SortByOrder, SortByFieldBrandList };
