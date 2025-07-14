describe('Utility Functions Unit Tests', () => {
    describe('Data Transformation Utils', () => {
        it('should transform request data correctly', () => {
            const transformUserData = (userData: any) => ({
                ...userData,
                email: userData.email?.toLowerCase(),
                created_at: new Date().toISOString(),
            });

            const input = { email: 'TEST@EXAMPLE.COM', name: 'John' };
            const transformed = transformUserData(input);

            expect(transformed.email).toBe('test@example.com');
            expect(transformed.name).toBe('John');
            expect(transformed.created_at).toBeDefined();
        });

        it('should format response data correctly', () => {
            const formatResponse = (data: any, status: number = 200) => ({
                success: status < 400,
                status,
                data,
                timestamp: new Date().toISOString(),
            });

            const successResponse = formatResponse(
                { id: 1, name: 'Test' },
                200,
            );
            const errorResponse = formatResponse({ error: 'Not found' }, 404);

            expect(successResponse.success).toBe(true);
            expect(errorResponse.success).toBe(false);
            expect(successResponse.status).toBe(200);
            expect(errorResponse.status).toBe(404);
        });
    });

    describe('Validation Utils', () => {
        it('should validate email format', () => {
            const isValidEmail = (email: string): boolean => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            };

            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('invalid-email')).toBe(false);
            expect(isValidEmail('test@')).toBe(false);
            expect(isValidEmail('@example.com')).toBe(false);
        });

        it('should validate UUID format', () => {
            const isValidUUID = (uuid: string): boolean => {
                const uuidRegex =
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                return uuidRegex.test(uuid);
            };

            expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(
                true,
            );
            expect(isValidUUID('invalid-uuid')).toBe(false);
            expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
        });
    });
});
