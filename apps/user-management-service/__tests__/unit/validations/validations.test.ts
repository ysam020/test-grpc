// Mock dependencies BEFORE importing the validation schemas
jest.mock('@atc/common', () => ({
    constants: {
        MIME_TYPE_REGEX: /^(image\/(jpeg|jpg|png|gif|webp)|application\/pdf)$/,
    },
    Countries: {
        AU: 'AU',
        US: 'US',
        UK: 'UK',
    },
    errorMessage: {
        PASSWORD: {
            LENGTH: 'Password must be between 6 and 15 characters',
            NUMBER: 'Password must contain at least one number',
            UPPERCASE: 'Password must contain at least one uppercase letter',
            SPECIAL_CHAR: 'Password must contain at least one special character',
            SAME_AS_CURRENT_PASSWORD: 'New password cannot be the same as current password',
        },
        WIDGET: {
            INVALID_DATE_FORMAT: 'Invalid date format. Use YYYY-MM-DD',
        },
        USER: {
            MINIMUM_AGE: 'User must be at least 12 years old',
            PHONE_FORMAT: (format: string) => `Phone number must match format: ${format}`,
        },
        OTHER: {
            INVALID_MIME_TYPE: 'Invalid file type. Only images and PDFs are allowed',
        },
    },
    utilFns: {
        phoneRegNdFormatByCountry: jest.fn(() => ({
            regex: '^\\+61[0-9]{9}$',
            format: '+61XXXXXXXXX',
        })),
    },
}));

// Mock environment variable before importing
process.env.USER_COUNTRY = 'AU';

// Now import the schemas after mocks are set up
import { constants, Countries, errorMessage, utilFns } from '@atc/common';
import {
    UUIDSchema,
    pageAndLimitSchema,
    updateUserSchema,
    changePasswordSchema,
    addToBasketSchema,
    removeFromBasketSchema,
    acceptDeviceTokenSchema,
    viewBasketSchema,
} from '../../../src/validations';

// Mock environment variable
const originalEnv = process.env;
beforeAll(() => {
    process.env.USER_COUNTRY = 'AU';
});

afterAll(() => {
    process.env = originalEnv;
});

const mockUtilFns = utilFns as jest.Mocked<typeof utilFns>;

describe('User Management Service Validations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Default mock for phone validation
        mockUtilFns.phoneRegNdFormatByCountry.mockReturnValue({
            regex: '^\\+61[0-9]{9}$',
            format: '+61XXXXXXXXX',
        });
    });

    describe('UUIDSchema', () => {
        it('should validate valid UUID', () => {
            const validData = { id: '123e4567-e89b-12d3-a456-426614174000' };
            
            const result = UUIDSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject invalid UUID format', () => {
            const invalidData = { id: 'invalid-uuid' };
            
            const result = UUIDSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should trim whitespace from UUID', () => {
            const dataWithWhitespace = { id: '  123e4567-e89b-12d3-a456-426614174000  ' };
            
            const result = UUIDSchema.safeParse(dataWithWhitespace);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe('123e4567-e89b-12d3-a456-426614174000');
            }
        });
    });

    describe('pageAndLimitSchema', () => {
        it('should validate valid page and limit', () => {
            const validData = { page: 2, limit: 20 };
            
            const result = pageAndLimitSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should apply default values when not provided', () => {
            const emptyData = {};
            
            const result = pageAndLimitSchema.safeParse(emptyData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ page: 1, limit: 10 });
            }
        });

        it('should reject decimal numbers', () => {
            const dataWithDecimals = { page: 2.7, limit: 15.9 };
            
            const result = pageAndLimitSchema.safeParse(dataWithDecimals);
            expect(result.success).toBe(false);
        });

        it('should reject zero or negative values', () => {
            const invalidPageData = { page: 0, limit: 10 };
            expect(pageAndLimitSchema.safeParse(invalidPageData).success).toBe(false);

            const invalidLimitData = { page: 1, limit: -5 };
            expect(pageAndLimitSchema.safeParse(invalidLimitData).success).toBe(false);
        });
    });

    describe('updateUserSchema', () => {
        const validBaseData = {
            id: '123e4567-e89b-12d3-a456-426614174000',
        };

        it('should validate with only required id field', () => {
            const result = updateUserSchema.safeParse(validBaseData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(validBaseData.id);
            }
        });

        it('should reject missing id', () => {
            const invalidData = {};
            
            const result = updateUserSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should validate optional string fields', () => {
            const validData = {
                ...validBaseData,
                first_name: 'John',
                last_name: 'Doe',
                address: '123 Main St',
                city: 'Sydney',
            };
            
            const result = updateUserSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.first_name).toBe('John');
                expect(result.data.last_name).toBe('Doe');
            }
        });

        it('should trim whitespace from string fields', () => {
            const dataWithWhitespace = {
                ...validBaseData,
                first_name: '  John  ',
                last_name: '  Doe  ',
            };
            
            const result = updateUserSchema.safeParse(dataWithWhitespace);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.first_name).toBe('John');
                expect(result.data.last_name).toBe('Doe');
            }
        });

        it('should validate birth_date and transform to Date', () => {
            const validData = { ...validBaseData, birth_date: '2000-01-15' };
            
            const result = updateUserSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.birth_date).toBeInstanceOf(Date);
            }
        });

        it('should reject birth_date less than 12 years ago', () => {
            const recentDate = new Date();
            recentDate.setFullYear(recentDate.getFullYear() - 10);
            const invalidData = { 
                ...validBaseData, 
                birth_date: recentDate.toISOString().split('T')[0] 
            };
            
            const result = updateUserSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should validate gender enum', () => {
            const maleData = { ...validBaseData, gender: 'MALE' };
            const femaleData = { ...validBaseData, gender: 'FEMALE' };
            
            const maleResult = updateUserSchema.safeParse(maleData);
            expect(maleResult.success).toBe(true);
            if (maleResult.success) {
                expect(maleResult.data.gender).toBe('MALE');
            }

            const femaleResult = updateUserSchema.safeParse(femaleData);
            expect(femaleResult.success).toBe(true);
            if (femaleResult.success) {
                expect(femaleResult.data.gender).toBe('FEMALE');
            }

            const invalidData = { ...validBaseData, gender: 'OTHER' };
            expect(updateUserSchema.safeParse(invalidData).success).toBe(false);
        });

        it('should validate phone number', () => {
            const validData = { ...validBaseData, phone_number: '+61123456789' };
            
            const result = updateUserSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone_number).toBe('+61123456789');
            }
        });

        it('should validate numeric fields with max limits', () => {
            const validData = {
                ...validBaseData,
                postcode: 9999,
                no_of_adult: 100,
                no_of_child: 100,
            };
            
            const result = updateUserSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.postcode).toBe(9999);
                expect(result.data.no_of_adult).toBe(100);
                expect(result.data.no_of_child).toBe(100);
            }
        });

        it('should reject numeric fields exceeding limits', () => {
            const invalidPostcodeData = { ...validBaseData, postcode: 10000 };
            expect(updateUserSchema.safeParse(invalidPostcodeData).success).toBe(false);

            const invalidAdultData = { ...validBaseData, no_of_adult: 101 };
            expect(updateUserSchema.safeParse(invalidAdultData).success).toBe(false);

            const invalidChildData = { ...validBaseData, no_of_child: 101 };
            expect(updateUserSchema.safeParse(invalidChildData).success).toBe(false);
        });

        it('should validate MIME types', () => {
            const validMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            
            validMimeTypes.forEach(mimeType => {
                const validData = { ...validBaseData, mime_type: mimeType };
                const result = updateUserSchema.safeParse(validData);
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.mime_type).toBe(mimeType);
                }
            });
        });

        it('should reject invalid MIME types', () => {
            const invalidMimeTypes = ['text/plain', 'video/mp4'];
            
            invalidMimeTypes.forEach(mimeType => {
                const invalidData = { ...validBaseData, mime_type: mimeType };
                const result = updateUserSchema.safeParse(invalidData);
                expect(result.success).toBe(false);
            });
        });
    });

    describe('changePasswordSchema', () => {
        const validBaseData = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            current_password: 'OldPass123!',
            new_password: 'NewPass456#',
        };

        it('should validate valid password change', () => {
            const result = changePasswordSchema.safeParse(validBaseData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validBaseData);
            }
        });

        it('should enforce password length requirements', () => {
            const tooShortData = {
                ...validBaseData,
                new_password: 'A1!', // Too short
            };
            expect(changePasswordSchema.safeParse(tooShortData).success).toBe(false);

            const tooLongData = {
                ...validBaseData,
                new_password: 'VeryLongPassword123!', // Too long
            };
            expect(changePasswordSchema.safeParse(tooLongData).success).toBe(false);
        });

        it('should require uppercase letter', () => {
            const invalidData = {
                ...validBaseData,
                new_password: 'password123!', // No uppercase
            };
            
            const result = changePasswordSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should require number', () => {
            const invalidData = {
                ...validBaseData,
                new_password: 'Password!', // No number
            };
            
            const result = changePasswordSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should require special character', () => {
            const invalidData = {
                ...validBaseData,
                new_password: 'Password123', // No special char
            };
            
            const result = changePasswordSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject same current and new password', () => {
            const invalidData = {
                ...validBaseData,
                current_password: 'SamePass123!',
                new_password: 'SamePass123!',
            };
            
            const result = changePasswordSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should validate all required special characters', () => {
            const specialChars = ['!', '#', '$', '%', '&', '(', ')', '*', '+', '@', '^', '_', '{', '}'];
            
            specialChars.forEach(char => {
                const validData = {
                    ...validBaseData,
                    new_password: `Pass1${char}`,
                };
                const result = changePasswordSchema.safeParse(validData);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('addToBasketSchema', () => {
        const validData = {
            product_id: '123e4567-e89b-12d3-a456-426614174000',
            quantity: 2,
        };

        it('should validate valid input', () => {
            const result = addToBasketSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should validate without quantity (optional)', () => {
            const dataWithoutQuantity = { product_id: '123e4567-e89b-12d3-a456-426614174000' };
            
            const result = addToBasketSchema.safeParse(dataWithoutQuantity);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.product_id).toBe('123e4567-e89b-12d3-a456-426614174000');
                expect(result.data.quantity).toBeUndefined();
            }
        });

        it('should reject invalid product_id', () => {
            const invalidData = { 
                ...validData, 
                product_id: 'invalid-uuid' 
            };
            
            const result = addToBasketSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject zero or negative quantity', () => {
            const zeroQuantityData = { ...validData, quantity: 0 };
            expect(addToBasketSchema.safeParse(zeroQuantityData).success).toBe(false);

            const negativeQuantityData = { ...validData, quantity: -1 };
            expect(addToBasketSchema.safeParse(negativeQuantityData).success).toBe(false);
        });
    });

    describe('removeFromBasketSchema', () => {
        it('should validate valid input', () => {
            const validData = { master_product_id: '123e4567-e89b-12d3-a456-426614174000' };
            
            const result = removeFromBasketSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should reject invalid master_product_id', () => {
            const invalidData = { 
                master_product_id: 'invalid-uuid' 
            };
            
            const result = removeFromBasketSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should trim master_product_id', () => {
            const dataWithWhitespace = { master_product_id: '  123e4567-e89b-12d3-a456-426614174000  ' };
            
            const result = removeFromBasketSchema.safeParse(dataWithWhitespace);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.master_product_id).toBe('123e4567-e89b-12d3-a456-426614174000');
            }
        });
    });

    describe('acceptDeviceTokenSchema', () => {
        it('should validate valid device token', () => {
            const validData = { device_token: 'abc123def456ghi789' };
            
            const result = acceptDeviceTokenSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should trim device token', () => {
            const dataWithWhitespace = { device_token: '  abc123def456ghi789  ' };
            
            const result = acceptDeviceTokenSchema.safeParse(dataWithWhitespace);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.device_token).toBe('abc123def456ghi789');
            }
        });

        it('should allow empty device token', () => {
            const dataWithEmptyToken = { device_token: '' };
            
            const result = acceptDeviceTokenSchema.safeParse(dataWithEmptyToken);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.device_token).toBe('');
            }
        });
    });

    describe('viewBasketSchema', () => {
        it('should validate with all fields', () => {
            const validData = {
                page: 2,
                limit: 20,
                retailer_id: '123e4567-e89b-12d3-a456-426614174000',
            };
            
            const result = viewBasketSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should apply default page and limit', () => {
            const dataWithRetailer = { retailer_id: '123e4567-e89b-12d3-a456-426614174000' };
            
            const result = viewBasketSchema.safeParse(dataWithRetailer);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({
                    page: 1,
                    limit: 10,
                    retailer_id: '123e4567-e89b-12d3-a456-426614174000',
                });
            }
        });

        it('should validate without retailer_id', () => {
            const dataWithoutRetailer = { page: 3, limit: 15 };
            
            const result = viewBasketSchema.safeParse(dataWithoutRetailer);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({ page: 3, limit: 15 });
            }
        });

        it('should reject invalid retailer_id', () => {
            const invalidData = {
                page: 1,
                limit: 10,
                retailer_id: 'invalid-uuid',
            };
            
            const result = viewBasketSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('Phone validation integration', () => {
        it('should call phoneRegNdFormatByCountry with correct country', () => {
            const validData = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                phone_number: '+61123456789',
            };
            
            updateUserSchema.safeParse(validData);
            expect(mockUtilFns.phoneRegNdFormatByCountry).toHaveBeenCalledWith('AU');
        });

        it('should handle different country formats', () => {
            mockUtilFns.phoneRegNdFormatByCountry.mockReturnValue({
                regex: '^\\+1[0-9]{10}$',
                format: '+1XXXXXXXXXX',
            });

            const validData = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                phone_number: '+11234567890',
            };
            
            const result = updateUserSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone_number).toBe('+11234567890');
            }
        });
    });

    describe('Edge cases', () => {
        it('should handle null values gracefully', () => {
            const invalidData = { id: null };
            
            const result = UUIDSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should handle undefined optional fields', () => {
            const validData = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                first_name: undefined,
            };
            
            const result = updateUserSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.first_name).toBeUndefined();
            }
        });

        it('should handle empty strings', () => {
            const validData = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                first_name: '',
                last_name: '   ',
            };
            
            const result = updateUserSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.first_name).toBe('');
                expect(result.data.last_name).toBe('');
            }
        });

        it('should handle zero values correctly', () => {
            const validData = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                postcode: 0,
                no_of_adult: 0,
                no_of_child: 0,
            };
            
            const result = updateUserSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.postcode).toBe(0);
                expect(result.data.no_of_adult).toBe(0);
                expect(result.data.no_of_child).toBe(0);
            }
        });
    });
});