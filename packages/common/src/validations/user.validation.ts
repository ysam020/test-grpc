import { ChartType, Countries, errorMessage, utilFns } from '../index';
import z from 'zod';

const country = process.env.USER_COUNTRY! as unknown as Countries;

enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
}

const passwordRules = z
    .string()
    .trim()
    .min(6, { message: errorMessage.PASSWORD.LENGTH })
    .max(15, { message: errorMessage.PASSWORD.LENGTH })
    .regex(/\d/, { message: errorMessage.PASSWORD.NUMBER })
    .regex(/[A-Z]/, { message: errorMessage.PASSWORD.UPPERCASE })
    .regex(/[!#$%&()*+@^_{}]/, {
        message: errorMessage.PASSWORD.SPECIAL_CHAR,
    });
const UUIDSchema = z.object({ id: z.string().trim().uuid() });

const getUsersSchema = z.object({
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

const updateUserSchema = z.object({
    first_name: z.string().trim().optional(),
    last_name: z.string().trim().optional(),
    profile_pic: z.instanceof(Buffer).optional(),
    retailer_ids: z.array(z.string().trim().uuid()).optional(),
    birth_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, errorMessage.WIDGET.INVALID_DATE_FORMAT)
        .refine(
            (date) => {
                const today = new Date();
                const minDate = new Date(
                    today.getFullYear() - 12,
                    today.getMonth(),
                    today.getDate(),
                );

                return new Date(date) <= minDate;
            },
            { message: errorMessage.USER.MINIMUM_AGE },
        )
        .optional(),
    gender: z.nativeEnum(Gender).optional(),
    phone_number: z
        .string()
        .trim()
        .refine(
            (value) =>
                new RegExp(
                    utilFns.phoneRegNdFormatByCountry(country).regex,
                ).test(value),
            {
                message: errorMessage.USER.PHONE_FORMAT(
                    utilFns.phoneRegNdFormatByCountry(country).format,
                ),
            },
        )
        .optional(),
    address: z.string().trim().max(255).optional(),
    city: z.string().trim().max(50).optional(),
    postcode: z
        .string()
        .trim()
        .max(4)
        .transform((val) => parseInt(val))
        .optional(),
    no_of_adult: z
        .string()
        .trim()
        .transform((val) => parseInt(val))
        .optional(),
    no_of_child: z
        .string()
        .trim()
        .transform((val) => parseInt(val))
        .optional(),
});

const changePasswordSchema = z
    .object({
        current_password: z.string().trim(),
        new_password: passwordRules,
    })
    .refine((data) => data.new_password !== data.current_password, {
        message: errorMessage.PASSWORD.SAME_AS_CURRENT_PASSWORD,
        path: ['new_password'],
    });

const addToBasketSchema = z.object({
    product_id: z.string().trim().uuid(),
    quantity: z.number().int().gt(0).optional(),
});

const removeFromBasketSchema = z.object({
    master_product_id: z.string().trim().uuid(),
});

const acceptDeviceTokenSchema = z.object({
    device_token: z.string().trim(),
});

const getUserEngagementSchema = z
    .object({
        type: z.nativeEnum(ChartType),
    })
    .strict();

const viewBasketSchema = z.object({
    page: z
        .string()
        .refine((value) => {
            const parsed = parseInt(value);
            return !isNaN(parsed) && Number.isInteger(parsed);
        })
        .transform((value) => Math.trunc(parseInt(value))),
    limit: z
        .string()
        .refine((value) => {
            const parsed = parseInt(value);
            return !isNaN(parsed) && Number.isInteger(parsed);
        })
        .transform((value) => Math.trunc(parseInt(value))),
    retailer_id: z.string().trim().uuid().optional(),
});

type updateUserType = z.infer<typeof updateUserSchema>;
type changePasswordType = z.infer<typeof changePasswordSchema>;
type addToBasketType = z.infer<typeof addToBasketSchema>;
type removeFromBasketType = z.infer<typeof removeFromBasketSchema>;
type acceptDeviceTokenType = z.infer<typeof acceptDeviceTokenSchema>;

export {
    UUIDSchema,
    getUsersSchema,
    updateUserSchema,
    changePasswordSchema,
    addToBasketSchema,
    removeFromBasketSchema,
    acceptDeviceTokenSchema,
    getUserEngagementSchema,
    viewBasketSchema,
};
export type {
    updateUserType,
    changePasswordType,
    addToBasketType,
    removeFromBasketType,
    acceptDeviceTokenType,
};
