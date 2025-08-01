import { errorMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getActiveWidgetData, getBannerByID } from '../services/model.service';
import {
    Empty__Output,
    GetActiveLayoutResponse,
    GetActiveLayoutResponse__Output,
    WidgetComponent__Output,
} from '@atc/proto';
import { getActiveLayoutType } from '../validations';

export const getActiveLayout = async (
    call: CustomServerUnaryCall<Empty__Output, GetActiveLayoutResponse>,
    callback: sendUnaryData<GetActiveLayoutResponse__Output>,
) => {
    try {
        const { widget_id } = utilFns.removeEmptyFields(
            call.request,
        ) as getActiveLayoutType;

        const widgetsData = await getActiveWidgetData(widget_id);

        if (!widgetsData) {
            return callback(null, {
                status: status.NOT_FOUND,
                data: null,
                message: errorMessage.WIDGET.NOT_FOUND,
            });
        }

        const widgetData: GetActiveLayoutResponse__Output['data'] = {
            banner: [],
            widget: {
                widget_id: '',
                component: [],
                widget_name: '',
            },
        };

        widgetData.widget = {
            widget_id: widgetsData.id,
            component:
                widgetsData.WidgetComponent as unknown as WidgetComponent__Output[],
            widget_name: widgetsData.widget_name,
        };

        for (
            let index = 0;
            index < widgetsData.WidgetComponent.length;
            index++
        ) {
            const widget = widgetsData.WidgetComponent[index];
            if (widget?.component_type === 'BANNER') {
                const banner = await getBannerByID(widget.reference_model_id);
                widgetData.banner!.push({
                    widget_type: 'BANNER',
                    widget_metadata: {
                        widget_order: widget.order,
                    },
                    widget_data: {
                        banner: {
                            banner_name: banner?.banner_name!,
                            link_type: banner?.link_type!,
                            banner_path: banner?.link || '',
                            image: banner?.image!,
                            internal_link_type:
                                banner?.internal_link_type || '',
                        },
                    },
                    widget_filter: {
                        brand_id: banner?.brands.map((brand) => brand.id) || [],
                        retailer_id:
                            banner?.retailers.map((retailer) => retailer.id) ||
                            [],
                        category_id:
                            banner?.categories.map((category) => category.id) ||
                            [],
                        promotion_type: banner?.promotion_type || '',
                        sample_id: banner?.sample_id || '',
                    },
                });
            }
        }

        return callback(null, {
            status: status.OK,
            message: '',
            data: widgetData,
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
