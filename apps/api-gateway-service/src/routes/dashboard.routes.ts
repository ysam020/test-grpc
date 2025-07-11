import { Router } from 'express';
import {
    dashboard,
    productDashboard,
} from '../controllers/dashboard.controller';

const dashboardRouter = Router();

dashboardRouter.get('/', dashboard);

dashboardRouter.get('/product', productDashboard);

export { dashboardRouter };
