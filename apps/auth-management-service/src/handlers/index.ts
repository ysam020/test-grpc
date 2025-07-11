import { AuthServiceHandlers } from '@atc/proto';
import { registerUser } from './registerUser';
import { verifyUser } from './verifyUser';
import { resendEmail } from './resendEmail';
import { loginUser } from './loginUser';
import { forgotPassword } from './forgotPassword';
import { resetPassword } from './resetPassword';
import { refreshToken } from './refreshToken';
import { oAuthRegister } from './oauthRegister';

export const handlers: AuthServiceHandlers = {
    RegisterUser: registerUser,
    VerifyUser: verifyUser,
    ResendEmail: resendEmail,
    LoginUser: loginUser,
    ForgotPassword: forgotPassword,
    ResetPassword: resetPassword,
    RefreshToken: refreshToken,
    OauthRegister: oAuthRegister,
};
