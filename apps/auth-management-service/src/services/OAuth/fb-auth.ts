import axios from 'axios';

import { AuthProviderEnum, utilFns } from '@atc/common';
import { logger } from '@atc/logger';

const authorizeFacebook = async (accessToken: string, userId: string) => {
    try {
        const { data } = await getUserByFacebookIdAndAccessToken(
            accessToken,
            userId,
        );

        const { email, name, picture } = data;

        const { first_name, last_name } = utilFns.splitName(name);

        return {
            email: email!,
            first_name: first_name,
            last_name: last_name,
            auth: AuthProviderEnum.META,
            picture: picture.data.url,
        };
    } catch (error: any | Error) {
        logger.error(error.message);
        throw error;
    }
};

const getUserByFacebookIdAndAccessToken = (
    accessToken: string,
    userId: string,
) => {
    // eslint-disable-next-line max-len
    const urlGraphFacebook = `https://graph.facebook.com/v2.11/${userId}?fields=id,name,email,picture&access_token=${accessToken}`;
    return axios.get(urlGraphFacebook);
};

export { authorizeFacebook };
