import { loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';

import { ProductProtoGrpcType } from '@atc/proto/';

import { packageDefinitionOptions } from '../types';
import { protoFiles } from '../proto-file.config';

const packageDefinition = loadSync(
    protoFiles.product,
    packageDefinitionOptions,
);

const productPackageDefinition = loadPackageDefinition(
    packageDefinition,
) as unknown as ProductProtoGrpcType;

export { productPackageDefinition };
