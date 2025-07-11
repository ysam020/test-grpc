import { hash, compare } from 'bcrypt';

const hashValue = async (value: string, salt = 10) => {
    return hash(value, salt);
};

const compareHash = async (value: string, hash: string) => {
    return compare(value, hash);
};

export { hashValue, compareHash };
