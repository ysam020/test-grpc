import {
    constants,
    errorMessage,
    invalidateCloudFrontCache,
    putS3Object,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    UpdateProductSliderRequest__Output,
    UpdateProductSliderResponse,
    UpdateProductSliderResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { updateProductSliderType } from '../validations';
import {
    getAllBrands,
    getAllCategories,
    getAllRetailers,
    getProductSliderByID,
    getWidgetComponentByRefID,
    updateProductSliderByID,
} from '../services/model.service';
import { prismaClient } from '@atc/db';

export const updateProductSlider = async (
    call: CustomServerUnaryCall<
        UpdateProductSliderRequest__Output,
        UpdateProductSliderResponse
    >,
    callback: sendUnaryData<UpdateProductSliderResponse__Output>,
) => {
    try {
        const {
            product_slider_id,
            promotion_type,
            brand_ids,
            retailer_ids,
            category_ids,
            module_name,
            number_of_product,
            sort_by_field,
            sort_by_order,
            background_color,
            brand_logo,
            mime_type,
            content_length,
        } = utilFns.removeEmptyFields(call.request) as updateProductSliderType;

        const updateData: prismaClient.Prisma.ProductSliderUpdateInput = {};

        const widgetComponent = await getWidgetComponentByRefID(
            product_slider_id,
            prismaClient.WidgetComponentType.PRODUCT_SLIDER,
        );
        if (!widgetComponent) {
            return callback(null, {
                message: errorMessage.WIDGET_COMPONENT.NOT_FOUND,
                data: null,
                status: status.NOT_FOUND,
            });
        }

        let productSlider = await getProductSliderByID(product_slider_id);
        if (!productSlider) {
            return callback(null, {
                message: errorMessage.PRODUCT_SLIDER.NOT_FOUND,
                data: null,
                status: status.NOT_FOUND,
            });
        }

        if (promotion_type) {
            updateData.promotion_type = promotion_type;
        }
        if (brand_ids && brand_ids.length > 0) {
            const brands = await getAllBrands(brand_ids);

            if (brands.length !== brand_ids.length) {
                return callback(null, {
                    message: errorMessage.BRAND.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }

            updateData.brands = {
                disconnect: productSlider.brands.map((brand) => ({
                    id: brand.id,
                })),
                connect: brand_ids.map((id) => ({ id })),
            };
        } else {
            updateData.brands = { set: [] };
        }
        if (retailer_ids && retailer_ids.length > 0) {
            const retailers = await getAllRetailers(retailer_ids);

            if (retailers.length !== retailer_ids.length) {
                return callback(null, {
                    message: errorMessage.RETAILER.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }

            updateData.retailers = {
                disconnect: productSlider.retailers.map((retailer) => ({
                    id: retailer.id,
                })),
                connect: retailer_ids.map((id) => ({ id })),
            };
        } else {
            updateData.retailers = { set: [] };
        }
        if (category_ids && category_ids.length > 0) {
            const categories = await getAllCategories(category_ids);

            if (categories.length !== category_ids.length) {
                return callback(null, {
                    message: errorMessage.CATEGORY.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }

            updateData.categories = {
                disconnect: productSlider.categories.map((category) => ({
                    id: category.id,
                })),
                connect: category_ids.map((id) => ({ id })),
            };
        } else {
            updateData.categories = { set: [] };
        }
        if (module_name) {
            updateData.module_name = module_name;
        }
        if (number_of_product) {
            updateData.number_of_product = number_of_product;
        }
        if (sort_by_field) {
            updateData.sort_by_field = sort_by_field;
        }
        if (sort_by_order) {
            updateData.sort_by_order = sort_by_order;
        }
        if (background_color) {
            updateData.background_color = background_color;
        }
        if (brand_logo) {
            await invalidateCloudFrontCache(
                `${constants.PRODUCT_SLIDER_LOGO_FOLDER}/${product_slider_id}`,
            );

            await putS3Object(
                constants.PRODUCT_SLIDER_LOGO_FOLDER,
                brand_logo,
                product_slider_id,
                mime_type,
                content_length,
            );
        }

        productSlider = await updateProductSliderByID(
            product_slider_id,
            updateData,
        );

        return callback(null, {
            message: responseMessage.PRODUCT_SLIDER.UPDATED,
            status: status.OK,
            data: {
                widget_id: widgetComponent.widget_id,
                promotion_type: productSlider.promotion_type || '',
                module_name: productSlider.module_name,
                number_of_product: productSlider.number_of_product,
                sort_by_field: productSlider.sort_by_field,
                sort_by_order: productSlider.sort_by_order,
                background_color: productSlider.background_color || '',
                brand_logo: productSlider.brand_logo || '',
                widget_component_id: widgetComponent.id,
                order: widgetComponent.order,
                brands: productSlider.brands.map((brand) => brand.brand_name),
                categories: productSlider.categories.map(
                    (category) => category.category_name,
                ),
                retailers: productSlider.retailers.map(
                    (retailer) => retailer.retailer_name,
                ),
                product_slider_id: productSlider.id,
            },
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            data: null,
            status: status.INTERNAL,
        });
    }
};
