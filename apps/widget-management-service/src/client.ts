import { serviceDefinitions } from '@atc/grpc-config';
import { credentials } from '@grpc/grpc-js';

const surveyStub =
    new serviceDefinitions.surveyPackageDefinition.survey.SurveyService(
        `${process.env.SURVEY_SERVICE_HOST}:${process.env.SURVEY_SERVICE_PORT}`,
        credentials.createInsecure(),
    );

const sampleStub =
    new serviceDefinitions.samplePackageDefinition.sample.SampleService(
        `${process.env.SAMPLE_SERVICE_HOST}:${process.env.SAMPLE_SERVICE_PORT}`,
        credentials.createInsecure(),
    );

export { surveyStub, sampleStub };
