import { logger } from '@atc/logger';
import { sampleStub, surveyStub } from '../client';
import { SurveyType } from '@atc/common';
import { GetSingleSampleResponse, GetSingleSurveyResponse } from '@atc/proto';

const deactivateSurveys = async (surveyIDs: string[], metadata: any) => {
    try {
        return await Promise.all(
            surveyIDs.map((surveyID) => {
                return new Promise((resolve, reject) => {
                    surveyStub.DeactivateSurvey(
                        { id: surveyID },
                        metadata,
                        (err: any, response: any) => {
                            if (err) reject(err);
                            else resolve(response);
                        },
                    );
                });
            }),
        );
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const activateSurveys = async (surveyIDs: string[], metadata: any) => {
    try {
        return await new Promise((resolve, reject) => {
            surveyStub.ToggleSurvey(
                {
                    survey_ids: surveyIDs,
                    type: SurveyType.PUBLISHED,
                },
                metadata,
                (err: any, response: any) => {
                    if (err) reject(err);
                    else resolve(response);
                },
            );
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getSurveyByID = async (
    surveyID: string,
    metadata: any,
): Promise<GetSingleSurveyResponse['data']> => {
    try {
        const response: GetSingleSurveyResponse = await new Promise(
            (resolve, reject) => {
                surveyStub.GetSingleSurvey(
                    { id: surveyID, is_widget_survey: true },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        return response.data;
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getSampleByID = async (
    sampleID: string,
    metadata: any,
): Promise<GetSingleSampleResponse['data']> => {
    try {
        const response: GetSingleSampleResponse = await new Promise(
            (resolve, reject) => {
                sampleStub.GetSingleSample(
                    { id: sampleID, is_widget_sample: true },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        return response.data;
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

export { deactivateSurveys, activateSurveys, getSurveyByID, getSampleByID };
