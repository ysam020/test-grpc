export const errorMessage = {
    USER: {
        ALREADY_EXISTS: 'User already exists',
        REGISTER_FAILED: 'Failed to register user',
        NOT_FOUND: 'User not found',
        NOT_REGISTERED: 'User not registered',
        LOGIN_FAILED: 'Failed to login user',
        VERIFY_FAILED: 'Failed to verify user',
        ROLE_REQUIRED: 'Role required',
        ROLE_MISMATCH: 'User role does not match the specified role',
        UNAUTHORIZED_ACCESS:
            'Unauthorized access: You are not authorized to perform this action',
        NOT_VERIFIED: 'User is not verified, kindly verify your email',
        ALREADY_VERIFIED: 'User is already verified',
        PHONE_FORMAT: (format: string) =>
            `Invalid phone number format. Use ${format}`,
        MINIMUM_AGE: 'Minimum age should be 12 years',
    },

    PASSWORD: {
        INVALID: 'Invalid Password',
        UPDATE_FAILED: 'Failed to update password',
        LENGTH: 'Password must be between 8 to 16 characters',
        NUMBER: 'Password should contain at least one number',
        UPPERCASE: 'Password must contain at least 1 uppercase letter',
        SPECIAL_CHAR: 'Password must contain at least one special character',
        INCORRECT_CURRENT_PASSWORD:
            'Incorrect current password. Please provide the correct current password',
        SAME_AS_CURRENT_PASSWORD:
            'New password cannot be same as current password',
    },

    TOKEN: {
        INVALID: 'Invalid Token',
        NOT_FOUND: 'Token not found',
        INVALID_AUTH: 'Invalid Authentication',
        EXPIRED: 'Token has expired',
        REFRESHED: 'Token has been refreshed',
    },

    OTP: {
        INVALID: 'Invalid OTP',
    },

    WIDGET: {
        NOT_FOUND: 'Widget Not Found',
        INVALID_DATE_FORMAT: 'Invalid date format. Use YYYY-MM-DD.',
        DEPLOY_DATE_PAST: 'Deploy date must be in the future',
        WIDGET_NAME_EXISTS: 'Widget name already exists',
        ACTIVE_CANNOT_DELETE: 'Active widget cannot be deleted',
        NO_COMPONENTS: 'No components found in the widget',
        SURVEY_ALREADY_ADDED: 'Survey already added to the widget',
    },

    WIDGET_COMPONENT: {
        NOT_FOUND: 'Widget Component Not Found',
        DUPLICATE_ORDER: 'Order values must be unique',
        NOT_FOR_SURVEY: 'Widget component is not for a survey',
    },

    BANNER: {
        NOT_FOUND: 'Banner Not Found',
        INTERNAL_LINK_TYPE_REQUIRED:
            'internal_link_type is required when link type is INTERNAL',
        SAMPLE_ID_REQUIRED:
            'sample_id is required when internal link type is SAMPLE',
        AT_LEAST_ONE_REQUIRED:
            'At least one of brand_ids, retailer_ids, or category_ids is required when internal link type is PRODUCT',
        LINK_REQUIRED: 'link is required when link type is EXTERNAL',
    },

    PRODUCT_SLIDER: {
        NOT_FOUND: 'Product Slider Not Found',
    },

    OTHER: {
        SOMETHING_WENT_WRONG: 'Something went wrong',
        MISSING_CREDENTIAL: 'Missing S3 credentials or region',
        INVALID_FILE_TYPE: 'Invalid file type',
        FILL_REQUIRED_FIELD: 'Fill all the required field',
        BAD_REQUEST: 'Bad request',
        INVALID_MIME_TYPE: 'Invalid mime type',
        IMAGE_REQUIRED: 'Image is required',
        FILE_REQUIRED: 'File is required',
    },

    DATE: {
        INVALID_DATE: 'Invalid date format',
        PAST_DATE: 'Date should not be past date',
        DATE_BEFORE_START: 'End date should be greater than start date',
        PAST_DATE_END_DATE: 'End date should not be past date',
    },

    SURVEY: {
        NAME_REQUIRED:
            'Survey name is required with length atleast 5 characters long',
        QUESTION_REQUIRED: 'Question is required and atleast 5 characters long',
        MIN_OPTIONS: 'At least 2 options are required',
        TARGET_AUDIENCE_REQUIRED:
            'Number of target audiences are required. It should greater than zero',
        INVALID_LOCATION: (location: string[]): string =>
            `Invalid location. Possible values are: ${location.join(', ')}`,
        INVALID_STATE: (state: string[]): string =>
            `Invalid state. Possible values are: ${state.join(', ')}`,
        INVALID_AGE: (age: string[]): string =>
            `Invalid state. Possible values are:${age.join(', ')}`,
        INVALID_GENDER: 'Invalid gender.',
        ANSWER_TYPE:
            'It is necessary to specify whether the answer to the question is a single select or multi select.',
        ALREADY_EXISTS: 'Survey with provided name is already exists',
        FAILED_TO_CREATE: 'Failed to create survey',
        NOT_FOUND: 'Survey not found',
        NOT_EDITABLE:
            'This survey is currently in use and cannot be edited at this time.',
        FAILED_TO_UPDATE: 'Failed to update survey',
        FAILED_TO_DELETE: 'Failed to delete survey',
        DRAFT_NOT_FOUND: 'Draft not found',
        OPTION_NOT_FOUND: 'Option not found',
        FAILED_SUBMIT_ANSWER: 'Failed to submit answer',
        NOT_SINGLE_SELECTED:
            'Question must be answered with a single selection',
        ALREADY_SUBMITTED_ANSWER: 'You can give answer only once',
        FILL_REQUIRED_FIELD: 'Fill all the required field',
        QUESTION_REQUIRED_BEFORE_OPTION:
            'You need to add a question before options',
        DEACTIVATE: 'Survey is deactivated',
        MAX_NAME_LENGTH: 'Maximum length should be 50 characters',
        MAX_TARGET_AUDIENCE: 'Target audience can be maximum 500',
        MIN_TARGET_AUDIENCE: 'Target audience can be atleast 1',
        MAX_LENGTH: 'Maximum length should be 255 characters long',
        MAXIMUM_TARGET_AUDIENCE: 'Maximum 5000 target audience allowed',
        MIN_CLIENT_LENGTH: 'Client should be minimum 5 character long',
        MAX_CLIENT_LENGTH: 'Client should be minimum 255 character long',
        QUESTION_MIN_LENGTH: 'Question should be minimum 3 characters long',
        QUESTION_MAX_LENGTH: 'Question should be maximum 255 characters long',
        OPTION_MIN_MAX_LENGTH:
            'Invalid option. Each option must be at least 3 characters long and no more than 255 characters',
        TARGET_AUDIENCE_MIN_MAX: 'Target audience must be between 1 to 500',
        MAX_OPTIONS: 'A question can have a maximum of 10 options',
        CANNOT_ADD_OPTION: 'You cannot add option without adding question',
        MULTISELECT_BOOLEAN: 'Type of multiselect should be boolean',
        RESPONSE_NOT_FOUND: 'Responses not found',
        QUESTION_NOT_FOUND: 'Question not found',
        CANNOT_UPDATE_PUBLISHED: 'Published survey cannot be updated',
    },

    PRODUCT: {
        NOT_FOUND: 'Product not found',
        NO_PRICING_DATA: 'No pricing data found',
        ID_OR_BARCODE_REQUIRED: 'Either id or barcode is required',
        PROVIDE_AT_LEAST_ONE_PARAMETER: 'Provide at least one parameter',
        CATEGORY_NOT_FOUND: 'Category not found',
        CATEGORY_ID_REQUIRED: 'Category id is required',
        SUB_CATEGORY_NOT_FOUND: 'Sub category not found',
        SEARCH_PRODUCT_FAILED: 'Searched product not found',
        INCREASE_KEYWORD: 'Try Searching with more than 3 characters',
        PROVIDE_VALID_PARAMETER_VALUE: 'Provide valid parameter value',
        FAILED_TO_MATCH_PRODUCT: 'Failed to match product',
        PRODUCT_TO_BE_MATCH_NOT_FOUND: 'Product to be matched not found',
        POTENTIAL_MATCH_NOT_FOUND: 'Potential match product not found',
        BRAND_NOT_FOUND: 'Brand not found',
        RETAILER_NOT_FOUND: 'Retailer not found',
        PRODUCT_ALREADY_EXISTS: 'Product with same barcode already exists',
        BRAND_NAME_REQUIRED: 'Brand name is required',
        BRAND_NAME_EXISTS: 'Brand with same name already exists',
        FAILED_TO_ADD_BRAND: 'Failed to add brand',
        CATEGORY_NAME_REQUIRED: 'Category name is required',
        CATEGORY_ALREADY_EXISTS: 'Category with same name already exists',
        PARENT_CATEGORY_NOT_FOUND: 'Parent category not found',
        PRODUCT_ID_REQUIRED: 'Product id is required',
        PRODUCT_NOT_FOUND: 'Product not found',
        UPDATE_FAILED: 'Failed to update product',
        RETAILER_ALREADY_EXISTS: 'Retailer with same name already exists',
        FAILED_TO_UPDATE_PRODUCT_IN_ELASTIC:
            'Failed to update product in Elasticsearch',
        UPDATED: 'Product updated successfully',
        BARCODE_ALREADY_EXISTS: 'Product with same barcode already exists',
        EITHER_IMAGE_OR_IMAGE_URL: 'Either image or image_url is required',
        MIN_PRICE_GREATER_THAN_MAX_PRICE:
            'Max price must be greater than min price',
        MIN_AND_MAX_BOTH_REQUIRED: 'Both min price and max price are required',
    },

    BASKET: {
        BASKET_NOT_FOUND: 'Basket not found',
        PRODUCT_NOT_FOUND: 'Product not found in basket',
    },

    ADMIN_NOTIFICATION: {
        NOT_FOUND: 'Admin Notification not found',
        DATE_RANGE_REQUIRED:
            'Both start_date and end_date are required if one is provided',
        NO_CHANNEL_SELECTED: 'At least one channel is required',
        NO_LOCATION_SELECTED: 'At least one location is required',
        NO_STATE_SELECTED: 'At least one state is required',
        NO_AGE_GROUP_SELECTED: 'At least one age group is required',
        INCOMPLETE_SCHEDULE_FIELDS:
            'If updating the schedule, you must provide all three fields: schedule_date, schedule_hour, and schedule_minute',
        NO_FAILED_NOTIFICATIONS: 'No failed notifications found',
        ALREADY_SENT: 'Notification already sent cannot be updated',
    },

    SAMPLE: {
        FAILED_TO_CREATE: 'Failed to create sample',
        DESCRIPTION_REQUIRED: 'Description required with minimum 5 characters',
        MAXIMUM_SAMPLE_REQUIRED:
            'Maximum Number of sample are required and it should be greater than zero',
        DESCRIPTION_TO_GET_PRODUCT_REQUIRED:
            'It is required to add how user will get sample product with length minimum 5 characters',
        TASK_TO_DO_REQUIRED:
            'It is required to add task you expect to do by users when they will get sample with length minimum 5 characters',
        INQUIRIES_REQUIRED:
            'Inquiries details are required with length minimum 5 characters',
        QUESTION_REQUIRED: 'Question required',
        MAX_QUESTION: 'You can add maximum 5 question',
        NOT_FOUND: 'Sample not found',
        NO_QUESTIONS: 'It required to add questions in your sample question',
        INSUFFICIENT_OPTIONS:
            'It is required to added atleast 2 options for each question which have answer type text',
        ALREADY_REQUESTED: 'You can request sample only once',
        QUESTION_NOT_FOUND: 'Question not found',
        FAILED_TO_REVIEW: 'Failed to add review',
        REVIEW_NOT_FOUND: 'Review not found',
        OPTIONS_REQUIRED_FOR_NON_TEXT:
            "Options are required when the answer type is not 'text'.",
        INVALID_PAGE: 'Invalid page. It should positive with greater than zero',
        INVALID_LIMIT:
            'Invalid limit.It should positive with greater than zero',
        MAXIMUM_ANSWER: 'You can only select one option',
        FAILED_TO_SUBMIT_ANSWERS: 'Failed to submit answers',
        OPTION_REQUIRED: 'Options are required while answer_type is not text',
        MAXIMUM_RATING: 'Rating must not exceed 5',
        MIN_RATING: 'Rating should be minimum 1',
        MINIMUM_COMMENT_LENGTH: 'Comment must be at least 20 characters long',
        MAXIMUM_RESPONSE: 'You can give maximum 5 answer at once',
        MIN_LENGTH: 'Minimum length should be 5 characters long',
        MAX_LENGTH: 'Maximum length should be 255 characters long',
        MAX_LENGTH_FOR_MAXIMUM_SAMPLE:
            'Maximum 5000 number of samples can be added',
        INVALID_LOCATION: (location: string[]): string =>
            `Invalid location. Possible values are: ${location.join(', ')}`,
        INVALID_STATE: (state: string[]): string =>
            `Invalid state. Possible values are: ${state.join(', ')}`,
        INVALID_AGE: (age: string[]): string =>
            `Invalid state. Possible values are:${age.join(', ')}`,
        INVALID_GENDER: (gender: string[]): string =>
            `Invalid gender. Possible values are: ${gender.join(', ')}`,
        OPTION_MIN_REQUIRED: 'It is required to add atleast 2 options',
        OPTION_MAX_REQUIRED: 'You can add atmost 10 options',
        MIN_QUESTION: 'It is required to add atleast 1 question',
        OPTION_NOT_ALLOWED_FOR_TEXT:
            'You cannot add options with answer type text',
        OPTION_INVALID_COUNT:
            'Atleast 2 options are required with each options',
        ANSWER_TYPE_REQUIRED: 'Answer type is required',
        SINGLE_ANSWER_REQUIRED: 'You can select only one option',
        MULTI_ANSWER_REQUIRED: 'It is required to give answer',
        INVALID_OPTION_ID: 'Invalid options ',
        INVALID_NUMBER: 'Invalid Number',
        REQUIRED_BOOLEAN_VALUE: 'Only boolean values are allowed',
        OPTION_NOT_FOUND: 'Option not found',
        NO_DATA_NEEDED:
            'When type is "all-sample-report", you should not provide any "id"',
        ID_REQUIRED: (type: string): string =>
            `When type is "${type}", an ID is required.`,
        SHOULD_NOT_FUTURE_DATE: 'Start date should not future date',
        SHOULD_NOT_LESS_THAT_START_DATE:
            'End date cannot be before the start date',
        MINIMUM_RATING: 'Rating must be greater than zero',
        REQUIRED: 'You must need to pass atleast one field',
        BOOLEAN_VALUE_REQUIRED:
            'Invalid value for is_widget_sample. Expected "true" or "false".',
        USED_IN_WIDGET: (widgetNames: string[]) =>
            `Sample is used in Widgets: ${widgetNames.join(', ')}`,
    },

    PRICE_ALERT: {
        NOT_FOUND: 'Price Alert not found',
    },

    BRAND: {
        NOT_FOUND: 'Brand not found',
    },

    RETAILER: {
        NOT_FOUND: 'Retailer not found',
    },

    CATEGORY: {
        NOT_FOUND: 'Category not found',
    },

    PRODUCT_GROUP: {
        NOT_FOUND: 'Product Group not found',
        BRAND_IDS_UNIQUE: 'Brand ids must be unique',
        PRODUCT_IDS_REQUIRED: 'Product ids are required',
        PRODUCT_IDS_UNIQUE: 'Product ids must be unique',
    },

    SUPPLIER: {
        ALREADY_EXISTS: 'Supplier with same name already exists',
        BRAND_ALREADY_ASSOCIATED: 'Brand is already associated with supplier',
        NOT_FOUND: 'Supplier not found',
    },

    ADVERTISEMENT: {
        NOT_FOUND: 'Advertisement not found',
        IMAGE_NOT_FOUND: 'Advertisement image not found',
        ADVERTISEMENT_ITEM_NOT_FOUND: 'Advertisement item not found',
        AD_IMAGE_NOT_FOUND: 'Advertisement image not found',
        CANNOT_TOGGLE_TO_MATCHED:
            'Cannot toggle advertisement item to matched state',
    },
};
