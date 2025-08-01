import {
    Age,
    AnswerType,
    constants,
    errorMessage,
    ExcelReportType,
    Gender,
    Location,
    ReviewType,
    SampleStatus,
    SampleType,
    SelectionOptionEnum,
    State,
} from '@atc/common';
import z from 'zod';

const CreateSampleSchema = z
    .object({
        client: z
            .string()
            .trim()
            .min(5, { message: errorMessage.SAMPLE.MIN_LENGTH })
            .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH })
            .optional(),
        product_id: z.string().trim().uuid(),
        image: z.instanceof(Buffer).optional(),
        description: z
            .string()
            .trim()
            .min(5, { message: errorMessage.SAMPLE.DESCRIPTION_REQUIRED })
            .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH }),
        start_date: z.string().trim(),
        end_date: z.string().trim(),
        maximum_sample: z
            .number()
            .min(1, { message: errorMessage.SAMPLE.MAXIMUM_SAMPLE_REQUIRED })
            .max(5000, {
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
        gender: z
            .string()
            .trim()
            .refine(
                (value) => Object.values(Gender).includes(value as Gender),
                {
                    message: errorMessage.SAMPLE.INVALID_GENDER(
                        Object.values(Gender),
                    ),
                },
            )
            .optional(),
        has_children: z.nativeEnum(SelectionOptionEnum).optional(),
        with_email_saved: z.nativeEnum(SelectionOptionEnum).optional(),
        is_draft: z.boolean().optional(),
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
        mime_type: z
            .string()
            .regex(
                constants.MIME_TYPE_REGEX,
                errorMessage.OTHER.INVALID_MIME_TYPE,
            )
            .optional(),
        content_length: z.number().optional(),
        id: z.string().trim().uuid().optional(),
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
    })
    .transform((data) => {
        return {
            ...data,
            start_date: new Date(data.start_date),
            end_date: new Date(data.end_date),
        };
    });

const commonFields = z.object({
    client: z
        .string()
        .trim()
        .min(5, { message: errorMessage.SAMPLE.MIN_LENGTH })
        .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH })
        .optional(),
    product_id: z.string().trim().uuid().optional(),
    image: z.instanceof(Buffer).optional(),
    description: z
        .string()
        .trim()
        .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH })
        .min(5, { message: errorMessage.SAMPLE.DESCRIPTION_REQUIRED })
        .optional(),
    start_date: z.string().trim().optional(),
    end_date: z.string().trim().optional(),
    maximum_sample: z
        .number()
        .min(0, { message: errorMessage.SAMPLE.MAXIMUM_SAMPLE_REQUIRED })
        .max(5000, {
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
    gender: z
        .string()
        .trim()
        .refine((value) => Object.values(Gender).includes(value as Gender), {
            message: errorMessage.SAMPLE.INVALID_GENDER(Object.values(Gender)),
        })
        .optional(),
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
                answer_type: z.nativeEnum(AnswerType).optional(),
                options: z.array(z.string().trim()).optional(),
            }),
        )
        .min(0, { message: errorMessage.SAMPLE.MIN_QUESTION })
        .max(5, { message: errorMessage.SAMPLE.MAX_QUESTION })
        .optional(),
    mime_type: z
        .string()
        .regex(constants.MIME_TYPE_REGEX, errorMessage.OTHER.INVALID_MIME_TYPE)
        .optional(),
    content_length: z.number().optional(),
});

const DraftSampleSchema = commonFields
    .extend({
        is_draft: z.boolean(),
        id: z.string().trim().uuid().optional(),
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
    })
    .transform((data) => {
        return {
            ...data,
            start_date: data.start_date ? new Date(data.start_date) : undefined,
            end_date: data.end_date ? new Date(data.end_date) : undefined,
        };
    });

const DeleteSampleSchema = z.object({
    id: z.string().trim().uuid(),
});

const GetAllSamplesSchema = z
    .object({
        type: z.nativeEnum(SampleType),
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
    })
    .transform((data) => {
        return {
            ...data,
            start_date: data.start_date ? new Date(data.start_date) : undefined,
            end_date: data.end_date ? new Date(data.end_date) : undefined,
        };
    });

const UpdateSampleSchema = commonFields
    .partial()
    .extend({
        id: z.string().uuid(),
        is_draft: z.boolean().optional(),
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
    })
    .transform((data) => {
        return {
            ...data,
            start_date: data.start_date ? new Date(data.start_date) : undefined,
            end_date: data.end_date ? new Date(data.end_date) : undefined,
        };
    });

const UUIDSchema = z.object({ id: z.string().trim().uuid() });

const ToggleSampleSchema = z.object({
    id: z.string().trim().uuid(),
    type: z.nativeEnum(SampleType),
});

const ReviewSampleSchema = z
    .object({
        id: z.string().trim().uuid(),
        rating: z.number().optional(),
        comment: z
            .string()
            .trim()
            .min(20, { message: errorMessage.SAMPLE.MINIMUM_COMMENT_LENGTH })
            .max(255, { message: errorMessage.SAMPLE.MAX_LENGTH })
            .optional(),
        image: z.instanceof(Buffer).optional(),
        mime_type: z
            .string()
            .regex(
                constants.MIME_TYPE_REGEX,
                errorMessage.OTHER.INVALID_MIME_TYPE,
            )
            .optional(),
        content_length: z.number().optional(),
    })
    .superRefine((data, ctx) => {
        if (!data.comment && !data.rating && !data.image) {
            return ctx.addIssue({
                path: ['rating | comment | image'],
                message: errorMessage.SAMPLE.REQUIRED,
                code: z.ZodIssueCode.custom,
            });
        }

        if (data.rating) {
            if (data.rating < 0) {
                return ctx.addIssue({
                    path: ['rating'],
                    message: errorMessage.SAMPLE.MINIMUM_RATING,
                    code: z.ZodIssueCode.custom,
                });
            }

            if (data.rating > 5) {
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
        .number()
        .refine((value) => !isNaN(Number(value)), {
            message: errorMessage.SAMPLE.INVALID_PAGE,
        })
        .refine((value) => Number(value) > 0, {
            message: errorMessage.SAMPLE.INVALID_PAGE,
        })
        .transform((value) => Math.trunc(Number(value))),
    limit: z
        .number()
        .refine((value) => !isNaN(Number(value)), {
            message: errorMessage.SAMPLE.INVALID_LIMIT,
        })
        .refine((value) => Number(value) > 0, {
            message: errorMessage.SAMPLE.INVALID_LIMIT,
        })
        .transform((value) => Math.trunc(Number(value))),
});

const AnswerSchema = z.object({
    question_id: z.string().trim().uuid(),
    option: z.array(z.union([z.string().uuid(), z.string(), z.number()])),
});

const SubmitSampleAnswerSchema = z.object({
    id: z.string().trim().uuid(),
    answer_data: z
        .array(AnswerSchema)
        .max(5, { message: errorMessage.SAMPLE.MAXIMUM_RESPONSE }),
});

const FetchAllSamplesForUserSchema = z.object({
    page: z
        .number()
        .refine((value) => !isNaN(Number(value)), {
            message: errorMessage.SAMPLE.INVALID_PAGE,
        })
        .refine((value) => Number(value) > 0, {
            message: errorMessage.SAMPLE.INVALID_PAGE,
        })
        .transform((value) => Math.trunc(Number(value))),
    limit: z
        .number()
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
        .number()
        .int()
        .positive()
        .transform((value) => Math.trunc(value)),
    limit: z
        .number()
        .int()
        .positive()
        .transform((value) => Math.trunc(value)),
    id: z.string().trim().uuid(),
});

const ExportToExcelSchema = z
    .object({
        type: z.nativeEnum(ExcelReportType),
        id: z.string().trim().uuid().optional(),
        start_date: z.string().trim().optional(),
        end_date: z.string().trim().optional(),
        email: z.string().trim().toLowerCase().email(),
    })
    .superRefine((data, ctx) => {
        if (data.type === ExcelReportType.ALL_SAMPLE_REPORT) {
            if (data.id) {
                return ctx.addIssue({
                    path: ['id'],
                    message: errorMessage.SAMPLE.NO_DATA_NEEDED,
                    code: z.ZodIssueCode.custom,
                });
            }

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
        }

        if (
            (data.type === ExcelReportType.QUESTION_REPORT ||
                data.type === ExcelReportType.SAMPLE_REPORT) &&
            !data.id
        ) {
            return ctx.addIssue({
                path: ['id'],
                message: errorMessage.SAMPLE.ID_REQUIRED(data.type),
                code: z.ZodIssueCode.custom,
            });
        }
    });

const GetSingleSampleSchema = z.object({
    id: z.string().trim().uuid(),
    is_widget_sample: z.boolean().optional(),
});

type CreateSampleType = z.infer<typeof CreateSampleSchema>;
type DraftSampleType = z.infer<typeof DraftSampleSchema>;
type DeleteSampleType = z.infer<typeof DeleteSampleSchema>;
type GetAllSamplesType = z.infer<typeof GetAllSamplesSchema>;
type UpdateSampleType = z.infer<typeof UpdateSampleSchema>;
type GetSingleSampleType = z.infer<typeof GetSingleSampleSchema>;
type RequestSampleType = z.infer<typeof UUIDSchema>;
type ToggleSampleType = z.infer<typeof ToggleSampleSchema>;
type ReviewSampleType = z.infer<typeof ReviewSampleSchema>;
type GetAllReviewType = z.infer<typeof GetAllReviewSchema>;
type SubmitSampleAnswerType = z.infer<typeof SubmitSampleAnswerSchema>;
type FetchAllSamplesForUserSchemaType = z.infer<
    typeof FetchAllSamplesForUserSchema
>;
type GetAllRequestedSampleType = z.infer<typeof GetAllRequestedSampleSchema>;
type ExportToExcelType = z.infer<typeof ExportToExcelSchema>;

export {
    CreateSampleSchema,
    DraftSampleSchema,
    DeleteSampleSchema,
    GetAllSamplesSchema,
    UpdateSampleSchema,
    UUIDSchema,
    ToggleSampleSchema,
    ReviewSampleSchema,
    GetAllReviewSchema,
    SubmitSampleAnswerSchema,
    FetchAllSamplesForUserSchema,
    GetAllRequestedSampleSchema,
    ExportToExcelSchema,
    GetSingleSampleSchema,
};

export type {
    DraftSampleType,
    DeleteSampleType,
    CreateSampleType,
    GetAllSamplesType,
    UpdateSampleType,
    GetSingleSampleType,
    ToggleSampleType,
    RequestSampleType,
    ReviewSampleType,
    GetAllReviewType,
    SubmitSampleAnswerType,
    FetchAllSamplesForUserSchemaType,
    GetAllRequestedSampleType,
    ExportToExcelType,
};
