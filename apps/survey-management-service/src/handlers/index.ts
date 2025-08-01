import { SurveyServiceHandlers } from '@atc/proto';

import { CreateSurvey } from './createSurvey';
import { DeleteSurvey } from './deleteSurvey';
import { ToggleSurvey } from './ToggleSurvey';
import { GetAllSurvey } from './getAllSurvey';
import { GetSingleSurvey } from './getSingleSurvey';
import { UpdateSurvey } from './updateSurvey';
import { SubmitSurveyAnswer } from './submitSurveyAnswer';
import { DeactivateSurvey } from './deactivateSurvey';
import { GetAllResponsesByUserID } from './getAllResponseByUserID';
import { DidUserAnswered } from './didUserAnswered';
import { getSurveyEngagement } from './getSurveyEngagement';
import { getSurveysCount } from './getSurveysCount';
import { ExportToExcel } from './exportToExcel';

export const handlers: SurveyServiceHandlers = {
    CreateSurvey: CreateSurvey,
    GetSingleSurvey: GetSingleSurvey,
    GetAllSurvey: GetAllSurvey,
    UpdateSurvey: UpdateSurvey,
    DeleteSurvey: DeleteSurvey,
    ToggleSurvey: ToggleSurvey,
    SubmitSurveyAnswer: SubmitSurveyAnswer,
    DraftSurvey: CreateSurvey,
    DeactivateSurvey: DeactivateSurvey,
    GetAllResponsesByUserID: GetAllResponsesByUserID,
    DidUserAnswered: DidUserAnswered,
    GetSurveyEngagement: getSurveyEngagement,
    GetSurveysCount: getSurveysCount,
    ExportToExcel: ExportToExcel,
};
