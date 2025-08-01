import {
    DidUserAnsweredRequest,
    getAllProductsRequest,
    GetSampleStatusRequest,
    GetSingleSurveyRequest,
} from '@atc/proto';
import { productStub, sampleStub, surveyStub, widgetStub } from '../client';
import { Metadata } from '@grpc/grpc-js';

const getSurveyByID = (params: GetSingleSurveyRequest, metadata: Metadata) =>
    new Promise((resolve, reject) => {
        surveyStub.GetSingleSurvey(
            params,
            metadata,
            (err: any, response: any) => {
                if (err) reject(err);
                else resolve(response);
            },
        );
    });

const didUserAnswered = (params: DidUserAnsweredRequest, metadata: Metadata) =>
    new Promise((resolve, reject) => {
        surveyStub.DidUserAnswered(
            params,
            metadata,
            (err: any, response: any) => {
                if (err) reject(err);
                else resolve(response);
            },
        );
    });

const allProducts = (body: getAllProductsRequest, metadata: Metadata) =>
    new Promise((resolve, reject) => {
        productStub.getAllProducts(
            body,
            metadata,
            (err: any, response: any) => {
                if (err) reject(err);
                else resolve(response);
            },
        );
    });

const getActiveWidgetLayout = (metadata: Metadata, widgetID?: string) =>
    new Promise((resolve, reject) => {
        widgetStub.GetActiveLayout(
            { widget_id: widgetID },
            metadata,
            (err: any, response: any) => {
                if (err) reject(err);
                else resolve(response);
            },
        );
    });

const getSampleStatus = (params: GetSampleStatusRequest, metadata: Metadata) =>
    new Promise((resolve, reject) => {
        sampleStub.GetSampleStatus(
            params,
            metadata,
            (err: any, response: any) => {
                if (err) reject(err);
                else resolve(response);
            },
        );
    });

export {
    getSurveyByID,
    allProducts,
    getActiveWidgetLayout,
    didUserAnswered,
    getSampleStatus,
};
