import { dbClient, prismaClient } from '@atc/db';
import { logger } from '@atc/logger';
import {
    SortByOrder,
    SurveyStatus,
    SurveyType,
    UserRoleEnum,
} from '@atc/common';
import { UpdateSurveyRequest } from '@atc/proto';

async function createSurvey(
    data: prismaClient.Prisma.SurveyCreateInput,
    question: string,
    multiSelect: boolean,
    options: string[],
) {
    try {
        // Create the survey
        const survey = await dbClient.survey.create({
            data: data,
        });

        // Create the survey question
        const que = await dbClient.surveyQuestion.create({
            data: {
                survey_id: survey.id,
                question: question || '',
                multiSelect,
            },
        });

        // Create the survey option
        options.map(async (option) => {
            await dbClient.surveyOption.create({
                data: {
                    option,
                    question_id: que.id,
                },
            });
        });

        return survey;
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findSurveyByName(
    name: prismaClient.Prisma.SurveyWhereUniqueInput['name'],
) {
    try {
        return await dbClient.survey.findUnique({ where: { name } });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function calculateDaysCount(startDate: Date, endDate: Date) {
    const differenceInTime = endDate.getTime() - startDate.getTime();
    const totalDays = Math.round(differenceInTime / (1000 * 3600 * 24));

    let daysSinceStart = Math.max(
        Math.round(
            (new Date().getTime() - startDate.getTime()) / (1000 * 3600 * 24),
        ),
        0,
    );

    if (daysSinceStart > totalDays) {
        daysSinceStart = totalDays;
    }

    return { totalDays, daysSinceStart };
}

async function findSurveyByID(
    surveyID: prismaClient.Prisma.SurveyWhereUniqueInput['id'],
    role?: prismaClient.Prisma.UserWhereUniqueInput['role'],
    is_widget_survey: boolean = false,
) {
    try {
        let matchCondition = {};

        if (role && role === UserRoleEnum.USER) {
            const today = new Date();
            const startOfToday = new Date(today);
            startOfToday.setHours(0, 0, 0, 0);

            const endOfToday = new Date(today);
            endOfToday.setHours(23, 59, 59, 999);

            matchCondition = {
                is_active: true,
                is_completed: false,
                is_draft: false,
                AND: [
                    {
                        startDate: { lte: endOfToday },
                    },
                    {
                        OR: [
                            { endDate: { gte: endOfToday } },
                            { endDate: { gte: startOfToday, lte: endOfToday } },
                        ],
                    },
                ],
            };
        }

        if (is_widget_survey) {
            matchCondition = {
                is_draft: false,
            };
        }

        const survey = await dbClient.survey.findFirst({
            where: { id: surveyID, ...matchCondition },
            select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                targetAudience: true,
                location: true,
                state: true,
                age: true,
                gender: true,
                hasChildren: true,
                withEmailSaved: true,
                client: true,
                is_draft: true,
                is_active: true,
                questions: {
                    select: {
                        id: true,
                        question: true,
                        multiSelect: true,
                        options: {
                            select: {
                                id: true,
                                option: true,
                            },
                        },
                    },
                },
            },
        });

        if (!survey) {
            return null;
        }

        if (survey.is_draft === true) {
            let optionData;

            if (survey.questions) {
                optionData = survey.questions.options.map((opt) => {
                    return {
                        id: opt.id || '',
                        option: opt.option || '',
                        count: 0,
                        average: 0,
                    };
                });
            }

            return {
                id: survey.id,
                name: survey.name,
                location: survey.location || [],
                gender: survey.gender || '',
                state: survey.state || [],
                age: survey.age || [],
                client: survey.client || '',
                startDate: survey.startDate
                    ? survey.startDate.toISOString()
                    : '',
                endDate: survey.endDate ? survey.endDate.toISOString() : '',
                question: {
                    id: survey.questions?.id || '',
                    question: survey.questions?.question || '',
                    multiSelect: survey.questions?.multiSelect || false,
                },
                option: optionData || [],
                totalAnswered: 0,
                targetAudience: survey.targetAudience || 0,
                is_updatable: true,
                hasChildren: survey.hasChildren || '',
                withEmailSaved: survey.withEmailSaved || '',
                is_draft: true,
                is_active: false,
                daysSinceStart: 0,
                totalDuration: 0,
            };
        }

        const {
            questions,
            client,
            startDate,
            endDate,
            targetAudience,
            ...surveyDetails
        } = survey;

        const totalAnswered = await countResponseByQueID(survey.questions!.id);

        const answerPerOption = await countAnswersPerOptionByQueID(
            survey.questions!.id,
        );

        const optionAverages = survey.questions!.options.map((option) => {
            const optionStats = answerPerOption.options.find(
                (data) => data.option_id === option.id,
            );

            const count = optionStats ? optionStats.count : 0;
            const average =
                optionStats && answerPerOption.totalCount > 0
                    ? (count / answerPerOption.totalCount) * 100
                    : 0;

            return {
                ...option,
                count,
                average: parseFloat(average.toFixed(2)),
            };
        });

        let daysCount = {
            totalDays: 0,
            daysSinceStart: 0,
        };

        if (survey.startDate && survey.endDate) {
            const days = await calculateDaysCount(
                survey.startDate,
                survey.endDate,
            );

            daysCount = {
                totalDays: days.totalDays,
                daysSinceStart: days.daysSinceStart,
            };
        }

        const is_updatable = survey.startDate
            ? new Date(survey.startDate!) > new Date()
            : true;

        return {
            ...surveyDetails,
            client: client || '',
            startDate: startDate ? startDate.toISOString() : '',
            endDate: endDate ? endDate.toISOString() : '',
            question: {
                id: questions?.id || '',
                question: questions?.question || '',
                multiSelect: questions?.multiSelect || false,
            },
            option: optionAverages,
            totalAnswered: totalAnswered || 0,
            targetAudience: targetAudience || 0,
            is_updatable,
            daysSinceStart:
                daysCount.daysSinceStart < 0 ? 0 : daysCount.daysSinceStart,
            totalDuration: daysCount.totalDays,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function updateSurveyByID(
    id: prismaClient.Prisma.SurveyWhereUniqueInput['id'],
    updateData: UpdateSurveyRequest,
) {
    try {
        const {
            name,
            startDate,
            endDate,
            targetAudience,
            hasChildren,
            withEmailSaved,
            is_draft,
            client,
            location,
            state,
            age,
            gender,
            multiSelect,
            question,
            option,
        } = updateData;

        const surveyUpdateData = {
            name,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            targetAudience,
            hasChildren,
            withEmailSaved,
            is_draft,
            client,
            location,
            state,
            age,
            gender,
        };

        await dbClient.survey.update({
            where: { id },
            data: surveyUpdateData,
        });

        if (multiSelect !== undefined || question) {
            await dbClient.surveyQuestion.upsert({
                where: { survey_id: id },
                update: { question, multiSelect },
                create: {
                    survey_id: id!,
                    question: question || '',
                    multiSelect: multiSelect || false,
                },
            });
        }

        if (option) {
            const survey = await findSurveyByID(id);
            const questionId = survey?.question.id;

            if (questionId) {
                if (survey.option.length > 0) {
                    await dbClient.surveyOption.deleteMany({
                        where: { question_id: questionId },
                    });
                }

                await dbClient.surveyOption.createMany({
                    data: option.map((opt: string) => ({
                        option: opt,
                        question_id: questionId,
                    })),
                });
            }
        }

        return true;
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function deleteSurveyByID(
    id: prismaClient.Prisma.SurveyOptionWhereUniqueInput['id'],
) {
    try {
        await dbClient.$transaction(async () => {
            await dbClient.surveyResponse.deleteMany({
                where: {
                    survey_id: id,
                },
            });

            await dbClient.surveyOption.deleteMany({
                where: {
                    question: {
                        survey_id: id,
                    },
                },
            });

            await dbClient.surveyQuestion.deleteMany({
                where: {
                    survey_id: id,
                },
            });

            await dbClient.survey.delete({
                where: { id },
            });
        });

        return true;
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function toggleSurveyByID(
    id: prismaClient.Prisma.SurveyWhereUniqueInput['id'],
    is_active: prismaClient.Prisma.SurveyWhereUniqueInput['is_active'],
    is_completed?: boolean,
) {
    try {
        return await dbClient.survey.update({
            where: { id: id },
            data: {
                is_active: !is_active,
                is_completed:
                    is_completed !== undefined ? is_completed : undefined,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function publishSurveyByID(
    id: prismaClient.Prisma.SurveyWhereUniqueInput['id'],
) {
    try {
        return await dbClient.survey.update({
            where: { id },
            data: { is_draft: false },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findDraftOrSurveyByID(
    id: prismaClient.Prisma.SurveyWhereUniqueInput['id'],
    type?: string,
    role?: prismaClient.Prisma.UserWhereUniqueInput['role'],
) {
    try {
        const is_draft = type === SurveyType.DRAFT ? true : false;

        const matchQuery =
            role && role === UserRoleEnum.USER ? { is_active: true } : {};

        return await dbClient.survey.findUnique({
            where: { id, ...(type ? { is_draft } : {}), ...matchQuery },
            select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                targetAudience: true,
                is_active: true,
                withEmailSaved: true,
                questions: {
                    select: {
                        id: true,
                        question: true,
                        multiSelect: true,
                        options: {
                            select: {
                                id: true,
                                option: true,
                            },
                        },
                    },
                },
                is_draft: true,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findSurveysByIDs(
    ids: prismaClient.Prisma.SurveyWhereUniqueInput['id'][],
    type: string,
    role?: prismaClient.Prisma.UserWhereUniqueInput['role'],
) {
    try {
        const is_draft = type === SurveyType.DRAFT ? true : false;
        const matchQuery =
            role && role === UserRoleEnum.USER ? { is_active: true } : {};

        const filteredIds = ids.filter((value) => value !== undefined);

        return await dbClient.survey.findMany({
            where: { id: { in: filteredIds }, is_draft, ...matchQuery },
            select: {
                id: true,
                is_active: true,
                questions: {
                    select: {
                        id: true,
                        multiSelect: true,
                        options: {
                            select: {
                                id: true,
                                option: true,
                            },
                        },
                    },
                },
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function submitAnswerByQueID(
    id: prismaClient.Prisma.SurveyWhereUniqueInput['id'],
    question_id: prismaClient.Prisma.SurveyQuestionWhereUniqueInput['id'],
    options: string[],
    user_id: prismaClient.Prisma.UserWhereUniqueInput['id'],
    email?: prismaClient.Prisma.UserWhereUniqueInput['email'],
) {
    try {
        const userEmail = email ? email : '';

        return options.map(async (option) => {
            await dbClient.surveyResponse.create({
                data: {
                    survey_id: id!,
                    option_id: option,
                    question_id: question_id!,
                    user_id: user_id!,
                    email: userEmail,
                },
            });
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findResponseByQueID(
    id: prismaClient.Prisma.SurveyResponseWhereUniqueInput['id'],
    userID: prismaClient.Prisma.UserWhereUniqueInput['id'],
) {
    try {
        return await dbClient.surveyResponse.findMany({
            where: { question_id: id, user_id: userID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function disableSurvey() {
    try {
        return await dbClient.survey.updateMany({
            where: { is_active: true },
            data: { is_active: false },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function countResponseByQueID(
    questionId: prismaClient.Prisma.SurveyQuestionWhereUniqueInput['id'],
): Promise<number> {
    const result = await dbClient.$queryRaw<any>`
        SELECT COUNT(DISTINCT "user_id") AS count
        FROM "SurveyResponse"
        WHERE "question_id" = ${questionId}::uuid::uuid
    `;

    return Number(result[0]?.count || 0);
}

async function countAnswersPerOptionByQueID(
    questionId: prismaClient.Prisma.SurveyQuestionWhereUniqueInput['id'],
) {
    try {
        const aggregatedResponses = await dbClient.surveyResponse.groupBy({
            by: ['option_id'],
            where: { question_id: questionId },
            _count: { option_id: true },
        });

        const totalCount = aggregatedResponses.reduce(
            (sum, response) => sum + response._count.option_id,
            0,
        );

        const optionsWithCounts = aggregatedResponses.map((response) => ({
            option_id: response.option_id,
            count: response._count.option_id,
        }));

        return {
            options: optionsWithCounts,
            totalCount,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function calculateSurveyTimeDetails(surveys: any[]) {
    try {
        const surveyTimeDetails: any = {};

        surveys.forEach((surveyData) => {
            if (surveyData.startDate && surveyData.endDate) {
                const differenceInTime =
                    surveyData.endDate.getTime() -
                    surveyData.startDate.getTime();

                const totalDays = Math.round(
                    differenceInTime / (1000 * 3600 * 24),
                );

                let daysSinceStart = Math.max(
                    Math.round(
                        (new Date().getTime() -
                            surveyData.startDate.getTime()) /
                            (1000 * 3600 * 24),
                    ),
                    0,
                );

                if (daysSinceStart > totalDays) {
                    daysSinceStart = totalDays;
                }

                surveyTimeDetails[surveyData.id] = {
                    totalDays,
                    daysSinceStart,
                };
            }
        });

        return surveyTimeDetails;
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function getSurveyDetails(survey: any) {
    try {
        const totalAnswered = await countResponseByQueID(survey.questions.id);
        const answerPerOption = await countAnswersPerOptionByQueID(
            survey.questions.id,
        );

        const optionData = survey.questions.options.map((option: any) => {
            const optionStats = answerPerOption.options.find(
                (data: any) => data.option_id === option.id,
            );
            const count = optionStats ? optionStats.count : 0;
            const average =
                optionStats && answerPerOption.totalCount > 0
                    ? (count / answerPerOption.totalCount) * 100
                    : 0;

            return {
                id: option.id,
                option: option.option,
                count: count,
                average: parseFloat(average.toFixed(2)),
            };
        });

        return { totalAnswered, optionData };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findAllSurvey(
    type: string,
    page: number,
    limit: number,
    surveyStatus?: string,
    keyword?: string,
) {
    try {
        const skip = (page - 1) * limit;

        let matchQuery: any = {};

        if (type === SurveyType.DRAFT) {
            matchQuery = { ...matchQuery, is_draft: true };
        }

        if (type === SurveyType.PUBLISHED) {
            matchQuery = { ...matchQuery, is_draft: false };
        }

        if (type === SurveyType.WIDGET) {
            const today = new Date();
            const startOfToday = new Date(today);
            startOfToday.setHours(0, 0, 0, 0);

            const endOfToday = new Date(today);
            endOfToday.setHours(23, 59, 59, 999);

            matchQuery = {
                is_completed: false,
                is_draft: false,
                is_active: false,
                OR: [
                    { endDate: { gte: endOfToday } },
                    { endDate: { gte: startOfToday, lte: endOfToday } },
                ],
            };
        }

        if (surveyStatus === SurveyStatus.ACTIVE) {
            matchQuery = { ...matchQuery, is_active: true };
        }

        if (surveyStatus === SurveyStatus.COMPLETED) {
            matchQuery = { ...matchQuery, is_completed: true };
        }

        if (surveyStatus === SurveyStatus.INACTIVE) {
            matchQuery = { ...matchQuery, is_active: false };
        }

        if (keyword) {
            matchQuery = {
                ...matchQuery,
                name: {
                    contains: keyword,
                    mode: 'insensitive',
                },
            };
        }

        const surveys = await dbClient.survey.findMany({
            where: matchQuery,
            select: {
                id: true,
                client: true,
                name: true,
                is_active: true,
                startDate: true,
                endDate: true,
                is_completed: true,
                targetAudience: true,
                questions: {
                    select: {
                        id: true,
                        question: true,
                        multiSelect: true,
                        options: {
                            select: {
                                id: true,
                                option: true,
                            },
                        },
                    },
                },
            },
            skip: skip,
            take: limit,
            orderBy: {
                createdAt: SortByOrder.DESC,
            },
        });

        const totalCount = await dbClient.survey.count({ where: matchQuery });

        if (type === SurveyType.DRAFT) {
            const surveysWithAdditionalData = surveys.map((survey) => ({
                id: survey.id || '',
                client: survey.client || '',
                name: survey.name!,
                question: {
                    id: survey.questions?.id || '',
                    question: survey.questions?.question || '',
                    multiSelect: survey.questions?.multiSelect || false,
                },
                option:
                    survey.questions?.options.length! > 0
                        ? survey.questions?.options
                        : [],
                totalAnswered: 0,
                is_active: false,
                is_completed: false,
                totalDuration: 0,
                daysSinceStart: 0,
                targetAudience: survey.targetAudience || 0,
                start_date: survey.startDate
                    ? survey.startDate.toISOString()
                    : '',
                end_date: survey.endDate ? survey.endDate.toISOString() : '',
            }));

            return { surveys: surveysWithAdditionalData, totalCount };
        }

        const surveyTimeDetails: any =
            await calculateSurveyTimeDetails(surveys);

        const surveysWithAdditionalData = [];

        for (let survey of surveys) {
            const { totalAnswered, optionData } =
                await getSurveyDetails(survey);

            const { totalDays, daysSinceStart } = surveyTimeDetails[
                survey.id
            ] || { totalDays: 0, daysSinceStart: 0 };

            surveysWithAdditionalData.push({
                id: survey.id || '',
                client: survey.client || '',
                name: survey.name!,
                question: {
                    id: survey.questions?.id || '',
                    question: survey.questions?.question || '',
                    multiSelect: survey.questions?.multiSelect || false,
                },
                option: optionData,
                totalAnswered,
                is_active: survey.is_active!,
                is_completed: survey.is_completed,
                totalDuration: totalDays,
                daysSinceStart: daysSinceStart < 0 ? 0 : daysSinceStart,
                targetAudience: survey.targetAudience || 0,
                start_date: survey.startDate
                    ? survey.startDate.toISOString()
                    : '',
                end_date: survey.endDate ? survey.endDate.toISOString() : '',
            });
        }

        return { surveys: surveysWithAdditionalData, totalCount };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findResponsesByUserID(
    id: prismaClient.Prisma.SurveyQuestionWhereUniqueInput['id'],
    userID: prismaClient.Prisma.UserWhereUniqueInput['id'],
) {
    try {
        const responses = await dbClient.surveyResponse.findMany({
            where: { question_id: id, user_id: userID },
            select: {
                option: { select: { id: true } },
            },
        });

        return responses.length
            ? responses.map((response) => ({
                  id: response.option.id,
              }))
            : null;
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function isActiveSurvey(
    id: prismaClient.Prisma.SurveyWhereUniqueInput['id'],
) {
    try {
        return await dbClient.survey.findUnique({
            where: {
                id,
                is_active: true,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function deactivateSurvey(
    id: prismaClient.Prisma.SurveyWhereUniqueInput['id'],
) {
    try {
        return await dbClient.survey.update({
            where: {
                id,
            },
            data: {
                is_active: false,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}
async function findUniqueResponseCount(
    id: prismaClient.Prisma.SurveyOptionWhereUniqueInput['id'],
) {
    try {
        const count: [{ unique_count: number }] = await dbClient.$queryRaw`
            SELECT COUNT(DISTINCT (user_id, survey_id)) AS unique_count
            FROM "SurveyResponse"
            WHERE "survey_id" = ${prismaClient.Prisma.sql`${id}::uuid`}
        `;

        return Number(count[0].unique_count);
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findAdmin() {
    try {
        return await dbClient.user.findFirst({
            where: { role: UserRoleEnum.ADMIN },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function findAllSurveyResponseByUserID(
    user_id: prismaClient.Prisma.UserWhereUniqueInput['id'],
    page: number,
    limit: number,
) {
    try {
        const skip = (page - 1) * limit;

        const data = await dbClient.surveyResponse.findMany({
            where: {
                user_id,
            },
            select: {
                createdAt: true,
                survey: {
                    select: {
                        name: true,
                    },
                },
                option: {
                    select: {
                        option: true,
                    },
                },
                question: {
                    select: {
                        question: true,
                    },
                },
                id: true,
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: SortByOrder.DESC,
            },
        });

        const total_count = await dbClient.surveyResponse.count({
            where: { user_id },
        });

        const responses = data.map((response) => {
            return {
                id: response.id || '',
                name: response.survey.name || '',
                question: response.question.question || '',
                response_date: response.createdAt
                    ? new Date(response.createdAt).toISOString()
                    : '',
                response: response.option.option || '',
            };
        });

        return {
            responses: responses.length > 0 ? responses : null,
            totalCount: total_count || 0,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function didUserAnswered(survey_ids: string[], user_id: string) {
    try {
        return dbClient.surveyResponse.findMany({
            where: {
                user_id: user_id,
                survey_id: { in: survey_ids },
            },
            select: {
                survey: true,
                question: {
                    select: {
                        responses: { where: { user_id } },
                    },
                },
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

const getAllSurveysCount = async () => {
    try {
        return await dbClient.survey.count();
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

async function findQuestionReport(
    id: prismaClient.Prisma.SurveyWhereUniqueInput['id'],
) {
    try {
        const data = await dbClient.surveyQuestion.findUnique({
            where: { id },
            select: {
                id: true,
                survey: {
                    select: {
                        name: true,
                        targetAudience: true,
                        startDate: true,
                        endDate: true,
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
                    },
                },
                options: {
                    select: {
                        id: true,
                        option: true,
                    },
                },
            },
        });

        if (!data) {
            return [];
        }

        const { totalAnswered, optionData } = await getSurveyDetails(
            data.survey,
        );

        let daysCount = {
            days_since_start: 0,
            total_duration: 0,
        };

        if (data.survey.startDate && data.survey.endDate) {
            const days = await calculateDaysCount(
                data.survey.startDate,
                data.survey.endDate,
            );

            daysCount = {
                days_since_start: days.daysSinceStart,
                total_duration: days.totalDays,
            };
        }

        return [
            {
                name: data.survey ? data.survey.name : '',
                target_audience: data.survey ? data.survey.targetAudience : 0,
                question:
                    data.survey && data.survey.questions
                        ? data.survey.questions.question
                        : '',
                total_answered: `${totalAnswered} / ${data.survey ? data.survey.targetAudience : 0}`,
                no_of_days: `${daysCount.days_since_start} / ${daysCount.total_duration}`,
                option_data: optionData,
                start_date: data.survey.startDate
                    ? data.survey.startDate.toISOString()
                    : '',
                end_date: data.survey.endDate
                    ? data.survey.endDate.toISOString()
                    : '',
            },
        ];
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function getSurveyByID(surveyID: string) {
    try {
        return await dbClient.survey.findUnique({
            where: {
                id: surveyID,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

export {
    createSurvey,
    findSurveyByName,
    findSurveyByID,
    findAllSurvey,
    updateSurveyByID,
    deleteSurveyByID,
    toggleSurveyByID,
    publishSurveyByID,
    findDraftOrSurveyByID,
    submitAnswerByQueID,
    findResponseByQueID,
    countAnswersPerOptionByQueID,
    findSurveysByIDs,
    disableSurvey,
    findResponsesByUserID,
    isActiveSurvey,
    deactivateSurvey,
    findUniqueResponseCount,
    findAdmin,
    findAllSurveyResponseByUserID,
    didUserAnswered,
    getAllSurveysCount,
    findQuestionReport,
    getSurveyByID,
};
