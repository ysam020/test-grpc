
# Steps to Generate Mock Files

## 1. Identify which mock files to be created

Navigate to service directory and run this command:

```bash
grep -r "from '@atc" src/ --include="*.ts" | cut -d"'" -f2 | sort | uniq
```

**Expected output format:**
-   @atc/common
-   @atc/db
-   @atc/grpc-config
-   @atc/grpc-server
-   @atc/logger
-   @atc/proto

Create a folder `test/__mocks__` and create files for each external dependencies.

## 2. Steps to generate database mock (`test/__mocks__/@atc/db.js`)
### Find operations

```bash
grep -r "dbClient\." src/ | sed 's/.*dbClient\.\([^.]*\)\.\([^(]*\).*/\1.\2/' | sort | uniq
```

**Expected output format:**

-   ✅  adSuggestedBrand.findUnique **(valid import)**
-   ✅  adSuggestedGroup.updateMany **(valid import)**
-   ✅  adSuggestedProduct.findUnique **(valid import)**
-   ✅  advertisement.create **(valid import)**
-   ✅  productGroupProduct.findMany **(valid import)**
-   ✅  retailer.findUnique **(valid import)**
-   ❌  `src/services/model.service.ts: await dbClient.$transaction([`  **(invalid - sed extraction failed)**
-   ❌  `src/services/model.service.ts: const [matchSummary] = await dbClient.$queryRawUnsafe<`  **(invalid - sed extraction failed)**
-   ❌  `src/services/model.service.ts: const rows = await dbClient.$queryRawUnsafe<any[]>(`  **(invalid - sed extraction failed)**

---
**Clean imports found:** `["adSuggestedBrand", "adSuggestedGroup", "adSuggestedProduct", "advertisement"]`

---
**On the basis of this, create mock file**
```javascript
module.exports= {
  dbClient: {
    $transaction: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    adSuggestedBrand: {
      findUnique: jest.fn(),
      update: jest.fn()
      …
    },
    advertisement: {
      count: jest.fn(),
      create: jest.fn()
    },
    …
  }
}
```

**Then, run this command to find Prisma ENUMS:**

```bash
grep -r "prismaClient\." src/ --include="*.ts" | grep -v "\.Prisma\." | sed 's/.*prismaClient\.\([^.,)]*\).*/\1/' | sort | uniq
```

**Expected output format:**

- AdvertisementStatus
- AdvertisementType

**Then modify the mock file. Add prismaClient.**

```javascript
module.exports= {
  dbClient: {
    $transaction: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    adSuggestedBrand: {
      findUnique: jest.fn(),
      update: jest.fn()
      …
    },
    advertisement: {
      count: jest.fn(),
      create: jest.fn()
    },
    …
  },
  prismaClient: {
	  AdvertisementStatus: {},
	  AdvertisementType: {}
  }
}

```

**Then, run this command for each output from the last command. Example:**

```bash
grep -r "AdvertisementStatus\." src/ --include="*.ts" | sed 's/.*AdvertisementStatus\.\([^,)]*\).*/\1/' | sort | uniq

```

**Expected output format:**

- COMPLETED
- NEEDS_REVIEW



**Expected output format:**

Now modify the mock file again

```javascript
module.exports= {
  dbClient: {
    $transaction: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    adSuggestedBrand: {
      findUnique: jest.fn(),
      update: jest.fn()
      …
    },
    advertisement: {
      count: jest.fn(),
      create: jest.fn()
    },
    …
  },
  prismaClient: {
	 AdvertisementType: {},
	 AdvertisementStatus:{
		NEEDS_REVIEW: "NEEDS_REVIEW",
		COMPLETED: "COMPLETED"
	},
  }
}

```

Now run this command to find Prisma Types

```bash
grep -r "prismaClient\." src/ --include="*.ts" | grep "data:" | sed 's/.*prismaClient\.Prisma\.\([^,)]*\).*/\1/' | sort | uniq

```

**Expected output:**


- AdSuggestedBrandUpdateInput
- AdSuggestedGroupUpdateInput
- AdSuggestedProductUpdateInput
- AdvertisementCreateInput
- AdvertisementItemCreateInput
- AdvertisementItemUpdateInput
- AdvertisementUpdateInput
- ProductGroupCreateInput
- ProductGroupUpdateInput

**Lastly, modify the mock file again**

```javascript
module.exports= {
  dbClient: {
    $transaction: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    adSuggestedBrand: {
      findUnique: jest.fn(),
      update: jest.fn()
      …
    },
    advertisement: {
      count: jest.fn(),
      create: jest.fn()
    },
    …
  },
  prismaClient: {
	 AdvertisementType: {},
	 AdvertisementStatus:{
		NEEDS_REVIEW: "NEEDS_REVIEW",
		COMPLETED: "COMPLETED"
	},
	Prisma: {
		ProductGroupCreateInput: {},
		ProductGroupUpdateInput: {},
		AdvertisementCreateInput: {},
		AdvertisementUpdateInput: {},
		AdvertisementItemCreateInput: {},
		AdvertisementItemUpdateInput: {},
		AdSuggestedProductUpdateInput: {},
		AdSuggestedGroupUpdateInput: {},
		AdSuggestedBrandUpdateInput: {},
	}
  }
}

```

## 3. Steps to generate logger mock (`test/__mocks__/@atc/logger.js`)

**Navigate to service directory and run this command:**

```bash
grep -r "logger\." src/ | sed 's/.*logger\.\([^(]*\).*/\1/' | sort | uniq

```

**Expected output format:**
-   error
-   info

**On the basis of this, create mock file**

```javascript
const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn(),
};

module.exports = {
  logger: mockLogger,
  default: mockLogger,
};

```

## 4. Steps to generate common mock (`test/__mocks__/@atc/common.js`)

**Navigate to service directory and run this command:**

```bash
grep -r "from '@atc/common'" src/ --include="*.ts" | sed 's/.*{\([^}]*\)}.*/\1/' | tr ',' '\n' | sed 's/^[ \t]*//' | sort | uniq
```

**Expected output format:**

-   AdItemMatchType
-   catalogueValidation
-   errorMessage
-   healthCheck
-   ProductMatch
-   responseMessage
-   src/handlers/addAdvertisementItem.ts:} from '@atc/common';
-   src/handlers/createAdvertisement.ts:} from '@atc/common';
-   src/handlers/deleteAdvertisement.ts:} from '@atc/common';
-   startAllWorkers
-   UserRoleEnum
-   utilFns

### Find errorMessage structure

```bash
grep -r "errorMessage\." src/ --include="*.ts" | sed 's/.*errorMessage\.\([A-Z_][A-Z0-9_]*\)\.\([A-Z_][A-Z0-9_]*\).*/\1.\2/' | sort | uniq

```

**Expected output format:**
-   ADVERTISEMENT.AD_IMAGE_NOT_FOUND
-   ADVERTISEMENT.NOT_FOUND
-   BRAND.NOT_FOUND
-   DATE.DATE_BEFORE_START
-   OTHER.INVALID_MIME_TYPE
-   OTHER.SOMETHING_WENT_WRONG
-   PRODUCT_GROUP.NOT_FOUND
-   PRODUCT_GROUP.PRODUCT_IDS_UNIQUE
-   PRODUCT.NOT_FOUND
-   RETAILER.NOT_FOUND
-   WIDGET.INVALID_DATE_FORMAT

### Find responseMessage structure

```bash
grep -r "responseMessage\." src/ --include="*.ts" | sed 's/.*responseMessage\.\([A-Z_][A-Z0-9_]*\)\.\([A-Z_][A-Z0-9_]*\).*/\1.\2/' | sort | uniq
```

**Expected output format:**
-   ADVERTISEMENT.CREATED
-   ADVERTISEMENT.UPDATED
-   ADVERTISEMENT.DELETED
-   EMAIL.MAIL_SENT
-   PRODUCT_GROUP.CREATED
-   PRODUCT_GROUP.UPDATED

### Find enum values for common enums

For enums like UserRoleEnum, ProductMatch, AdItemMatchType:

```bash
# Example for UserRoleEnum
grep -r "UserRoleEnum\." src/ --include="*.ts" | sed 's/.*UserRoleEnum\.\([A-Z_][A-Z0-9_]*\).*/\1/' | sort | uniq

```

**Expected output format:**

- ADMIN
- MODERATOR
- USER

```bash
# Example for ProductMatch
grep -r "ProductMatch\." src/ --include="*.ts" | sed 's/.*ProductMatch\.\([A-Z_][A-Z0-9_]*\).*/\1/' | sort | uniq
```

**Expected output format:**
- MATCHED
- NOT_MATCHED
- IN_PROGRESS

```bash
# Example for AdItemMatchType
grep -r "AdItemMatchType\." src/ --include="*.ts" | sed 's/.*AdItemMatchType\.\([A-Z_][A-Z0-9_]*\).*/\1/' | sort | uniq
```

**Expected output format:**
- PRODUCT
- PRODUCT_GROUP
- BRAND

**On the basis of this, create mock file:**

```javascript
module.exports = {
  errorMessage: {
    ADVERTISEMENT: {
      AD_IMAGE_NOT_FOUND: 'Ad Image Not Found',
      ADVERTISEMENT_ITEM_NOT_FOUND: 'Advertisement Item Not Found',
      CANNOT_TOGGLE_TO_MATCHED: 'Cannot Toggle To Matched',
      NOT_FOUND: 'Not Found',
    },
    BRAND: {
      NOT_FOUND: 'Not Found',
    },
    DATE: {
      DATE_BEFORE_START: 'Date Before Start',
    },
    OTHER: {
      INVALID_MIME_TYPE: 'Invalid Mime Type',
      SOMETHING_WENT_WRONG: 'Something Went Wrong',
    },
    PRODUCT: {
      NOT_FOUND: 'Not Found',
    },
    PRODUCT_GROUP: {
      NOT_FOUND: 'Not Found',
      PRODUCT_IDS_REQUIRED: 'Product Ids Required',
      PRODUCT_IDS_UNIQUE: 'Product Ids Unique',
    },
    RETAILER: {
      NOT_FOUND: 'Not Found',
    },
    WIDGET: {
      INVALID_DATE_FORMAT: 'Invalid Date Format',
    },
  },
  responseMessage: {
    ADVERTISEMENT: {
      ADVERTISEMENT_COMPLETED: 'Advertisement Completed successfully',
      ADVERTISEMENT_ITEM_ADDED: 'Advertisement Item Added successfully',
      ADVERTISEMENT_ITEM_MATCHED: 'Advertisement Item Matched successfully',
      ADVERTISEMENT_ITEM_UPDATED: 'Advertisement Item Updated successfully',
      CREATED: 'Created successfully',
      DELETED: 'Deleted successfully',
      FINISHED_LATER: 'Finished Later successfully',
      RETRIEVED: 'Retrieved successfully',
      UPDATED: 'Updated successfully',
    },
    EMAIL: {
      MAIL_SENT: 'Mail Sent successfully',
    },
    PRODUCT_GROUP: {
      CREATED: 'Created successfully',
      DELETED: 'Deleted successfully',
      PRODUCTS_ATTACHED: 'Products Attached successfully',
      PRODUCTS_REMOVED: 'Products Removed successfully',
      PRODUCTS_RETRIEVED: 'Products Retrieved successfully',
      RETRIEVED: 'Retrieved successfully',
      UPDATED: 'Updated successfully',
    },
  },
  AdItemMatchType: {
    PRODUCT: 'PRODUCT',
    PRODUCT_GROUP: 'PRODUCT_GROUP',
    BRAND: 'BRAND',
  },
  catalogueValidation: jest.fn(),
  healthCheck: jest.fn(),
  ProductMatch: {
    MATCHED: 'MATCHED',
    NOT_MATCHED: 'NOT_MATCHED',
    IN_PROGRESS: 'IN_PROGRESS',
  },
  startAllWorkers: jest.fn(),
  UserRoleEnum: {
    ADMIN: 'ADMIN',
    USER: 'USER',
    MODERATOR: 'MODERATOR',
  },
  utilFns: jest.fn(),
};

```

## 5. Steps to generate gRPC config mock (`test/__mocks__/@atc/grpc-config.js`)

### Find gRPC imports

**Navigate to service directory and run this command:**

```bash
grep -r "from '@atc/grpc-config'" src/ --include="*.ts"

```

**Expected output format:**
-   src/client.ts:import { serviceDefinitions } from '@atc/grpc-config';
-   src/index.ts:import { serviceDefinitions } from '@atc/grpc-config';
-   src/server.ts:import { serviceConfig } from '@atc/grpc-config';

### Find serviceConfig usage

```bash
grep -r "serviceConfig\." src/ --include="*.ts"
```

**Expected output format:**
- src/server.ts:const port = serviceConfig.catalogue?.port || 50051;
- src/server.ts:const host = serviceConfig.catalogue?.host || 'localhost';

This shows usage like: `serviceConfig.catalogue?.host` and `serviceConfig.catalogue?.port`

### Find serviceDefinitions usage

```bash
grep -r "serviceDefinitions\." src/ --include="*.ts"
```

**Expected output format:**
- src/index.ts:            serviceDefinitions.cataloguePackageDefinition.catalogue
- src/client.ts:        new serviceDefinitions.productPackageDefinition.product.ProductService(
- src/client.ts:        new serviceDefinitions.healthPackageDefinition.health.HealthService(

### Extract actual service names from serviceConfig usage

```bash
grep -r "serviceConfig\." src/ --include="*.ts" | sed 's/.*serviceConfig\.\([^?]*\)?.*/\1/' | sort | uniq
```

**Expected output format:**
- catalogue
- product
- notification

### Extract actual package definitions from serviceDefinitions usage

```bash
grep -r "serviceDefinitions\." src/ --include="*.ts" | sed 's/.*serviceDefinitions\.\([^.]*\).*/\1/' | sort | uniq
```

**Expected output format:**
- cataloguePackageDefinition
- productPackageDefinition
- healthPackageDefinition

**Based on the usage patterns, create mock file:**

```javascript
module.exports = {
  serviceConfig: {
    catalogue: {
      host: 'localhost',
      port: 50051,
    },
    product: {
      host: 'localhost',
      port: 50052,
    },
    notification: {
      host: 'localhost',
      port: 50053,
    },
  },

  serviceDefinitions: {
    cataloguePackageDefinition: {
      catalogue: {
        CatalogueService: {
          service: jest.fn(),
        },
      },
    },

    productPackageDefinition: {
      product: {
        ProductService: jest.fn(),
      },
    },

    healthPackageDefinition: {
      health: {
        HealthService: jest.fn(),
      },
    },
  },
};
```

## 6. Steps to generate gRPC server mock (`test/__mocks__/@atc/grpc-server.js`)

### Find gRPC server imports

```bash
grep -r "from '@atc/grpc-server'" src/ --include="*.ts" | sed 's/.*{\([^}]*\)}.*/\1/' | tr ',' '\n' | sed 's/^[ \t]*//' | sort | uniq
```

**Expected output format:**
- authMiddleware
- BaseGrpcServer
- CustomServerUnaryCall
- roleMiddleware
- src/index.ts:} from '@atc/grpc-server';

### Find gRPC server usage patterns

```bash
grep -r "grpcServer\|BaseGrpcServer\|createGrpcServer" src/ --include="*.ts"
```

**Expected output format:**
- src/index.ts:    BaseGrpcServer,
- src/index.ts:export class CatalogueServer extends BaseGrpcServer {

### Analysis Process: From Commands to Mock

#### Step 1: Extract Valid Imports

From the imports command output:

-   ✅ `authMiddleware` (valid import)
-   ✅ `BaseGrpcServer` (valid import)
-   ✅ `CustomServerUnaryCall` (valid import)
-   ✅ `roleMiddleware` (valid import)
-   ❌ `src/index.ts:} from '@atc/grpc-server';` (invalid - sed extraction failed)
---
**Clean imports found:** `["authMiddleware", "BaseGrpcServer", "CustomServerUnaryCall", "roleMiddleware"]`

---
#### Step 2: Analyze Usage Patterns

From the usage command output:

-   ✅ `BaseGrpcServer,` (shows it's imported)
-   ✅ `extends BaseGrpcServer` (shows it's used as a parent class)

**Key insight:** `extends BaseGrpcServer` means BaseGrpcServer is a **CLASS**, not a function.

#### Step 3: Categorize Each Import

```javascript
// Decision logic:
const isBaseClassUsed = true; // Found "extends BaseGrpcServer"

// For each import:
"authMiddleware" → Function → Mock as: jest.fn()
"BaseGrpcServer" → Used with "extends" → Class → Mock as: class
"CustomServerUnaryCall" → Contains "Call" → Type/Interface → Mock as: {}
"roleMiddleware" → Function → Mock as: jest.fn()
```

#### Step 4: Build Class Structure

Since `extends BaseGrpcServer` was found, create a class mock:

```javascript
class MockBaseGrpcServer {
    constructor() {
        this.server = null; // Common gRPC server property
    }
    addService = jest.fn();    // For adding gRPC services
    addMiddleware = jest.fn(); // For adding middleware  
    start = jest.fn();         // For starting the server
    stop = jest.fn();          // For stopping the server
    bind = jest.fn();          // For binding to address
}
```

### Create the mock file

Based on the analysis above, create mock file:

```javascript
class MockBaseGrpcServer {
  constructor() {
    this.server = null;
  }
  
  addService = jest.fn();
  addMiddleware = jest.fn();
  start = jest.fn();
  stop = jest.fn();
  bind = jest.fn();
}

module.exports = {
  BaseGrpcServer: MockBaseGrpcServer,
  authMiddleware: jest.fn(),
  CustomServerUnaryCall: {},
  roleMiddleware: jest.fn(),
  createGrpcServer: jest.fn(),
  startServer: jest.fn(),
  stopServer: jest.fn(),
};
```

## 7. Steps to generate proto mock (`test/__mocks__/@atc/proto.js`)

### Find proto imports

**Navigate to service directory and run this command:**

```bash
grep -r "from '@atc/proto'" src/ --include="*.ts" | sed 's/.*{\([^}]*\)}.*/\1/' | tr ',' '\n' | sed 's/^[ \t]*//' | sort | uniq
```

**Expected output format:**
- CatalogueServiceHandlers 
- CreateProductGroupRequest__Output
- CreateProductGroupResponse
- DefaultResponse
- DefaultResponse__Output
- GetProductByIDsResponse 
- src/handlers/addAdvertisementItem.ts:} from '@atc/proto';
- src/handlers/attachProductsToGroup.ts:} from '@atc/proto';-

### Find service handlers specifically

```bash
grep -r "ServiceHandlers" src/ --include="*.ts" | sed 's/.*\(\w*ServiceHandlers\).*/\1/' | sort | uniq
```

**Expected output format:**
- CatalogueServiceHandlers
- ProductServiceHandlers  
- NotificationServiceHandlers

### Find proto-related enums (including from @atc/common)

```bash
# Find enums used in proto context
grep -r "\w*Enum\." src/ --include="*.ts" | sed 's/.*\(\w*Enum\)\..*/\1/' | sort | uniq
```

**Expected output format:**
- UserRoleEnum
- ProductMatchEnum
- AdItemMatchTypeEnum
- AdvertisementStatusEnum```

### Find non-proto enums used in handlers

```bash
# Check for enums from @atc/common used in proto contexts
grep -r "UserRoleEnum\|ProductMatch\|AdItemMatchType" src/ --include="*.ts"
```

**Expected output format:**
- src/index.ts:            '/catalogue.CatalogueService/CreateProductGroup': [UserRoleEnum.ADMIN],
- src/handlers/matchAdvertisementItem.ts:        switch (match_type) {
- src/handlers/matchAdvertisementItem.ts:            case AdItemMatchType.PRODUCT:
- src/services/model.service.ts:                    type: AdItemMatchType.PRODUCT_GROUP,

### Extract enum values for each enum

For each enum found, run this command to get their values:

```bash
# Example for UserRoleEnum
grep -r "UserRoleEnum\." src/ --include="*.ts" | sed 's/.*UserRoleEnum\.\([A-Z_][A-Z0-9_]*\).*/\1/' | sort | uniq
```

**Expected output format:**
- MODERATOR
- USER

```bash
# Example for ProductMatch (might be from @atc/common)
grep -r "ProductMatch\." src/ --include="*.ts" | sed 's/.*ProductMatch\.\([A-Z_][A-Z0-9_]*\).*/\1/' | sort | uniq
```

**Expected output format:**
- MATCHED
- NOT_MATCHED
- IN_PROGRESS
```

```bash
# Example for AdItemMatchType
grep -r "AdItemMatchType\." src/ --include="*.ts" | sed 's/.*AdItemMatchType\.\([A-Z_][A-Z0-9_]*\).*/\1/' | sort | uniq
```

**Expected output format:**
- PRODUCT
- PRODUCT_GROUP
- BRAND

### Find request/response type patterns

```bash
# Find all request types
grep -r "\w*Request__Output" src/ --include="*.ts" | sed 's/.*\(\w*Request__Output\).*/\1/' | sort | uniq
```

**Expected output format:**
- CreateProductGroupRequest__Output
- UpdateProductGroupRequest__Output
- GetProductGroupRequest__Output
- DeleteProductGroupRequest__Output

```bash
# Find all response types  
grep -r "\w*Response" src/ --include="*.ts" | sed 's/.*\(\w*Response\w*\).*/\1/' | sort | uniq
```

**Expected output format:**
- CreateProductGroupResponse
- CreateProductGroupResponse__Output
- DefaultResponse
- DefaultResponse__Output
- GetProductByIDsResponse

### Find data types

```bash
# Find data structure types
grep -r "\w*Data__Output" src/ --include="*.ts" | sed 's/.*\(\w*Data__Output\).*/\1/' | sort | uniq
```

**Expected output format:**
- ProductGroupData__Output
- AdvertisementData__Output
- AdvertisementItemData__Output
- RetailerData__Output

### Find proto usage patterns

```bash
grep -r "proto\|ServiceDefinition\|\.proto" src/ --include="*.ts"
```

**Expected output format:**
- src/handlers/addAdvertisementItem.ts:} from '@atc/proto';
- src/handlers/index.ts:import { CatalogueServiceHandlers } from '@atc/proto';
- src/services/client.service.ts:import { GetProductByIDsResponse } from '@atc/proto';

### Find specific proto method calls

```bash
grep -r "CatalogueServiceHandlers\|GetProductByIDsResponse" src/ --include="*.ts"
```

**Expected output format:**
- src/handlers/index.ts:import { CatalogueServiceHandlers } from '@atc/proto';
- src/services/client.service.ts:import { GetProductByIDsResponse } from '@atc/proto';

### Analysis Process: From Commands to Mock

#### Step 1: Extract Valid Imports

From the imports command output:

-   ✅ `CatalogueServiceHandlers` (valid import)
-   ✅ `CreateProductGroupRequest__Output` (valid import)
-   ✅ `DefaultResponse__Output` (valid import)
-   ✅ `GetProductByIDsResponse` (valid import)
-   ❌ `src/handlers/...` (invalid - sed extraction failed)

---
**Clean imports found:** `["CatalogueServiceHandlers", "CreateProductGroupRequest__Output", "DefaultResponse__Output", "GetProductByIDsResponse"]`
 
 ---
#### Step 2: Categorize Proto Types

**Service Handlers:**

-   `CatalogueServiceHandlers` → Object with handler methods

**Request Types:**

-   `CreateProductGroupRequest__Output` → Empty object type
-   `UpdateProductGroupRequest__Output` → Empty object type

**Response Types:**

-   `CreateProductGroupResponse` → Empty object type
-   `GetProductByIDsResponse` → Empty object type
-   `DefaultResponse__Output` → Empty object type

**Data Types:**

-   `ProductGroupData__Output` → Empty object type
-   `AdvertisementData__Output` → Empty object type

**Enums (from proto or @atc/common):**

-   `UserRoleEnum` → Object with string values
-   `ProductMatch` → Object with string values
-   `AdItemMatchType` → Object with string values

#### Step 3: Analyze Usage Patterns

From the usage patterns:

-   ✅ `CatalogueServiceHandlers` (imported in handlers/index.ts)
-   ✅ `GetProductByIDsResponse` (imported in services/client.service.ts)

**Key insights:**

-   `CatalogueServiceHandlers` → Collection of handler functions
-   `GetProductByIDsResponse` → Response type/interface
-   `UserRoleEnum` → Used in authorization middleware
-   `AdItemMatchType` → Used in business logic for matching

#### Step 4: Categorize Each Import

```javascript
// Decision logic for proto imports:
"CatalogueServiceHandlers" → Contains "Handlers" → Collection of functions → Mock as object with methods
"CreateProductGroupRequest__Output" → Contains "Request__Output" → Type/Interface → Mock as empty object
"DefaultResponse__Output" → Contains "Response__Output" → Type/Interface → Mock as empty object
"UserRoleEnum" → Contains "Enum" → Enum with values → Mock as object with string values
"ProductMatch" → Used with dot notation → Enum with values → Mock as object with string values
```

#### Step 5: Build Complete Proto Structure

Based on handler files in `src/handlers/`, create comprehensive handler mocks:

```javascript
// CatalogueServiceHandlers - Collection of all handler functions
const mockHandlers = {
    // Product Group Operations
    createProductGroup: jest.fn(),
    getProductGroup: jest.fn(),
    updateProductGroup: jest.fn(),
    deleteProductGroup: jest.fn(),
    attachProductsToGroup: jest.fn(),
    removeProductsFromGroup: jest.fn(),
    getAllProductGroups: jest.fn(),
    getAttachedProducts: jest.fn(),
    
    // Advertisement Operations
    createAdvertisement: jest.fn(),
    getAdvertisements: jest.fn(),
    getSingleAdvertisement: jest.fn(),
    updateAdvertisement: jest.fn(),
    deleteAdvertisement: jest.fn(),
    addAdvertisementItem: jest.fn(),
    matchAdvertisementItem: jest.fn(),
    toggleManualMatchAdItem: jest.fn(),
    markAsCompleteAdvertisement: jest.fn(),
    finishLaterAdvertisement: jest.fn(),
    
    // Export Operations
    exportToExcel: jest.fn(),
    exportToExcelAdvertisements: jest.fn(),
};

// Enums with actual values from codebase
const mockEnums = {
    UserRoleEnum: {
        ADMIN: 'ADMIN',
        USER: 'USER', 
        MODERATOR: 'MODERATOR',
    },
    
    ProductMatch: {
        MATCHED: 'MATCHED',
        NOT_MATCHED: 'NOT_MATCHED',
        IN_PROGRESS: 'IN_PROGRESS',
    },
    
    AdItemMatchType: {
        PRODUCT: 'PRODUCT',
        PRODUCT_GROUP: 'PRODUCT_GROUP',
        BRAND: 'BRAND',
    },
};
```

### Create the complete mock file

Based on the analysis above, create comprehensive mock file:

```javascript
module.exports  = {
// Output Types
	CreateProductGroupResponse__Output: {},
	DefaultResponse__Output: {},
	DeleteAdvertisementRequest__Output: {},
	DeleteProductGroupRequest__Output: {},
	ExportToExcelAdvertisementsRequest__Output: {},
	ExportToExcelSheetRequest__Output: {},
	FinishLaterAdvertisementRequest__Output: {},
	GetAdvertisementsResponse__Output: {},
	GetAllProductGroupsResponse__Output: {},
	GetAttachedProductsResponse__Output: {},
	GetProductGroupResponse__Output: {},
	GetSingleAdvertisementResponse__Output: {},
	MarkAsCompleteAdvertisementRequest__Output: {},
	MatchAdvertisementItemRequest__Output: {},
	RemoveProductsFromGroupRequest__Output: {},
	ToggleManualMatchRequest__Output: {},
	UpdateAdvertisementRequest__Output: {},
	UpdateProductGroupResponse__Output: {},
  
	// Enums
	AdItemMatchType: {
		PRODUCT:  'PRODUCT',
		PRODUCT_GROUP:  'PRODUCT_GROUP',
		BRAND:  'BRAND',
	},
	ProductMatch: {
		MATCHED:  'MATCHED',
		NOT_MATCHED:  'NOT_MATCHED',
		IN_PROGRESS:  'IN_PROGRESS',
	},

	UserRoleEnum: {
		ADMIN:  'ADMIN',
		USER:  'USER',
		MODERATOR:  'MODERATOR',
	},
};
```