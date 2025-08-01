import { Status } from '@grpc/grpc-js/build/src/constants';

enum RESPONSE_STATUS {
    SUCCESS = 200,
    CREATED = 201,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UN_AUTHORIZED = 401,
    PAYMENT_REQUIRES = 402,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    GONE = 410,
    LARGE_ENTITY = 413,
    UN_SUPPORTED_MEDIA_TYPE = 415,
    UN_PROCESSABLE_ENTITY = 422,
    TOO_MANY_REQUEST = 429,
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    GATEWAY_TIMEOUT = 504,
}

function grpcToHttpStatus(grpcStatus: Status): RESPONSE_STATUS {
    switch (grpcStatus) {
        case Status.OK:
            return RESPONSE_STATUS.SUCCESS;
        case Status.CANCELLED:
            return RESPONSE_STATUS.INTERNAL_SERVER_ERROR;
        case Status.UNKNOWN:
            return RESPONSE_STATUS.INTERNAL_SERVER_ERROR;
        case Status.DEADLINE_EXCEEDED:
            return RESPONSE_STATUS.GATEWAY_TIMEOUT;
        case Status.INVALID_ARGUMENT:
            return RESPONSE_STATUS.BAD_REQUEST;
        case Status.NOT_FOUND:
            return RESPONSE_STATUS.NOT_FOUND;
        case Status.ALREADY_EXISTS:
            return RESPONSE_STATUS.CONFLICT;
        case Status.PERMISSION_DENIED:
            return RESPONSE_STATUS.FORBIDDEN;
        case Status.RESOURCE_EXHAUSTED:
            return RESPONSE_STATUS.TOO_MANY_REQUEST;
        case Status.FAILED_PRECONDITION:
            return RESPONSE_STATUS.BAD_REQUEST;
        case Status.ABORTED:
            return RESPONSE_STATUS.INTERNAL_SERVER_ERROR;
        case Status.OUT_OF_RANGE:
            return RESPONSE_STATUS.BAD_REQUEST;
        case Status.UNIMPLEMENTED:
            return RESPONSE_STATUS.NOT_IMPLEMENTED;
        case Status.INTERNAL:
            return RESPONSE_STATUS.INTERNAL_SERVER_ERROR;
        case Status.UNAVAILABLE:
            return RESPONSE_STATUS.INTERNAL_SERVER_ERROR;
        case Status.DATA_LOSS:
            return RESPONSE_STATUS.INTERNAL_SERVER_ERROR;
        case Status.UNAUTHENTICATED:
            return RESPONSE_STATUS.UN_AUTHORIZED;
        default:
            return RESPONSE_STATUS.INTERNAL_SERVER_ERROR;
    }
}

export { RESPONSE_STATUS, grpcToHttpStatus };
