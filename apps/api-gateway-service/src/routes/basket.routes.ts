import { Router } from 'express';
import { notificationValidation, userValidation } from '@atc/common';

import {
    addToBasket,
    clearBasket,
    removeFromBasket,
    viewBasket,
} from '../controllers/basket.controller';
import { validateData } from '../middlewares/validation.middleware';

const basketRouter = Router();

basketRouter.post(
    '/',
    validateData(userValidation.addToBasketSchema),
    addToBasket,
);

basketRouter.delete(
    '/:master_product_id',
    validateData(undefined, undefined, userValidation.removeFromBasketSchema),
    removeFromBasket,
);

basketRouter.delete('/', clearBasket);

basketRouter.get(
    '/',
    validateData(undefined, userValidation.viewBasketSchema),
    viewBasket,
);

export { basketRouter };
