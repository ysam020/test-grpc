import { NotificationServiceHandlers } from '@atc/proto';
import { createAdminNotification } from './createAdminNotification';
import { updateAdminNotification } from './updateAdminNotification';
import { getAdminNotifications } from './getAdminNotifications';
import { getSingleAdminNotification } from './getSingleAdminNotification';
import { deleteAdminNotification } from './deleteAdminNotification';
import { addPriceAlert } from './addPriceAlert';
import { getPriceAlerts } from './getPriceAlerts';
import { deletePriceAlert } from './deletePriceAlert';
import { getNotifications } from './getNotifications';
import { createNotification } from './createNotification';
import { retryAdminNotification } from './retryAdminNotification';
import { getAverageNotificationCount } from './getAverageNotificationCount';

export const handlers: NotificationServiceHandlers = {
    CreateAdminNotification: createAdminNotification,
    UpdateAdminNotification: updateAdminNotification,
    GetAdminNotifications: getAdminNotifications,
    GetSingleAdminNotification: getSingleAdminNotification,
    DeleteAdminNotification: deleteAdminNotification,
    AddPriceAlert: addPriceAlert,
    GetPriceAlerts: getPriceAlerts,
    DeletePriceAlert: deletePriceAlert,
    GetNotifications: getNotifications,
    CreateNotification: createNotification,
    RetryAdminNotification: retryAdminNotification,
    GetAverageNotificationCount: getAverageNotificationCount,
};
