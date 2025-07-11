import { loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';

import { HealthProtoGrpcType } from '@atc/proto/';

import { packageDefinitionOptions } from '../types';
import { protoFiles } from '../proto-file.config';

const packageDefinition = loadSync(protoFiles.health, packageDefinitionOptions);

const healthPackageDefinition = loadPackageDefinition(
    packageDefinition,
) as unknown as HealthProtoGrpcType;

export { healthPackageDefinition };
