import {
    adminNotificationIDSchema,
    createNotificationSchema,
    addPriceAlertSchema,
} from '../../../src/validations';

jest.mock('@atc/common', () => ({
    errorMessage: {
        ADMIN_NOTIFICATION: {
            NO_TITLE: 'Title is required',
            NO_DESCRIPTION: 'Description is required',
            NO_CHANNEL_SELECTED: 'At least one channel must be selected',
            NO_STATE_SELECTED: 'At least one state must be selected',
            NO_AGE_GROUP_SELECTED: 'At least one age group must be selected',
        },
        WIDGET: {
            DEPLOY_DATE_PAST: 'Schedule date cannot be in the past',
        },
        NOTIFICATION: {
            NO_TITLE: 'Title is required',
            NO_DESCRIPTION: 'Description is required',
            NO_USER_ID: 'User ID is required',
            NO_TYPE: 'Type is required',
        },
        PRICE_ALERT: {
            NO_PRODUCT_ID: 'Product ID is required',
            NO_TARGET_PRICE: 'Target price is required',
        },
    },
    NotificationChannelEnum: {
        EMAIL: 'EMAIL',
        PUSH: 'PUSH',
        SMS: 'SMS',
    },
    StateEnum: {
        ALL: 'ALL',
        DELHI: 'DELHI',
        MUMBAI: 'MUMBAI',
    },
    AgeEnum: {
        ALL: 'ALL',
        YOUNG: 'YOUNG',
        ADULT: 'ADULT',
    },
    GenderEnum: {
        BOTH: 'BOTH',
        MALE: 'MALE',
        FEMALE: 'FEMALE',
    },
    SelectionOptionEnum: {
        ALL: 'ALL',
        YES: 'YES',
        NO: 'NO',
    },
    NotificationTypeEnum: {
        REGISTRATION: 'REGISTRATION',
        PRICE_ALERT: 'PRICE_ALERT',
    },
}));

describe('Validation Schemas', () => {
    describe('adminNotificationIDSchema', () => {
        it('should validate valid UUID', () => {
            const validData = {
                admin_notification_id: '123e4567-e89b-12d3-a456-426614174000',
            };

            const result = adminNotificationIDSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid UUID', () => {
            const invalidData = {
                admin_notification_id: 'invalid-uuid',
            };

            const result = adminNotificationIDSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('createNotificationSchema', () => {
        it('should validate valid notification data', () => {
            const validData = {
                title: 'Test Notification',
                description: 'Test Description',
                user_id: '123e4567-e89b-12d3-a456-426614174000',
                type: 'REGISTRATION',
            };

            const result = createNotificationSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject missing required fields', () => {
            const invalidData = {
                title: 'Test Notification',
                // missing description, user_id, type
            };

            const result = createNotificationSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('addPriceAlertSchema', () => {
        it('should validate valid price alert data', () => {
            const validData = {
                product_id: '123e4567-e89b-12d3-a456-426614174000',
                target_price: 100.5,
            };

            const result = addPriceAlertSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid product ID', () => {
            const invalidData = {
                product_id: 'invalid-uuid',
                target_price: 100.5,
            };

            const result = addPriceAlertSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject negative target price', () => {
            const invalidData = {
                product_id: '123e4567-e89b-12d3-a456-426614174000',
                target_price: -10,
            };

            const result = addPriceAlertSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
