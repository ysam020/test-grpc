module.exports = {
    utilFns: {
        createMetadata: jest.fn((key, value) => ({ [key]: value })),
        cleanObject: jest.fn((obj) => obj),
    },
    apiResponse: jest.fn(),
    grpcToHttpStatus: jest.fn((status) => status || 200),
    asyncHandler: jest.fn((fn) => fn),
    RESPONSE_STATUS: {
        SUCCESS: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UN_AUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500,
    },
    errorMessage: {
        TOKEN: {
            NOT_FOUND: 'Token not found',
            INVALID: 'Invalid token',
        },
        PASSWORD: {
            INVALID: 'Invalid password',
        },
        OTHER: {
            SOMETHING_WENT_WRONG: 'Something went wrong',
        },
    },
    authValidation: {
        registerSchema: {},
        loginSchema: {},
        verifyUserSchema: {},
        emailSchema: {},
        resetPasswordSchema: {},
        refreshTokenSchema: {},
        oauthRegisterSchema: {},
        roleSchema: {},
    },
    userValidation: {
        updateUserSchema: {},
        changePasswordSchema: {},
        acceptDeviceTokenSchema: {},
        getUsersSchema: {},
        getUserEngagementSchema: {},
    },
    productValidation: {
        productIDSchema: {},
    },
    notificationValidation: {
        addPriceAlertSchema: {},
        pageAndLimitSchema: {},
    },
    widgetValidation: {
        widgetIDSchema: {},
    },
    sampleValidation: {
        CreateSampleSchema: {},
    },
    redisValidation: {
        clearCacheSchema: {},
    },
    UUIDSchema: {},
    optionalUUIDSchema: {},
    ExportTypeSchema: {},
};
