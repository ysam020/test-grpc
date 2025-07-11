import { logger } from '@atc/logger';
import { widgetStub } from '../client';
import { RemoveSurveyFromWidgetResponse } from '@atc/proto';

const removeSurveyFromWidget = async (surveyID: string, metadata: any) => {
    try {
        const response: RemoveSurveyFromWidgetResponse = await new Promise(
            (resolve, reject) => {
                widgetStub.RemoveSurveyFromWidget(
                    { id: surveyID },
                    metadata,
                    (err: any, response: any) => {
                        if (err) reject(err);
                        else resolve(response);
                    },
                );
            },
        );

        return response.status;
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

export { removeSurveyFromWidget };
