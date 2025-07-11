import * as grpc from '@grpc/grpc-js';
import { randomInt } from 'node:crypto';
import { Countries, PhoneNumberFormat } from './types';
import { prismaClient } from '@atc/db';
import { ProductMatch } from './types/catalogue';

const generateRandomNumber = (min: number, max: number) => {
    return randomInt(min, max);
};

function removeEmptyFields(data: any): { [key: string]: any } {
    return Object.fromEntries(
        Object.entries(data).filter(([_, value]) => {
            if (Buffer.isBuffer(value)) {
                return value.length > 0;
            }

            return value !== null && value !== '';
        }),
    );
}

const createMetadata = (
    key: string,
    value: grpc.MetadataValue,
): grpc.Metadata => {
    const metadata = new grpc.Metadata();
    if (key && value) {
        metadata.add(key, value);
    }
    return metadata;
};

const cleanObject = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj
            .map(cleanObject)
            .filter((item) => Object.keys(item).length > 0);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj)
            .filter((key) => {
                const value = obj[key];
                return (
                    !(Array.isArray(value) && value.length === 0) &&
                    !(typeof value === 'string' && value.trim() === '')
                );
            })
            .reduce(
                (acc: Record<string, any>, key) => {
                    acc[key] = cleanObject(obj[key]);
                    return acc;
                },
                {} as Record<string, any>,
            );
    }
    return obj;
};

function splitName(name: string): {
    first_name: string | undefined;
    last_name: string | undefined;
} {
    const nameParts = name.trim().split(' ');

    if (nameParts.length === 1) {
        return { first_name: nameParts[0], last_name: '' };
    }

    const first_name = nameParts[0];
    const last_name = nameParts[1];

    return { first_name, last_name };
}

function calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

const phoneRegNdFormatByCountry = (country: Countries): PhoneNumberFormat => {
    switch (country) {
        case 'IN':
            return {
                regex: /^\+91\s?[789]\d{9}$/,
                format: '+91XXXXXXXXXX',
            };
        case 'AU':
            return {
                regex: /^\+61( ?-?\d){8,10}$/,
                format: '+61XXXXXXXXX',
            };
        default:
            return {
                regex: /^\+91\s?[789]\d{9}$/,
                format: '+91XXXXXXXXXX',
            };
    }
};

interface FieldMapping {
    [key: string]: string;
}

const fieldMapping: FieldMapping = {
    start_date: 'startDate',
    end_date: 'endDate',
    target_audience: 'targetAudience',
    multi_select: 'multiSelect',
    has_children: 'hasChildren',
    with_email_saved: 'withEmailSaved',
    total_answered: 'totalAnswered',
    total_duration: 'totalDuration',
    days_since_start: 'daysSinceStart',
    total_users: 'totalUsers',
    total_count: 'totalCount',
};

function convertSnakeToCamel(obj: { [key: string]: any }): {
    [key: string]: any;
} {
    const newObj: { [key: string]: any } = {};

    for (const key in obj) {
        newObj[fieldMapping[key] || key] = obj[key];
    }

    return newObj;
}

function convertCamelToSnake(obj: { [key: string]: any }): {
    [key: string]: any;
} {
    const newObj: { [key: string]: any } = {};

    const reversedFieldMapping = Object.fromEntries(
        Object.entries(fieldMapping).map(([k, v]) => [v, k]),
    );

    for (const key in obj) {
        if (reversedFieldMapping[key]) {
            newObj[reversedFieldMapping[key]] = obj[key];
        } else if (Array.isArray(obj[key])) {
            newObj[key] = obj[key].map((item: any) =>
                typeof item === 'object' ? convertCamelToSnake(item) : item,
            );
        } else if (typeof obj[key] === 'object') {
            newObj[key] = convertCamelToSnake(obj[key]);
        } else {
            newObj[key] = obj[key];
        }
    }

    return newObj;
}

function mapElectorateRatingToRegion(electorateRating: string) {
    switch (electorateRating.toLowerCase()) {
        case 'inner metropolitan':
        case 'outer metropolitan':
            return prismaClient.Region.METRO;

        case 'provincial':
            return prismaClient.Region.URBAN;

        case 'rural':
            return prismaClient.Region.RURAL;
    }
}

function getProductMatchStatus(match_percentage: number): ProductMatch {
    if (match_percentage === 0) {
        return ProductMatch.NOT_MATCHED;
    }

    if (match_percentage === 100) {
        return ProductMatch.MATCHED;
    }

    return ProductMatch.IN_PROGRESS;
}

export {
    generateRandomNumber,
    removeEmptyFields,
    createMetadata,
    cleanObject,
    splitName,
    calculateAge,
    phoneRegNdFormatByCountry,
    convertSnakeToCamel,
    convertCamelToSnake,
    mapElectorateRatingToRegion,
    getProductMatchStatus,
};
