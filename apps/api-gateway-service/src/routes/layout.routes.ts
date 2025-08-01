import { Router } from 'express';
import {
    getActiveLayout,
    getSingleLayout,
} from '../controllers/layout.controller';
import { validateData } from '../middlewares/validation.middleware';
import { widgetValidation } from '@atc/common';

const layoutRouter = Router();

layoutRouter.get('/active', getActiveLayout);

layoutRouter.get(
    '/:widget_id',
    validateData(undefined, undefined, widgetValidation.widgetIDSchema),
    getSingleLayout,
);

export { layoutRouter };
