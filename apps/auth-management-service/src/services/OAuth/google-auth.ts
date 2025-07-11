import { OAuth2Client, TokenPayload } from 'google-auth-library';

import { AuthProviderEnum, OauthPayload, utilFns } from '@atc/common';
import { logger } from '@atc/logger';

const authorizeGoogle = async (googleToken: string): Promise<OauthPayload> => {
    try {
        const google = new OAuth2Client({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        });

        const ticket = await google.verifyIdToken({
            idToken: googleToken,
        });

        const { email, name, picture } = ticket.getPayload() as TokenPayload;

        const { first_name, last_name } = utilFns.splitName(name!);

        return {
            email: email!,
            first_name: first_name,
            last_name: last_name,
            auth: AuthProviderEnum.GOOGLE,
            picture,
        };
    } catch (error: any | Error) {
        logger.error(error.message);
        throw error;
    }
};

export { authorizeGoogle };
