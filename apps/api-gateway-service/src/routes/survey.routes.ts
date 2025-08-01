import { Router } from 'express';
import { optionalUUIDSchema, surveyValidation, UUIDSchema } from '@atc/common';

import {
    createSurvey,
    deleteSurvey,
    draftSurvey,
    exportToExcel,
    getAllResponses,
    getAllSurvey,
    getSingleSurvey,
    getSurveyEngagement,
    submitSurveyAnswer,
    toggleSurvey,
    updateSurvey,
} from '../controllers/survey.controller';
import { validateData } from '../middlewares/validation.middleware';

const surveyRouter = Router();

surveyRouter.post(
    '/publish/:id?',
    validateData(
        surveyValidation.CreateSurveySchema,
        undefined,
        optionalUUIDSchema,
    ),
    createSurvey,
);

surveyRouter.post(
    '/draft/:id?',
    validateData(
        surveyValidation.DraftSurveySchema,
        undefined,
        optionalUUIDSchema,
    ),
    draftSurvey,
);

surveyRouter.get(
    '/dashboard',
    validateData(undefined, surveyValidation.GetSurveyEngagementSchema),
    getSurveyEngagement,
);

surveyRouter.get(
    '/:id',
    validateData(undefined, undefined, UUIDSchema),
    getSingleSurvey,
);

surveyRouter.get(
    '/all-surveys/:type',
    validateData(
        undefined,
        surveyValidation.GetAllSurveySchema,
        surveyValidation.surveyTypeSchema,
    ),
    getAllSurvey,
);

surveyRouter.put(
    '/:id',
    validateData(surveyValidation.UpdateSurveySchema, undefined, UUIDSchema),
    updateSurvey,
);

surveyRouter.delete(
    '/:id',
    validateData(undefined, undefined, UUIDSchema),
    deleteSurvey,
);

surveyRouter.put(
    '/toggle-survey/:type',
    validateData(
        surveyValidation.ToggleSurveySchema,
        undefined,
        surveyValidation.surveyTypeSchema,
    ),
    toggleSurvey,
);

surveyRouter.post(
    '/:id',
    validateData(
        surveyValidation.SubmitSurveyAnswerSchema,
        undefined,
        UUIDSchema,
    ),
    submitSurveyAnswer,
);

surveyRouter.get(
    '/all-responses/:id',
    validateData(undefined, surveyValidation.GetAllResponseSchema, UUIDSchema),
    getAllResponses,
);

surveyRouter.get(
    '/export-excel/:id',
    validateData(undefined, surveyValidation.ExportToExcelSchema, UUIDSchema),
    exportToExcel,
);

export { surveyRouter };
