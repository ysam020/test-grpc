// apps/notification-management-service/__tests__/unit/handlers/createNotification.test.ts
import { status } from '@grpc/grpc-js';
import { createNotification } from '../../../src/handlers/createNotification';
import { addNewNotification } from '../../../src/services/model.service';

jest.mock('../../../src/services/model.service');
jest.mock('@atc/common', () => ({
    utilFns: {
        removeEmptyFields: jest.fn(),
    },
    errorMessage: {
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    responseMessage: {
        NOTIFICATION: {
            CREATED: 'Notification created successfully',
        },
    },
}));

jest.mock('@atc/logger', () => ({
    logger: {
        error: jest.fn(),
    },
}));

const { utilFns } = require('@atc/common');

describe('createNotification Handler', () => {
    let mockCallback: jest.MockedFunction<any>;
    let mockCall: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCallback = jest.fn();
        mockCall = {
            request: {
                title: 'Test Notification',
                description: 'Test Description',
                user_id: 'user-123',
                type: 'REGISTRATION',
            },
        };
    });

    it('should create notification successfully', async () => {
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (addNewNotification as jest.Mock).mockResolvedValue(true);

        await createNotification(mockCall, mockCallback);

        expect(addNewNotification).toHaveBeenCalledWith({
            title: 'Test Notification',
            description: 'Test Description',
            User: { connect: { id: 'user-123' } },
            type: 'REGISTRATION',
        });

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Notification created successfully',
            status: status.OK,
        });
    });

    it('should handle errors gracefully', async () => {
        utilFns.removeEmptyFields.mockReturnValue(mockCall.request);
        (addNewNotification as jest.Mock).mockRejectedValue(
            new Error('Database error'),
        );

        await createNotification(mockCall, mockCallback);

        expect(mockCallback).toHaveBeenCalledWith(null, {
            message: 'Something went wrong',
            status: status.INTERNAL,
        });
    });
});
