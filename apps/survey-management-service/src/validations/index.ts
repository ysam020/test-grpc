import {
    errorMessage,
    Location,
    Age,
    State,
    Gender,
    SurveyType,
    SurveyStatus,
    constants,
    SelectionOptionEnum,
} from '@atc/common';
import z from 'zod';

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
        startDate: z.string().trim(),
        endDate: z.string().trim(),
        question: z
            .string()
            .min(5, { message: errorMessage.SURVEY.QUESTION_REQUIRED })
            .max(255, { message: errorMessage.SURVEY.MAX_LENGTH }),
        option: z
            .array(z.string().trim())
            .min(2, { message: errorMessage.SURVEY.MIN_OPTIONS })
            .max(10, { message: errorMessage.SURVEY.MAX_OPTIONS }),
        targetAudience: z
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
                    message: errorMessage.SURVEY.INVALID_AGE(
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
        multiSelect: z.boolean(),
        hasChildren: z.nativeEnum(SelectionOptionEnum).optional(),
        withEmailSaved: z.nativeEnum(SelectionOptionEnum).optional(),
        is_draft: z.boolean(),
        id: z.string().trim().uuid().optional(),
    })
    .superRefine((data, ctx) => {
        if (!constants.DATE_REGEX.test(data.startDate)) {
            ctx.addIssue({
                path: ['startDate'],
                message: errorMessage.DATE.INVALID_DATE,
                code: z.ZodIssueCode.custom,
            });
            return;
        }

        if (
            new Date(data.startDate).setHours(0, 0, 0, 0) <
            new Date().setHours(0, 0, 0, 0)
        ) {
            ctx.addIssue({
                path: ['startDate'],
                message: errorMessage.DATE.PAST_DATE,
                code: z.ZodIssueCode.custom,
            });
            return;
        }

        if (!constants.DATE_REGEX.test(data.endDate)) {
            ctx.addIssue({
                path: ['endDate'],
                message: errorMessage.DATE.INVALID_DATE,
                code: z.ZodIssueCode.custom,
            });
            return;
        }
        if (new Date(data.endDate) < new Date(data.startDate)) {
            ctx.addIssue({
                path: ['endDate'],
                message: errorMessage.DATE.DATE_BEFORE_START,
                code: z.ZodIssueCode.custom,
            });
        }
    })
    .transform((data) => {
        return {
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
        };
    });

const GetAllSurveySchema = z.object({
    type: z.nativeEnum(SurveyType),
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
    user_id: z.string().trim().uuid().optional(),
    survey_status: z.nativeEnum(SurveyStatus).optional(),
    keyword: z.string().trim().optional(),
});

const ToggleSurveySchema = z.object({
    type: z.nativeEnum(SurveyType),
    id: z.string().trim().uuid().optional(),
    survey_ids: z.array(z.string().trim().uuid()).optional(),
});

const SubmitSurveyAnswerSchema = z.object({
    id: z.string().trim().uuid(),
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
    targetAudience: z
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
    startDate: z.string().trim().optional(),
    endDate: z.string().trim().optional(),
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
        })
        .optional(),
    gender: z.nativeEnum(Gender).optional(),
    multiSelect: z.boolean().optional(),
    hasChildren: z.nativeEnum(SelectionOptionEnum).optional(),
    withEmailSaved: z.nativeEnum(SelectionOptionEnum).optional(),
    is_draft: z.boolean(),
});

const UpdateSurveySchema = commonFields
    .extend({
        id: z.string().trim().uuid(),
        name: z
            .string()
            .trim()
            .min(6, { message: errorMessage.SURVEY.NAME_REQUIRED })
            .max(50, { message: errorMessage.SURVEY.MAX_NAME_LENGTH })
            .transform((value) => value.toLowerCase())
            .optional(),
    })
    .superRefine((data, ctx) => {
        if (data.startDate || data.endDate) {
            if (data.startDate) {
                if (!constants.DATE_REGEX.test(data.startDate)) {
                    ctx.addIssue({
                        path: ['startDate'],
                        message: errorMessage.DATE.INVALID_DATE,
                        code: z.ZodIssueCode.custom,
                    });
                    return;
                }

                if (
                    new Date(data.startDate).setHours(0, 0, 0, 0) <
                    new Date().setHours(0, 0, 0, 0)
                ) {
                    ctx.addIssue({
                        path: ['startDate'],
                        message: errorMessage.DATE.PAST_DATE,
                        code: z.ZodIssueCode.custom,
                    });
                    return;
                }
            }

            if (data.endDate) {
                if (!constants.DATE_REGEX.test(data.endDate)) {
                    ctx.addIssue({
                        path: ['endDate'],
                        message: errorMessage.DATE.INVALID_DATE,
                        code: z.ZodIssueCode.custom,
                    });
                    return;
                }
            }

            if (data.startDate && data.endDate) {
                if (new Date(data.endDate) < new Date(data.startDate)) {
                    ctx.addIssue({
                        path: ['endDate'],
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
    })
    .transform((data) => {
        return {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
        };
    });

const DraftSurveySchema = commonFields
    .extend({
        name: z
            .string()
            .trim()
            .min(6, { message: errorMessage.SURVEY.NAME_REQUIRED })
            .max(50, { message: errorMessage.SURVEY.MAX_NAME_LENGTH })
            .transform((value) => value.toLowerCase()),
        id: z.string().trim().uuid().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.startDate || data.endDate) {
            if (data.startDate) {
                if (!constants.DATE_REGEX.test(data.startDate)) {
                    ctx.addIssue({
                        path: ['startDate'],
                        message: errorMessage.DATE.INVALID_DATE,
                        code: z.ZodIssueCode.custom,
                    });
                    return;
                }

                if (
                    new Date(data.startDate).setHours(0, 0, 0, 0) <
                    new Date().setHours(0, 0, 0, 0)
                ) {
                    ctx.addIssue({
                        path: ['startDate'],
                        message: errorMessage.DATE.PAST_DATE,
                        code: z.ZodIssueCode.custom,
                    });
                    return;
                }
            }

            if (data.endDate) {
                if (!constants.DATE_REGEX.test(data.endDate)) {
                    ctx.addIssue({
                        path: ['endDate'],
                        message: errorMessage.DATE.INVALID_DATE,
                        code: z.ZodIssueCode.custom,
                    });
                    return;
                }
            }

            if (data.startDate && data.endDate) {
                if (new Date(data.endDate) < new Date(data.startDate)) {
                    ctx.addIssue({
                        path: ['endDate'],
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
    })
    .transform((data) => {
        return {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
        };
    });

const GetAllResponsesByUserIDSchema = z.object({
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

const DidUserAnsweredSchema = z.object({
    survey_ids: z.array(z.string().trim().uuid()).optional(),
});

const GetSingleSurveySchema = z.object({
    id: z.string().trim().uuid(),
    is_widget_survey: z.boolean().optional().default(false),
});

const ExportToExcelSchema = z.object({
    id: z.string().trim().uuid(),
    email: z.string().trim().email(),
});

type createSurveyType = z.infer<typeof CreateSurveySchema>;
type GetAllSurveyType = z.infer<typeof GetAllSurveySchema>;
type UpdateSurveyType = z.infer<typeof UpdateSurveySchema>;
type ToggleSurveyType = z.infer<typeof ToggleSurveySchema>;
type SubmitSurveyAnswerType = z.infer<typeof SubmitSurveyAnswerSchema>;
type GetAllResponsesByUserIDType = z.infer<
    typeof GetAllResponsesByUserIDSchema
>;
type ExportToExcelType = z.infer<typeof ExportToExcelSchema>;

export {
    CreateSurveySchema,
    GetAllSurveySchema,
    UpdateSurveySchema,
    ToggleSurveySchema,
    SubmitSurveyAnswerSchema,
    DraftSurveySchema,
    GetAllResponsesByUserIDSchema,
    DidUserAnsweredSchema,
    GetSingleSurveySchema,
    ExportToExcelSchema,
};
export type {
    createSurveyType,
    GetAllSurveyType,
    UpdateSurveyType,
    ToggleSurveyType,
    SubmitSurveyAnswerType,
    GetAllResponsesByUserIDType,
    ExportToExcelType,
};
