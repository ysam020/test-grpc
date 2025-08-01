import { loadSync } from '@grpc/proto-loader';
import { protoFiles } from '../proto-file.config';
import { packageDefinitionOptions } from '../types';
import { loadPackageDefinition } from '@grpc/grpc-js';
import { NotificationProtoGrpcType } from '@atc/proto';

const packageDefinition = loadSync(
    protoFiles.notification,
    packageDefinitionOptions,
);

const notificationPackageDefinition = loadPackageDefinition(
    packageDefinition,
) as unknown as NotificationProtoGrpcType;

export { notificationPackageDefinition };
