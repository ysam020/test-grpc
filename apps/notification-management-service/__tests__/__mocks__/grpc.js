// apps/notification-management-service/__tests__/__mocks__/grpc.js
module.exports = {
    mockGrpcCall: {
        request: {},
        metadata: {
            get: jest.fn(),
            set: jest.fn(),
            add: jest.fn(),
            remove: jest.fn(),
            clone: jest.fn(),
        },
        cancelled: false,
        deadline: new Date(Date.now() + 30000),
        peer: 'localhost:50057',
    },

    mockCallback: jest.fn(),

    createMockCall: (request = {}, metadata = {}) => ({
        request,
        metadata: {
            get: jest.fn().mockReturnValue(metadata ? [metadata] : []),
            set: jest.fn(),
            add: jest.fn(),
            remove: jest.fn(),
            clone: jest.fn(),
            ...metadata,
        },
        cancelled: false,
        deadline: new Date(Date.now() + 30000),
        peer: 'localhost:50057',
    }),

    createMockCallWithAuth: (
        request = {},
        userId = 'test-user-id',
        role = 'USER',
    ) => ({
        request,
        metadata: {
            get: jest.fn().mockImplementation((key) => {
                if (key === 'user-id') return [userId];
                if (key === 'user-role') return [role];
                return [];
            }),
            set: jest.fn(),
            add: jest.fn(),
            remove: jest.fn(),
            clone: jest.fn(),
        },
        cancelled: false,
        deadline: new Date(Date.now() + 30000),
        peer: 'localhost:50057',
    }),

    createMockCallbackWithValidation: () => {
        const callback = jest.fn();
        callback.mockImplementation((error, response) => {
            if (error) {
                throw error;
            }
            return response;
        });
        return callback;
    },
};
