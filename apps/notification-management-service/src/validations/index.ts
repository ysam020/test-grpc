import z from 'zod';
import { prismaClient } from '@atc/db';
import { errorMessage, SelectionOptionEnum } from '@atc/common';

const isFutureDate = (date: string, hour: number, minute: number) => {
    const currentDate = new Date();
    const inputDate = new Date(date);
    inputDate.setHours(hour, minute, 0, 0);
    return inputDate > currentDate;
};

enum LocationEnum {
    METRO = 'METRO',
    URBAN = 'URBAN',
    RURAL = 'RURAL',
    ALL = 'ALL',
}

enum StateEnum {
    ACT = 'ACT',
    NSW = 'NSW',
    NT = 'NT',
    QLD = 'QLD',
    SA = 'SA',
    TAS = 'TAS',
    VIC = 'VIC',
    WA = 'WA',
    ALL = 'ALL',
}

export enum AgeEnum {
    CHILD = 'CHILD', // <18
    YOUNG_ADULT = 'YOUNG_ADULT', // 18-20
    ADULT = 'ADULT', // 21-30
    MIDDLE_AGED = 'MIDDLE_AGED', //31-40
    SENIOR_ADULT = 'SENIOR_ADULT', //41-50
    OLDER_ADULT = 'OLDER_ADULT', //51-60
    SENIOR = 'SENIOR', // > 60
    ALL = 'ALL',
}

enum GenderEnum {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    BOTH = 'BOTH',
}

enum Channel {
    EMAIL = 'EMAIL',
    SMS = 'SMS',
    WHATSAPP = 'WHATSAPP',
    PUSH_NOTIFICATION = 'PUSH_NOTIFICATION',
}

const commonAdminNotification = z.object({
    title: z.string().trim().min(3).max(100),
    description: z.string().trim().min(3).max(500),
    schedule_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, errorMessage.WIDGET.INVALID_DATE_FORMAT),
    schedule_hour: z.number().int().min(0).max(23),
    schedule_minute: z.number().int().min(0).max(59),
    channels: z
        .array(z.nativeEnum(Channel))
        .min(1, errorMessage.ADMIN_NOTIFICATION.NO_CHANNEL_SELECTED),
    target_users: z.object({
        location: z
            .array(z.nativeEnum(LocationEnum))
            .min(1, errorMessage.ADMIN_NOTIFICATION.NO_LOCATION_SELECTED)
            .transform((value) => {
                if (value?.includes(LocationEnum.ALL)) {
                    return [LocationEnum.ALL];
                }
                return value;
            }),
        states: z
            .array(z.nativeEnum(StateEnum))
            .min(1, errorMessage.ADMIN_NOTIFICATION.NO_STATE_SELECTED)
            .transform((value) => {
                if (value?.includes(StateEnum.ALL)) {
                    return [StateEnum.ALL];
                }
                return value;
            }),
        age: z
            .array(z.nativeEnum(AgeEnum))
            .min(1, errorMessage.ADMIN_NOTIFICATION.NO_AGE_GROUP_SELECTED)
            .transform((value) => {
                if (value?.includes(AgeEnum.ALL)) {
                    return [AgeEnum.ALL];
                }
                return value;
            }),
        gender: z.nativeEnum(GenderEnum).transform((value) => {
            if (
                !value ||
                !Object.values(GenderEnum).includes(value as GenderEnum)
            ) {
                return GenderEnum.BOTH;
            }
            return value;
        }),
        has_children: z.nativeEnum(SelectionOptionEnum),
        with_email_saved: z.nativeEnum(SelectionOptionEnum),
    }),
});

const createAdminNotificationSchema = commonAdminNotification.refine(
    (data) =>
        isFutureDate(
            data.schedule_date,
            data.schedule_hour,
            data.schedule_minute,
        ),
    { message: errorMessage.WIDGET.DEPLOY_DATE_PAST, path: ['schedule_date'] },
);

const updateAdminNotificationSchema = commonAdminNotification
    .partial()
    .extend({
        admin_notification_id: z.string().trim().uuid(),
    })
    .refine(
        (data) => {
            const { schedule_date, schedule_hour, schedule_minute } = data;

            const isAnyFieldProvided =
                schedule_date !== undefined ||
                schedule_hour !== undefined ||
                schedule_minute !== undefined;

            const areAllFieldsProvided =
                schedule_date !== undefined &&
                schedule_hour !== undefined &&
                schedule_minute !== undefined;

            // If any one field is provided, ensure all three are provided
            if (isAnyFieldProvided && !areAllFieldsProvided) {
                return false;
            }

            // If all fields are provided, check if the date is in the future
            if (areAllFieldsProvided) {
                return isFutureDate(
                    schedule_date,
                    schedule_hour,
                    schedule_minute,
                );
            }

            return true;
        },
        {
            message: errorMessage.ADMIN_NOTIFICATION.INCOMPLETE_SCHEDULE_FIELDS,
            path: ['schedule_date', 'schedule_hour', 'schedule_minute'],
        },
    );

const getAdminNotificationsSchema = z
    .object({
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
        status: z.nativeEnum(prismaClient.AdminNotificationStatus).optional(),
        start_date: z
            .string()
            .regex(
                /^\d{4}-\d{2}-\d{2}$/,
                errorMessage.WIDGET.INVALID_DATE_FORMAT,
            )
            .transform((value) => new Date(value))
            .optional(),
        end_date: z
            .string()
            .regex(
                /^\d{4}-\d{2}-\d{2}$/,
                errorMessage.WIDGET.INVALID_DATE_FORMAT,
            )
            .transform((value) => new Date(value))
            .optional(),
    })
    .strict()
    .refine(
        (data) => {
            // Ensure both start_date and end_date are provided if one is passed
            if (
                (data.start_date && !data.end_date) ||
                (!data.start_date && data.end_date)
            ) {
                return false;
            }
            return true;
        },
        {
            message: errorMessage.ADMIN_NOTIFICATION.DATE_RANGE_REQUIRED,
            path: ['end_date'],
        },
    );

const adminNotificationIDSchema = z
    .object({
        admin_notification_id: z.string().trim().uuid(),
    })
    .strict();

const addPriceAlertSchema = z
    .object({
        product_id: z.string().trim().uuid(),
        target_price: z.number().positive(),
    })
    .strict();

const priceAlertIDSchema = z
    .object({
        price_alert_id: z.string().trim().uuid(),
    })
    .strict();

const getNotificationsSchema = z
    .object({
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
    })
    .strict();

const createNotificationSchema = z
    .object({
        title: z.string().trim(),
        description: z.string().trim(),
        user_id: z.string().trim().uuid(),
        type: z.nativeEnum(prismaClient.NotificationType),
    })
    .strict();

const pageAndLimitSchema = z.object({
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
});

type createAdminNotificationType = z.infer<
    typeof createAdminNotificationSchema
>;
type updateAdminNotificationType = z.infer<
    typeof updateAdminNotificationSchema
>;
type getAdminNotificationsType = z.infer<typeof getAdminNotificationsSchema>;
type adminNotificationIDType = z.infer<typeof adminNotificationIDSchema>;
type addPriceAlertType = z.infer<typeof addPriceAlertSchema>;
type getNotificationsType = z.infer<typeof getNotificationsSchema>;
type createNotificationType = z.infer<typeof createNotificationSchema>;

export {
    createAdminNotificationSchema,
    updateAdminNotificationSchema,
    getAdminNotificationsSchema,
    adminNotificationIDSchema,
    addPriceAlertSchema,
    priceAlertIDSchema,
    getNotificationsSchema,
    createNotificationSchema,
    pageAndLimitSchema,
};
export type {
    createAdminNotificationType,
    updateAdminNotificationType,
    getAdminNotificationsType,
    adminNotificationIDType,
    addPriceAlertType,
    getNotificationsType,
    createNotificationType,
};
