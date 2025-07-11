import { Router } from 'express';
import { authRouter } from './auth.routes';
import { userRouter } from './user.routes';
import { widgetRouter } from './widget.routes';
import { surveyRouter } from './survey.routes';
import { productRouter } from './product.routes';
import { basketRouter } from './basket.routes';
import { notificationRouter } from './notification.routes';
import { sampleRouter } from './sample.routes';
import { priceAlertRouter } from './priceAlert.routes';
import { layoutRouter } from './layout.routes';
import { dashboardRouter } from './dashboard.routes';
import { redisRouter } from './redis.routes';
import { catalogueRouter } from './catalogue.routes';

const rootRouter = Router();

rootRouter.use('/auth', authRouter);

rootRouter.use('/users', userRouter);

rootRouter.use('/widget', widgetRouter);

rootRouter.use('/survey', surveyRouter);

rootRouter.use('/basket', basketRouter);

rootRouter.use('/product', productRouter);

rootRouter.use('/notification', notificationRouter);

rootRouter.use('/sample', sampleRouter);

rootRouter.use('/priceAlert', priceAlertRouter);

rootRouter.use('/layout', layoutRouter);

rootRouter.use('/dashboard', dashboardRouter);

rootRouter.use('/redis', redisRouter);

rootRouter.use('/catalogue', catalogueRouter);

export { rootRouter };
