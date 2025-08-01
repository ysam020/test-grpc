import { loadSync } from '@grpc/proto-loader';
import { protoFiles } from '../proto-file.config';
import { packageDefinitionOptions } from '../types';
import { loadPackageDefinition } from '@grpc/grpc-js';
import { SurveyProtoGrpcType } from '@atc/proto';

const packageDefinition = loadSync(protoFiles.survey, packageDefinitionOptions);

const surveyPackageDefinition = loadPackageDefinition(
    packageDefinition,
) as unknown as SurveyProtoGrpcType;

export { surveyPackageDefinition };
