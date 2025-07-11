import { Router } from 'express';

import { authValidation } from '@atc/common';
import {
    forgotPassword,
    login,
    refreshToken,
    oauthRegister,
    register,
    resendEmail,
    resetPassword,
    verifyEmail,
} from '../controllers/auth.controller';
import { validateData } from '../middlewares/validation.middleware';

const authRouter = Router();

authRouter.post(
    '/register',
    validateData(authValidation.registerSchema),
    register,
);

authRouter.post(
    '/verify-email',
    validateData(authValidation.verifyUserSchema),
    verifyEmail,
);

authRouter.post(
    '/resend-email',
    validateData(authValidation.emailSchema),
    resendEmail,
);

authRouter.post(
    '/login/:role',
    validateData(
        authValidation.loginSchema,
        undefined,
        authValidation.roleSchema,
    ),
    login,
);

authRouter.post(
    '/forgot-password',
    validateData(authValidation.emailSchema),
    forgotPassword,
);

authRouter.post(
    '/reset-password',
    validateData(authValidation.resetPasswordSchema),
    resetPassword,
);

authRouter.post(
    '/refresh-token',
    validateData(authValidation.refreshTokenSchema),
    refreshToken,
);
authRouter.post(
    '/oauth-register',
    validateData(authValidation.oauthRegisterSchema),
    oauthRegister,
);

export { authRouter };
