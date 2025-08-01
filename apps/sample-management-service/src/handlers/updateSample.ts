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
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    findSampleOrDraftByID,
    updateQuestionDataByID,
    updateSampleByID,
    updateSampleProductByID,
} from '../services/model.services';
import {
    UpdateSampleRequest__Output,
    UpdateSampleResponse,
    UpdateSampleResponse__Output,
} from '@atc/proto';
import { prismaClient } from '@atc/db';
import { productStub } from '../client';

export const UpdateSample = async (
    call: CustomServerUnaryCall<
        UpdateSampleRequest__Output,
        UpdateSampleResponse
    >,
    callback: sendUnaryData<UpdateSampleResponse__Output>,
) => {
    try {
        const {
            id,
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
            mime_type,
            content_length,
        } = utilFns.removeEmptyFields(call.request);

        const sample = await findSampleOrDraftByID(id);
        if (!sample) {
            return callback(null, {
                message: errorMessage.SAMPLE.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const updateSampleData: prismaClient.Prisma.SampleUpdateInput = {
            client,
            description,
            start_date,
            end_date,
            maximum_sample,
            to_get_product,
            task_to_do,
            inquiries,
            location: location.length > 0 ? location : undefined,
            state: state.length > 0 ? state : undefined,
            age: age.length > 0 ? age : undefined,
            gender,
            has_children,
            with_email_saved,
        };

        await updateSampleByID(id, updateSampleData);

        if (question_data.length > 0) {
            await updateQuestionDataByID(id, question_data);
        }

        if (image) {
            await invalidateCloudFrontCache(
                `${constants.SAMPLE_PRODUCT_FOLDER}/${sample.id}`,
            );

            await putS3Object(
                constants.SAMPLE_PRODUCT_FOLDER,
                image,
                sample.id,
                mime_type,
                content_length,
            );
        }

        let params: any = { id };

        if (product_id) {
            let productID;

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
                });
            }

            params = { ...params, product_id };
        }

        if (image) {
            params = { ...params, image: sample.id };
        }

        await updateSampleProductByID(params);

        return callback(null, {
            message: responseMessage.SAMPLE.UPDATED,
            status: status.OK,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
