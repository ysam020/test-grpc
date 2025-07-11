import { serviceDefinitions } from '@atc/grpc-config';
import { credentials } from '@grpc/grpc-js';

const userStub = new serviceDefinitions.userPackageDefinition.user.UserService(
    `${process.env.USER_SERVICE_HOST}:${process.env.USER_SERVICE_PORT}`,
    credentials.createInsecure(),
);

export { userStub };
