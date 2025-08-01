import { loadSync } from '@grpc/proto-loader';
import { protoFiles } from '../proto-file.config';
import { packageDefinitionOptions } from '../types';
import { loadPackageDefinition } from '@grpc/grpc-js';
import { CatalogueProtoGrpcType } from '@atc/proto';

const packageDefinition = loadSync(
    protoFiles.catalogue,
    packageDefinitionOptions,
);

const cataloguePackageDefinition = loadPackageDefinition(
    packageDefinition,
) as unknown as CatalogueProtoGrpcType;

export { cataloguePackageDefinition };
