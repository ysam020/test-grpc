import {
    createPlatformEndpoint,
    errorMessage,
    responseMessage,
    utilFns,
} from '@atc/common';
import { CustomServerUnaryCall } from '@atc/grpc-server';
import { logger } from '@atc/logger';
import {
    AcceptDeviceTokenRequest__Output,
    AcceptDeviceTokenResponse,
    AcceptDeviceTokenResponse__Output,
} from '@atc/proto';
import { sendUnaryData, status } from '@grpc/grpc-js';
import { acceptDeviceTokenType } from '../validations';
import { updateUserByID } from '../services/model.service';

export const acceptDeviceToken = async (
    call: CustomServerUnaryCall<
        AcceptDeviceTokenRequest__Output,
        AcceptDeviceTokenResponse
    >,
    callback: sendUnaryData<AcceptDeviceTokenResponse__Output>,
) => {
    try {
        const { device_token } = utilFns.removeEmptyFields(
            call.request,
        ) as acceptDeviceTokenType;
        const { userID } = call.user;

        const result = await createPlatformEndpoint(device_token);

        await updateUserByID(userID, {
            device_endpoint_arn: result.EndpointArn,
        });

        return callback(null, {
            message: responseMessage.DEVICE_TOKEN.ACCEPTED,
            status: status.OK,
        });
    } catch (error) {
        logger.error(error);
        return callback(null, {
            message: errorMessage.OTHER.SOMETHING_WENT_WRONG,
            status: status.INTERNAL,
        });
    }
};
