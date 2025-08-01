import appleSignin from 'apple-signin-auth';

import { logger } from '@atc/logger';
import { AuthProviderEnum } from '@atc/common';

const authorizeApple = async (token: string) => {
    try {
        const ticket = await appleSignin.verifyIdToken(token);
        return {
            email: ticket.email,
            auth: AuthProviderEnum.APPLE,
        };
    } catch (error: any | Error) {
        logger.error(error.message);
        throw error;
    }
};

export { authorizeApple };
