import { dbClient, prismaClient } from '@atc/db';
import { logger } from '@atc/logger';
import { TargetUsers__Output } from '@atc/proto';
import { AgeEnum } from '../validations';

const addAdminNotification = async (
    data: prismaClient.Prisma.AdminNotificationCreateInput,
) => {
    try {
        return await dbClient.adminNotification.create({ data });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAdminNotificationByID = async (
    adminNotificationID: prismaClient.Prisma.AdminNotificationWhereUniqueInput['id'],
) => {
    try {
        return await dbClient.adminNotification.findUnique({
            where: { id: adminNotificationID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateAdminNotificationByID = async (
    adminNotificationID: prismaClient.Prisma.AdminNotificationWhereUniqueInput['id'],
    data: prismaClient.Prisma.AdminNotificationUpdateInput,
) => {
    try {
        return await dbClient.adminNotification.update({
            where: { id: adminNotificationID },
            data,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAllAdminNotifications = async (
    page: number = 1,
    limit: number = 10,
    status?: prismaClient.AdminNotificationStatus,
    startDate?: Date,
    endDate?: Date,
) => {
    try {
        const skip = (page - 1) * limit;

        const dateFilter =
            startDate && endDate
                ? `AND an."createdAt" BETWEEN '${new Date(startDate.setHours(0, 0, 0, 0)).toISOString()}' AND '${new Date(endDate.setHours(23, 59, 59, 999)).toISOString()}'`
                : '';

        const statusFilter = status ? `AND an.status = '${status}'` : '';

        const adminNotifications: Array<{
            admin_notification_id: string;
            title: string;
            description: string;
            scheduled_at: Date;
            channels: string[];
            status: string;
            target_users: TargetUsers__Output;
            createdAt: Date;
            updatedAt: Date;
            no_of_users: number;
            sent_count: number;
        }> = await dbClient.$queryRawUnsafe(`
            SELECT
                an.id AS admin_notification_id,
                an.title,
                an.description,
                an.scheduled_at,
                an.channels,
                an.status,
                an.target_users,
                an."createdAt",
                an."updatedAt",
                CASE 
                    WHEN an.status = '${prismaClient.AdminNotificationStatus.PENDING}' THEN COUNT(u.id)
                    ELSE COALESCE(total_users.user_count, 0)
                END AS no_of_users,
                COALESCE(successful_sends.sent_count, 0) AS sent_count
            FROM
                "AdminNotification" an
            LEFT JOIN "User" u ON 
                an.status = '${prismaClient.AdminNotificationStatus.PENDING}' AND (
                    (
                        (an.target_users->'location')::jsonb ? 'ALL'
                        OR u.region::text = ANY (
                            SELECT unnest(ARRAY(
                                SELECT jsonb_array_elements_text(an.target_users->'location')
                            ))
                        )
                    )
                    AND (
                        (an.target_users->'age')::jsonb ? 'ALL'
                        OR (
                            CASE
                                WHEN (an.target_users->'age')::jsonb ? '${AgeEnum.CHILD}' THEN u.age < 18
                                WHEN (an.target_users->'age')::jsonb ? '${AgeEnum.YOUNG_ADULT}' THEN u.age BETWEEN 18 AND 20
                                WHEN (an.target_users->'age')::jsonb ? '${AgeEnum.ADULT}' THEN u.age BETWEEN 21 AND 30
                                WHEN (an.target_users->'age')::jsonb ? '${AgeEnum.MIDDLE_AGED}' THEN u.age BETWEEN 31 AND 40
                                WHEN (an.target_users->'age')::jsonb ? '${AgeEnum.SENIOR_ADULT}' THEN u.age BETWEEN 41 AND 50
                                WHEN (an.target_users->'age')::jsonb ? '${AgeEnum.OLDER_ADULT}' THEN u.age BETWEEN 51 AND 60
                                WHEN (an.target_users->'age')::jsonb ? '${AgeEnum.SENIOR}' THEN u.age > 60
                                ELSE FALSE
                            END
                        )
                    )
                    AND (
                        an.target_users->>'gender' = 'BOTH'
                        OR u.gender::text = an.target_users->>'gender'
                    )
                    AND (
                        an.target_users->>'has_children' IS NULL
                        OR an.target_users->>'has_children' = 'BOTH'
                        OR (an.target_users->>'has_children' = 'YES' AND u.no_of_children > 0)
                        OR (an.target_users->>'has_children' = 'NO' AND u.no_of_children = 0)
                    )
                ) 
            LEFT JOIN (
                SELECT admin_notification_id, COUNT(DISTINCT user_id) AS user_count
                FROM "Notification"
                GROUP BY admin_notification_id
            ) AS total_users ON an.id = total_users.admin_notification_id
            LEFT JOIN (
                SELECT 
                    admin_notification_id,
                    COUNT(DISTINCT user_id) AS sent_count
                FROM (
                    SELECT 
                        admin_notification_id,
                        user_id,
                        CASE 
                            WHEN COUNT(*) = SUM(CASE WHEN is_sent = true THEN 1 ELSE 0 END) 
                            THEN 1 
                            ELSE 0 
                        END as all_channels_sent
                    FROM "Notification"
                    GROUP BY admin_notification_id, user_id
                ) as user_status
                WHERE all_channels_sent = 1
                GROUP BY admin_notification_id
            ) AS successful_sends ON an.id = successful_sends.admin_notification_id
            WHERE 1=1
            ${statusFilter}
            ${dateFilter}
            GROUP BY
                an.id, an.title, an.description, an.scheduled_at, an.channels, 
                an.status, an.target_users, an."createdAt", an."updatedAt", successful_sends.sent_count, total_users.user_count
            ORDER BY
                an."createdAt" DESC
            LIMIT ${limit}
            OFFSET ${skip}
            `);

        const whereConditions: any = status ? { status } : {};

        if (startDate && endDate) {
            const startOfDay = new Date(startDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(endDate.setHours(23, 59, 59, 999));

            whereConditions.createdAt = {
                gte: startOfDay,
                lte: endOfDay,
            };
        }

        const total = await dbClient.adminNotification.count({
            where: whereConditions,
        });

        return { adminNotifications, total };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const deleteAdminNotificationByID = async (
    adminNotificationID: prismaClient.Prisma.AdminNotificationWhereUniqueInput['id'],
) => {
    try {
        return await dbClient.adminNotification.delete({
            where: { id: adminNotificationID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getProductByID = async (productID: string) => {
    try {
        return await dbClient.masterProduct.findUnique({
            where: { id: productID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const upsertPriceAlert = async (
    data: prismaClient.Prisma.PriceAlertCreateInput,
) => {
    try {
        return await dbClient.priceAlert.upsert({
            where: {
                pricealertmatched_unique: {
                    user_id: data.User.connect?.id!,
                    product_id: data.MasterProduct.connect?.id!,
                },
            },
            update: { target_price: data.target_price },
            create: data,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getPriceAlertByProductID = async (
    productID: prismaClient.Prisma.PriceAlertPricealertmatched_uniqueCompoundUniqueInput['product_id'],
    userID: prismaClient.Prisma.PriceAlertPricealertmatched_uniqueCompoundUniqueInput['user_id'],
) => {
    try {
        return await dbClient.priceAlert.findUnique({
            where: {
                pricealertmatched_unique: {
                    product_id: productID,
                    user_id: userID,
                },
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const deletePriceAlertByID = async (
    priceAlertID: prismaClient.Prisma.PriceAlertWhereUniqueInput['id'],
) => {
    try {
        return await dbClient.priceAlert.delete({
            where: { id: priceAlertID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getPriceAlertsByUserID = async (
    userID: string,
    page: number,
    limit: number,
) => {
    try {
        const skip = (page - 1) * limit;

        const priceAlerts = await dbClient.priceAlert.findMany({
            where: { user_id: userID },
            include: {
                MasterProduct: {
                    include: {
                        retailerCurrentPricing: {
                            include: { Retailer: true },
                        },
                    },
                },
            },
            skip: skip,
            take: limit,
        });

        const total = await dbClient.priceAlert.count({
            where: { user_id: userID },
        });

        return { priceAlerts, total };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAllNotificationsByUserID = async (
    page: number,
    limit: number,
    userID: prismaClient.Prisma.NotificationWhereInput['user_id'],
    notificationType: prismaClient.NotificationType,
) => {
    try {
        const skip = (page - 1) * limit;

        const notifications = await dbClient.notification.findMany({
            where: { user_id: userID, type: notificationType },
            skip: skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        const total = await dbClient.notification.count({
            where: { user_id: userID, type: notificationType },
        });

        return { notifications, total };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const addNewNotification = async (
    data: prismaClient.Prisma.NotificationCreateInput,
) => {
    try {
        return await dbClient.notification.create({ data });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getFailedNotifications = async (adminNotificationID: string) => {
    try {
        return await dbClient.notification.findMany({
            where: {
                admin_notification_id: adminNotificationID,
                is_sent: false,
            },
            include: {
                User: {
                    select: {
                        email: true,
                        phone_number: true,
                        device_endpoint_arn: true,
                    },
                },
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const markNotificationsAsSent = async (notificationIDs: string[]) => {
    try {
        return await dbClient.notification.updateMany({
            where: { id: { in: notificationIDs } },
            data: {
                is_sent: true,
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const avgNotificationCount = async () => {
    try {
        const sentCount = await dbClient.adminNotification.count({
            where: {
                status: prismaClient.AdminNotificationStatus.SENT,
            },
        });

        const failedCount = await dbClient.adminNotification.count({
            where: {
                status: prismaClient.AdminNotificationStatus.FAILED,
            },
        });

        const totalNotifications = sentCount + failedCount;

        const avgSentRatio =
            totalNotifications > 0 ? sentCount / totalNotifications : 0;

        return avgSentRatio;
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

export {
    addAdminNotification,
    getAdminNotificationByID,
    updateAdminNotificationByID,
    getAllAdminNotifications,
    deleteAdminNotificationByID,
    getProductByID,
    upsertPriceAlert,
    getPriceAlertByProductID,
    deletePriceAlertByID,
    getPriceAlertsByUserID,
    getAllNotificationsByUserID,
    addNewNotification,
    getFailedNotifications,
    markNotificationsAsSent,
    avgNotificationCount,
};
