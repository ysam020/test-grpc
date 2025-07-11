import {
    authMiddleware,
    BaseGrpcServer,
    roleMiddleware,
} from '@atc/grpc-server';
import { serviceDefinitions } from '@atc/grpc-config';
import {
    healthCheck,
    surveyValidation,
    UserRoleEnum,
    UUIDSchema,
} from '@atc/common';
import * as grpc from '@grpc/grpc-js';
import {
    HealthCheckResponse,
    _health_ServiceStatus_ServingStatus as ServingStatus,
} from '@atc/proto';
import { handlers } from './handlers';
import {
    CreateSurveySchema,
    DidUserAnsweredSchema,
    DraftSurveySchema,
    ExportToExcelSchema,
    GetAllResponsesByUserIDSchema,
    GetAllSurveySchema,
    GetSingleSurveySchema,
    SubmitSurveyAnswerSchema,
    ToggleSurveySchema,
    UpdateSurveySchema,
} from './validations';

export class SurveyServer extends BaseGrpcServer {
    constructor() {
        super();
        this.initializeServer();
    }

    private initializeServer() {
        this.addMiddleware(
            authMiddleware(['/health.HealthService/healthCheck']),
        );

        const roleRequirements = {
            '/survey.SurveyService/CreateSurvey': [UserRoleEnum.ADMIN],
            '/survey.SurveyService/DraftSurvey': [UserRoleEnum.ADMIN],
            '/survey.SurveyService/UpdateSurvey': [UserRoleEnum.ADMIN],
            '/survey.SurveyService/GetAllSurvey': [UserRoleEnum.ADMIN],
            '/survey.SurveyService/DeleteSurvey': [UserRoleEnum.ADMIN],
            '/survey.SurveyService/ToggleSurvey': [UserRoleEnum.ADMIN],
            '/survey.SurveyService/DeactivateSurvey': [UserRoleEnum.ADMIN],
            '/survey.SurveyService/SubmitSurveyAnswer': [UserRoleEnum.USER],
            '/survey.SurveyService/GetAllResponsesByUserID': [
                UserRoleEnum.ADMIN,
            ],
            '/survey.SurveyService/GetSurveyEngagement': [UserRoleEnum.ADMIN],
            '/survey.SurveyService/GetSurveysCount': [UserRoleEnum.ADMIN],
            '/survey.SurveyService/ExportToExcel': [UserRoleEnum.ADMIN],
        };

        this.addMiddleware(roleMiddleware(roleRequirements));

        this.addService(
            serviceDefinitions.surveyPackageDefinition.survey.SurveyService
                .service,
            {
                ...handlers,
                CreateSurvey: this.wrapWithValidation(
                    handlers.CreateSurvey,
                    CreateSurveySchema,
                ),
                DraftSurvey: this.wrapWithValidation(
                    handlers.DraftSurvey,
                    DraftSurveySchema,
                ),
                GetSingleSurvey: this.wrapWithValidation(
                    handlers.GetSingleSurvey,
                    GetSingleSurveySchema,
                ),
                GetAllSurvey: this.wrapWithValidation(
                    handlers.GetAllSurvey,
                    GetAllSurveySchema,
                ),
                UpdateSurvey: this.wrapWithValidation(
                    handlers.UpdateSurvey,
                    UpdateSurveySchema,
                ),
                DeleteSurvey: this.wrapWithValidation(
                    handlers.DeleteSurvey,
                    UUIDSchema,
                ),
                ToggleSurvey: this.wrapWithValidation(
                    handlers.ToggleSurvey,
                    ToggleSurveySchema,
                ),
                SubmitSurveyAnswer: this.wrapWithValidation(
                    handlers.SubmitSurveyAnswer,
                    SubmitSurveyAnswerSchema,
                ),
                DeactivateSurvey: this.wrapWithValidation(
                    handlers.DeactivateSurvey,
                    UUIDSchema,
                ),
                GetAllResponsesByUserID: this.wrapWithValidation(
                    handlers.GetAllResponsesByUserID,
                    GetAllResponsesByUserIDSchema,
                ),
                DidUserAnswered: this.wrapWithValidation(
                    handlers.DidUserAnswered,
                    DidUserAnsweredSchema,
                ),
                GetSurveyEngagement: this.wrapWithValidation(
                    handlers.GetSurveyEngagement,
                    surveyValidation.GetSurveyEngagementSchema,
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
