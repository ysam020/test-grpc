import { Router } from 'express';
import {
    createDraft,
    createSample,
    deleteSample,
    exportToExcel,
    fetchAllSample,
    fetchSingleSample,
    getAllRequestedSample,
    getAllReviews,
    getAllSample,
    getSampleEngagement,
    getSingleSample,
    reviewSample,
    submitSampleAnswer,
    toggleSample,
    updateSample,
} from '../controllers/sample.controller';
import { uploadFile } from '../middlewares/uploadFile.middleware';
import { validateData } from '../middlewares/validation.middleware';
import {
    ExportTypeSchema,
    optionalUUIDSchema,
    sampleValidation,
    UUIDSchema,
} from '@atc/common';

const sampleRouter = Router();

sampleRouter.post(
    '/publish/:id?',
    uploadFile,
    validateData(
        sampleValidation.CreateSampleSchema,
        undefined,
        optionalUUIDSchema,
    ),
    createSample,
);

sampleRouter.post(
    '/draft/:id?',
    uploadFile,
    validateData(
        sampleValidation.CreateDraftSchema,
        undefined,
        optionalUUIDSchema,
    ),
    createDraft,
);

sampleRouter.put(
    '/:id',
    uploadFile,
    validateData(sampleValidation.UpdateSampleSchema, undefined, UUIDSchema),
    updateSample,
);

sampleRouter.delete(
    '/:id',
    validateData(undefined, undefined, UUIDSchema),
    deleteSample,
);

sampleRouter.get(
    '/all-samples/:type',
    validateData(
        undefined,
        sampleValidation.GetAllSampleSchema,
        sampleValidation.SampleTypeSchema,
    ),
    getAllSample,
);

sampleRouter.put(
    '/toggle-sample/:type/:id',
    validateData(undefined, undefined, sampleValidation.ToggleSampleSchema),
    toggleSample,
);

sampleRouter.post(
    '/:id',
    validateData(sampleValidation.SubmitAnswerSchema, undefined, UUIDSchema),
    submitSampleAnswer,
);

sampleRouter.post(
    '/review/:id',
    uploadFile,
    validateData(sampleValidation.ReviewSampleSchema, undefined, UUIDSchema),
    reviewSample,
);

sampleRouter.get(
    '/all-reviews',
    validateData(undefined, sampleValidation.GetAllReviewSchema),
    getAllReviews,
);

sampleRouter.get(
    '/dashboard',
    validateData(undefined, sampleValidation.GetSampleEngagementSchema),
    getSampleEngagement,
);

sampleRouter.get(
    '/:id',
    validateData(undefined, sampleValidation.GetSingleSampleSchema, UUIDSchema),
    getSingleSample,
);

sampleRouter.get(
    '/user-sample/:id',
    validateData(undefined, undefined, UUIDSchema),
    fetchSingleSample,
);

sampleRouter.get(
    '/user/all-samples',
    validateData(undefined, sampleValidation.FetchAllSampleSchema),
    fetchAllSample,
);

sampleRouter.get(
    '/requested-samples/:id',
    validateData(
        undefined,
        sampleValidation.GetAllRequestedSampleSchema,
        UUIDSchema,
    ),
    getAllRequestedSample,
);

sampleRouter.get(
    '/export-excel/:type',
    validateData(
        undefined,
        sampleValidation.ExportToExcelSchema,
        ExportTypeSchema,
    ),
    exportToExcel,
);

export { sampleRouter };
