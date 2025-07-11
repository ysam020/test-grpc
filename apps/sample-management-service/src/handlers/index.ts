import { SampleServiceHandlers } from '@atc/proto';
import { CreateSample } from './createSample';
import { UpdateSample } from './updateSample';
import { DeleteSample } from './deleteSample';
import { GetSingleSample } from './getSingleSample';
import { GetAllSample } from './getAllSample';
import { ToggleSample } from './toggleSample';
import { SubmitSampleAnswer } from './submitSampleAnswer';
import { ReviewSample } from './reviewSample';
import { GetAllReview } from './getAllReview';
import { FetchSampleForUser } from './fetchSampleForUser';
import { FetchAllSampleForUser } from './fetchAllSamplesForUser';
import { GetAllRequestedSamples } from './getAllRequestedSamples';
import { getSampleEngagement } from './getSampleEngagement';
import { getSamplesCount } from './getSamplesCount';
import { getSampleStatus } from './getSampleStatus';
import { ExportToExcel } from './exportToExcel';

export const handlers: SampleServiceHandlers = {
    CreateSample: CreateSample,
    DraftSample: CreateSample,
    UpdateSample: UpdateSample,
    DeleteSample: DeleteSample,
    GetSingleSample: GetSingleSample,
    GetAllSample: GetAllSample,
    ToggleSample: ToggleSample,
    SubmitSampleAnswer: SubmitSampleAnswer,
    ReviewSample: ReviewSample,
    GetAllReview: GetAllReview,
    FetchSampleForUser: FetchSampleForUser,
    FetchAllSampleForUser: FetchAllSampleForUser,
    GetAllRequestedSamples: GetAllRequestedSamples,
    GetSampleEngagement: getSampleEngagement,
    GetSamplesCount: getSamplesCount,
    GetSampleStatus: getSampleStatus,
    ExportToExcel: ExportToExcel,
};
