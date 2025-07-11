import { logger } from '@atc/logger';
import { dbClient, prismaClient } from '@atc/db';

const getUserByID = async (id: string) => {
    try {
        return await dbClient.user.findUnique({
            where: { id, is_deleted: false },
            include: {
                Preference: {
                    include: {
                        retailers: {
                            select: { id: true, retailer_name: true },
                        },
                    },
                },
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateUserByID = async (
    id: string,
    data: prismaClient.Prisma.UserUpdateInput,
) => {
    try {
        return await dbClient.user.update({
            where: { id, is_deleted: false },
            data,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const deleteUserByID = async (id: string) => {
    try {
        return await dbClient.user.update({
            where: { id },
            data: { is_deleted: true },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getAllUsers = async (page: number, limit: number) => {
    try {
        const skip = (page - 1) * limit;

        const users = await dbClient.user.findMany({
            where: { is_deleted: false, role: 'user' },
            skip,
            take: limit,
        });

        const totalCount = await dbClient.user.count({
            where: { is_deleted: false, role: 'user' },
        });

        return { users, totalCount };
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const updateUserPreference = async (userID: string, retailer_ids: string[]) => {
    try {
        return await dbClient.preference.upsert({
            where: { user_id: userID },
            update: {
                retailers: {
                    set: retailer_ids.map((retailer_id) => ({
                        id: retailer_id,
                    })),
                },
            },
            create: {
                user_id: userID,
                retailers: {
                    connect: retailer_ids.map((retailer_id) => ({
                        id: retailer_id,
                    })),
                },
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getBasketByUserID = async (
    userID: prismaClient.Prisma.BasketWhereUniqueInput['user_id'],
) => {
    try {
        return await dbClient.basket.findUnique({
            where: { user_id: userID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const createBasket = async (
    basketData: prismaClient.Prisma.BasketCreateInput,
) => {
    try {
        return await dbClient.basket.create({ data: basketData });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const upsertBasketItem = async (
    basketItem: prismaClient.Prisma.BasketItemCreateInput,
) => {
    try {
        return await dbClient.basketItem.upsert({
            where: {
                basketitemmatched_unique: {
                    basket_id: basketItem.basket.connect?.id!,
                    master_product_id: basketItem.master_product.connect?.id!,
                },
            },
            update: { quantity: basketItem.quantity },
            create: basketItem,
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getDetailedBasketByUserID = async (
    userID: prismaClient.Prisma.BasketWhereUniqueInput['user_id'],
    retailerID?: string,
) => {
    try {
        return await dbClient.basket.findUnique({
            where: { user_id: userID },
            include: {
                BasketItem: {
                    include: {
                        master_product: {
                            include: {
                                retailerCurrentPricing: {
                                    where: retailerID
                                        ? { retailer_id: retailerID }
                                        : {},
                                    include: { Retailer: true },
                                    orderBy: { current_price: 'asc' },
                                },
                            },
                        },
                    },
                },
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getPaginatedBasketByUserID = async (
    userID: prismaClient.Prisma.BasketWhereUniqueInput['user_id'],
    page: number,
    limit: number,
    retailerID?: string,
) => {
    try {
        const skip = (page - 1) * limit;

        return await dbClient.basket.findUnique({
            where: { user_id: userID },
            include: {
                BasketItem: {
                    skip,
                    take: limit,
                    include: {
                        master_product: {
                            include: {
                                retailerCurrentPricing: {
                                    where: retailerID
                                        ? { retailer_id: retailerID }
                                        : {},
                                    include: { Retailer: true },
                                },
                            },
                        },
                    },
                },
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const deleteBasketByID = async (
    id: prismaClient.Prisma.BasketWhereUniqueInput['id'],
) => {
    try {
        await dbClient.basketItem.deleteMany({ where: { basket_id: id } });

        return await dbClient.basket.delete({ where: { id: id } });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const deleteBasketItemByID = async (
    id: prismaClient.Prisma.BasketItemWhereUniqueInput['id'],
) => {
    try {
        return await dbClient.basketItem.delete({ where: { id } });
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

const getPostcodeData = async (
    postcode: prismaClient.Prisma.PostcodeWhereUniqueInput['postcode'],
) => {
    try {
        return await dbClient.postcode.findFirst({
            where: { postcode: postcode },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const getPriceAlertsByUserID = async (userID: string) => {
    try {
        return await dbClient.priceAlert.findMany({
            where: { user_id: userID },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const monthlyActiveUsersCount = async () => {
    try {
        const now = new Date();

        const startOfMonth = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
        );

        const endOfMonth = new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth() + 1,
                0,
                23,
                59,
                59,
                999,
            ),
        );

        const rawQuery = `
            SELECT COUNT(DISTINCT user_id) as count
            FROM "UserLoginActivity"
            WHERE login_at >= $1 AND login_at <= $2;
            `;

        // Execute the raw query
        const result = await dbClient.$queryRawUnsafe<{ count: number }[]>(
            rawQuery,
            startOfMonth,
            endOfMonth,
        );

        return Number(result[0]?.count);
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

export {
    getUserByID,
    updateUserByID,
    deleteUserByID,
    getAllUsers,
    updateUserPreference,
    getBasketByUserID,
    createBasket,
    upsertBasketItem,
    getDetailedBasketByUserID,
    deleteBasketByID,
    deleteBasketItemByID,
    getProductByID,
    getPostcodeData,
    getPriceAlertsByUserID,
    getPaginatedBasketByUserID,
    monthlyActiveUsersCount,
};
