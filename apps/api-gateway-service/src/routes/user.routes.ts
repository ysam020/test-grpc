import { Router } from 'express';
import { userValidation, UUIDSchema } from '@atc/common';

import {
    acceptDeviceToken,
    changePassword,
    deleteUser,
    getSingleUser,
    getSingleUserAdmin,
    getUserEngagement,
    getUsers,
    updateUser,
} from '../controllers/user.controller';
import { uploadFile } from '../middlewares/uploadFile.middleware';
import { validateData } from '../middlewares/validation.middleware';

const userRouter = Router();

userRouter.put(
    '/device-token',
    validateData(userValidation.acceptDeviceTokenSchema),
    acceptDeviceToken,
);

userRouter.get(
    '/admin/:id',
    validateData(undefined, undefined, UUIDSchema),
    getSingleUserAdmin,
);

userRouter.get(
    '/dashboard',
    validateData(undefined, userValidation.getUserEngagementSchema),
    getUserEngagement,
);

userRouter.get(
    '/:id',
    validateData(undefined, undefined, UUIDSchema),
    getSingleUser,
);

userRouter.put(
    '/:id',
    uploadFile,
    validateData(userValidation.updateUserSchema, undefined, UUIDSchema),
    updateUser,
);

userRouter.delete(
    '/:id',
    validateData(undefined, undefined, UUIDSchema),
    deleteUser,
);

userRouter.put(
    '/password/:id',
    validateData(userValidation.changePasswordSchema, undefined, UUIDSchema),
    changePassword,
);

userRouter.get(
    '/',
    validateData(undefined, userValidation.getUsersSchema),
    getUsers,
);

export { userRouter };
