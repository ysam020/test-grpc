import { loadSync } from '@grpc/proto-loader';
import { protoFiles } from '../proto-file.config';
import { packageDefinitionOptions } from '../types';
import { loadPackageDefinition } from '@grpc/grpc-js';
import { WidgetProtoGrpcType } from '@atc/proto';

const packageDefinition = loadSync(protoFiles.widget, packageDefinitionOptions);

const widgetPackageDefinition = loadPackageDefinition(
    packageDefinition,
) as unknown as WidgetProtoGrpcType;

export { widgetPackageDefinition };
