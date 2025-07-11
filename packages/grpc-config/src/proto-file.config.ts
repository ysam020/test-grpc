import { join } from 'node:path';

export const protoFiles = {
    auth: join(process.env.PROTO_PATH!, '/auth/auth.proto'),
    product: join(process.env.PROTO_PATH!, '/product/product.proto'),
    health: join(process.env.PROTO_PATH!, '/health/health.proto'),
    user: join(process.env.PROTO_PATH!, '/user/user.proto'),
    survey: join(process.env.PROTO_PATH!, '/survey/survey.proto'),
    widget: join(process.env.PROTO_PATH!, '/widget/widget.proto'),
    notification: join(
        process.env.PROTO_PATH!,
        '/notification/notification.proto',
    ),
    sample: join(process.env.PROTO_PATH!, '/sample/sample.proto'),
    catalogue: join(process.env.PROTO_PATH!, '/catalogue/catalogue.proto'),
};
