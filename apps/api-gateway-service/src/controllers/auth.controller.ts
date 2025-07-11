import {
    ForgotPasswordResponse,
    LoginUserResponse,
    RefreshTokenResponse,
    RegisterUserResponse,
    ResendEmailResponse,
    ResetPasswordResponse,
    VerifyUserResponse,
} from '@atc/proto';
import { clientStub } from '../client';
import { apiResponse, asyncHandler, utilFns } from '@atc/common';
import { grpcToHttpStatus } from '@atc/common';

const register = asyncHandler(async (req, res) => {
    const body = utilFns.removeEmptyFields(req.body);

    const regUser: Promise<RegisterUserResponse> = new Promise(
        (resolve, reject) => {
            clientStub.RegisterUser(body, (err: any, response: any) => {
                if (err) reject(err);
                else resolve(response);
            });
        },
    );

    const { status, ...resData } = await regUser;

    return apiResponse(res, grpcToHttpStatus(status), resData);
});

const verifyEmail = asyncHandler(async (req, res) => {
    const body = utilFns.removeEmptyFields(req.body);

    const verUser = new Promise<VerifyUserResponse>((resolve, reject) => {
        clientStub.VerifyUser(body, (err: any, response: any) => {
            if (err) reject(err);
            else resolve(response);
        });
    });

    const { status, ...resData } = await verUser;

    return apiResponse(res, grpcToHttpStatus(status), resData);
});

const resendEmail = asyncHandler(async (req, res) => {
    const body = utilFns.removeEmptyFields(req.body);

    const resEmail = new Promise<ResendEmailResponse>((resolve, reject) => {
        clientStub.resendEmail(body, (err: any, response: any) => {
            if (err) reject(err);
            else resolve(response);
        });
    });

    const { status, ...resData } = await resEmail;

    return apiResponse(res, grpcToHttpStatus(status), resData);
});

const login = asyncHandler(async (req, res) => {
    const body = utilFns.removeEmptyFields(req.body);

    const resLogin = new Promise<LoginUserResponse>((resolve, reject) => {
        clientStub.loginUser(
            { ...body, ...req.params },
            (err: any, response: any) => {
                if (err) reject(err);
                else resolve(response);
            },
        );
    });

    const { status, ...resData } = await resLogin;

    return apiResponse(res, grpcToHttpStatus(status), resData);
});

const forgotPassword = asyncHandler(async (req, res) => {
    const body = utilFns.removeEmptyFields(req.body);

    const resForgotPass = new Promise<ForgotPasswordResponse>(
        (resolve, reject) => {
            clientStub.forgotPassword(body, (err: any, response: any) => {
                if (err) reject(err);
                else resolve(response);
            });
        },
    );

    const { status, ...resData } = await resForgotPass;

    return apiResponse(res, grpcToHttpStatus(status), resData);
});

const resetPassword = asyncHandler(async (req, res) => {
    const body = utilFns.removeEmptyFields(req.body);

    const resResetPass = new Promise<ResetPasswordResponse>(
        (resolve, reject) => {
            clientStub.resetPassword(body, (err: any, response: any) => {
                if (err) reject(err);
                else resolve(response);
            });
        },
    );

    const { status, ...resData } = await resResetPass;

    return apiResponse(res, grpcToHttpStatus(status), resData);
});

const refreshToken = asyncHandler(async (req, res) => {
    const { refresh_token } = req.body;
    const refreshToken = new Promise<RefreshTokenResponse>(
        (resolve, reject) => {
            clientStub.refreshToken(
                { refresh_token: refresh_token },
                (err: any, response: any) => {
                    if (err) reject(err);
                    else resolve(response);
                },
            );
        },
    );

    const { status, ...resData } = await refreshToken;
    return apiResponse(res, grpcToHttpStatus(status), resData);
});

const oauthRegister = asyncHandler(async (req, res) => {
    const body = utilFns.removeEmptyFields(req.body);

    const resOauthRegister = new Promise<LoginUserResponse>(
        (resolve, reject) => {
            clientStub.oauthRegister(body, (err: any, response: any) => {
                if (err) reject(err);
                else resolve(response);
            });
        },
    );

    const { status, ...resData } = await resOauthRegister;

    return apiResponse(res, grpcToHttpStatus(status), resData);
});

export {
    register,
    verifyEmail,
    resendEmail,
    login,
    forgotPassword,
    resetPassword,
    refreshToken,
    oauthRegister,
};
