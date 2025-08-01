import { sign, SignOptions, verify } from 'jsonwebtoken';

const generateToken = (payload: any, secret: string, options?: SignOptions) => {
    return sign(payload, secret, options);
};

const verifyToken = (token: string, secret: string) => {
    return verify(token, secret);
};

export { generateToken, verifyToken };
