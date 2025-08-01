import { errorMessage, responseMessage, utilFns } from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import {
    GetAllProductGroupsRequest__Output,
    GetAllProductGroupsResponse,
    GetAllProductGroupsResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { getAllProductGroupsType } from '../validations';
import { logger } from '@atc/logger';
import { getAllGroups } from '../services/model.service';

export const getAllProductGroups = async (
    call: CustomServerUnaryCall<
        GetAllProductGroupsRequest__Output,
        GetAllProductGroupsResponse
    >,
    callback: sendUnaryData<GetAllProductGroupsResponse__Output>,
) => {
    try {
        const { keyword, brand_id, page, limit } = utilFns.removeEmptyFields(
            call.request,
        ) as getAllProductGroupsType;

        const { groups, totalCount } = await getAllGroups(
            page,
            limit,
            keyword,
            brand_id,
        );

        return callback(null, {
            message: responseMessage.PRODUCT_GROUP.RETRIEVED,
            status: status.OK,
            data: {
                product_groups: groups.map((group) => ({
                    ...group,
                    brands: group.brands.map((brand) => ({
                        id: brand.id,
                        name: brand.brand_name,
                    })),
                    no_of_products: group._count.ProductGroupProduct,
                })), total_count: totalCount,
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
