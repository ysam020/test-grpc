// apps/notification-management-service/__tests__/unit/services/model.service.test.ts
import { addAdminNotification, getAdminNotificationByID, updateAdminNotificationByID } from '../../../src/services/model.service';

jest.mock('@atc/db', () => ({
    prismaClient: {
        adminNotification: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        priceAlert: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    masterProduct: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
};

// apps/notification-management-service/__tests__/__mocks__/common.ts
export const mockCommon = {
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
    errorMessage: {
        ADMIN_NOTIFICATION: {
            NOT_FOUND: 'Admin notification not found',
            NO_FAILED_NOTIFICATIONS: 'No failed notifications found',
            NO_TITLE: 'Title is required',
            NO_DESCRIPTION: 'Description is required',
            NO_CHANNEL_SELECTED: 'At least one channel must be selected',
            NO_STATE_SELECTED: 'At least one state must be selected',
            NO_AGE_GROUP_SELECTED: 'At least one age group must be selected',
            INCOMPLETE_SCHEDULE_FIELDS: 'All schedule fields are required',
        },
        NOTIFICATION: {
            NOT_FOUND: 'Notification not found',
            NO_TITLE: 'Title is required',
            NO_DESCRIPTION: 'Description is required',
            NO_USER_ID: 'User ID is required',
            NO_TYPE: 'Type is required',
        },
        PRICE_ALERT: {
            NOT_FOUND: 'Price alert not found',
            NO_PRODUCT_ID: 'Product ID is required',
            NO_TARGET_PRICE: 'Target price is required',
        },
        PRODUCT: {
            NOT_FOUND: 'Product not found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
        WIDGET: {
            DEPLOY_DATE_PAST: 'Schedule date cannot be in the past',
        },
    },
    responseMessage: {
        ADMIN_NOTIFICATION: {
            CREATED: 'Admin notification created successfully',
            UPDATED: 'Admin notification updated successfully',
            DELETED: 'Admin notification deleted successfully',
            RETRY_SUCCESS: 'Notifications retried successfully',
        },
        NOTIFICATION: {
            CREATED: 'Notification created successfully',
            UPDATED: 'Notification updated successfully',
            DELETED: 'Notification deleted successfully',
        },
        PRICE_ALERT: {
            ADDED: 'Price alert added successfully',
            UPDATED: 'Price alert updated successfully',
            DELETED: 'Price alert deleted successfully',
        },
    },
    eventBridge: {
        createEventBridgeSchedule: jest.fn(),
        deleteEventBridgeSchedule: jest.fn(),
    },
    snsHelper: {
        createTopic: jest.fn(),
        publishMessage: jest.fn(),
    },
    sendEmail: jest.fn(),
    tokenFns: {
        generateToken: jest.fn(),
        verifyToken: jest.fn(),
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
        PROMOTION: 'PROMOTION',
    },
    UserRoleEnum: {
        ADMIN: 'ADMIN',
        USER: 'USER',
    },
};

// Additional handler tests

// apps/notification-management-service/__tests__/unit/handlers/updateAdminNotification.test.ts
import { status } from '@grpc/grpc-js';
import { updateAdminNotification } from '../../../src/handlers/updateAdminNotification';
import { getAdminNotificationByID, updateAdminNotificationByID } from '../../../src/services/model.service';

jest.mock('../../../src/services/model.service');
jest.mock('@atc/common', () => ({
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
    errorMessage: {
        ADMIN_NOTIFICATION: {
            NOT_FOUND: 'Admin notification not found',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        ADMIN_NOTIFICATION: {
            UPDATED: 'Admin notification updated successfully',
        },
    },
    eventBridge: {
        createEventBridgeSchedule: jest.fn(),
        deleteEventBridgeSchedule: jest.fn(),
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

const { utilFns, eventBridge } = require('@atc/common');

describe('updateAdminNotification Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        mockCall = {
            request: {
                admin_notification_id: 'test-id',
                title: 'Updated Title',
                description: 'Updated Description',
            },
        };
    });

    it('should update admin notification successfully', async () => {
        const mockExistingNotification = {
            id: 'test-id',
            title: 'Old Title',
            description: 'Old Description',
            status: 'SCHEDULED',
        };

        const mockUpdatedNotification = {
            id: 'test-id',
            title: 'Updated Title',
            description: 'Updated Description',
            scheduled_at: new Date(),
            channels: ['EMAIL'],
            target_users: {},
            status: 'SCHEDULED',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getAdminNotificationByID as jest.Mock).mockResolvedValue(mockExistingNotification);
        (updateAdminNotificationByID as jest.Mock).mockResolvedValue(mockUpdatedNotification);

        await updateAdminNotification(mockCall, mockCallback);

        expect(getAdminNotificationByID).toHaveBeenCalledWith('test-id');
        expect(updateAdminNotificationByID).toHaveBeenCalledWith('test-id', {
            title: 'Updated Title',
            description: 'Updated Description',
        });

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Admin notification updated successfully',
            status: status.OK,
            data: expect.objectContaining({
                admin_notification_id: 'test-id',
                title: 'Updated Title',
                description: 'Updated Description',
            }),
        });
    });

    it('should return NOT_FOUND when notification does not exist', async () => {
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (getAdminNotificationByID as jest.Mock).mockResolvedValue(null);

        await updateAdminNotification(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Admin notification not found',
            status: status.NOT_FOUND,
            data: null,
        });
    });

    it('should handle schedule updates with EventBridge', async () => {
        const mockCallWithSchedule = {
            request: {
                admin_notification_id: 'test-id',
                title: 'Updated Title',
                schedule_date: '2025-12-31',
                schedule_hour: 15,
                schedule_minute: 30,
            },
        };

        const mockExistingNotification = {
            id: 'test-id',
            title: 'Old Title',
            status: 'SCHEDULED',
        };

        const mockUpdatedNotification = {
            id: 'test-id',
            title: 'Updated Title',
            scheduled_at: new Date('2025-12-31T15:30:00Z'),
            channels: ['EMAIL'],
            target_users: {},
            status: 'SCHEDULED',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        utilFns.removeEmptyFields.mockReturnValue(mockCallWithSchedule.request);
        (getAdminNotificationByID as jest.Mock).mockResolvedValue(mockExistingNotification);
        (updateAdminNotificationByID as jest.Mock).mockResolvedValue(mockUpdatedNotification);
        eventBridge.deleteEventBridgeSchedule.mockResolvedValue(true);
        eventBridge.createEventBridgeSchedule.mockResolvedValue(true);

        process.env.ADMIN_NOTIFICATION_ARN = 'test-arn';

        await updateAdminNotification(mockCallWithSchedule, mockCallback);

        expect(eventBridge.deleteEventBridgeSchedule).toHaveBeenCalledWith(`admin-notification-test-id`);
        expect(eventBridge.createEventBridgeSchedule).toHaveBeenCalledWith({
            scheduleName: 'admin-notification-test-id',
            scheduleDate: expect.any(Date),
            targetArn: 'test-arn',
            inputPayload: { adminNotificationID: 'test-id' },
        });
    });
});