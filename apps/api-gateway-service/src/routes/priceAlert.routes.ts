import { Router } from 'express';
import {
    addPriceAlert,
    deletePriceAlert,
    getPriceAlerts,
} from '../controllers/priceAlert.controller';
import { validateData } from '../middlewares/validation.middleware';
import { notificationValidation, productValidation } from '@atc/common';

const priceAlertRouter = Router();

priceAlertRouter.post(
    '/',
    validateData(notificationValidation.addPriceAlertSchema),
    addPriceAlert,
);

priceAlertRouter.get(
    '/',
    validateData(undefined, notificationValidation.pageAndLimitSchema),
    getPriceAlerts,
);

priceAlertRouter.delete(
    '/:product_id',
    validateData(undefined, undefined, productValidation.productIDSchema),
    deletePriceAlert,
);

export { priceAlertRouter };
