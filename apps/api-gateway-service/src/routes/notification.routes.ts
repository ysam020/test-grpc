import { Router } from 'express';
import { notificationValidation } from '@atc/common';

import {
    createAdminNotification,
    deleteAdminNotification,
    getAdminNotifications,
    getNotifications,
    getSingleAdminNotifications,
    retryAdminNotification,
    updateAdminNotification,
} from '../controllers/notification.controller';
import { validateData } from '../middlewares/validation.middleware';

const notificationRouter = Router();

notificationRouter.post(
    '/admin',
    validateData(notificationValidation.createAdminNotificationSchema),
    createAdminNotification,
);

notificationRouter.put(
    '/admin/:admin_notification_id',
    validateData(
        notificationValidation.updateAdminNotificationSchema,
        undefined,
        notificationValidation.adminNotificationIDSchema,
    ),
    updateAdminNotification,
);

notificationRouter.post(
    '/admin/:admin_notification_id',
    validateData(
        undefined,
        undefined,
        notificationValidation.adminNotificationIDSchema,
    ),
    retryAdminNotification,
);

notificationRouter.get(
    '/admin',
    validateData(undefined, notificationValidation.getAdminNotificationsSchema),
    getAdminNotifications,
);

notificationRouter.get(
    '/admin/:admin_notification_id',
    validateData(
        undefined,
        undefined,
        notificationValidation.adminNotificationIDSchema,
    ),
    getSingleAdminNotifications,
);

notificationRouter.delete(
    '/admin/:admin_notification_id',
    validateData(
        undefined,
        undefined,
        notificationValidation.adminNotificationIDSchema,
    ),
    deleteAdminNotification,
);

notificationRouter.get(
    '/',
    validateData(undefined, notificationValidation.getNotificationsSchema),
    getNotifications,
);

export { notificationRouter };
