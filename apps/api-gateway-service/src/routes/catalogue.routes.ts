import { Router } from 'express';
import {
    addAdvertisementItem,
    attachProductsToGroup,
    createAdvertisement,
    createProductGroup,
    deleteAdvertisement,
    deleteProductGroup,
    exportToExcel,
    exportToExcelAdvertisements,
    finishLaterAdvertisement,
    getAdvertisements,
    getAllProductGroups,
    getAttachedProducts,
    getProductGroup,
    getSingleAdvertisement,
    markAsCompleteAdvertisement,
    matchAdvertisementItem,
    removeProductsFromGroup,
    toggleManualMatch,
    updateAdvertisement,
    updateProductGroup,
} from '../controllers/catalogue.controller';
import { validateData } from '../middlewares/validation.middleware';
import {
    authValidation,
    catalogueValidation,
    notificationValidation,
} from '@atc/common';
import { uploadPdfOrImages } from '../middlewares/uploadFile.middleware';

const catalogueRouter = Router();

catalogueRouter.post(
    '/product-group',
    validateData(catalogueValidation.createProductGroupSchema),
    createProductGroup,
);

catalogueRouter.get(
    '/product-group/:group_id',
    validateData(
        undefined,
        undefined,
        catalogueValidation.productGroupIDSchema,
    ),
    getProductGroup,
);

catalogueRouter.put(
    '/product-group/:group_id',
    validateData(
        catalogueValidation.updateProductGroupSchema,
        undefined,
        catalogueValidation.productGroupIDSchema,
    ),
    updateProductGroup,
);

catalogueRouter.post(
    '/product-group/attach-products/:group_id',
    validateData(
        catalogueValidation.attachProductToGroupSchema,
        undefined,
        catalogueValidation.productGroupIDSchema,
    ),
    attachProductsToGroup,
);

catalogueRouter.get(
    '/product-group',
    validateData(undefined, catalogueValidation.getAllProductGroupsSchema),
    getAllProductGroups,
);

catalogueRouter.get(
    '/product-group/attached-products/:group_id',
    validateData(
        undefined,
        notificationValidation.pageAndLimitSchema,
        catalogueValidation.productGroupIDSchema,
    ),
    getAttachedProducts,
);

catalogueRouter.delete(
    '/product-group/:group_id',
    validateData(
        undefined,
        undefined,
        catalogueValidation.productGroupIDSchema,
    ),
    deleteProductGroup,
);

catalogueRouter.delete(
    '/product-group/attached-products/:group_id',
    validateData(
        catalogueValidation.removeProductsFromGroupSchema,
        undefined,
        catalogueValidation.productGroupIDSchema,
    ),
    removeProductsFromGroup,
);

catalogueRouter.get(
    '/product-group/export-to-excel/:group_id',
    validateData(
        undefined,
        authValidation.emailSchema,
        catalogueValidation.productGroupIDSchema,
    ),
    exportToExcel,
);

catalogueRouter.post(
    '/',
    uploadPdfOrImages,
    validateData(catalogueValidation.createAdvertisementSchema),
    createAdvertisement,
);

catalogueRouter.get(
    '/',
    validateData(undefined, catalogueValidation.getAdvertisementsSchema),
    getAdvertisements,
);

catalogueRouter.put(
    '/toggle-manual-match/:ad_item_id',
    validateData(
        undefined,
        undefined,
        catalogueValidation.advertisementItemIDSchema,
    ),
    toggleManualMatch,
);

catalogueRouter.get(
    '/export-to-excel',
    validateData(
        undefined,
        catalogueValidation.exportToExcelAdvertisementsSchema,
    ),
    exportToExcelAdvertisements,
);

catalogueRouter.post(
    '/advertisement-item',
    validateData(catalogueValidation.addAdvertisementItemSchema),
    addAdvertisementItem,
);

catalogueRouter.post(
    '/match/:match_type',
    validateData(
        catalogueValidation.matchAdvertisementItemSchema,
        undefined,
        catalogueValidation.matchAdItemTypeSchema,
    ),
    matchAdvertisementItem,
);

catalogueRouter.post(
    '/mark-as-complete/:advertisement_id',
    validateData(
        undefined,
        undefined,
        catalogueValidation.advertisementIDSchema,
    ),
    markAsCompleteAdvertisement,
);

catalogueRouter.post(
    '/finish-later/:advertisement_id',
    validateData(
        undefined,
        undefined,
        catalogueValidation.advertisementIDSchema,
    ),
    finishLaterAdvertisement,
);

catalogueRouter.get(
    '/:advertisement_id',
    validateData(
        undefined,
        catalogueValidation.getSingleAdvertisementSchema,
        catalogueValidation.advertisementIDSchema,
    ),
    getSingleAdvertisement,
);

catalogueRouter.delete(
    '/:advertisement_id',
    validateData(
        undefined,
        undefined,
        catalogueValidation.advertisementIDSchema,
    ),
    deleteAdvertisement,
);

catalogueRouter.put(
    '/:advertisement_id',
    validateData(
        catalogueValidation.updateAdvertisementSchema,
        undefined,
        catalogueValidation.advertisementIDSchema,
    ),
    updateAdvertisement,
);

export { catalogueRouter };
