import {
    AnswerType,
    ReviewType,
    SampleStatus,
    SampleType,
    SortByOrder,
    SurveyType,
    UserRoleEnum,
} from '@atc/common';
import { dbClient, prismaClient } from '@atc/db';
import { logger } from '@atc/logger';

async function newSample(
    sampleData: prismaClient.Prisma.SampleCreateInput,
    questionsData: any,
    sampleID?: string,
) {
    try {
        return await dbClient.$transaction(async () => {
            let sample;
            if (sampleID) {
                sample = await dbClient.sample.upsert({
                    where: { id: sampleID },
                    create: sampleData,
                    update: sampleData,
                });

                await dbClient.sampleQuestion.deleteMany({
                    where: { sample_id: sampleID },
                });
            } else {
                sample = await dbClient.sample.create({
                    data: sampleData,
                });
            }

            if (questionsData && questionsData.length > 0) {
                for (const questionData of questionsData) {
                    const que = await dbClient.sampleQuestion.create({
                        data: {
                            sample_id: sample.id,
                            question: questionData.question,
                            answer_type: questionData.answer_type,
                        },
                    });

                    if (
                        questionData.options &&
                        questionData.options.length > 0
                    ) {
                        for (const option of questionData.options) {
                            await dbClient.sampleOption.create({
                                data: {
                                    question_id: que.id,
                                    option,
                                },
                            });
                        }
                    }
                }
            }

            return sample;
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function createProductImage(
    id: prismaClient.Prisma.SampleProductWhereUniqueInput['id'],
    product_id:
        | prismaClient.Prisma.MasterProductWhereUniqueInput['id']
        | undefined,
) {
    try {
        return await dbClient.sampleProduct.upsert({
            where: { sample_id: id },
            update: { image: id },
            create: {
                sample_id: id!,
                image: id!,
                product_id: product_id || null,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function createSampleProduct(
    product_id: prismaClient.Prisma.MasterProductWhereUniqueInput['id'],
    sample_id: prismaClient.Prisma.SampleWhereUniqueInput['id'],
) {
    try {
        return dbClient.sampleProduct.upsert({
            where: { sample_id: sample_id },
            update: { product_id: product_id },
            create: {
                sample_id: sample_id!,
                product_id: product_id,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findSampleOrDraftByID(
    id: prismaClient.Prisma.SampleWhereUniqueInput['id'],
    type?: string,
    role?: prismaClient.Prisma.UserWhereUniqueInput['role'],
) {
    try {
        const is_draft = type === SurveyType.DRAFT ? true : false;

        let matchQuery = {};

        if (role === UserRoleEnum.USER) {
            const today = new Date();
            const startOfToday = new Date(today);
            startOfToday.setHours(0, 0, 0, 0);

            const endOfToday = new Date(today);
            endOfToday.setHours(23, 59, 59, 999);

            matchQuery = {
                is_active: true,
                is_completed: false,
                OR: [
                    { start_date: { lte: endOfToday } },
                    { end_date: { gte: startOfToday } },
                    {
                        start_date: { gte: startOfToday, lte: endOfToday },
                        end_date: { gte: startOfToday, lte: endOfToday },
                    },
                ],
            };
        }

        return await dbClient.sample.findUnique({
            where: { id, ...(type ? { is_draft } : {}), ...matchQuery },
            select: {
                id: true,
                description: true,
                is_active: true,
                start_date: true,
                end_date: true,
                maximum_sample: true,
                to_get_product: true,
                task_to_do: true,
                inquiries: true,
                product: {
                    select: {
                        id: true,
                        product_id: true,
                        image: true,
                    },
                },
                questions: {
                    select: {
                        id: true,
                        question: true,
                        answer_type: true,
                        options: {
                            select: {
                                id: true,
                                option: true,
                            },
                        },
                        responses: true,
                    },
                },
                samples: {
                    include: {
                        user: true,
                    },
                },
                reviews: true,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function updateSampleByID(
    id: prismaClient.Prisma.SampleWhereUniqueInput['id'],
    updatedData: prismaClient.Prisma.SampleUpdateInput,
) {
    try {
        const {
            client,
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
        } = updatedData;

        const sampleUpdateData = {
            client,
            description,
            start_date: start_date ? start_date : undefined,
            end_date: end_date ? end_date : undefined,
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
        };

        return await dbClient.sample.update({
            where: { id },
            data: sampleUpdateData,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function updateQuestionDataByID(
    id: prismaClient.Prisma.SampleWhereUniqueInput['id'],
    questionsData: any,
) {
    try {
        return await dbClient.$transaction(async () => {
            await dbClient.sampleQuestion.deleteMany({
                where: { sample_id: id },
            });

            for (const questionData of questionsData) {
                const que = await dbClient.sampleQuestion.create({
                    data: {
                        sample_id: id!,
                        question: questionData.question,
                        answer_type: questionData.answer_type,
                    },
                });

                if (questionData.options && questionData.options.length > 0) {
                    for (const option of questionData.options) {
                        await dbClient.sampleOption.create({
                            data: {
                                question_id: que.id,
                                option,
                            },
                        });
                    }
                }
            }
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function updateSampleProductByID(params: {
    id: prismaClient.Prisma.SampleWhereUniqueInput['id'];
    product_id: prismaClient.Prisma.MasterProductWhereUniqueInput['id'] | null;
    image: prismaClient.Prisma.SampleWhereUniqueInput['id'] | null | undefined;
}) {
    try {
        const { id, product_id, image } = params;

        return await dbClient.sampleProduct.upsert({
            where: { sample_id: id },
            update: {
                ...(product_id && { product_id }),
                ...(image && { image }),
            },
            create: {
                sample_id: id!,
                product_id: product_id ?? null,
                image: image ?? null,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function deleteSampleByID(
    id: prismaClient.Prisma.SampleWhereUniqueInput['id'],
    sample: any,
) {
    try {
        return await dbClient.$transaction(async (prisma) => {
            if (sample.questions && sample.questions.length > 0) {
                for (const question of sample.questions) {
                    if (question.options && question.options.length > 0) {
                        await prisma.sampleOption.deleteMany({
                            where: {
                                question_id: question.id,
                            },
                        });
                    }

                    if (question.responses && question.responses.length > 0) {
                        await prisma.sampleResponse.deleteMany({
                            where: {
                                question_id: question.id,
                            },
                        });
                    }
                }
            }

            if (sample.questions && sample.questions.length > 0) {
                await prisma.sampleQuestion.deleteMany({
                    where: { sample_id: id },
                });
            }

            if (sample.product) {
                await prisma.sampleProduct.delete({
                    where: { sample_id: id },
                });
            }

            if (sample.samples && sample.samples.length > 0) {
                await prisma.sampleUser.deleteMany({
                    where: {
                        sample_id: id,
                    },
                });
            }

            if (sample.reviews && sample.reviews.length > 0) {
                await prisma.sampleReview.deleteMany({
                    where: { sample_id: id },
                });
            }

            return await prisma.sample.delete({ where: { id } });
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findSampleByID(params: {
    id: prismaClient.Prisma.SampleWhereUniqueInput['id'];
    role?: prismaClient.Prisma.UserWhereUniqueInput['role'];
    userCreatedAt?: string;
    is_widget_sample?: boolean;
}) {
    const { id, role, userCreatedAt, is_widget_sample } = params;

    try {
        let matchQuery = {};

        if (role && role === UserRoleEnum.USER) {
            const today = new Date();

            const endOfToday = new Date(today);
            endOfToday.setHours(23, 59, 59, 999);

            matchQuery = {
                is_draft: false,
                AND: [
                    {
                        start_date: { lte: endOfToday },
                    },
                ],
            };
        }

        if (is_widget_sample) {
            matchQuery = { ...matchQuery, is_draft: false };
        }

        const data = await dbClient.sample.findUnique({
            where: { id, ...matchQuery },
            select: {
                id: true,
                client: true,
                description: true,
                start_date: true,
                end_date: true,
                to_get_product: true,
                task_to_do: true,
                inquiries: true,
                location: true,
                age: true,
                gender: true,
                state: true,
                has_children: true,
                with_email_saved: true,
                maximum_sample: true,
                is_active: true,
                is_completed: true,
                is_draft: true,
                questions: {
                    select: {
                        id: true,
                        question: true,
                        answer_type: true,
                        options: {
                            select: {
                                id: true,
                                option: true,
                            },
                        },
                    },
                },
                product: {
                    select: {
                        product_id: true,
                        image: true,
                        product: {
                            select: {
                                product_name: true,
                                retailerCurrentPricing: {
                                    select: {
                                        product_url: true,
                                        Retailer: {
                                            select: {
                                                retailer_name: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!data) return null;

        let received_on;

        if (userCreatedAt) {
            received_on = data.start_date;

            const userCreatedAtDate = new Date(userCreatedAt);

            if (userCreatedAtDate > new Date(received_on!)) {
                received_on = userCreatedAtDate;
            }
        }

        if (role === UserRoleEnum.USER) {
            let formattedQuestionData;

            if (data.questions.length > 0) {
                formattedQuestionData = data.questions.map((question) => ({
                    id: question.id || '',
                    question: question.question || '',
                    answer_type: question.answer_type || '',
                    options:
                        question.options.map((opt: any) => {
                            return {
                                option_id: opt.id || '',
                                option: opt.option,
                            };
                        }) || [],
                }));
            }

            return {
                id: data.id || '',
                end_date: data.end_date ? data.end_date.toISOString() : '',
                to_get_product: data.to_get_product || '',
                task_to_do: data.task_to_do || '',
                inquiries: data.inquiries || '',
                received_on: received_on ? received_on.toISOString() : '',
                product_data: {
                    product_id: data.product?.product_id || '',
                    image:
                        data.product && data.product.image
                            ? data.product.image
                            : '',
                    name: data.product?.product?.product_name || '',
                    product_url: data.product?.product?.retailerCurrentPricing
                        ? data.product.product.retailerCurrentPricing[0]
                              ?.product_url
                        : '',
                    retailer_name:
                        data.product?.product?.retailerCurrentPricing &&
                        data.product.product.retailerCurrentPricing.length > 0
                            ? data.product.product.retailerCurrentPricing[0]
                                  ?.Retailer.retailer_name
                            : '',
                },
                question_data:
                    formattedQuestionData && formattedQuestionData?.length > 0
                        ? formattedQuestionData
                        : [],
            };
        }

        let sample: any = {
            id: data.id || '',
            client: data.client || '',
            description: data.description || '',
            start_date: data.start_date ? data.start_date.toISOString() : '',
            end_date: data.end_date ? data.end_date.toISOString() : '',
            to_get_product: data.to_get_product || '',
            task_to_do: data.task_to_do || '',
            inquiries: data.inquiries || '',
            location: data.location || [],
            age: data.age || [],
            state: data.state || [],
            gender: data.gender || '',
            has_children: data.has_children || '',
            with_email_saved: data.with_email_saved || '',
            maximum_sample: data.maximum_sample || 0,
            is_active: data.is_active || false,
            is_completed: data.is_completed || false,
            is_draft: data.is_draft || false,
            sample_sent: { count: 0, average: 0 },
            sample_completed: { count: 0, average: 0 },
            survey_completed: { count: 0, average: 0 },
            questions: [],
            product_data: {
                product_id: data.product?.product_id || '',
                image: data.product?.image || '',
                name: data.product?.product?.product_name || '',
            },
            received_on: data.start_date
                ? new Date(data.start_date).toISOString()
                : '',
        };

        let totalDuration = 0;
        let daysSinceStart = 0;

        if (data.start_date && data.end_date) {
            const daysCount = await findNumberOfDays(
                data.start_date!,
                data.end_date!,
            );

            totalDuration = daysCount.totalDuration;
            daysSinceStart = daysCount.daysSinceStart;
        }

        if (data.is_draft === true) {
            const questionData = [];

            for (const question of data.questions) {
                const { totalAnswered, optionAverage } =
                    await countAverageForOptions(question.id);

                questionData.push({
                    question_id: question.id,
                    question: question.question,
                    answer_type: question.answer_type,
                    options: optionAverage,
                    total_answered: totalAnswered,
                    total_duration: totalDuration,
                    days_since_start:
                        daysSinceStart > totalDuration
                            ? totalDuration
                            : daysSinceStart,
                });
            }

            sample.questions = questionData;

            return sample;
        }

        const totalRequested = await countRequestedSample(id);
        const sampleCompleted = await countCompletedSample(
            id,
            data.maximum_sample,
        );
        const surveyCompleted = await countCompletedSurvey(
            id,
            data.maximum_sample,
        );
        const sampleSent = await countSampleSent(
            totalRequested,
            data.maximum_sample,
        );

        const questionData = [];
        for (const question of data.questions) {
            const { totalAnswered, optionAverage } =
                await countAverageForOptions(question.id);

            questionData.push({
                question_id: question.id,
                question: question.question,
                answer_type: question.answer_type,
                options: optionAverage,
                total_answered: totalAnswered,
                total_duration: totalDuration,
                days_since_start:
                    daysSinceStart > totalDuration
                        ? totalDuration
                        : daysSinceStart,
            });
        }

        sample.questions = questionData;
        sample.sample_completed = sampleCompleted;
        sample.survey_completed = surveyCompleted;
        sample.sample_sent = sampleSent;

        return sample;
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findAllSamples(params: {
    type: string;
    page: number;
    limit: number;
    sample_status?: string;
    start_date?: Date;
    end_date?: Date;
    keyword?: string;
}) {
    const { type, page, limit, sample_status, start_date, end_date, keyword } =
        params;

    try {
        const skip = (page - 1) * limit;

        let matchQuery: any = {};

        if (type === SurveyType.DRAFT) {
            matchQuery = { ...matchQuery, is_draft: true };
        }

        if (type === SurveyType.PUBLISHED) {
            matchQuery = { ...matchQuery, is_draft: false };

            if (start_date && end_date) {
                const startOfDay = new Date(start_date);
                startOfDay.setHours(0, 0, 0, 0);

                const endOfDay = new Date(end_date);
                endOfDay.setHours(23, 59, 59, 999);

                matchQuery = {
                    ...matchQuery,
                    start_date: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                    end_date: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                };
            }
        }

        if (type === SampleType.WIDGET) {
            const today = new Date();
            const startOfToday = new Date(today);
            startOfToday.setHours(0, 0, 0, 0);

            const endOfToday = new Date(today);
            endOfToday.setHours(23, 59, 59, 999);

            matchQuery = {
                is_completed: false,
                is_draft: false,
                is_active: true,
                OR: [
                    { end_date: { gte: endOfToday } },
                    { end_date: { gte: startOfToday, lte: endOfToday } },
                ],
            };
        }

        if (sample_status) {
            if (sample_status === SampleStatus.ACTIVE) {
                matchQuery = { ...matchQuery, is_active: true };
            }

            if (sample_status === SampleStatus.COMPLETED) {
                matchQuery = { ...matchQuery, is_completed: true };
            }

            if (sample_status === SampleStatus.INACTIVE) {
                matchQuery = { ...matchQuery, is_active: false };
            }
        }

        if (keyword) {
            matchQuery = {
                ...matchQuery,
                product: {
                    product: {
                        product_name: {
                            contains: keyword,
                            mode: 'insensitive',
                        },
                    },
                },
            };
        }

        let totalCount = 0;

        const filteredSamples = await dbClient.sample.findMany({
            where: matchQuery,
            select: {
                id: true,
                client: true,
                is_active: true,
                is_completed: true,
                is_draft: true,
                maximum_sample: true,
                description: true,
                start_date: true,
                end_date: true,
                product: {
                    select: {
                        product_id: true,
                        image: true,
                        product: {
                            select: {
                                product_name: true,
                            },
                        },
                    },
                },
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: SortByOrder.DESC,
            },
        });

        totalCount = await dbClient.sample.count({
            where: matchQuery,
        });

        if (filteredSamples.length === 0) {
            return {
                samples: null,
                total_count: 0,
            };
        }

        if (type === SampleType.DRAFT || type === SampleType.WIDGET) {
            const sampleWithAdditionalData = filteredSamples.map((sample) => ({
                id: sample.id || '',
                client: sample.client || '',
                is_active: sample.is_active || false,
                is_completed: sample.is_completed || false,
                is_draft: sample.is_draft || false,
                maximum_sample: sample.maximum_sample || 0,
                description: sample.description || '',
                product_name: sample.product
                    ? sample.product.product?.product_name || ''
                    : '',
                image: sample.product?.image || '',
                sample_completed: { count: 0, average: 0 },
                survey_completed: { count: 0, average: 0 },
                sample_sent: { count: 0, average: 0 },
                end_date: sample.end_date ? sample.end_date.toISOString() : '',
            }));

            return {
                samples: sampleWithAdditionalData,
                total_count: totalCount,
            };
        }

        const sampleWithAdditionalData = [];

        for (const sample of filteredSamples) {
            const totalRequested = await countRequestedSample(sample.id);
            const sampleCompleted = await countCompletedSample(
                sample.id!,
                sample.maximum_sample,
            );
            const surveyCompleted = await countCompletedSurvey(
                sample.id,
                sample.maximum_sample,
            );
            const sampleSent = await countSampleSent(
                totalRequested,
                sample.maximum_sample,
            );

            sampleWithAdditionalData.push({
                id: sample.id || '',
                client: sample.client || '',
                is_active: sample.is_active || false,
                is_completed: sample.is_completed || false,

                is_draft: sample.is_draft || false,
                maximum_sample: sample.maximum_sample || 0,
                description: sample.description || '',
                product_name: sample.product
                    ? sample.product.product?.product_name || ''
                    : '',
                sample_completed: {
                    count: sampleCompleted.count,
                    average: sampleCompleted.average,
                },
                survey_completed: {
                    count: surveyCompleted.count,
                    average: surveyCompleted.average,
                },
                sample_sent: {
                    count: sampleSent.count,
                    average: sampleSent.average,
                },
                image: sample.product?.image || '',
                end_date: sample.end_date ? sample.end_date.toISOString() : '',
            });
        }

        return {
            samples: sampleWithAdditionalData,
            total_count: totalCount || 0,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function toggleSampleByID({
    id,
    is_active,
}: prismaClient.Prisma.SampleWhereUniqueInput) {
    try {
        await dbClient.sample.update({
            where: { id },
            data: { is_active: is_active === true ? false : true },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function publishSampleBYID(
    id: prismaClient.Prisma.SampleWhereUniqueInput['id'],
) {
    try {
        return await dbClient.sample.update({
            where: { id },
            data: { is_draft: false },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function obtainSampleByID(
    sampleID: prismaClient.Prisma.SampleWhereUniqueInput['id'],
    userID: prismaClient.Prisma.UserWhereUniqueInput['id'],
) {
    try {
        return await dbClient.sampleUser.upsert({
            where: {
                sample_id_user_id: {
                    sample_id: sampleID!,
                    user_id: userID!,
                },
            },
            update: {
                updatedAt: new Date(),
            },
            create: {
                sample_id: sampleID!,
                user_id: userID!,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findRequestedSampleByID(
    sampleId: prismaClient.Prisma.SampleWhereUniqueInput['id'],
    userId: prismaClient.Prisma.UserWhereUniqueInput['id'],
) {
    try {
        return await dbClient.sampleUser.findFirst({
            where: {
                sample_id: sampleId,
                user_id: userId,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function addSampleForReview(
    id: prismaClient.Prisma.SampleWhereUniqueInput['id'],
    userID: prismaClient.Prisma.UserWhereUniqueInput['id'],
) {
    try {
        return await dbClient.sampleReview.create({
            data: {
                sample_id: id!,
                user_id: userID!,
                rating: 0,
                comment: '',
                image: '',
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function countRequestedSample(
    sampleID: prismaClient.Prisma.SampleWhereUniqueInput['id'],
) {
    try {
        const count = await dbClient.sampleUser.count({
            where: {
                sample_id: sampleID,
            },
        });

        return count > 0 ? count : 0;
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function markSampleAsCompleted(
    id: prismaClient.Prisma.SampleWhereUniqueInput['id'],
) {
    try {
        return await dbClient.sample.update({
            where: { id },
            data: { is_completed: true },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findQuestionByID(
    id: prismaClient.Prisma.SampleWhereUniqueInput['id'],
    questionIds: string[],
) {
    try {
        const questions = await dbClient.sampleQuestion.findMany({
            where: {
                sample_id: id!,
                id: { in: questionIds },
            },
            select: {
                id: true,
                question: true,
                answer_type: true,
                options: {
                    select: {
                        id: true,
                        option: true,
                    },
                },
            },
        });

        return questions;
    } catch (error) {
        throw error;
    }
}

async function createReviewByID(
    id: prismaClient.Prisma.SampleWhereUniqueInput['id'],
    reviewData: any,
    user_id: prismaClient.Prisma.UserWhereUniqueInput['id'],
) {
    try {
        return await dbClient.sampleReview.upsert({
            where: {
                sample_id_user_id: {
                    sample_id: id!,
                    user_id: user_id!,
                },
            },
            update: {
                rating: reviewData.rating ? reviewData.rating : null,
                comment: reviewData.comment ? reviewData.comment : '',
                image: reviewData.image ?? '',
            },
            create: {
                sample_id: id!,
                rating: reviewData.rating ? reviewData.rating : null,
                comment: reviewData.comment ? reviewData.comment : '',
                user_id: user_id!,
                image: reviewData.image ?? '',
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findAllReviews(
    userID: prismaClient.Prisma.UserWhereUniqueInput['id'],
    page: number,
    limit: number,
    userCreatedAt: string,
    type?: string,
) {
    try {
        const skip = (page - 1) * limit;

        let matchQuery: any = { user_id: userID };

        if (type === ReviewType.PENDING) {
            matchQuery = {
                ...matchQuery,
                AND: [
                    { rating: { equals: 0.0 } },
                    { comment: '' },
                    { image: '' },
                ],
            };
        } else if (type === ReviewType.COMPLETED) {
            matchQuery = {
                ...matchQuery,
                OR: [
                    { rating: { not: 0.0 } },
                    { comment: { not: '' } },
                    { image: { not: '' } },
                ],
            };
        }

        const userCreatedAtDate = userCreatedAt
            ? new Date(userCreatedAt)
            : null;

        const data = await dbClient.sampleReview.findMany({
            where: matchQuery,
            select: {
                id: true,
                rating: true,
                comment: true,
                image: true,
                createdAt: true,
                sample: {
                    select: {
                        id: true,
                        start_date: true,
                        product: {
                            select: {
                                image: true,
                                product: {
                                    select: {
                                        product_name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: SortByOrder.DESC,
            },
            skip,
            take: limit,
        });

        const totalCount = await dbClient.sampleReview.count({
            where: matchQuery,
        });

        const reviews =
            data.length > 0
                ? data.map((review) => {
                      let received_on = review.sample.start_date;
                      if (
                          userCreatedAtDate &&
                          received_on &&
                          userCreatedAtDate > new Date(received_on)
                      ) {
                          received_on = userCreatedAtDate;
                      }

                      return {
                          id: review.id,
                          rating: review.rating ? review.rating.toNumber() : 0,
                          comment: review.comment || '',
                          review_image: review.image || '',
                          sample_data: {
                              id: review.sample.id || '',
                              name:
                                  review.sample.product?.product
                                      ?.product_name || '',
                              received_on: received_on
                                  ? new Date(received_on).toISOString()
                                  : '',
                              image: review.sample.product?.image || '',
                          },
                      };
                  })
                : [];

        return {
            reviews,
            totalCount,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function countCompletedSample(
    id: prismaClient.Prisma.SampleWhereUniqueInput['id'],
    totalCount: number,
) {
    try {
        const reviewdSampleCount = await dbClient.sampleReview.count({
            where: {
                sample_id: id,
                OR: [
                    { rating: { not: 0.0 } },
                    { comment: { not: '' } },
                    { image: { not: '' } },
                ],
            },
        });

        const average =
            totalCount > 0 ? (reviewdSampleCount / totalCount) * 100 : 0;

        return {
            count: Math.max(reviewdSampleCount, 0),
            average: average >= 0 ? parseFloat(average.toFixed(2)) : 0,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function countCompletedSurvey(
    id: prismaClient.Prisma.SampleWhereUniqueInput['id'],
    totalCount: number,
) {
    try {
        const totalQuestions = await dbClient.sampleQuestion.count({
            where: { sample_id: id },
        });

        const userAnswerCounts = await dbClient.sampleResponse.groupBy({
            by: ['user_id'],
            where: {
                question: {
                    sample_id: id,
                },
            },
            _count: {
                question_id: true,
            },
        });

        const completedSurvey = userAnswerCounts.filter(
            (user) => user._count.question_id >= totalQuestions,
        ).length;

        const average =
            totalCount > 0 ? (completedSurvey / totalCount) * 100 : 0;

        return {
            count: completedSurvey >= 0 ? completedSurvey : 0,
            average: average >= 0 ? parseFloat(average.toFixed(2)) : 0,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function countSampleSent(
    requestedSample: number,
    maximum_sample: number,
) {
    try {
        let average = 0;

        if (maximum_sample && maximum_sample > 0) {
            average = (requestedSample / maximum_sample) * 100;
        }

        return {
            count: requestedSample >= 0 ? requestedSample : 0,
            average: average >= 0 ? parseFloat(average.toFixed(2)) : 0 || 0,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findNumberOfDays(start_date: Date, end_date: Date) {
    try {
        const start = new Date(start_date.setHours(0, 0, 0, 0));
        const end = new Date(end_date.setHours(0, 0, 0, 0));
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil(
            (end.getTime() - start.getTime()) / (1000 * 3600 * 24),
        );
        const totalDuration = Math.max(diffDays, 0);

        const diffStartDays = Math.ceil(
            (now.getTime() - start.getTime()) / (1000 * 3600 * 24),
        );
        const daysSinceStart = Math.min(
            totalDuration,
            Math.max(diffStartDays, 0),
        );

        return {
            totalDuration,
            daysSinceStart,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function countAverageForOptions(questionId: string) {
    try {
        const options = await dbClient.sampleOption.findMany({
            where: { question_id: questionId },
        });

        const responseCounts = await dbClient.sampleResponse.groupBy({
            by: ['option_id'],
            where: { question_id: questionId },
            _count: { user_id: true },
        });

        const responseCountMap = new Map(
            responseCounts.map((response) => [
                response.option_id,
                response._count.user_id,
            ]),
        );

        let totalResponses = 0;

        const optionCountMap = options.map((option) => {
            const count = responseCountMap.get(option.id) || 0;
            totalResponses += count;
            return {
                option_id: option.id,
                option: option.option,
                count,
            };
        });

        const optionPercentages = optionCountMap.map((response) => {
            const percentage =
                totalResponses > 0
                    ? (response.count / totalResponses) * 100
                    : 0;
            return {
                option_id: response.option_id,
                option: response.option,
                count: response.count >= 0 ? response.count : 0,
                average: parseFloat(percentage.toFixed(2)),
            };
        });

        return {
            totalAnswered: totalResponses,
            optionAverage: optionPercentages,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findResposesByUserID(
    questionData: any[],
    userID: prismaClient.Prisma.UserWhereUniqueInput['id'],
) {
    try {
        let questionResponse: any[] = [];

        for (const question of questionData) {
            questionResponse = await dbClient.sampleResponse.findMany({
                where: {
                    question_id: question.id,
                    user_id: userID,
                },
                select: {
                    id: true,
                    question_id: true,
                    option: true,
                    text: true,
                },
            });
        }

        return questionResponse.map((response) => ({
            responses: [
                {
                    option_id: response.option?.id || '',
                    text: response.text || '',
                },
            ],
            question_id: response.question_id || '',
        }));
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function createResponsesForAnswers(
    answerData: any[],
    userID: prismaClient.Prisma.UserWhereUniqueInput['id'],
) {
    try {
        const textResponses = [];
        const nonTextResponses = [];

        // Separate text answers and non-text answers
        for (const answer of answerData) {
            const options = answer.option;

            if (answer.answer_type === AnswerType.TEXT) {
                textResponses.push({
                    question_id: answer.question_id,
                    user_id: userID!,
                    text: options[0] || '',
                });
            } else {
                const optionID = options[0]; // For SINGLE and MULTI, we only need the first option
                if (answer.answer_type === AnswerType.MULTI) {
                    for (const optionID of options) {
                        nonTextResponses.push({
                            question_id: answer.question_id,
                            user_id: userID!,
                            option_id: optionID,
                            text: '',
                        });
                    }
                } else {
                    nonTextResponses.push({
                        question_id: answer.question_id,
                        user_id: userID!,
                        option_id: optionID,
                        text: '',
                    });
                }
            }
        }

        // Handle TEXT responses
        for (const response of textResponses) {
            const existingResponse = await dbClient.sampleResponse.findFirst({
                where: {
                    question_id: response.question_id,
                    user_id: response.user_id!,
                },
            });

            if (existingResponse) {
                await dbClient.sampleResponse.update({
                    where: {
                        id: existingResponse.id,
                    },
                    data: {
                        text: response.text || '',
                    },
                });
            } else {
                await dbClient.sampleResponse.create({
                    data: response,
                });
            }
        }

        for (const response of nonTextResponses) {
            const existingResponse = await dbClient.sampleResponse.findFirst({
                where: {
                    question_id: response.question_id,
                    user_id: response.user_id!,
                    option_id: response.option_id || '',
                },
            });

            if (existingResponse) {
                await dbClient.sampleResponse.update({
                    where: {
                        id: existingResponse.id,
                    },
                    data: {
                        text: response.text || '',
                        option_id: response.option_id || '',
                    },
                });
            } else {
                await dbClient.sampleResponse.create({
                    data: response,
                });
            }
        }

        return true;
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findAllSamplesForUser(params: {
    type: string;
    page: number;
    limit: number;
    role: prismaClient.Prisma.UserWhereUniqueInput['role'];
    sampleStatus?: string;
    userID?: prismaClient.Prisma.UserWhereUniqueInput['id'];
    userCreatedAt?: string;
}) {
    try {
        const { type, page, limit, role, userID, userCreatedAt } = params;

        const skip = (page - 1) * limit;

        let matchQuery: any = {};

        type === SurveyType.DRAFT
            ? (matchQuery = { ...matchQuery, is_draft: true })
            : (matchQuery = { ...matchQuery, is_draft: false });

        if (role === UserRoleEnum.USER) {
            const today = new Date();
            const startOfToday = new Date(today);
            startOfToday.setHours(0, 0, 0, 0);

            const endOfToday = new Date(today);
            endOfToday.setHours(23, 59, 59, 999);

            matchQuery = {
                is_active: true,
                is_completed: false,
                is_draft: false,
                AND: [
                    {
                        start_date: { lte: endOfToday },
                    },
                    {
                        OR: [
                            { end_date: { gte: endOfToday } },
                            {
                                end_date: {
                                    gte: startOfToday,
                                    lte: endOfToday,
                                },
                            },
                        ],
                    },
                ],
            };
        }

        let totalCount = 0;

        const userSampleIds = await dbClient.sampleUser.findMany({
            where: {
                user_id: userID,
            },
            select: {
                sample_id: true,
            },
        });

        const obtainedSampleIds = userSampleIds.map((entry) => entry.sample_id);

        totalCount = await dbClient.sample.count({
            where: {
                ...matchQuery,
                id: {
                    notIn: obtainedSampleIds,
                },
            },
        });

        const samples = await dbClient.sample.findMany({
            where: {
                ...matchQuery,
                id: {
                    notIn: obtainedSampleIds,
                },
            },
            select: {
                id: true,
                client: true,
                is_active: true,
                is_completed: true,
                is_draft: true,
                maximum_sample: true,
                description: true,
                start_date: true,
                product: {
                    select: {
                        product_id: true,
                        image: true,
                        product: {
                            select: {
                                product_name: true,
                            },
                        },
                    },
                },
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: SortByOrder.DESC,
            },
        });

        if (samples.length === 0) {
            return {
                samples: null,
                total_count: 0,
            };
        }

        const transformedSamples = samples.map((sample) => {
            let received_on = sample.start_date;

            if (userCreatedAt) {
                const userCreatedAtDate = new Date(userCreatedAt);

                if (userCreatedAtDate > new Date(received_on!)) {
                    received_on = userCreatedAtDate;
                }
            }

            return {
                id: sample.id || '',
                received_on: received_on
                    ? new Date(received_on).toISOString()
                    : '',
                product_data: {
                    product_id: sample.product?.product_id || '',
                    name: sample.product?.product?.product_name || '',
                    image: sample.product?.image || '',
                },
            };
        });

        return {
            samples: transformedSamples,
            total_count: totalCount || 0,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findAllSampleResponseByUserID(
    user_id: prismaClient.Prisma.UserWhereUniqueInput['id'],
    page: number,
    limit: number,
) {
    try {
        const skip = (page - 1) * limit;

        const samples = await dbClient.sampleUser.findMany({
            where: {
                user_id: user_id,
            },
            select: {
                createdAt: true,
                sample: {
                    select: {
                        id: true,
                        description: true,
                        product: {
                            select: {
                                image: true,
                                product: {
                                    select: {
                                        product_name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            skip,
            take: limit,
            orderBy: { createdAt: SortByOrder.DESC },
        });

        const total_count = await dbClient.sampleUser.count({
            where: { user_id: user_id },
        });

        const requested_samples = samples.map((sample) => {
            return {
                id: sample.sample.id || '',
                image:
                    (sample.sample.product &&
                        sample.sample.product.product &&
                        sample.sample.product.image) ||
                    '',
                name: sample.sample.product?.product?.product_name || '',
                description: sample.sample.description || '',
                availed_date: sample.createdAt.toISOString() || '',
            };
        });

        return {
            requested_samples:
                requested_samples.length > 0 ? requested_samples : null,
            total_count,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findSampleToReview(
    id: prismaClient.Prisma.SampleWhereUniqueInput['id'],
) {
    try {
        const today = new Date();
        const startOfToday = new Date(today);
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);

        return await dbClient.sample.findUnique({
            where: {
                id,
                is_active: true,
                OR: [
                    { start_date: { lte: endOfToday } },
                    { end_date: { gte: startOfToday } },
                    {
                        start_date: { gte: startOfToday, lte: endOfToday },
                        end_date: { gte: startOfToday, lte: endOfToday },
                    },
                ],
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

const getAllSamplesCount = async () => {
    try {
        return await dbClient.sample.count();
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

async function findSamplesByIDs(sampleIDs: string[]) {
    try {
        const today = new Date();
        const startOfToday = new Date(today);
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);

        const samples = await dbClient.sample.findMany({
            where: {
                id: { in: sampleIDs },
                is_active: true,
                is_completed: false,
                is_draft: false,
                AND: [
                    {
                        start_date: { lte: endOfToday },
                    },
                    {
                        OR: [
                            { end_date: { gte: endOfToday } },
                            {
                                end_date: {
                                    gte: startOfToday,
                                    lte: endOfToday,
                                },
                            },
                        ],
                    },
                ],
            },
            select: {
                id: true,
            },
        });

        return samples;
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

const getReviewsBySampleIDs = async (sampleIDs: string[], userID: string) => {
    try {
        return await dbClient.sampleReview.findMany({
            where: {
                sample_id: { in: sampleIDs },
                user_id: userID,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

async function findAllSamplesReport(params: {
    start_date: string | undefined;
    end_date: string | undefined;
}) {
    try {
        const { start_date, end_date } = params;

        let matchCondition = {};

        if (start_date && end_date) {
            const startOfDay = new Date(start_date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(end_date);
            endOfDay.setHours(23, 59, 59, 999);

            matchCondition = {
                start_date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                end_date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            };
        }

        const samples = await dbClient.sample.findMany({
            where: {
                is_draft: false,
                ...matchCondition,
            },
            select: {
                id: true,
                maximum_sample: true,
                start_date: true,
                end_date: true,
                questions: {
                    select: {
                        id: true,
                        question: true,
                        options: {
                            select: {
                                id: true,
                                option: true,
                            },
                        },
                    },
                },
                product: {
                    select: {
                        product: {
                            select: {
                                product_name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: SortByOrder.DESC },
        });

        const result = [];

        for (const sample of samples) {
            const totalRequested = await countRequestedSample(sample.id);
            const sampleCompleted = await countCompletedSample(
                sample.id,
                sample.maximum_sample,
            );
            const surveyCompleted = await countCompletedSurvey(
                sample.id,
                sample.maximum_sample,
            );
            const sampleSent = await countSampleSent(
                totalRequested,
                sample.maximum_sample,
            );

            const questionData = [];
            let daysData = {
                totalDuration: 0,
                daysSinceStart: 0,
            };

            if (sample.start_date && sample.end_date) {
                daysData = await findNumberOfDays(
                    new Date(sample.start_date),
                    new Date(sample.end_date),
                );
            }

            for (const question of sample.questions || []) {
                const questionDetails = await countAverageForOptions(
                    question.id,
                );

                questionData.push({
                    question: question.question,
                    total_answered: `${questionDetails.totalAnswered} / ${sample.maximum_sample}`,
                    no_of_days: `${daysData.daysSinceStart} / ${daysData.totalDuration}`,
                    option_data: questionDetails.optionAverage.map((opt) => ({
                        option: opt.option,
                        count: opt.count,
                        average: opt.average,
                    })),
                });
            }

            result.push({
                name:
                    sample.product && sample.product.product
                        ? sample.product.product.product_name
                        : '',
                maximum_sample: sample.maximum_sample || 0,
                sample_completed_count: sampleCompleted.count || 0,
                sample_completed_average: sampleCompleted.average || 0,
                survey_completed_count: surveyCompleted.count || 0,
                survey_completed_average: surveyCompleted.average || 0,
                sample_sent_count: sampleSent.count || 0,
                sample_sent_average: sampleSent.average || 0,
                question_data: questionData,
                start_date: sample.start_date || '',
                end_date: sample.end_date || '',
            });
        }

        return result.length > 0 ? result : [];
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findSampleReport(
    id: prismaClient.Prisma.SampleWhereUniqueInput['id'],
) {
    try {
        const data = await dbClient.sample.findUnique({
            where: { id },
            select: {
                id: true,
                maximum_sample: true,
                start_date: true,
                end_date: true,
                product: {
                    select: {
                        product: {
                            select: {
                                product_name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!data) {
            return [];
        }

        let daysData = {
            totalDuration: 0,
            daysSinceStart: 0,
        };

        if (data.start_date && data.end_date) {
            daysData = await findNumberOfDays(data.start_date, data.end_date);
        }

        const totalRequested = await countRequestedSample(data.id);

        const sampleCompleted = await countCompletedSample(
            data.id,
            data.maximum_sample,
        );

        const surveyCompleted = await countCompletedSurvey(
            data.id,
            data.maximum_sample,
        );

        const sampleSent = await countSampleSent(
            totalRequested,
            data.maximum_sample,
        );

        return [
            {
                name:
                    data.product && data.product.product
                        ? data.product.product.product_name
                        : '',
                maximum_sample: data.maximum_sample || 0,
                total_answered: `${surveyCompleted.count} / ${data.maximum_sample}`,
                no_of_days: `${daysData.daysSinceStart} / ${daysData.totalDuration}`,
                sample_completed_count: sampleCompleted.count || 0,
                sample_completed_average: sampleCompleted.average || 0,
                survey_completed_count: surveyCompleted.count || 0,
                survey_completed_average: surveyCompleted.average || 0,
                sample_sent_count: sampleSent.count || 0,
                sample_sent_average: sampleSent.average || 0,
                start_date: data.start_date
                    ? data.start_date.toISOString()
                    : '',
            },
        ];
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findQuestionReport(
    id: prismaClient.Prisma.SampleQuestionWhereUniqueInput['id'],
) {
    try {
        const data = await dbClient.sampleQuestion.findUnique({
            where: {
                id,
                sample: {
                    is_draft: false,
                },
            },
            select: {
                id: true,
                question: true,
                options: {
                    select: {
                        id: true,
                        option: true,
                    },
                },
                sample: {
                    select: {
                        maximum_sample: true,
                        start_date: true,
                        end_date: true,
                        product: {
                            select: {
                                product: {
                                    select: {
                                        product_name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!data) {
            return [];
        }

        let daysCount = {
            totalDuration: 0,
            daysSinceStart: 0,
        };

        if (data.sample.start_date && data.sample.end_date) {
            daysCount = await findNumberOfDays(
                data.sample.start_date,
                data.sample.end_date,
            );
        }

        const optionsCount = await countAverageForOptions(data.id);

        return [
            {
                name: data.sample.product?.product
                    ? data.sample.product.product.product_name
                    : '',
                no_of_days: `${daysCount.daysSinceStart} / ${daysCount.totalDuration}`,
                total_answered: `${optionsCount.totalAnswered} / ${data.sample.maximum_sample}`,
                question: data.question || '',
                option_data: optionsCount.optionAverage,
            },
        ];
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function getSampleByID(sampleID: string) {
    try {
        return await dbClient.sample.findUnique({
            where: { id: sampleID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

export {
    newSample,
    createProductImage,
    createSampleProduct,
    findSampleOrDraftByID,
    updateSampleByID,
    updateQuestionDataByID,
    updateSampleProductByID,
    deleteSampleByID,
    findSampleByID,
    findAllSamples,
    toggleSampleByID,
    publishSampleBYID,
    obtainSampleByID,
    findRequestedSampleByID,
    addSampleForReview,
    countRequestedSample,
    markSampleAsCompleted,
    findQuestionByID,
    createReviewByID,
    findAllReviews,
    countAverageForOptions,
    findResposesByUserID,
    createResponsesForAnswers,
    findAllSamplesForUser,
    findAllSampleResponseByUserID,
    findSampleToReview,
    getAllSamplesCount,
    findSamplesByIDs,
    getReviewsBySampleIDs,
    findAllSamplesReport,
    findSampleReport,
    findQuestionReport,
    getSampleByID,
};
