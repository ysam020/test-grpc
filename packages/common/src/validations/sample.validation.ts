import z from 'zod';
import { errorMessage } from '../errorMessage';
import {
    Age,
    Gender,
    Location,
    SelectionOptionEnum,
    State,
} from '../types/survey.types';
import {
    AnswerType,
    ReviewType,
    SampleStatus,
    SampleType,
} from '../types/sample.types';
import { constants } from '..';
import { ChartType } from '../types';

export const booleanFromStringSchema = z
    .string()
    .toLowerCase()
    .refine((value) => value === 'true' || value === 'false', {
        message: errorMessage.SAMPLE.REQUIRED_BOOLEAN_VALUE,
    })
    .transform((value) => value === 'true');

const CreateSampleSchema = z
    .object({
        client: z
            .string()
            .trim()
            .min(5, { message: errorMessage.SAMPLE.MIN_LENGTH })
            .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH })
            .optional(),
        product_id: z.string().trim().uuid(),
        description: z
            .string()
            .trim()
            .min(5, { message: errorMessage.SAMPLE.DESCRIPTION_REQUIRED })
            .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH }),
        start_date: z.string().trim(),
        end_date: z.string().trim(),
        maximum_sample: z
            .string()
            .transform((value) => Number(value))
            .refine((value) => !isNaN(value), {
                message: errorMessage.SAMPLE.INVALID_NUMBER,
            })
            .refine((value) => value > 0, {
                message: errorMessage.SAMPLE.MAXIMUM_SAMPLE_REQUIRED,
            })
            .refine((value) => value <= 5000, {
                message: errorMessage.SAMPLE.MAX_LENGTH_FOR_MAXIMUM_SAMPLE,
            }),
        to_get_product: z
            .string()
            .trim()
            .min(5, {
                message:
                    errorMessage.SAMPLE.DESCRIPTION_TO_GET_PRODUCT_REQUIRED,
            })
            .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH }),
        task_to_do: z
            .string()
            .trim()
            .min(5, { message: errorMessage.SAMPLE.TASK_TO_DO_REQUIRED })
            .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH }),
        inquiries: z
            .string()
            .trim()
            .min(5, { message: errorMessage.SAMPLE.INQUIRIES_REQUIRED })
            .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH }),
        location: z
            .array(z.string().trim())
            .refine(
                (values) => {
                    const isValid = values.every(
                        (value) =>
                            Object.values(Location).includes(
                                value as Location,
                            ) || value === Location.ALL,
                    );

                    return isValid;
                },
                {
                    message: errorMessage.SAMPLE.INVALID_LOCATION(
                        Object.values(Location),
                    ),
                },
            )
            .transform((values) => {
                if (values.includes(Location.ALL)) {
                    return [Location.ALL];
                }

                return values.filter((value) =>
                    Object.values(Location).includes(value as Location),
                );
            })
            .optional(),
        state: z
            .array(z.string().trim())
            .refine(
                (values) => {
                    const isValid = values.every(
                        (value) =>
                            Object.values(State).includes(value as State) ||
                            value === State.ALL,
                    );

                    return isValid;
                },
                {
                    message: errorMessage.SAMPLE.INVALID_STATE(
                        Object.values(State),
                    ),
                },
            )
            .transform((values) => {
                if (values.includes(State.ALL)) {
                    return [State.ALL];
                }

                return values.filter((value) =>
                    Object.values(State).includes(value as State),
                );
            })
            .optional(),
        age: z
            .array(z.string().trim())
            .refine(
                (values) => {
                    const isValid = values.every(
                        (value) =>
                            Object.values(Age).includes(value as Age) ||
                            value === Age.ALL,
                    );

                    return isValid;
                },
                {
                    message: errorMessage.SAMPLE.INVALID_AGE(
                        Object.values(Age),
                    ),
                },
            )
            .transform((values) => {
                if (values.includes(Age.ALL)) {
                    return [Age.ALL];
                }

                return values.filter((value) =>
                    Object.values(Age).includes(value as Age),
                );
            })
            .optional(),
        gender: z.nativeEnum(Gender).optional(),
        has_children: z.nativeEnum(SelectionOptionEnum).optional(),
        with_email_saved: z.nativeEnum(SelectionOptionEnum).optional(),
        is_draft: booleanFromStringSchema.optional(),
        question_data: z
            .array(
                z.object({
                    question: z
                        .string()
                        .trim()
                        .min(5, {
                            message: errorMessage.SAMPLE.QUESTION_REQUIRED,
                        })
                        .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH }),
                    answer_type: z.nativeEnum(AnswerType).optional(),
                    options: z.array(z.string().trim()).optional(),
                }),
            )
            .min(1, { message: errorMessage.SAMPLE.MIN_QUESTION })
            .max(5, { message: errorMessage.SAMPLE.MAX_QUESTION }),
    })
    .superRefine((data, ctx) => {
        data.question_data.forEach((question, index) => {
            if (!question.answer_type) {
                return ctx.addIssue({
                    path: ['question_data', index, 'answer_type'],
                    message: errorMessage.SAMPLE.ANSWER_TYPE_REQUIRED,
                    code: z.ZodIssueCode.custom,
                });
            }

            if (question.answer_type === AnswerType.TEXT) {
                if (!question.options || question.options.length === 0) {
                    return true;
                }

                if (question.options && question.options.length > 0) {
                    return ctx.addIssue({
                        path: ['question_data', index, 'options'],
                        message:
                            errorMessage.SAMPLE.OPTION_NOT_ALLOWED_FOR_TEXT,
                        code: z.ZodIssueCode.custom,
                    });
                }
            } else {
                if (
                    (question.options && question.options.length === 0) ||
                    (question.options && question.options.length === 1) ||
                    !question.options
                ) {
                    return ctx.addIssue({
                        path: ['question_data', index, 'options'],
                        message: errorMessage.SAMPLE.OPTION_MIN_REQUIRED,
                        code: z.ZodIssueCode.custom,
                    });
                }

                if (question.options && question.options.length > 10) {
                    return ctx.addIssue({
                        path: ['question_data', index, 'options'],
                        message: errorMessage.SAMPLE.OPTION_MAX_REQUIRED,
                        code: z.ZodIssueCode.custom,
                    });
                }
            }
        });

        if (!constants.DATE_REGEX.test(data.start_date)) {
            return ctx.addIssue({
                path: ['start_date'],
                message: errorMessage.DATE.INVALID_DATE,
                code: z.ZodIssueCode.custom,
            });
        }

        if (
            new Date(data.start_date).setHours(0, 0, 0, 0) <
            new Date().setHours(0, 0, 0, 0)
        ) {
            return ctx.addIssue({
                path: ['start_date'],
                message: errorMessage.DATE.PAST_DATE,
                code: z.ZodIssueCode.custom,
            });
        }

        if (!constants.DATE_REGEX.test(data.end_date)) {
            return ctx.addIssue({
                path: ['end_date'],
                message: errorMessage.DATE.INVALID_DATE,
                code: z.ZodIssueCode.custom,
            });
        }

        if (new Date(data.end_date) < new Date(data.start_date)) {
            return ctx.addIssue({
                path: ['end_date'],
                message: errorMessage.DATE.DATE_BEFORE_START,
                code: z.ZodIssueCode.custom,
            });
        }
    });

const commonFields = z.object({
    client: z
        .string()
        .trim()
        .min(5, { message: errorMessage.SAMPLE.MIN_LENGTH })
        .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH })
        .optional(),
    product_id: z.string().trim().uuid().optional(),
    description: z
        .string()
        .trim()
        .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH })
        .min(5, { message: errorMessage.SAMPLE.DESCRIPTION_REQUIRED })
        .optional(),
    start_date: z.string().trim().optional(),
    end_date: z.string().trim().optional(),
    maximum_sample: z
        .string()
        .transform((value) => Number(value))
        .refine((value) => !isNaN(value), {
            message: errorMessage.SAMPLE.INVALID_NUMBER,
        })
        .refine((value) => value > 0, {
            message: errorMessage.SAMPLE.MAXIMUM_SAMPLE_REQUIRED,
        })
        .refine((value) => value <= 5000, {
            message: errorMessage.SAMPLE.MAX_LENGTH_FOR_MAXIMUM_SAMPLE,
        })
        .optional(),
    to_get_product: z
        .string()
        .trim()
        .min(5, {
            message: errorMessage.SAMPLE.DESCRIPTION_TO_GET_PRODUCT_REQUIRED,
        })
        .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH })
        .optional(),
    task_to_do: z
        .string()
        .trim()
        .min(5, { message: errorMessage.SAMPLE.TASK_TO_DO_REQUIRED })
        .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH })
        .optional(),
    inquiries: z
        .string()
        .trim()
        .min(5, { message: errorMessage.SAMPLE.INQUIRIES_REQUIRED })
        .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH })
        .optional(),
    location: z
        .array(z.string().trim())
        .refine(
            (values) => {
                const isValid = values.every(
                    (value) =>
                        Object.values(Location).includes(value as Location) ||
                        value === Location.ALL,
                );

                return isValid;
            },
            {
                message: errorMessage.SAMPLE.INVALID_LOCATION(
                    Object.values(Location),
                ),
            },
        )
        .transform((values) => {
            if (values.includes(Location.ALL)) {
                return [Location.ALL];
            }

            return values.filter((value) =>
                Object.values(Location).includes(value as Location),
            );
        })
        .optional(),
    state: z
        .array(z.string().trim())
        .refine(
            (values) => {
                const isValid = values.every(
                    (value) =>
                        Object.values(State).includes(value as State) ||
                        value === State.ALL,
                );

                return isValid;
            },
            {
                message: errorMessage.SAMPLE.INVALID_STATE(
                    Object.values(State),
                ),
            },
        )
        .transform((values) => {
            if (values.includes(State.ALL)) {
                return [State.ALL];
            }

            return values.filter((value) =>
                Object.values(State).includes(value as State),
            );
        })
        .optional(),
    age: z
        .array(z.string().trim())
        .refine(
            (values) => {
                const isValid = values.every(
                    (value) =>
                        Object.values(Age).includes(value as Age) ||
                        value === Age.ALL,
                );

                return isValid;
            },
            {
                message: errorMessage.SAMPLE.INVALID_AGE(Object.values(Age)),
            },
        )
        .transform((values) => {
            if (values.includes(Age.ALL)) {
                return [Age.ALL];
            }

            return values.filter((value) =>
                Object.values(Age).includes(value as Age),
            );
        })
        .optional(),
    gender: z.nativeEnum(Gender).optional(),
    has_children: z.nativeEnum(SelectionOptionEnum).optional(),
    with_email_saved: z.nativeEnum(SelectionOptionEnum).optional(),
    question_data: z
        .array(
            z.object({
                question: z
                    .string()
                    .trim()
                    .min(5, { message: errorMessage.SAMPLE.QUESTION_REQUIRED })
                    .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH })
                    .optional(),
                answer_type: z.nativeEnum(AnswerType),
                options: z.array(z.string().trim()).optional(),
            }),
        )
        .min(0, { message: errorMessage.SAMPLE.MIN_QUESTION })
        .max(5, { message: errorMessage.SAMPLE.MAX_QUESTION })
        .optional(),
});

const CreateDraftSchema = commonFields
    .extend({ is_draft: booleanFromStringSchema })
    .superRefine((data, ctx) => {
        if (data.start_date) {
            if (!constants.DATE_REGEX.test(data.start_date)) {
                return ctx.addIssue({
                    path: ['start_date'],
                    message: errorMessage.DATE.INVALID_DATE,
                    code: z.ZodIssueCode.custom,
                });
            }

            if (
                new Date(data.start_date).setHours(0, 0, 0, 0) <
                new Date().setHours(0, 0, 0, 0)
            ) {
                return ctx.addIssue({
                    path: ['start_date'],
                    message: errorMessage.DATE.PAST_DATE,
                    code: z.ZodIssueCode.custom,
                });
            }
        }

        if (data.end_date) {
            if (
                new Date(data.end_date).setHours(0, 0, 0, 0) <
                new Date().setHours(0, 0, 0, 0)
            ) {
                return ctx.addIssue({
                    path: ['end_date'],
                    message: errorMessage.DATE.PAST_DATE_END_DATE,
                    code: z.ZodIssueCode.custom,
                });
            }

            if (!constants.DATE_REGEX.test(data.end_date)) {
                return ctx.addIssue({
                    path: ['end_date'],
                    message: errorMessage.DATE.INVALID_DATE,
                    code: z.ZodIssueCode.custom,
                });
            }
        }

        if (data.start_date && data.end_date) {
            if (
                new Date(data.end_date).setHours(0, 0, 0, 0) <
                new Date(data.start_date).setHours(0, 0, 0, 0)
            ) {
                return ctx.addIssue({
                    path: ['end_date'],
                    message: errorMessage.DATE.DATE_BEFORE_START,
                    code: z.ZodIssueCode.custom,
                });
            }
        }

        if (data.question_data && data.question_data.length > 0) {
            data.question_data.forEach((question, index) => {
                if (!question.answer_type) {
                    return ctx.addIssue({
                        path: ['question_data', index, 'answer_type'],
                        message: errorMessage.SAMPLE.ANSWER_TYPE_REQUIRED,
                        code: z.ZodIssueCode.custom,
                    });
                }

                if (question.answer_type === AnswerType.TEXT) {
                    if (!question.options || question.options.length === 0) {
                        return true;
                    }

                    if (question.options && question.options.length > 0) {
                        return ctx.addIssue({
                            path: ['question_data', index, 'options'],
                            message:
                                errorMessage.SAMPLE.OPTION_NOT_ALLOWED_FOR_TEXT,
                            code: z.ZodIssueCode.custom,
                        });
                    }
                } else {
                    if (
                        (question.options && question.options.length === 0) ||
                        (question.options && question.options.length === 1) ||
                        !question.options
                    ) {
                        return ctx.addIssue({
                            path: ['question_data', index, 'options'],
                            message: errorMessage.SAMPLE.OPTION_MIN_REQUIRED,
                            code: z.ZodIssueCode.custom,
                        });
                    }

                    if (question.options && question.options.length > 10) {
                        return ctx.addIssue({
                            path: ['question_data', index, 'options'],
                            message: errorMessage.SAMPLE.OPTION_MAX_REQUIRED,
                            code: z.ZodIssueCode.custom,
                        });
                    }
                }
            });
        }
    });

const UpdateSampleSchema = commonFields
    .partial()
    .extend({
        is_draft: booleanFromStringSchema.optional(),
    })
    .superRefine((data, ctx) => {
        if (data.start_date) {
            if (!constants.DATE_REGEX.test(data.start_date)) {
                return ctx.addIssue({
                    path: ['start_date'],
                    message: errorMessage.DATE.INVALID_DATE,
                    code: z.ZodIssueCode.custom,
                });
            }

            if (
                new Date(data.start_date).setHours(0, 0, 0, 0) <
                new Date().setHours(0, 0, 0, 0)
            ) {
                return ctx.addIssue({
                    path: ['start_date'],
                    message: errorMessage.DATE.PAST_DATE,
                    code: z.ZodIssueCode.custom,
                });
            }
        }

        if (data.end_date) {
            if (
                new Date(data.end_date).setHours(0, 0, 0, 0) <
                new Date().setHours(0, 0, 0, 0)
            ) {
                return ctx.addIssue({
                    path: ['end_date'],
                    message: errorMessage.DATE.PAST_DATE_END_DATE,
                    code: z.ZodIssueCode.custom,
                });
            }

            if (!constants.DATE_REGEX.test(data.end_date)) {
                return ctx.addIssue({
                    path: ['end_date'],
                    message: errorMessage.DATE.INVALID_DATE,
                    code: z.ZodIssueCode.custom,
                });
            }
        }

        if (data.start_date && data.end_date) {
            if (
                new Date(data.end_date).setHours(0, 0, 0, 0) <
                new Date(data.start_date).setHours(0, 0, 0, 0)
            ) {
                return ctx.addIssue({
                    path: ['end_date'],
                    message: errorMessage.DATE.DATE_BEFORE_START,
                    code: z.ZodIssueCode.custom,
                });
            }
        }

        if (data.question_data && data.question_data.length > 0) {
            data.question_data.forEach((question, index) => {
                if (!question.answer_type) {
                    return ctx.addIssue({
                        path: ['question_data', index, 'answer_type'],
                        message: errorMessage.SAMPLE.ANSWER_TYPE_REQUIRED,
                        code: z.ZodIssueCode.custom,
                    });
                }

                if (question.answer_type === AnswerType.TEXT) {
                    if (!question.options || question.options.length === 0) {
                        return true;
                    }

                    if (question.options && question.options.length > 0) {
                        return ctx.addIssue({
                            path: ['question_data', index, 'options'],
                            message:
                                errorMessage.SAMPLE.OPTION_NOT_ALLOWED_FOR_TEXT,
                            code: z.ZodIssueCode.custom,
                        });
                    }
                } else {
                    if (
                        (question.options && question.options.length === 0) ||
                        (question.options && question.options.length === 1) ||
                        !question.options
                    ) {
                        return ctx.addIssue({
                            path: ['question_data', index, 'options'],
                            message: errorMessage.SAMPLE.OPTION_MIN_REQUIRED,
                            code: z.ZodIssueCode.custom,
                        });
                    }

                    if (question.options && question.options.length > 10) {
                        return ctx.addIssue({
                            path: ['question_data', index, 'options'],
                            message: errorMessage.SAMPLE.OPTION_MAX_REQUIRED,
                            code: z.ZodIssueCode.custom,
                        });
                    }
                }
            });
        }
    });

const GetAllSampleSchema = z
    .object({
        page: z
            .string()
            .refine((value) => !isNaN(Number(value)), {
                message: errorMessage.SAMPLE.INVALID_PAGE,
            })
            .refine((value) => Number(value) > 0, {
                message: errorMessage.SAMPLE.INVALID_PAGE,
            })
            .transform((value) => Math.trunc(Number(value))),
        limit: z
            .string()
            .refine((value) => !isNaN(Number(value)), {
                message: errorMessage.SAMPLE.INVALID_LIMIT,
            })
            .refine((value) => Number(value) > 0, {
                message: errorMessage.SAMPLE.INVALID_LIMIT,
            })
            .transform((value) => Math.trunc(Number(value))),
        sample_status: z.nativeEnum(SampleStatus).optional(),
        start_date: z.string().trim().optional(),
        end_date: z.string().trim().optional(),
        keyword: z.string().trim().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.start_date) {
            if (!constants.DATE_REGEX.test(data.start_date)) {
                return ctx.addIssue({
                    path: ['start_date'],
                    message: errorMessage.DATE.INVALID_DATE,
                    code: z.ZodIssueCode.custom,
                });
            }
        }

        if (data.end_date) {
            if (!constants.DATE_REGEX.test(data.end_date)) {
                return ctx.addIssue({
                    path: ['end_date'],
                    message: errorMessage.DATE.INVALID_DATE,
                    code: z.ZodIssueCode.custom,
                });
            }
        }

        if (data.start_date && data.end_date) {
            if (
                new Date(data.end_date).setHours(0, 0, 0, 0) <
                new Date(data.start_date).setHours(0, 0, 0, 0)
            ) {
                return ctx.addIssue({
                    path: ['end_date'],
                    message: errorMessage.DATE.DATE_BEFORE_START,
                    code: z.ZodIssueCode.custom,
                });
            }
        }
    });

const SampleTypeSchema = z.object({
    type: z.nativeEnum(SampleType),
});

const ToggleSampleSchema = z.object({
    id: z.string().trim().uuid(),
    type: z.nativeEnum(SampleType),
});

const AnswerSchema = z.object({
    question_id: z.string().trim().uuid(),
    option: z.array(z.union([z.string().uuid(), z.string(), z.number()])),
});

const SubmitAnswerSchema = z.object({
    answer_data: z
        .array(AnswerSchema)
        .max(5, { message: errorMessage.SAMPLE.MAXIMUM_RESPONSE }),
});

const ReviewSampleSchema = z
    .object({
        rating: z.string().trim().optional(),
        comment: z
            .string()
            .trim()
            .min(20, { message: errorMessage.SAMPLE.MINIMUM_COMMENT_LENGTH })
            .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH })
            .optional(),
        image: z.instanceof(Buffer).optional(),
    })
    .superRefine((data, ctx) => {
        if (data.rating !== undefined || data.rating !== '') {
            const rating = Number(data.rating);

            if (typeof rating !== 'number') {
                return ctx.addIssue({
                    path: ['rating'],
                    message: errorMessage.SAMPLE.INVALID_NUMBER,
                    code: z.ZodIssueCode.custom,
                });
            }

            if (rating < 0) {
                return ctx.addIssue({
                    path: ['rating'],
                    message: errorMessage.SAMPLE.MINIMUM_RATING,
                    code: z.ZodIssueCode.custom,
                });
            }

            if (rating > 5) {
                return ctx.addIssue({
                    path: ['rating'],
                    message: errorMessage.SAMPLE.MAXIMUM_RATING,
                    code: z.ZodIssueCode.custom,
                });
            }
        }
    });

const GetAllReviewSchema = z.object({
    type: z.nativeEnum(ReviewType),
    page: z
        .string()
        .refine((value) => !isNaN(Number(value)), {
            message: errorMessage.SAMPLE.INVALID_PAGE,
        })
        .refine((value) => Number(value) > 0, {
            message: errorMessage.SAMPLE.INVALID_PAGE,
        })
        .transform((value) => Math.trunc(Number(value))),
    limit: z
        .string()
        .refine((value) => !isNaN(Number(value)), {
            message: errorMessage.SAMPLE.INVALID_LIMIT,
        })
        .refine((value) => Number(value) > 0, {
            message: errorMessage.SAMPLE.INVALID_LIMIT,
        })
        .transform((value) => Math.trunc(Number(value))),
});

const FetchAllSampleSchema = z.object({
    page: z
        .string()
        .refine((value) => !isNaN(Number(value)), {
            message: errorMessage.SAMPLE.INVALID_PAGE,
        })
        .refine((value) => Number(value) > 0, {
            message: errorMessage.SAMPLE.INVALID_PAGE,
        })
        .transform((value) => Math.trunc(Number(value))),
    limit: z
        .string()
        .refine((value) => !isNaN(Number(value)), {
            message: errorMessage.SAMPLE.INVALID_LIMIT,
        })
        .refine((value) => Number(value) > 0, {
            message: errorMessage.SAMPLE.INVALID_LIMIT,
        })
        .transform((value) => Math.trunc(Number(value))),
});

const GetAllRequestedSampleSchema = z.object({
    page: z
        .string()
        .refine((value) => {
            const parsed = parseInt(value);
            return !isNaN(parsed) && Number.isInteger(parsed);
        })
        .transform((value) => Math.trunc(parseInt(value)))
        .optional(),
    limit: z
        .string()
        .refine((value) => {
            const parsed = parseInt(value);
            return !isNaN(parsed) && Number.isInteger(parsed);
        })
        .transform((value) => Math.trunc(parseInt(value)))
        .optional(),
});

const ExportToExcelSchema = z
    .object({
        id: z.string().trim().uuid().optional(),
        start_date: z.string().trim().optional(),
        end_date: z.string().trim().optional(),
        email: z.string().trim().toLowerCase().email(),
    })
    .superRefine((data, ctx) => {
        if (data.start_date) {
            if (!constants.DATE_REGEX.test(data.start_date)) {
                return ctx.addIssue({
                    path: ['start_date'],
                    message: errorMessage.DATE.INVALID_DATE,
                    code: z.ZodIssueCode.custom,
                });
            }

            if (
                new Date(data.start_date).setHours(0, 0, 0, 0) >
                new Date().setHours(0, 0, 0, 0)
            ) {
                return ctx.addIssue({
                    path: ['start_date'],
                    message: errorMessage.SAMPLE.SHOULD_NOT_FUTURE_DATE,
                    code: z.ZodIssueCode.custom,
                });
            }
        }

        if (data.end_date) {
            if (!constants.DATE_REGEX.test(data.end_date)) {
                return ctx.addIssue({
                    path: ['end_date'],
                    message: errorMessage.DATE.INVALID_DATE,
                    code: z.ZodIssueCode.custom,
                });
            }
        }

        if (data.start_date && data.end_date) {
            if (
                new Date(data.end_date).setHours(0, 0, 0, 0) <
                new Date(data.start_date).setHours(0, 0, 0, 0)
            ) {
                return ctx.addIssue({
                    path: ['end_date'],
                    message:
                        errorMessage.SAMPLE.SHOULD_NOT_LESS_THAT_START_DATE,
                    code: z.ZodIssueCode.custom,
                });
            }
        }
    });

const GetSampleEngagementSchema = z
    .object({
        type: z.nativeEnum(ChartType),
    })
    .strict();

const GetSingleSampleSchema = z.object({
    is_widget_sample: z
        .string()
        .trim()
        .optional()
        .refine(
            (value) => {
                return (
                    value === undefined || value === 'true' || value === 'false'
                );
            },
            {
                message: errorMessage.SAMPLE.BOOLEAN_VALUE_REQUIRED,
            },
        )
        .transform((value) => value === 'true'),
});

type CreateSampleType = z.infer<typeof CreateSampleSchema>;
type CreateDraftType = z.infer<typeof CreateDraftSchema>;
type UpdateSampleType = z.infer<typeof UpdateSampleSchema>;
type GetAllSampleType = z.infer<typeof GetAllSampleSchema>;
type ToggleSampleType = z.infer<typeof ToggleSampleSchema>;
type SubmitAnswerType = z.infer<typeof SubmitAnswerSchema>;
type ReviewSampleType = z.infer<typeof ReviewSampleSchema>;
type GetAllReviewType = z.infer<typeof GetAllReviewSchema>;
type FetchAllSampleType = z.infer<typeof FetchAllSampleSchema>;
type GetAllRequestedSampleType = z.infer<typeof GetAllRequestedSampleSchema>;
type ExportToExcelType = z.infer<typeof ExportToExcelSchema>;

export {
    CreateSampleSchema,
    CreateDraftSchema,
    UpdateSampleSchema,
    GetAllSampleSchema,
    SampleTypeSchema,
    ToggleSampleSchema,
    SubmitAnswerSchema,
    ReviewSampleSchema,
    GetAllReviewSchema,
    FetchAllSampleSchema,
    GetAllRequestedSampleSchema,
    ExportToExcelSchema,
    GetSampleEngagementSchema,
    GetSingleSampleSchema,
};

export type {
    CreateSampleType,
    CreateDraftType,
    UpdateSampleType,
    GetAllSampleType,
    ToggleSampleType,
    SubmitAnswerType,
    ReviewSampleType,
    GetAllReviewType,
    FetchAllSampleType,
    GetAllRequestedSampleType,
    ExportToExcelType,
};
