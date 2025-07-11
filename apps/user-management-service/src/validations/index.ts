import { constants, Countries, errorMessage, utilFns } from '@atc/common';
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

const pageAndLimitSchema = z.object({
    page: z
        .number()
        .int()
        .positive()
        .transform((value) => Math.trunc(value))
        .default(1),
    limit: z
        .number()
        .int()
        .positive()
        .transform((value) => Math.trunc(value))
        .default(10),
});

const updateUserSchema = z.object({
    id: z.string().trim().uuid(),
    first_name: z.string().trim().optional(),
    last_name: z.string().trim().optional(),
    profile_pic: z.instanceof(Buffer).optional(),
    retailer_ids: z.array(z.string().trim().uuid()).optional(),
    birth_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, errorMessage.WIDGET.INVALID_DATE_FORMAT)
        .transform((value) => new Date(value))
        .refine(
            (date) => {
                const today = new Date();
                const minDate = new Date(
                    today.getFullYear() - 12,
                    today.getMonth(),
                    today.getDate(),
                );

                return date <= minDate;
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
    postcode: z.number().max(9999).optional(),
    no_of_adult: z.number().max(100).optional(),
    no_of_child: z.number().max(100).optional(),
    mime_type: z
        .string()
        .regex(constants.MIME_TYPE_REGEX, errorMessage.OTHER.INVALID_MIME_TYPE)
        .optional(),
    content_length: z.number().optional(),
});

const changePasswordSchema = z
    .object({
        id: z.string().trim().uuid(),
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

const viewBasketSchema = pageAndLimitSchema.extend({
    retailer_id: z.string().trim().uuid().optional(),
});

type updateUserType = z.infer<typeof updateUserSchema>;
type changePasswordType = z.infer<typeof changePasswordSchema>;
type addToBasketType = z.infer<typeof addToBasketSchema>;
type removeFromBasketType = z.infer<typeof removeFromBasketSchema>;
type acceptDeviceTokenType = z.infer<typeof acceptDeviceTokenSchema>;
type viewBasketType = z.infer<typeof viewBasketSchema>;

export {
    UUIDSchema,
    pageAndLimitSchema,
    updateUserSchema,
    changePasswordSchema,
    addToBasketSchema,
    removeFromBasketSchema,
    acceptDeviceTokenSchema,
    viewBasketSchema,
};
export type {
    updateUserType,
    changePasswordType,
    addToBasketType,
    removeFromBasketType,
    acceptDeviceTokenType,
    viewBasketType,
};
