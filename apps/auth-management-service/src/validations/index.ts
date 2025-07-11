import { AuthProviderEnum, errorMessage, UserRoleEnum } from '@atc/common';
import { z } from 'zod';

const passwordRules = z.string().trim();
// .min(6, { message: errorMessage.PASSWORD.LENGTH })
// .max(15, { message: errorMessage.PASSWORD.LENGTH })
// .regex(/\d/, { message: errorMessage.PASSWORD.NUMBER })
// .regex(/[A-Z]/, { message: errorMessage.PASSWORD.UPPERCASE })
// .regex(/[!#$%&()*+@^_{}]/, {
//     message: errorMessage.PASSWORD.SPECIAL_CHAR,
// })
const registerSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: passwordRules,
});

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(6).max(15),
    role: z.nativeEnum(UserRoleEnum),
});

const verifyUserSchema = z.object({
    otp: z.number().int(),
    token: z.string(),
});

const emailSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
});

const resetPasswordSchema = z.object({
    password: passwordRules,
    token: z.string(),
    otp: z.number().int(),
});

const refreshTokenSchema = z.object({
    refresh_token: z.string(),
});

const oauthRegisterSchema = z.object({
    token: z.string(),
    authProvider: z.nativeEnum(AuthProviderEnum),
    userId: z.string().optional(),
    fcmToken: z.string().optional(),
});

export {
    registerSchema,
    loginSchema,
    verifyUserSchema,
    emailSchema,
    resetPasswordSchema,
    refreshTokenSchema,
    oauthRegisterSchema,
};
