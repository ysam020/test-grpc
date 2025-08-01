import { healthCheck, catalogueValidation, UserRoleEnum } from '@atc/common';
import { serviceDefinitions } from '@atc/grpc-config';
import {
    authMiddleware,
    BaseGrpcServer,
    roleMiddleware,
} from '@atc/grpc-server';
import { handlers } from './handlers';
import {
    attachProductsToGroupSchema,
    createAdvertisementSchema,
    exportToExcelAdvertisementsSchema,
    exportToExcelSchema,
    getAdvertisementsSchema,
    getAllProductGroupsSchema,
    getAttachedProductsSchema,
    getSingleAdvertisementSchema,
    matchAdvertisementItemSchema,
    productGroupIDSchema,
    removeProductsFromGroupSchema,
    updateAdvertisementSchema,
    updateProductGroupSchema,
} from './validations';

export class CatalogueServer extends BaseGrpcServer {
    constructor() {
        super();
        this.initializeServer();
    }

    private initializeServer() {
        this.addMiddleware(
            authMiddleware(['/health.HealthService/healthCheck']),
        );

        const roleRequirements = {
            '/catalogue.CatalogueService/CreateProductGroup': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/GetProductGroup': [UserRoleEnum.ADMIN],
            '/catalogue.CatalogueService/UpdateProductGroup': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/AttachProductToGroup': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/GetAllProductGroups': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/GetAttachedProducts': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/DeleteProductGroup': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/RemoveProductsFromGroup': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/ExportToExcel': [UserRoleEnum.ADMIN],
            '/catalogue.CatalogueService/CreateAdvertisement': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/GetAdvertisements': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/GetSingleAdvertisement': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/UpdateAdvertisement': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/ExportToExcelAdvertisements': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/ToggleManualMatch': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/AddAdvertisementItem': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/MatchAdvertisementItem': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/MarkAsCompleteAdvertisement': [
                UserRoleEnum.ADMIN,
            ],
            '/catalogue.CatalogueService/FinishLaterAdvertisement': [
                UserRoleEnum.ADMIN,
            ],
        };

        this.addMiddleware(roleMiddleware(roleRequirements));

        this.addService(
            serviceDefinitions.cataloguePackageDefinition.catalogue
                .CatalogueService.service,
            {
                ...handlers,
                CreateProductGroup: this.wrapWithValidation(
                    handlers.CreateProductGroup,
                    catalogueValidation.createProductGroupSchema,
                ),
                GetProductGroup: this.wrapWithValidation(
                    handlers.GetProductGroup,
                    productGroupIDSchema,
                ),
                UpdateProductGroup: this.wrapWithValidation(
                    handlers.UpdateProductGroup,
                    updateProductGroupSchema,
                ),
                AttachProductToGroup: this.wrapWithValidation(
                    handlers.AttachProductToGroup,
                    attachProductsToGroupSchema,
                ),
                GetAllProductGroups: this.wrapWithValidation(
                    handlers.GetAllProductGroups,
                    getAllProductGroupsSchema,
                ),
                GetAttachedProducts: this.wrapWithValidation(
                    handlers.GetAttachedProducts,
                    getAttachedProductsSchema,
                ),
                DeleteProductGroup: this.wrapWithValidation(
                    handlers.DeleteProductGroup,
                    productGroupIDSchema,
                ),
                RemoveProductsFromGroup: this.wrapWithValidation(
                    handlers.RemoveProductsFromGroup,
                    removeProductsFromGroupSchema,
                ),
                ExportToExcel: this.wrapWithValidation(
                    handlers.ExportToExcel,
                    exportToExcelSchema,
                ),
                CreateAdvertisement: this.wrapWithValidation(
                    handlers.CreateAdvertisement,
                    createAdvertisementSchema,
                ),
                GetAdvertisements: this.wrapWithValidation(
                    handlers.GetAdvertisements,
                    getAdvertisementsSchema,
                ),
                GetSingleAdvertisement: this.wrapWithValidation(
                    handlers.GetSingleAdvertisement,
                    getSingleAdvertisementSchema,
                ),
                UpdateAdvertisement: this.wrapWithValidation(
                    handlers.UpdateAdvertisement,
                    updateAdvertisementSchema,
                ),
                ExportToExcelAdvertisements: this.wrapWithValidation(
                    handlers.ExportToExcelAdvertisements,
                    exportToExcelAdvertisementsSchema,
                ),
                ToggleManualMatch: this.wrapWithValidation(
                    handlers.ToggleManualMatch,
                    catalogueValidation.advertisementItemIDSchema,
                ),
                AddAdvertisementItem: this.wrapWithValidation(
                    handlers.AddAdvertisementItem,
                    catalogueValidation.addAdvertisementItemSchema,
                ),
                MatchAdvertisementItem: this.wrapWithValidation(
                    handlers.MatchAdvertisementItem,
                    matchAdvertisementItemSchema,
                ),
                MarkAsCompleteAdvertisement: this.wrapWithValidation(
                    handlers.MarkAsCompleteAdvertisement,
                    catalogueValidation.advertisementIDSchema,
                ),
                FinishLaterAdvertisement: this.wrapWithValidation(
                    handlers.FinishLaterAdvertisement,
                    catalogueValidation.advertisementIDSchema,
                ),
            },
        );

        this.addService(
            serviceDefinitions.healthPackageDefinition.health.HealthService
                .service,
            { healthCheck },
        );
    }
}
