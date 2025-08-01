import { loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';

import { AuthProtoGrpcType } from '@atc/proto';

import { packageDefinitionOptions } from '../types';
import { protoFiles } from '../proto-file.config';

const packageDefinition = loadSync(protoFiles.auth, packageDefinitionOptions);

const authPackageDefinition = loadPackageDefinition(
    packageDefinition,
) as unknown as AuthProtoGrpcType;

export { authPackageDefinition };
