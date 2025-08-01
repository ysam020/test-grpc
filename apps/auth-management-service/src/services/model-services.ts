import { UserRoleEnum } from '@atc/common';
import { dbClient } from '@atc/db';
import { prismaClient } from '@atc/db';
import { logger } from '@atc/logger';

const createUser = async (user: prismaClient.Prisma.UserCreateInput) => {
    return dbClient.user.create({
        data: user,
    });
};

const getUserByEmail = async (email: string) => {
    return dbClient.user.findUnique({
        where: {
            email,
        },
    });
};

const updateUserData = async (
    id: string,
    user: prismaClient.Prisma.UserUpdateInput,
) => {
    return dbClient.user.update({
        where: {
            id,
        },
        data: user,
    });
};

const getAllRetailersforPreference = async () => {
    return dbClient.retailer.findMany({
        select: {
            id: true,
        },
    });
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

const getAdminDetails = async () => {
    try {
        return await dbClient.user.findFirst({
            where: { role: UserRoleEnum.ADMIN },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

const addUserLoginActivity = async (userID: string) => {
    try {
        return await dbClient.userLoginActivity.create({
            data: { User: { connect: { id: userID } } },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

export {
    createUser,
    getUserByEmail,
    updateUserData,
    getAllRetailersforPreference,
    updateUserPreference,
    getAdminDetails,
    addUserLoginActivity,
};
