import { logger } from '@atc/logger';
import { widgetStub } from '../client';
import { FindWidgetsBySampleResponse } from '@atc/proto';

const findWidgetNamesBySampleID = async (
    sampleID: string,
    metadata: any,
): Promise<FindWidgetsBySampleResponse['data']> => {
    try {
        const response: FindWidgetsBySampleResponse = await new Promise(
            (resolve, reject) => {
                widgetStub.FindWidgetsBySample(
                    { sample_id: sampleID },
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

export { findWidgetNamesBySampleID };
