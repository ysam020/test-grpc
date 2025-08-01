export enum AuthProviderEnum {
    INTERNAL = 'internal',
    GOOGLE = 'google',
    META = 'meta',
    APPLE = 'apple',
}

export interface OauthPayload {
    email: string;
    first_name?: string;
    last_name?: string;
    picture?: string;
    auth: AuthProviderEnum;
}
