import {
    authMiddleware,
    BaseGrpcServer,
    roleMiddleware,
} from '@atc/grpc-server';
import { serviceDefinitions } from '@atc/grpc-config';
import {
    healthCheck,
    UserRoleEnum,
    UUIDSchema,
    sampleValidation,
} from '@atc/common';
import * as grpc from '@grpc/grpc-js';
import {
    HealthCheckResponse,
    _health_ServiceStatus_ServingStatus as ServingStatus,
} from '@atc/proto';
import { handlers } from './handlers';
import {
    CreateSampleSchema,
    DeleteSampleSchema,
    DraftSampleSchema,
    FetchAllSamplesForUserSchema,
    GetAllRequestedSampleSchema,
    GetAllReviewSchema,
    GetAllSamplesSchema,
    ReviewSampleSchema,
    SubmitSampleAnswerSchema,
    ToggleSampleSchema,
    UpdateSampleSchema,
    GetSingleSampleSchema,
    ExportToExcelSchema,
} from './validations';

export class SampleServer extends BaseGrpcServer {
    constructor() {
        super();
        this.initializeServer();
    }

    private initializeServer() {
        this.addMiddleware(
            authMiddleware(['/health.HealthService/healthCheck']),
        );

        const roleRequirements = {
            '/sample.SampleService/CreateSample': [UserRoleEnum.ADMIN],
            '/sample.SampleService/DraftSample': [UserRoleEnum.ADMIN],
            '/sample.SampleService/UpdateSample': [UserRoleEnum.ADMIN],
            '/sample.SampleService/DeleteSample': [UserRoleEnum.ADMIN],
            '/sample.SampleService/ToggleSample': [UserRoleEnum.ADMIN],
            '/sample.SampleService/GetAllSample': [UserRoleEnum.ADMIN],
            '/sample.SampleService/GetSingleSample': [UserRoleEnum.ADMIN],
            '/sample.SampleService/GetAllRequestedSamples': [
                UserRoleEnum.ADMIN,
            ],
            '/sample.SampleService/ReviewSample': [UserRoleEnum.USER],
            '/sample.SampleService/SubmitSampleAnswer': [UserRoleEnum.USER],
            '/sample.SampleService/FetchSampleForUser': [UserRoleEnum.USER],
            '/sample.SampleService/FetchAllSampleForUser': [UserRoleEnum.USER],
            '/sample.SampleService/GetSampleEngagement': [UserRoleEnum.ADMIN],
            '/sample.SampleService/GetSamplesCount': [UserRoleEnum.ADMIN],
            '/sample.SampleService/ExportToExcel': [UserRoleEnum.ADMIN],
        };

        this.addMiddleware(roleMiddleware(roleRequirements));

        this.addService(
            serviceDefinitions.samplePackageDefinition.sample.SampleService
                .service,
            {
                ...handlers,
                CreateSample: this.wrapWithValidation(
                    handlers.CreateSample,
                    CreateSampleSchema,
                ),
                DraftSample: this.wrapWithValidation(
                    handlers.DraftSample,
                    DraftSampleSchema,
                ),
                DeleteSample: this.wrapWithValidation(
                    handlers.DeleteSample,
                    DeleteSampleSchema,
                ),
                UpdateSample: this.wrapWithValidation(
                    handlers.UpdateSample,
                    UpdateSampleSchema,
                ),
                GetAllSample: this.wrapWithValidation(
                    handlers.GetAllSample,
                    GetAllSamplesSchema,
                ),
                GetSingleSample: this.wrapWithValidation(
                    handlers.GetSingleSample,
                    GetSingleSampleSchema,
                ),
                ToggleSample: this.wrapWithValidation(
                    handlers.ToggleSample,
                    ToggleSampleSchema,
                ),
                ReviewSample: this.wrapWithValidation(
                    handlers.ReviewSample,
                    ReviewSampleSchema,
                ),
                GetAllReview: this.wrapWithValidation(
                    handlers.GetAllReview,
                    GetAllReviewSchema,
                ),
                SubmitSampleAnswer: this.wrapWithValidation(
                    handlers.SubmitSampleAnswer,
                    SubmitSampleAnswerSchema,
                ),
                FetchSampleForUser: this.wrapWithValidation(
                    handlers.FetchSampleForUser,
                    UUIDSchema,
                ),
                FetchAllSampleForUser: this.wrapWithValidation(
                    handlers.FetchAllSampleForUser,
                    FetchAllSamplesForUserSchema,
                ),
                GetAllRequestedSamples: this.wrapWithValidation(
                    handlers.GetAllRequestedSamples,
                    GetAllRequestedSampleSchema,
                ),
                GetSampleEngagement: this.wrapWithValidation(
                    handlers.GetSampleEngagement,
                    sampleValidation.GetSampleEngagementSchema,
                ),
                ExportToExcel: this.wrapWithValidation(
                    handlers.ExportToExcel,
                    ExportToExcelSchema,
                ),
            },
        );

        this.addService(
            serviceDefinitions.healthPackageDefinition.health.HealthService
                .service,
            {
                healthCheck,
            },
        );
    }

    private healthCheckHandler = (
        call: grpc.ServerUnaryCall<any, HealthCheckResponse>,
        callback: grpc.sendUnaryData<HealthCheckResponse>,
    ) => {
        const services = [
            {
                service_name: 'SurveyServer',
                status: ServingStatus.SERVING,
            },
        ];
        callback(null, { services });
    };
}
