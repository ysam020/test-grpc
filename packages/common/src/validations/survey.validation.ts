import {
    errorMessage,
    Location,
    Age,
    State,
    Gender,
    SurveyType,
    SurveyStatus,
    constants,
    ChartType,
    SelectionOptionEnum,
} from '../index';
import z from 'zod';

const surveyTypeSchema = z.object({
    type: z.nativeEnum(SurveyType),
});

const CreateSurveySchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(5, { message: errorMessage.SURVEY.NAME_REQUIRED })
            .max(50, { message: errorMessage.SURVEY.MAX_NAME_LENGTH })
            .transform((value) => value.toLowerCase()),
        client: z
            .string()
            .trim()
            .min(5, { message: errorMessage.SURVEY.MIN_CLIENT_LENGTH })
            .max(255, { message: errorMessage.SURVEY.MAX_CLIENT_LENGTH })
            .optional(),
        start_date: z.string().trim(),
        end_date: z.string().trim(),
        question: z
            .string()
            .min(5, { message: errorMessage.SURVEY.QUESTION_REQUIRED })
            .max(255, { message: errorMessage.SURVEY.MAX_LENGTH }),
        option: z
            .array(z.string().trim())
            .min(2, { message: errorMessage.SURVEY.MIN_OPTIONS })
            .max(10, { message: errorMessage.SURVEY.MAX_OPTIONS }),
        target_audience: z
            .number()
            .min(1, { message: errorMessage.SURVEY.TARGET_AUDIENCE_REQUIRED })
            .max(5000, {
                message: errorMessage.SURVEY.MAXIMUM_TARGET_AUDIENCE,
            }),
        location: z
            .array(z.string().trim())
            .refine(
                (values) => {
                    return values.every((value) =>
                        Object.values(Location).includes(value as Location),
                    );
                },
                {
                    message: errorMessage.SURVEY.INVALID_LOCATION(
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
            }),
        state: z
            .array(z.string().trim())
            .refine(
                (values) => {
                    return values.every((value) =>
                        Object.values(State).includes(value as State),
                    );
                },
                {
                    message: errorMessage.SURVEY.INVALID_LOCATION(
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
            }),
        age: z
            .array(z.string().trim())
            .refine(
                (values) => {
                    return values.every((value) =>
                        Object.values(Age).includes(value as Age),
                    );
                },
                {
                    message: errorMessage.SURVEY.INVALID_LOCATION(
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
            }),
        gender: z.nativeEnum(Gender).optional(),
        multi_select: z.boolean(),
        has_children: z.nativeEnum(SelectionOptionEnum).optional(),
        with_email_saved: z.nativeEnum(SelectionOptionEnum).optional(),
        is_draft: z.boolean(),
    })
    .superRefine((data, ctx) => {
        if (!constants.DATE_REGEX.test(data.start_date)) {
            ctx.addIssue({
                path: ['start_date'],
                message: errorMessage.DATE.INVALID_DATE,
                code: z.ZodIssueCode.custom,
            });
            return;
        }

        if (
            new Date(data.start_date).setHours(0, 0, 0, 0) <
            new Date().setHours(0, 0, 0, 0)
        ) {
            ctx.addIssue({
                path: ['start_date'],
                message: errorMessage.DATE.PAST_DATE,
                code: z.ZodIssueCode.custom,
            });
            return;
        }

        if (!constants.DATE_REGEX.test(data.end_date)) {
            ctx.addIssue({
                path: ['end_date'],
                message: errorMessage.DATE.INVALID_DATE,
                code: z.ZodIssueCode.custom,
            });
            return;
        }
        if (new Date(data.end_date) < new Date(data.start_date)) {
            ctx.addIssue({
                path: ['end_date'],
                message: errorMessage.DATE.DATE_BEFORE_START,
                code: z.ZodIssueCode.custom,
            });
        }
    });

const GetAllSurveySchema = z.object({
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
    survey_status: z.nativeEnum(SurveyStatus).optional(),
    user_id: z.string().trim().uuid().optional(),
    keyword: z.string().trim().optional(),
});

const ToggleSurveySchema = z.object({
    id: z.string().trim().uuid().optional(),
    survey_ids: z.array(z.string().trim().uuid()).optional(),
});

const SubmitSurveyAnswerSchema = z.object({
    option: z.array(z.string().trim().uuid()),
});

const commonFields = z.object({
    client: z
        .string()
        .trim()
        .min(5, { message: errorMessage.SURVEY.MIN_CLIENT_LENGTH })
        .max(255, { message: errorMessage.SURVEY.MAX_CLIENT_LENGTH })
        .optional(),
    question: z.string().optional(),
    option: z.array(z.string().trim()).optional(),
    target_audience: z
        .number()
        .refine(
            (value) => {
                if (
                    value === undefined ||
                    value === 0 ||
                    (value >= 1 && value <= 5000)
                ) {
                    return true;
                }
            },
            {
                message: errorMessage.SURVEY.TARGET_AUDIENCE_MIN_MAX,
            },
        )
        .optional(),
    start_date: z.string().trim().optional(),
    end_date: z.string().trim().optional(),
    location: z
        .array(z.string().trim())
        .refine(
            (values) => {
                return values.every((value) =>
                    Object.values(Location).includes(value as Location),
                );
            },
            {
                message: errorMessage.SURVEY.INVALID_LOCATION(
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
                return values.every((value) =>
                    Object.values(State).includes(value as State),
                );
            },
            {
                message: errorMessage.SURVEY.INVALID_STATE(
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
                return values.every((value) =>
                    Object.values(Age).includes(value as Age),
                );
            },
            {
                message: errorMessage.SURVEY.INVALID_AGE(Object.values(Age)),
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
    multi_select: z.boolean().optional(),
    has_children: z.nativeEnum(SelectionOptionEnum).optional(),
    with_email_saved: z.nativeEnum(SelectionOptionEnum).optional(),
    is_draft: z.boolean(),
});

const UpdateSurveySchema = commonFields
    .extend({
        is_draft: z.boolean().optional(),
        name: z
            .string()
            .trim()
            .min(6, { message: errorMessage.SURVEY.NAME_REQUIRED })
            .max(50, { message: errorMessage.SURVEY.MAX_NAME_LENGTH })
            .transform((value) => value.toLowerCase())
            .optional(),
    })
    .superRefine((data, ctx) => {
        if (data.start_date || data.end_date) {
            if (data.start_date) {
                if (!constants.DATE_REGEX.test(data.start_date)) {
                    ctx.addIssue({
                        path: ['start_date'],
                        message: errorMessage.DATE.INVALID_DATE,
                        code: z.ZodIssueCode.custom,
                    });
                    return;
                }

                if (
                    new Date(data.start_date).setHours(0, 0, 0, 0) <
                    new Date().setHours(0, 0, 0, 0)
                ) {
                    ctx.addIssue({
                        path: ['start_date'],
                        message: errorMessage.DATE.PAST_DATE,
                        code: z.ZodIssueCode.custom,
                    });
                    return;
                }
            }

            if (data.end_date) {
                if (!constants.DATE_REGEX.test(data.end_date)) {
                    ctx.addIssue({
                        path: ['end_date'],
                        message: errorMessage.DATE.INVALID_DATE,
                        code: z.ZodIssueCode.custom,
                    });
                    return;
                }
            }

            if (data.start_date && data.end_date) {
                if (new Date(data.end_date) < new Date(data.start_date)) {
                    ctx.addIssue({
                        path: ['end_date'],
                        message: errorMessage.DATE.DATE_BEFORE_START,
                        code: z.ZodIssueCode.custom,
                    });
                    return;
                }
            }
        }

        if (data.question) {
            if (data.question.length < 5) {
                ctx.addIssue({
                    path: ['question'],
                    message: errorMessage.SURVEY.QUESTION_MIN_LENGTH,
                    code: z.ZodIssueCode.custom,
                });
            }

            if (data.question.length > 255) {
                ctx.addIssue({
                    path: ['question'],
                    message: errorMessage.SURVEY.QUESTION_MAX_LENGTH,
                    code: z.ZodIssueCode.custom,
                });
            }
        }

        if (!data.question && data.option && data.option.length > 0) {
            ctx.addIssue({
                path: ['option'],
                message: errorMessage.SURVEY.CANNOT_ADD_OPTION,
                code: z.ZodIssueCode.custom,
            });
        }

        if (data.question) {
            if (
                data.option &&
                data.option.length > 0 &&
                data.option.length < 2
            ) {
                ctx.addIssue({
                    path: ['option'],
                    message: errorMessage.SURVEY.MIN_OPTIONS,
                    code: z.ZodIssueCode.custom,
                });
            }

            if (data.option && data.option.length > 10) {
                ctx.addIssue({
                    path: ['option'],
                    message: errorMessage.SURVEY.MAX_OPTIONS,
                    code: z.ZodIssueCode.custom,
                });
            }
        }
    });

const DraftSurveySchema = commonFields
    .extend({
        name: z
            .string()
            .trim()
            .min(6, { message: errorMessage.SURVEY.NAME_REQUIRED })
            .max(50, { message: errorMessage.SURVEY.MAX_NAME_LENGTH })
            .transform((value) => value.toLowerCase()),
    })
    .superRefine((data, ctx) => {
        if (data.start_date || data.end_date) {
            if (data.start_date) {
                if (!constants.DATE_REGEX.test(data.start_date)) {
                    ctx.addIssue({
                        path: ['start_date'],
                        message: errorMessage.DATE.INVALID_DATE,
                        code: z.ZodIssueCode.custom,
                    });
                    return;
                }

                if (
                    new Date(data.start_date).setHours(0, 0, 0, 0) <
                    new Date().setHours(0, 0, 0, 0)
                ) {
                    ctx.addIssue({
                        path: ['start_date'],
                        message: errorMessage.DATE.PAST_DATE,
                        code: z.ZodIssueCode.custom,
                    });
                    return;
                }
            }

            if (data.end_date) {
                if (!constants.DATE_REGEX.test(data.end_date)) {
                    ctx.addIssue({
                        path: ['end_date'],
                        message: errorMessage.DATE.INVALID_DATE,
                        code: z.ZodIssueCode.custom,
                    });
                    return;
                }
            }

            if (data.start_date && data.end_date) {
                if (new Date(data.end_date) < new Date(data.start_date)) {
                    ctx.addIssue({
                        path: ['end_date'],
                        message: errorMessage.DATE.DATE_BEFORE_START,
                        code: z.ZodIssueCode.custom,
                    });
                    return;
                }
            }
        }

        if (data.question) {
            if (data.question.length < 5) {
                ctx.addIssue({
                    path: ['question'],
                    message: errorMessage.SURVEY.QUESTION_MIN_LENGTH,
                    code: z.ZodIssueCode.custom,
                });
            }

            if (data.question.length > 255) {
                ctx.addIssue({
                    path: ['question'],
                    message: errorMessage.SURVEY.QUESTION_MAX_LENGTH,
                    code: z.ZodIssueCode.custom,
                });
            }
        }

        if (!data.question && data.option && data.option.length > 0) {
            ctx.addIssue({
                path: ['option'],
                message: errorMessage.SURVEY.CANNOT_ADD_OPTION,
                code: z.ZodIssueCode.custom,
            });
        }

        if (data.question) {
            if (
                data.option &&
                data.option.length > 0 &&
                data.option.length < 2
            ) {
                ctx.addIssue({
                    path: ['option'],
                    message: errorMessage.SURVEY.MIN_OPTIONS,
                    code: z.ZodIssueCode.custom,
                });
            }

            if (data.option && data.option.length > 10) {
                ctx.addIssue({
                    path: ['option'],
                    message: errorMessage.SURVEY.MAX_OPTIONS,
                    code: z.ZodIssueCode.custom,
                });
            }
        }
    });

const GetAllResponseSchema = z.object({
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

const DidUserAnsweredSchema = z.object({
    survey_ids: z.array(z.string().trim().uuid()).optional(),
});

const GetSurveyEngagementSchema = z
    .object({
        type: z.nativeEnum(ChartType),
    })
    .strict();

const ExportToExcelSchema = z.object({ email: z.string().trim().email() });

type createSurveyType = z.infer<typeof CreateSurveySchema>;
type GetAllSurveyType = z.infer<typeof GetAllSurveySchema>;
type UpdateSurveyType = z.infer<typeof UpdateSurveySchema>;
type ToggleSurveyType = z.infer<typeof ToggleSurveySchema>;
type SubmitSurveyAnswerType = z.infer<typeof SubmitSurveyAnswerSchema>;
type GetAllResponseType = z.infer<typeof GetAllResponseSchema>;

export {
    CreateSurveySchema,
    GetAllSurveySchema,
    UpdateSurveySchema,
    ToggleSurveySchema,
    SubmitSurveyAnswerSchema,
    DraftSurveySchema,
    surveyTypeSchema,
    GetAllResponseSchema,
    DidUserAnsweredSchema,
    GetSurveyEngagementSchema,
    ExportToExcelSchema,
};
export type {
    createSurveyType,
    GetAllSurveyType,
    UpdateSurveyType,
    ToggleSurveyType,
    SubmitSurveyAnswerType,
    GetAllResponseType,
};
