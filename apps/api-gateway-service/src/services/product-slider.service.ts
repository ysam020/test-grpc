import { dbClient, prismaClient } from '@atc/db';
import { logger } from '@atc/logger';

const getProductSliderByID = async (
    productSliderID: prismaClient.Prisma.ProductSliderWhereUniqueInput['id'],
) => {
    try {
        return await dbClient.productSlider.findUnique({
            where: { id: productSliderID },
            include: {
                brands: { select: { id: true, brand_name: true } },
                retailers: { select: { id: true, retailer_name: true } },
                categories: { select: { id: true, category_name: true } },
            },
        });
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

export { getProductSliderByID };
