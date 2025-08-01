import { loadSync } from '@grpc/proto-loader';
import { protoFiles } from '../proto-file.config';
import { packageDefinitionOptions } from '../types';
import { loadPackageDefinition } from '@grpc/grpc-js';
import { SampleProtoGrpcType } from '@atc/proto';

const packageDefinition = loadSync(protoFiles.sample, packageDefinitionOptions);

const samplePackageDefinition = loadPackageDefinition(
    packageDefinition,
) as unknown as SampleProtoGrpcType;

export { samplePackageDefinition };
