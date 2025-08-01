import {
    constants,
    errorMessage,
    putS3Object,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    AddProductSliderRequest__Output,
    AddProductSliderResponse,
    AddProductSliderResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { addProductSliderType } from '../validations';
import {
    createProductSlider,
    createWidgetComponent,
    getAllBrands,
    getAllCategories,
    getAllRetailers,
    getProductSliderByID,
    getWidgetByID,
    updateProductSliderByID,
} from '../services/model.service';
import { prismaClient } from '@atc/db';

export const addProductSlider = async (
    call: CustomServerUnaryCall<
        AddProductSliderRequest__Output,
        AddProductSliderResponse
    >,
    callback: sendUnaryData<AddProductSliderResponse__Output>,
) => {
    try {
        const {
            widget_id,
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
            order,
            mime_type,
            content_length,
        } = utilFns.removeEmptyFields(call.request) as addProductSliderType;

        const widget = await getWidgetByID(widget_id);
        if (!widget) {
            return callback(null, {
                message: errorMessage.WIDGET.NOT_FOUND,
                data: null,
                status: status.NOT_FOUND,
            });
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
        }

        const productSliderData: prismaClient.Prisma.ProductSliderCreateInput =
            {
                promotion_type,
                brands: {
                    connect: brand_ids ? brand_ids.map((id) => ({ id })) : [],
                },
                retailers: {
                    connect: retailer_ids
                        ? retailer_ids.map((id) => ({ id }))
                        : [],
                },
                categories: {
                    connect: category_ids
                        ? category_ids.map((id) => ({ id }))
                        : [],
                },
                module_name,
                number_of_product,
                sort_by_field,
                sort_by_order,
                background_color,
            };
        let productSlider = await createProductSlider(productSliderData);

        if (brand_logo) {
            await putS3Object(
                constants.PRODUCT_SLIDER_LOGO_FOLDER,
                brand_logo,
                productSlider.id,
                mime_type,
                content_length,
            );

            await updateProductSliderByID(productSlider.id, {
                brand_logo: productSlider.id,
            });
        }

        const widgetComponent = await createWidgetComponent({
            component_type: prismaClient.WidgetComponentType.PRODUCT_SLIDER,
            order,
            reference_model_id: productSlider.id,
            reference_model: prismaClient.ReferenceModelType.PRODUCT_SLIDER,
            widget: { connect: { id: widget_id } },
        });

        const response = await getProductSliderByID(productSlider.id);

        return callback(null, {
            message: responseMessage.PRODUCT_SLIDER.ADDED,
            status: status.OK,
            data: {
                widget_id,
                promotion_type: response?.promotion_type || '',
                module_name: response!.module_name,
                number_of_product: response!.number_of_product,
                sort_by_field: response!.sort_by_field,
                sort_by_order: response!.sort_by_order,
                background_color: response?.background_color || '',
                brand_logo: response?.brand_logo || '',
                widget_component_id: widgetComponent.id,
                order: widgetComponent.order,
                brands: response?.brands.map((brand) => brand.brand_name) || [],
                categories:
                    response?.categories.map(
                        (category) => category.category_name,
                    ) || [],
                retailers:
                    response?.retailers.map(
                        (retailer) => retailer.retailer_name,
                    ) || [],
                product_slider_id: response!.id,
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
