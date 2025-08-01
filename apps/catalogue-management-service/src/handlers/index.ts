import { CatalogueServiceHandlers } from '@atc/proto';
import { createProductGroup } from './createProductGroup';
import { getProductGroup } from './getProductGroup';
import { updateProductGroup } from './updateProductGroup';
import { attachProductsToGroup } from './attachProductsToGroup';
import { getAllProductGroups } from './getAllProductGroups';
import { getAttachedProducts } from './getAttachedProducts';
import { deleteProductGroup } from './deleteProductGroup';
import { removeProductsFromGroup } from './removeProductsFromGroup';
import { exportToExcel } from './exportToExcel';
import { createAdvertisement } from './createAdvertisement';
import { getAdvertisements } from './getAdvertisements';
import { getSingleAdvertisement } from './getSingleAdvertisement';
import { deleteAdvertisement } from './deleteAdvertisement';
import { updateAdvertisement } from './updateAdvertisement';
import { exportToExcelAdvertisements } from './exportToExcelAdvertisements';
import { toggleManualMatch } from './toggleManualMatchAdItem';
import { addAdvertisementItem } from './addAdvertisementItem';
import { matchAdvertisementItem } from './matchAdvertisementItem';
import { finishLaterAdvertisement } from './finishLaterAdvertisement';
import { markAsCompleteAdvertisement } from './markAsCompleteAdvertisement';

export const handlers: CatalogueServiceHandlers = {
    CreateProductGroup: createProductGroup,
    GetProductGroup: getProductGroup,
    UpdateProductGroup: updateProductGroup,
    AttachProductToGroup: attachProductsToGroup,
    GetAllProductGroups: getAllProductGroups,
    GetAttachedProducts: getAttachedProducts,
    DeleteProductGroup: deleteProductGroup,
    RemoveProductsFromGroup: removeProductsFromGroup,
    ExportToExcel: exportToExcel,
    CreateAdvertisement: createAdvertisement,
    GetAdvertisements: getAdvertisements,
    GetSingleAdvertisement: getSingleAdvertisement,
    DeleteAdvertisement: deleteAdvertisement,
    UpdateAdvertisement: updateAdvertisement,
    ExportToExcelAdvertisements: exportToExcelAdvertisements,
    ToggleManualMatch: toggleManualMatch,
    AddAdvertisementItem: addAdvertisementItem,
    MatchAdvertisementItem: matchAdvertisementItem,
    MarkAsCompleteAdvertisement: markAsCompleteAdvertisement,
    FinishLaterAdvertisement: finishLaterAdvertisement,
};
