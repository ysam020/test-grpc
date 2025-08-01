import {
    constants,
    errorMessage,
    putS3Object,
    responseMessage,
    utilFns,
} from '@atc/common';
import { prismaClient } from '@atc/db';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    CreateSampleRequest__Output,
    CreateSampleResponse,
    CreateSampleResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    createProductImage,
    createSampleProduct,
    getSampleByID,
    newSample,
} from '../services/model.services';
import { CreateSampleType } from '../validations';
import { productStub } from '../client';

export const CreateSample = async (
    call: CustomServerUnaryCall<
        CreateSampleRequest__Output,
        CreateSampleResponse
    >,
    callback: sendUnaryData<CreateSampleResponse__Output>,
) => {
    const {
        client,
        product_id,
        image,
        description,
        start_date,
        end_date,
        maximum_sample,
        to_get_product,
        task_to_do,
        inquiries,
        location,
        age,
        state,
        gender,
        has_children,
        with_email_saved,
        question_data,
        is_draft,
        mime_type,
        content_length,
        id,
    } = utilFns.removeEmptyFields(call.request) as CreateSampleType;

    try {
        let sampleData: prismaClient.Prisma.SampleCreateInput = {
            description: description || '',
            start_date: start_date || null,
            end_date: end_date || null,
            maximum_sample: maximum_sample || 0,
            to_get_product: to_get_product || '',
            task_to_do: task_to_do || '',
            inquiries: inquiries || '',
            is_draft: is_draft === undefined ? true : is_draft,
            client: client || '',
            location: location || [],
            age: age || [],
            state: state || [],
            gender: gender || '',
            has_children: has_children || '',
            with_email_saved: with_email_saved || '',
        };

        if (id) {
            const sample = await getSampleByID(id);
            if (!sample) {
                return callback(null, {
                    message: errorMessage.SAMPLE.NOT_FOUND,
                    status: status.NOT_FOUND,
                    data: null,
                });
            }
        }

        const result = await newSample(sampleData, question_data, id);
        if (!result) {
            return callback(null, {
                message: errorMessage.SAMPLE.FAILED_TO_CREATE,
                status: status.INTERNAL,
                data: null,
            });
        }

        let productID;

        if (product_id) {
            try {
                const { data } = await new Promise<any>((resolve, reject) => {
                    productStub.productDetails(
                        { id: product_id },
                        call.metadata,
                        (err: any, response: any) => {
                            if (err) reject(err);
                            else resolve(response);
                        },
                    );
                });

                if (data) {
                    productID = data.product_data.id;
                }
            } catch (error) {
                throw error;
            }

            if (!productID) {
                return callback(null, {
                    message: errorMessage.PRODUCT.NOT_FOUND,
                    status: status.NOT_FOUND,
                    data: null,
                });
            }

            await createSampleProduct(product_id, result.id);
        }

        if (image) {
            await putS3Object(
                constants.SAMPLE_PRODUCT_FOLDER,
                image,
                result.id,
                mime_type,
                content_length,
            );

            await createProductImage(result.id, product_id || undefined);
        }

        return callback(null, {
            message: responseMessage.SAMPLE.CREATED,
            status: status.OK,
            data: { id: result.id },
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
