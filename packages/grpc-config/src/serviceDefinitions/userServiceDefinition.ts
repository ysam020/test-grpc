import { loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';

import { UserProtoGrpcType } from '@atc/proto';

import { packageDefinitionOptions } from '../types';
import { protoFiles } from '../proto-file.config';

const packageDefinition = loadSync(protoFiles.user, packageDefinitionOptions);

const userPackageDefinition = loadPackageDefinition(
    packageDefinition,
) as unknown as UserProtoGrpcType;

export { userPackageDefinition };
