import {
    AnswerType,
    errorMessage,
    responseMessage,
    SampleType,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    SubmitSampleAnswerRequest__Output,
    SubmitSampleAnswerResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import {
    addSampleForReview,
    countRequestedSample,
    createResponsesForAnswers,
    findQuestionByID,
    findRequestedSampleByID,
    findSampleOrDraftByID,
    markSampleAsCompleted,
    obtainSampleByID,
} from '../services/model.services';
import { SubmitSampleAnswerType } from '../validations';

export const SubmitSampleAnswer = async (
    call: CustomServerUnaryCall<
        SubmitSampleAnswerRequest__Output,
        SubmitSampleAnswerResponse__Output
    >,
    callback: sendUnaryData<SubmitSampleAnswerResponse__Output>,
) => {
    try {
        const { userID, role } = call.user;
        const { id, answer_data } = utilFns.removeEmptyFields(
            call.request,
        ) as SubmitSampleAnswerType;

        const sample = await findSampleOrDraftByID(
            id,
            SampleType.PUBLISHED,
            role,
        );
        if (!sample) {
            return callback(null, {
                message: errorMessage.SAMPLE.NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const questionIds = answer_data.map((ans: any) => ans.question_id);
        const questions = await findQuestionByID(id, questionIds);

        const validQuestionIds = questions.map((q) => q.id);
        const invalidQuestions = answer_data.filter(
            (ans: any) => !validQuestionIds.includes(ans.question_id),
        );
        if (invalidQuestions.length > 0) {
            return callback(null, {
                message: errorMessage.SAMPLE.QUESTION_NOT_FOUND,
                status: status.NOT_FOUND,
            });
        }

        const answerDataWithTypes = answer_data.map((answer: any) => {
            const question = questions.find((q) => q.id === answer.question_id);
            return {
                ...answer,
                answer_type: question?.answer_type,
            };
        });

        for (let answer of answerDataWithTypes) {
            const question = questions.find((q) => q.id === answer.question_id);

            if (!question) continue;

            const { answer_type } = question;

            if (answer_type === AnswerType.TEXT) {
                continue;
            }

            const providedOptions = answer.option;

            if (!providedOptions || providedOptions.length === 0) {
                return callback(null, {
                    message: errorMessage.SAMPLE.OPTION_REQUIRED,
                    status: status.INVALID_ARGUMENT,
                });
            }

            const validOptions = question.options.map((opt: any) => opt.id);
            const invalidOptions = providedOptions.filter(
                (option: string) => !validOptions.includes(option),
            );

            if (invalidOptions.length > 0) {
                return callback(null, {
                    message: errorMessage.SAMPLE.OPTION_NOT_FOUND,
                    status: status.INVALID_ARGUMENT,
                });
            }

            if (answer_type === AnswerType.SINGLE) {
                if (
                    !providedOptions ||
                    providedOptions.length !== 1 ||
                    !providedOptions[0]
                ) {
                    return callback(null, {
                        message: errorMessage.SAMPLE.SINGLE_ANSWER_REQUIRED,
                        status: status.INVALID_ARGUMENT,
                    });
                }
            }

            if (answer_type === AnswerType.MULTI) {
                if (!providedOptions || providedOptions.length === 0) {
                    return callback(null, {
                        message: errorMessage.SAMPLE.MULTI_ANSWER_REQUIRED,
                        status: status.INVALID_ARGUMENT,
                    });
                }

                const validOptions = providedOptions.filter(
                    (option: any) => option && option.trim() !== '',
                );
                if (validOptions.length !== providedOptions.length) {
                    return callback(null, {
                        message: errorMessage.SAMPLE.INVALID_OPTION_ID,
                        status: status.INVALID_ARGUMENT,
                    });
                }
            }
        }

        const result = await createResponsesForAnswers(
            answerDataWithTypes,
            userID,
        );
        if (!result) {
            return callback(null, {
                message: errorMessage.SAMPLE.FAILED_TO_SUBMIT_ANSWERS,
                status: status.INTERNAL,
            });
        }

        const alreadyRequested = await findRequestedSampleByID(id, userID);
        if (!alreadyRequested) {
            await obtainSampleByID(id, userID);
            await addSampleForReview(id, userID);
        }

        const requestedSample = await countRequestedSample(id);
        if (requestedSample >= sample.maximum_sample) {
            await markSampleAsCompleted(id);
        }

        return callback(null, {
            message: responseMessage.SAMPLE.SUBMITTED,
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
