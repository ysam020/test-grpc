import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import {
    GetProductSliderRequest__Output,
    GetProductSliderResponse,
    GetProductSliderResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getProductSliderByID } from '../services/model.service';
import { logger } from '@atc/logger';

export const getProductSlider = async (
    call: CustomServerUnaryCall<
        GetProductSliderRequest__Output,
        GetProductSliderResponse
    >,
    callback: sendUnaryData<GetProductSliderResponse__Output>,
) => {
    try {
        const { product_slider_id } = utilFns.removeEmptyFields(call.request);

        const productSlider = await getProductSliderByID(product_slider_id);
        if (!productSlider) {
            return callback(null, {
                message: errorMessage.PRODUCT_SLIDER.NOT_FOUND,
                status: status.NOT_FOUND,
                data: null,
            });
        }

        return callback(null, {
            message: responseMessage.PRODUCT_SLIDER.RETRIEVED,
            status: status.OK,
            data: {
                product_slider_id: productSlider.id,
                module_name: productSlider.module_name,
                promotion_type: productSlider.promotion_type || '',
                brands:
                    productSlider?.brands.map((brand) => ({
                        id: brand.id,
                        name: brand.brand_name,
                    })) || [],
                retailers:
                    productSlider?.retailers.map((retailer) => ({
                        id: retailer.id,
                        name: retailer.retailer_name,
                    })) || [],
                categories:
                    productSlider?.categories.map((category) => ({
                        id: category.id,
                        name: category.category_name,
                    })) || [],
                number_of_product: productSlider.number_of_product,
                sort_by_field: productSlider.sort_by_field,
                sort_by_order: productSlider.sort_by_order,
                background_color: productSlider.background_color || '',
                brand_logo: productSlider.brand_logo || '',
            },
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
            data: null,
        });
    }
};
