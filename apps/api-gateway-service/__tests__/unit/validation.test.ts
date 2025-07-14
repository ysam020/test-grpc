import { z } from 'zod';

describe('Validation Logic Unit Tests', () => {
    describe('Schema Validation', () => {
        it('should validate email schema correctly', () => {
            const emailSchema = z.string().email();

            expect(() => emailSchema.parse('test@example.com')).not.toThrow();
            expect(() => emailSchema.parse('invalid-email')).toThrow();
        });

        it('should validate password schema correctly', () => {
            const passwordSchema = z.string().min(6);

            expect(() => passwordSchema.parse('password123')).not.toThrow();
            expect(() => passwordSchema.parse('123')).toThrow();
        });

        it('should validate UUID schema correctly', () => {
            const uuidSchema = z.string().uuid();

            expect(() =>
                uuidSchema.parse('550e8400-e29b-41d4-a716-446655440000'),
            ).not.toThrow();
            expect(() => uuidSchema.parse('invalid-uuid')).toThrow();
        });
    });

    describe('Request Data Transformation', () => {
        it('should transform user registration data correctly', () => {
            const userRegisterSchema = z.object({
                email: z.string().email(),
                password: z.string().min(6),
                first_name: z.string(),
                last_name: z.string(),
            });

            const input = {
                email: 'test@example.com',
                password: 'password123',
                first_name: 'John',
                last_name: 'Doe',
            };

            const result = userRegisterSchema.parse(input);
            expect(result).toEqual(input);
        });

        it('should transform pagination parameters correctly', () => {
            const paginationSchema = z.object({
                page: z
                    .string()
                    .transform((val) => parseInt(val))
                    .optional(),
                limit: z
                    .string()
                    .transform((val) => parseInt(val))
                    .optional(),
            });

            const input = { page: '1', limit: '10' };
            const result = paginationSchema.parse(input);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });
    });
});
