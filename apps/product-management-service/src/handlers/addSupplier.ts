import {
    constants,
    errorMessage,
    putS3Object,
    responseMessage,
    utilFns,
} from '@atc/common';
import { logger } from '@atc/logger';
import {
    AddSupplierRequest__Output,
    AddSupplierResponse,
    AddSupplierResponse__Output,
} from '@atc/proto';
import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import { addSupplierType } from '../validations';
import {
    createSupplier,
    getBrandByIDs,
    getSupplierByName,
} from '../services/model-services';

export const addSupplier = async (
    call: ServerUnaryCall<AddSupplierRequest__Output, AddSupplierResponse>,
    callback: sendUnaryData<AddSupplierResponse__Output>,
) => {
    try {
        const { supplier_name, brand_ids, image, mime_type, content_length } =
            utilFns.removeEmptyFields(call.request) as addSupplierType;

        const existingSupplier = await getSupplierByName(supplier_name);
        if (existingSupplier) {
            return callback(null, {
                message: errorMessage.SUPPLIER.ALREADY_EXISTS,
                data: null,
                status: status.ALREADY_EXISTS,
            });
        }

        if (brand_ids && brand_ids.length > 0) {
            const brands = await getBrandByIDs(brand_ids);

            if (brands.length !== brand_ids.length) {
                return callback(null, {
                    message: errorMessage.BRAND.NOT_FOUND,
                    data: null,
                    status: status.NOT_FOUND,
                });
            }

            if (brands.find((brand) => brand.supplier_id)) {
                return callback(null, {
                    message: errorMessage.SUPPLIER.BRAND_ALREADY_ASSOCIATED,
                    data: null,
                    status: status.ALREADY_EXISTS,
                });
            }
        }

        const supplier = await createSupplier({
            supplier_name,
            brands: {
                connect: brand_ids?.map((id) => ({ id })),
            },
        });

        if (image) {
            await putS3Object(
                constants.SUPPLIER_IMAGE_FOLDER,
                image,
                supplier.id,
                mime_type,
                content_length,
            );
        }

        return callback(null, {
            message: responseMessage.SUPPLIER.CREATED,
            status: status.OK,
            data: supplier,
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
