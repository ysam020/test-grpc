/**
 * Mock Generator - Only Uses Actually Found Code Patterns
 * Generates mock files based ONLY on what's actually used in your code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MockGenerator {
    constructor() {
        this.serviceDir = '.';
        this.mockDir = '__tests__/__mocks__';
        this.srcDir = 'src';
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
        };

        // Always include these special operations (commonly used)
        this.commonSpecialOperations = [
            '$transaction',
            '$queryRawUnsafe',
            '$queryRaw',
            '$executeRaw',
            '$executeRawUnsafe'
        ];

        // Valid database methods
        this.validDbMethods = [
            'findUnique', 'findFirst', 'findMany', 'create', 'createMany',
            'update', 'updateMany', 'upsert', 'delete', 'deleteMany',
            'count', 'aggregate', 'groupBy'
        ];
    }

    log(message, color = 'reset') {
        console.log(`${this.colors[color]}${message}${this.colors.reset}`);
    }

    success(message) { this.log(`✅ ${message}`, 'green'); }
    info(message) { this.log(`ℹ️  ${message}`, 'blue'); }
    warning(message) { this.log(`⚠️  ${message}`, 'yellow'); }
    error(message) { this.log(`❌ ${message}`, 'red'); }
    step(message) { this.log(`🔍 ${message}`, 'magenta'); }

    executeCommand(description, command) {
        console.log(`   ${command}`);
        
        try {
            const result = execSync(command, { 
                encoding: 'utf8', 
                cwd: this.serviceDir,
                stderr: 'pipe'
            });
            
            const lines = result.trim().split('\n').filter(line => line.trim());
            
            if (lines.length > 0) {
                console.log(`   Found ${lines.length} results`);
                return lines;
            } else {
                console.log('   No results found');
                return [];
            }
        } catch (error) {
            console.log('   No results found');
            return [];
        }
    }

    createDirectories() {
        this.info('📁 Creating directories...');
        
        if (!fs.existsSync(this.mockDir)) {
            fs.mkdirSync(this.mockDir, { recursive: true });
        }
        
        const atcDir = path.join(this.mockDir, '@atc');
        if (!fs.existsSync(atcDir)) {
            fs.mkdirSync(atcDir, { recursive: true });
        }
    }

    // Step 1: Identify dependencies (exact MD command)
    identifyDependencies() {
        this.step('Step 1: Identifying which mock files to be created');
        
        const command = `grep -r "from '@atc" ${this.srcDir}/ --include="*.ts" | cut -d"'" -f2 | sort | uniq`;
        const dependencies = this.executeCommand('Dependencies command', command);
        
        console.log('   Expected format: @atc/common, @atc/db, @atc/logger, etc.');
        console.log('   Found dependencies:');
        dependencies.forEach(dep => console.log(`     - ${dep}`));
        console.log('');
        return dependencies;
    }

    // Step 2: Generate database mock
    generateDatabaseMock() {
        this.step('Step 2: Generating database mock (@atc/db.js)');
        
        // 2.1: Find operations (exact MD command)
        console.log('   Finding database operations...');
        const operationsCommand = `grep -r "dbClient\\." ${this.srcDir}/ | sed 's/.*dbClient\\.\\([^.]*\\)\\.\\([^(]*\\).*/\\1.\\2/' | sort | uniq`;
        const rawOperations = this.executeCommand('Database operations', operationsCommand);
        
        // Filter valid operations
        const validOperations = [];
        const tableOperations = {};
        
        rawOperations.forEach(op => {
            if (op.includes('.') && !op.includes('/') && !op.includes('src')) {
                const [tableName, methodName] = op.split('.');
                if (tableName && methodName && this.validDbMethods.includes(methodName)) {
                    validOperations.push(op);
                    if (!tableOperations[tableName]) {
                        tableOperations[tableName] = new Set();
                    }
                    tableOperations[tableName].add(methodName);
                }
            }
        });

        // 2.2: Find Prisma enums (exact MD command)
        console.log('   Finding Prisma enums...');
        const enumsCommand = `grep -r "prismaClient\\." ${this.srcDir}/ --include="*.ts" | grep -v "\\.Prisma\\." | sed 's/.*prismaClient\\.\\([^.,)]*\\).*/\\1/' | sort | uniq`;
        const rawEnums = this.executeCommand('Prisma enums', enumsCommand);
        
        const validEnums = rawEnums.filter(e => e && /^[A-Z][A-Za-z0-9]*$/.test(e) && !e.includes('/'));

        // 2.3: Find enum values for each enum
        const enumValues = {};
        validEnums.forEach(enumName => {
            const enumCommand = `grep -r "${enumName}\\." ${this.srcDir}/ --include="*.ts" | sed "s/.*${enumName}\\.\\([^,)]*\\).*/\\1/" | sort | uniq`;
            try {
                const values = execSync(enumCommand, { encoding: 'utf8', cwd: this.serviceDir })
                    .trim().split('\n')
                    .filter(v => v && /^[A-Z][A-Z0-9_]*$/.test(v));
                enumValues[enumName] = values;
            } catch (error) {
                enumValues[enumName] = [];
            }
        });

        // 2.4: Find Prisma types (exact MD command)
        console.log('   Finding Prisma types...');
        const typesCommand = `grep -r "prismaClient\\." ${this.srcDir}/ --include="*.ts" | grep "data:" | sed 's/.*prismaClient\\.Prisma\\.\\([^,)]*\\).*/\\1/' | sort | uniq`;
        const rawTypes = this.executeCommand('Prisma types', typesCommand);
        
        const validTypes = rawTypes.filter(t => t && /^[A-Z][A-Za-z0-9]*$/.test(t) && !t.includes('[') && !t.includes('='));

        // Generate db.js file
        this.generateDbFile(tableOperations, validEnums, enumValues, validTypes);
        
        console.log('');
        return { operations: validOperations.length, enums: validEnums.length, types: validTypes.length };
    }

    generateDbFile(tableOperations, enums, enumValues, types) {
        const outputFile = path.join(this.mockDir, '@atc', 'db.js');
        
        let content = `// Auto-generated mock file for @atc/db\nmodule.exports = {\n  dbClient: {\n`;

        // Add special operations first
        this.commonSpecialOperations.forEach(op => {
            content += `    ${op}: jest.fn(),\n`;
        });

        // Add table operations
        Object.keys(tableOperations).sort().forEach(tableName => {
            content += `    ${tableName}: {\n`;
            Array.from(tableOperations[tableName]).sort().forEach(methodName => {
                content += `      ${methodName}: jest.fn(),\n`;
            });
            content += `    },\n`;
        });

        content += `  },\n  prismaClient: {\n`;

        // Add enums with values
        enums.forEach(enumName => {
            const values = enumValues[enumName] || [];
            content += `    ${enumName}: {\n`;
            values.forEach(value => {
                content += `      ${value}: "${value}",\n`;
            });
            content += `    },\n`;
        });

        // Add Prisma types
        content += `    Prisma: {\n`;
        types.forEach(typeName => {
            content += `      ${typeName}: {},\n`;
        });
        content += `    },\n`;

        content += `  }\n};\n`;

        fs.writeFileSync(outputFile, content);
        this.success(`Generated: ${outputFile}`);
    }

    // Step 3: Generate logger mock (exact MD steps)
    generateLoggerMock() {
        this.step('Step 3: Generating logger mock (@atc/logger.js)');
        
        const command = `grep -r "logger\\." ${this.srcDir}/ | sed 's/.*logger\\.\\([^(]*\\).*/\\1/' | sort | uniq`;
        const loggerMethods = this.executeCommand('Logger methods', command);
        
        // Filter valid logger methods
        const validMethods = loggerMethods.filter(method => 
            method && /^[a-zA-Z]+$/.test(method) && !method.includes('/') && !method.includes('src')
        );

        // Always include common logger methods even if not found
        const commonMethods = ['info', 'error', 'warn', 'debug', 'trace', 'fatal'];
        const allMethods = [...new Set([...validMethods, ...commonMethods])];

        const outputFile = path.join(this.mockDir, '@atc', 'logger.js');
        
        let content = `// Auto-generated mock file for @atc/logger\nconst mockLogger = {\n`;
        allMethods.sort().forEach(method => {
            content += `  ${method}: jest.fn(),\n`;
        });
        content += `};\n\nmodule.exports = {\n  logger: mockLogger,\n  default: mockLogger,\n};\n`;

        fs.writeFileSync(outputFile, content);
        this.success(`Generated: ${outputFile}`);
        
        console.log('');
        this.info(`Generated ${allMethods.length} logger methods (${validMethods.length} found + ${commonMethods.length} common)`);
        return { methods: allMethods.length };
    }

    // Step 4: Generate common mock (exact MD steps)
    generateCommonMock() {
        this.step('Step 4: Generating common mock (@atc/common.js)');
        
        // Find common imports
        const importsCommand = `grep -r "from '@atc/common'" ${this.srcDir}/ --include="*.ts" | sed 's/.*{\\([^}]*\\)}.*/\\1/' | tr ',' '\\n' | sed 's/^[ \\t]*//' | sort | uniq`;
        const commonImports = this.executeCommand('Common imports', importsCommand);
        
        // Filter valid imports (remove file paths and invalid entries)
        const validImports = commonImports.filter(imp => 
            imp && 
            !imp.includes('/') && 
            !imp.includes('.ts') && 
            !imp.includes('{') &&
            !imp.includes('}') &&
            !imp.includes('(') &&
            !imp.includes(')') &&
            imp.length > 0 &&
            /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(imp.trim())
        ).map(imp => imp.trim());

        // Find errorMessage structure
        console.log('   Finding errorMessage structure...');
        const errorMessages = this.findErrorMessages();
        
        console.log('   Finding responseMessage structure...');
        const responseMessages = this.findResponseMessages();

        // Find enums that might be imported from common
        console.log('   Finding enums from common...');
        const commonEnums = this.findCommonEnums();

        const outputFile = path.join(this.mockDir, '@atc', 'common.js');
        
        let content = `// Auto-generated mock file for @atc/common\nmodule.exports = {\n`;
        
        // Add errorMessage if found
        if (errorMessages && Object.keys(errorMessages).length > 0) {
            content += `  errorMessage: {\n`;
            Object.keys(errorMessages).sort().forEach(category => {
                content += `    ${category}: {\n`;
                Object.keys(errorMessages[category]).sort().forEach(key => {
                    content += `      ${key}: '${errorMessages[category][key]}',\n`;
                });
                content += `    },\n`;
            });
            content += `  },\n`;
        }

        // Add responseMessage if found
        if (responseMessages && Object.keys(responseMessages).length > 0) {
            content += `  responseMessage: {\n`;
            Object.keys(responseMessages).sort().forEach(category => {
                content += `    ${category}: {\n`;
                Object.keys(responseMessages[category]).sort().forEach(key => {
                    content += `      ${key}: '${responseMessages[category][key]}',\n`;
                });
                content += `    },\n`;
            });
            content += `  },\n`;
        }

        // Add enums found in common
        if (commonEnums && Object.keys(commonEnums).length > 0) {
            Object.entries(commonEnums).forEach(([enumName, enumValues]) => {
                content += `  ${enumName}: {\n`;
                if (enumValues.length > 0) {
                    enumValues.forEach(value => {
                        content += `    ${value}: '${value}',\n`;
                    });
                } else {
                    content += `    // Add enum values as needed\n`;
                }
                content += `  },\n`;
            });
        }

        // Add other common exports (functions, objects, etc.)
        const otherExports = validImports.filter(imp => 
            !['errorMessage', 'responseMessage'].includes(imp) &&
            !commonEnums.hasOwnProperty(imp) &&
            imp.length > 1
        );

        otherExports.forEach(exportName => {
            if (/^[A-Z]/.test(exportName) && !exportName.includes('Enum')) {
                // Likely an enum or constant that we haven't detected values for
                content += `  ${exportName}: {\n    // Add enum values as needed\n  },\n`;
            } else {
                // Function or object export
                content += `  ${exportName}: jest.fn(),\n`;
            }
        });

        content += `};\n`;

        fs.writeFileSync(outputFile, content);
        this.success(`Generated: ${outputFile}`);
        
        console.log('');
        this.info(`Generated errorMessage categories: ${Object.keys(errorMessages).length}`);
        this.info(`Generated responseMessage categories: ${Object.keys(responseMessages).length}`);
        this.info(`Generated enums: ${Object.keys(commonEnums).length}`);
        this.info(`Other exports: ${otherExports.length}`);
        
        return { 
            imports: validImports.length,
            errorCategories: Object.keys(errorMessages).length,
            responseCategories: Object.keys(responseMessages).length,
            enums: Object.keys(commonEnums).length
        };
    }

    // Find enums that are imported from @atc/common
    findCommonEnums() {
        const commonEnums = {};
        
        // Look for enum-like imports and usage
        const enumCandidates = ['UserRoleEnum', 'ProductMatch', 'AdItemMatchType', 'ChartType'];
        
        enumCandidates.forEach(enumName => {
            // Check if this enum is imported or used
            const checkCommand = `grep -r "${enumName}" ${this.srcDir}/ --include="*.ts" | head -1`;
            try {
                const result = execSync(checkCommand, { encoding: 'utf8', cwd: this.serviceDir });
                if (result.trim()) {
                    // Try to find enum values
                    const valuesCommand = `grep -r "${enumName}\\." ${this.srcDir}/ --include="*.ts" | sed 's/.*${enumName}\\.\\([A-Z_][A-Z0-9_]*\\).*/\\1/' | sort | uniq`;
                    try {
                        const values = execSync(valuesCommand, { encoding: 'utf8', cwd: this.serviceDir })
                            .trim().split('\n')
                            .filter(v => v && /^[A-Z_][A-Z0-9_]*$/.test(v));
                        commonEnums[enumName] = values;
                    } catch (error) {
                        commonEnums[enumName] = [];
                    }
                }
            } catch (error) {
                // Enum not found, skip
            }
        });

        return commonEnums;
    }

    findErrorMessages() {
        try {
            // Use a more comprehensive approach to find error messages
            const command = `grep -r "errorMessage\\." ${this.srcDir}/ --include="*.ts" | grep -v "import" | sed 's/.*errorMessage\\.\\([A-Z_][A-Z0-9_]*\\)\\.\\([A-Z_][A-Z0-9_]*\\).*/\\1.\\2/' | sort | uniq`;
            const errorPaths = execSync(command, { encoding: 'utf8', cwd: this.serviceDir })
                .trim().split('\n').filter(line => line.trim() && line.includes('.'));

            const errorMessages = {};
            
            errorPaths.forEach(path => {
                const parts = path.split('.');
                if (parts.length === 2) {
                    const category = parts[0];
                    const key = parts[1];
                    
                    // Validate category and key format
                    if (/^[A-Z_][A-Z0-9_]*$/.test(category) && /^[A-Z_][A-Z0-9_]*$/.test(key)) {
                        if (!errorMessages[category]) {
                            errorMessages[category] = {};
                        }
                        
                        // Generate a reasonable error message from the key
                        const message = key.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                        ).join(' ');
                        
                        errorMessages[category][key] = message;
                    }
                }
            });

            return errorMessages;
        } catch (error) {
            console.log('   Error finding error messages:', error.message);
            return {};
        }
    }

    findResponseMessages() {
        try {
            // Use a more comprehensive approach to find response messages
            const command = `grep -r "responseMessage\\." ${this.srcDir}/ --include="*.ts" | grep -v "import" | sed 's/.*responseMessage\\.\\([A-Z_][A-Z0-9_]*\\)\\.\\([A-Z_][A-Z0-9_]*\\).*/\\1.\\2/' | sort | uniq`;
            const responsePaths = execSync(command, { encoding: 'utf8', cwd: this.serviceDir })
                .trim().split('\n').filter(line => line.trim() && line.includes('.'));

            const responseMessages = {};
            
            responsePaths.forEach(path => {
                const parts = path.split('.');
                if (parts.length === 2) {
                    const category = parts[0];
                    const key = parts[1];
                    
                    // Validate category and key format
                    if (/^[A-Z_][A-Z0-9_]*$/.test(category) && /^[A-Z_][A-Z0-9_]*$/.test(key)) {
                        if (!responseMessages[category]) {
                            responseMessages[category] = {};
                        }
                        
                        // Generate a reasonable response message from the key
                        const message = key.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                        ).join(' ') + ' successfully';
                        
                        responseMessages[category][key] = message;
                    }
                }
            });

            return responseMessages;
        } catch (error) {
            console.log('   Error finding response messages:', error.message);
            return {};
        }
    }

    // Step 5: Generate gRPC config mock (only actual usage)
    generateGrpcConfigMock() {
        this.step('Step 5: Generating gRPC config mock (@atc/grpc-config.js)');
        
        // Find gRPC imports to check what's actually imported
        const importsCommand = `grep -r "from '@atc/grpc-config'" ${this.srcDir}/ --include="*.ts"`;
        const grpcImportLines = this.executeCommand('gRPC imports', importsCommand);
        
        // Check if serviceConfig or serviceDefinitions are imported
        const hasServiceConfig = grpcImportLines.some(line => line.includes('serviceConfig'));
        const hasServiceDefinitions = grpcImportLines.some(line => line.includes('serviceDefinitions'));
        
        const outputFile = path.join(this.mockDir, '@atc', 'grpc-config.js');
        let content = `// Auto-generated mock file for @atc/grpc-config\nmodule.exports = {\n`;
        
        // Only add serviceConfig if it's actually imported and used
        if (hasServiceConfig) {
            const serviceConfigCommand = `grep -r "serviceConfig\\." ${this.srcDir}/ --include="*.ts"`;
            const serviceConfigUsage = this.executeCommand('serviceConfig usage', serviceConfigCommand);
            
            // Extract ONLY the services that are actually used
            const actualServiceNames = new Set();
            
            serviceConfigUsage.forEach(line => {
                const match = line.match(/serviceConfig\.(\w+)\?/);
                if (match) {
                    actualServiceNames.add(match[1]);
                }
            });
            
            if (actualServiceNames.size > 0) {
                content += `  serviceConfig: {\n`;
                let port = 50051;
                
                actualServiceNames.forEach(serviceName => {
                    content += `    ${serviceName}: {\n`;
                    content += `      host: 'localhost',\n`;
                    content += `      port: ${port++},\n`;
                    content += `    },\n`;
                });
                
                content += `  },\n`;
                
                this.info(`Found ${actualServiceNames.size} actual services in serviceConfig: ${Array.from(actualServiceNames).join(', ')}`);
            } else {
                this.warning('serviceConfig imported but no actual usage found');
            }
        }

        // Only add serviceDefinitions if it's actually imported and used
        if (hasServiceDefinitions) {
            const serviceDefsCommand = `grep -r "serviceDefinitions\\." ${this.srcDir}/ --include="*.ts"`;
            const serviceDefsUsage = this.executeCommand('serviceDefinitions usage', serviceDefsCommand);
            
            // Extract package definitions that are actually used
            const actualPackageDefinitions = new Set();
            const packageUsageDetails = {};
            
            serviceDefsUsage.forEach(line => {
                const packageMatch = line.match(/serviceDefinitions\.(\w+PackageDefinition)/);
                if (packageMatch) {
                    const packageDef = packageMatch[1];
                    actualPackageDefinitions.add(packageDef);
                    
                    if (!packageUsageDetails[packageDef]) {
                        packageUsageDetails[packageDef] = {
                            serviceName: packageDef.replace('PackageDefinition', ''),
                            services: new Set()
                        };
                    }
                    
                    // Check for specific service usage patterns
                    const fullMatch = line.match(/serviceDefinitions\.(\w+PackageDefinition)\.(\w+)\.(\w+)/);
                    if (fullMatch) {
                        const [, , serviceName, className] = fullMatch;
                        
                        // Determine usage pattern
                        let usageType = 'service'; // default
                        if (line.includes(`new serviceDefinitions.${packageDef}.${serviceName}.${className}`)) {
                            usageType = 'constructor';
                        } else if (line.includes(`.${className}.service`)) {
                            usageType = 'service';
                        }
                        
                        packageUsageDetails[packageDef].services.add({
                            className: className,
                            usageType: usageType
                        });
                    }
                }
            });
            
            if (actualPackageDefinitions.size > 0) {
                content += `\n  serviceDefinitions: {\n`;
                
                actualPackageDefinitions.forEach(packageDef => {
                    const details = packageUsageDetails[packageDef];
                    const serviceName = details.serviceName;
                    
                    content += `    ${packageDef}: {\n`;
                    content += `      ${serviceName}: {\n`;
                    
                    if (details.services.size > 0) {
                        details.services.forEach(serviceInfo => {
                            if (serviceInfo.usageType === 'constructor') {
                                content += `        ${serviceInfo.className}: jest.fn(),\n`;
                            } else {
                                content += `        ${serviceInfo.className}: {\n`;
                                content += `          service: jest.fn(),\n`;
                                content += `        },\n`;
                            }
                        });
                    } else {
                        // Default service structure if no specific usage found
                        const defaultServiceName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1) + 'Service';
                        content += `        ${defaultServiceName}: {\n`;
                        content += `          service: jest.fn(),\n`;
                        content += `        },\n`;
                    }
                    
                    content += `      },\n`;
                    content += `    },\n`;
                });
                
                content += `  },\n`;
                
                this.info(`Found ${actualPackageDefinitions.size} actual package definitions: ${Array.from(actualPackageDefinitions).join(', ')}`);
            } else {
                this.warning('serviceDefinitions imported but no actual usage found');
            }
        }

        content += `};\n`;

        fs.writeFileSync(outputFile, content);
        this.success(`Generated: ${outputFile}`);
        
        console.log('');
        return { 
            hasServiceConfig: hasServiceConfig,
            hasServiceDefinitions: hasServiceDefinitions
        };
    }

    // Generate gRPC server mock (based on actual usage)
    generateGrpcServerMock() {
        this.step('Step 6: Generating gRPC server mock (@atc/grpc-server.js)');
        
        // Find gRPC server imports
        const importsCommand = `grep -r "from '@atc/grpc-server'" ${this.srcDir}/ --include="*.ts" | sed 's/.*{\\([^}]*\\)}.*/\\1/' | tr ',' '\\n' | sed 's/^[ \\t]*//' | sort | uniq`;
        const grpcServerImports = this.executeCommand('gRPC server imports', importsCommand);
        
        // Filter valid imports (remove file paths)
        const validImports = grpcServerImports.filter(imp => 
            imp && !imp.includes('/') && !imp.includes('.ts') && imp.length > 0
        );
        
        // Find gRPC server usage patterns
        const usageCommand = `grep -r "grpcServer\\|BaseGrpcServer\\|createGrpcServer" ${this.srcDir}/ --include="*.ts"`;
        const grpcServerUsage = this.executeCommand('gRPC server usage', usageCommand);
        
        const outputFile = path.join(this.mockDir, '@atc', 'grpc-server.js');
        
        let content = `// Auto-generated mock file for @atc/grpc-server\n`;
        
        // Check if BaseGrpcServer is used as a class (extends)
        const isBaseClassUsed = grpcServerUsage.some(line => line.includes('extends BaseGrpcServer'));
        
        if (isBaseClassUsed) {
            // BaseGrpcServer should be a class constructor
            content += `class MockBaseGrpcServer {\n`;
            content += `  constructor() {\n`;
            content += `    this.server = null;\n`;
            content += `  }\n`;
            content += `  \n`;
            content += `  addService = jest.fn();\n`;
            content += `  addMiddleware = jest.fn();\n`;
            content += `  start = jest.fn();\n`;
            content += `  stop = jest.fn();\n`;
            content += `  bind = jest.fn();\n`;
            content += `}\n\n`;
            
            content += `module.exports = {\n`;
            content += `  BaseGrpcServer: MockBaseGrpcServer,\n`;
        } else {
            content += `module.exports = {\n`;
        }
        
        // Add other found imports
        validImports.forEach(importName => {
            if (importName !== 'BaseGrpcServer') {
                if (importName.includes('Call') || importName.includes('Type')) {
                    // Mock types/interfaces as objects
                    content += `  ${importName}: {},\n`;
                } else {
                    // Mock functions
                    content += `  ${importName}: jest.fn(),\n`;
                }
            }
        });
        
        // Add common gRPC server exports if not already added
        const commonExports = ['createGrpcServer', 'startServer', 'stopServer'];
        commonExports.forEach(exportName => {
            if (!validImports.includes(exportName)) {
                content += `  ${exportName}: jest.fn(),\n`;
            }
        });
        
        content += `};\n`;

        fs.writeFileSync(outputFile, content);
        this.success(`Generated: ${outputFile}`);
        
        console.log('');
        this.info(`Found ${validImports.length} gRPC server imports: ${validImports.join(', ')}`);
        this.info(`BaseGrpcServer used as class: ${isBaseClassUsed ? 'Yes' : 'No'}`);
        
        return { imports: validImports.length, isBaseClass: isBaseClassUsed };
    }

    // Generate proto mock (based on actual usage)
    generateProtoMock() {
        this.step('Step 7: Generating proto mock (@atc/proto.js)');
        
        // Find proto imports
        const importsCommand = `grep -r "from '@atc/proto'" ${this.srcDir}/ --include="*.ts" -A 1 -B 1`;
        const protoImportLines = this.executeCommand('Proto imports with context', importsCommand);
        
        // Extract actual proto imports from the context
        let protoImports = new Set();
        
        protoImportLines.forEach(line => {
            // Look for import lines and extract the imported items
            if (line.includes('from \'@atc/proto\'') || line.includes('from "@atc/proto"')) {
                // This is an import line, skip it
                return;
            }
            
            // Look for lines that contain proto type names
            const typeMatches = line.match(/(\w+(?:Request|Response|__Output|Handlers|Data|Enum))/g);
            if (typeMatches) {
                typeMatches.forEach(match => protoImports.add(match));
            }
        });
        
        // Also try the simpler extraction method as fallback
        const simpleImportsCommand = `grep -r "from '@atc/proto'" ${this.srcDir}/ --include="*.ts" | sed 's/.*{\\([^}]*\\)}.*/\\1/' | tr ',' '\\n' | sed 's/^[ \\t]*//' | sort | uniq`;
        const simpleImports = this.executeCommand('Simple proto imports', simpleImportsCommand);
        
        // Filter valid imports from simple method
        const validSimpleImports = simpleImports.filter(imp => 
            imp && 
            !imp.includes('/') && 
            !imp.includes('.ts') && 
            imp.length > 0 &&
            /^[A-Z][A-Za-z0-9_]*$/.test(imp)
        );
        
        // Combine both methods
        validSimpleImports.forEach(imp => protoImports.add(imp));

        // Find service handlers specifically
        console.log('   Finding service handlers...');
        const handlersCommand = `grep -r "ServiceHandlers" ${this.srcDir}/ --include="*.ts" | sed 's/.*\\(\\w*ServiceHandlers\\).*/\\1/' | sort | uniq`;
        const serviceHandlers = this.executeCommand('Service handlers', handlersCommand);
        
        // Add service handlers to imports
        serviceHandlers.forEach(handler => {
            if (handler && /^[A-Z]\w*ServiceHandlers$/.test(handler)) {
                protoImports.add(handler);
            }
        });

        // Find enums used in the code (including from @atc/common and other sources)
        console.log('   Finding proto-related enums...');
        const enumsCommand = `grep -r "\\w*Enum\\." ${this.srcDir}/ --include="*.ts" | sed 's/.*\\(\\w*Enum\\)\\..*/\\1/' | sort | uniq`;
        const allEnums = this.executeCommand('All enums used', enumsCommand);
        
        // Also look for common proto-related enums that might be used in handlers
        const commonProtoEnums = ['UserRoleEnum', 'ProductMatchEnum', 'AdItemMatchTypeEnum', 'ProductMatch', 'AdItemMatchType'];
        
        // Check which enums are actually used in handlers or proto-related files
        const usedEnums = new Set();
        allEnums.forEach(enumName => {
            if (enumName && /^[A-Z]\w*/.test(enumName) && !enumName.includes('/')) {
                // Check if this enum is used in handlers or proto context
                const enumUsageCommand = `grep -r "${enumName}\\." ${this.srcDir}/handlers/ --include="*.ts" 2>/dev/null || grep -r "${enumName}\\." ${this.srcDir}/index.ts --include="*.ts" 2>/dev/null || echo ""`;
                try {
                    const usageResult = execSync(enumUsageCommand, { encoding: 'utf8', cwd: this.serviceDir });
                    if (usageResult.trim()) {
                        usedEnums.add(enumName);
                    }
                } catch (error) {
                    // Ignore errors, just means enum not found in those contexts
                }
            }
        });

        // Add common proto enums if they're referenced anywhere
        commonProtoEnums.forEach(enumName => {
            const checkCommand = `grep -r "${enumName}" ${this.srcDir}/ --include="*.ts" 2>/dev/null || echo ""`;
            try {
                const result = execSync(checkCommand, { encoding: 'utf8', cwd: this.serviceDir });
                if (result.trim()) {
                    usedEnums.add(enumName);
                    // Also add with Enum suffix if it doesn't have one
                    if (!enumName.endsWith('Enum')) {
                        usedEnums.add(enumName + 'Enum');
                    }
                }
            } catch (error) {
                // Ignore errors
            }
        });

        // Add used enums to proto imports
        usedEnums.forEach(enumName => protoImports.add(enumName));

        // Find enum values for detected enums
        const enumValues = {};
        usedEnums.forEach(enumName => {
            console.log(`   Finding values for ${enumName}...`);
            
            // Try multiple patterns to find enum values
            const patterns = [
                `${enumName}\\.([A-Z_][A-Z0-9_]*)`,
                `${enumName.replace('Enum', '')}\\.([A-Z_][A-Z0-9_]*)`,
            ];
            
            const foundValues = new Set();
            
            patterns.forEach(pattern => {
                const enumValuesCommand = `grep -r "${enumName}\\." ${this.srcDir}/ --include="*.ts" | sed 's/.*${pattern}.*/\\1/' | sort | uniq`;
                try {
                    const values = execSync(enumValuesCommand, { encoding: 'utf8', cwd: this.serviceDir })
                        .trim().split('\n')
                        .filter(v => v && /^[A-Z][A-Z0-9_]*$/.test(v));
                    values.forEach(v => foundValues.add(v));
                } catch (error) {
                    // Try alternative pattern
                    const altCommand = `grep -r "${enumName.replace('Enum', '')}\\." ${this.srcDir}/ --include="*.ts" | sed 's/.*${enumName.replace('Enum', '')}\\.\\([A-Z_][A-Z0-9_]*\\).*/\\1/' | sort | uniq`;
                    try {
                        const altValues = execSync(altCommand, { encoding: 'utf8', cwd: this.serviceDir })
                            .trim().split('\n')
                            .filter(v => v && /^[A-Z][A-Z0-9_]*$/.test(v));
                        altValues.forEach(v => foundValues.add(v));
                    } catch (altError) {
                        // Ignore
                    }
                }
            });
            
            if (foundValues.size > 0) {
                enumValues[enumName] = Array.from(foundValues);
            } else {
                // Add some common enum values if we can't find them
                if (enumName.includes('UserRole')) {
                    enumValues[enumName] = ['ADMIN', 'USER', 'MODERATOR'];
                } else if (enumName.includes('ProductMatch') || enumName === 'ProductMatch') {
                    enumValues[enumName] = ['MATCHED', 'NOT_MATCHED', 'IN_PROGRESS'];
                } else if (enumName.includes('AdItemMatch') || enumName === 'AdItemMatchType') {
                    enumValues[enumName] = ['PRODUCT', 'PRODUCT_GROUP', 'BRAND'];
                } else {
                    enumValues[enumName] = [];
                }
            }
        });

        // Filter out non-proto types that might be detected
        const filteredImports = new Set();
        protoImports.forEach(importName => {
            // Filter out gRPC-js types and other non-proto types
            if (!importName.includes('sendUnaryData') && 
                !importName.includes('status') && 
                !importName.includes('grpc') &&
                importName !== 'Enum' && // Remove generic "Enum"
                importName.length > 0) {
                filteredImports.add(importName);
            }
        });
        
        protoImports = filteredImports;

        const outputFile = path.join(this.mockDir, '@atc', 'proto.js');
        
        if (protoImports.size === 0) {
            // No proto imports found, create basic mock
            const content = `// Auto-generated mock file for @atc/proto
module.exports = {
  // Add proto definitions as needed
  // These should be mocked based on your actual proto files
};
`;
            fs.writeFileSync(outputFile, content);
            this.success(`Generated basic proto mock: ${outputFile}`);
            return { imports: 0 };
        }
        
        // Categorize imports
        const requestTypes = [];
        const responseTypes = [];
        const outputTypes = [];
        const handlerTypes = [];
        const enumTypes = [];
        const dataTypes = [];
        const otherTypes = [];
        
        protoImports.forEach(importName => {
            if (importName.endsWith('__Output')) {
                outputTypes.push(importName);
            } else if (importName.endsWith('Request')) {
                requestTypes.push(importName);
            } else if (importName.endsWith('Response')) {
                responseTypes.push(importName);
            } else if (importName.includes('Handlers')) {
                handlerTypes.push(importName);
            } else if (importName.endsWith('Enum') || usedEnums.has(importName)) {
                enumTypes.push(importName);
            } else if (importName.endsWith('Data')) {
                dataTypes.push(importName);
            } else {
                otherTypes.push(importName);
            }
        });
        
        let content = `// Auto-generated mock file for @atc/proto
module.exports = {
`;

        // Add handlers first
        if (handlerTypes.length > 0) {
            content += `  // Service Handlers\n`;
            handlerTypes.sort().forEach(handler => {
                content += `  ${handler}: {},\n`;
            });
            content += `\n`;
        }
        
        // Add request types
        if (requestTypes.length > 0) {
            content += `  // Request Types\n`;
            requestTypes.sort().forEach(request => {
                content += `  ${request}: {},\n`;
            });
            content += `\n`;
        }
        
        // Add response types
        if (responseTypes.length > 0) {
            content += `  // Response Types\n`;
            responseTypes.sort().forEach(response => {
                content += `  ${response}: {},\n`;
            });
            content += `\n`;
        }
        
        // Add output types
        if (outputTypes.length > 0) {
            content += `  // Output Types\n`;
            outputTypes.sort().forEach(output => {
                content += `  ${output}: {},\n`;
            });
            content += `\n`;
        }
        
        // Add data types
        if (dataTypes.length > 0) {
            content += `  // Data Types\n`;
            dataTypes.sort().forEach(data => {
                content += `  ${data}: {},\n`;
            });
            content += `\n`;
        }
        
        // Avoid duplicate enum entries - prefer enum with values over empty object
        const finalEnumTypes = [];
        const processedEnums = new Set();
        
        enumTypes.forEach(enumType => {
            const baseName = enumType.replace('Enum', '');
            if (!processedEnums.has(baseName)) {
                // Prefer the version with 'Enum' suffix if it has values
                if (enumValues[enumType] && enumValues[enumType].length > 0) {
                    finalEnumTypes.push(enumType);
                } else if (enumValues[baseName] && enumValues[baseName].length > 0) {
                    finalEnumTypes.push(baseName);
                } else {
                    finalEnumTypes.push(enumType);
                }
                processedEnums.add(baseName);
            }
        });
        
        // Also check otherTypes for enum-like names
        const otherEnumTypes = [];
        const remainingOtherTypes = [];
        
        otherTypes.forEach(type => {
            if ((type.includes('Match') || type.includes('Role') || type.includes('Status')) && 
                !processedEnums.has(type.replace('Enum', ''))) {
                otherEnumTypes.push(type);
                processedEnums.add(type.replace('Enum', ''));
            } else {
                remainingOtherTypes.push(type);
            }
        });
        
        // Combine enum types
        const allEnumTypes = [...finalEnumTypes, ...otherEnumTypes];

        // Add enum types with their actual values
        if (allEnumTypes.length > 0) {
            content += `  // Enums\n`;
            allEnumTypes.sort().forEach(enumType => {
                content += `  ${enumType}: {\n`;
                
                const values = enumValues[enumType] || enumValues[enumType.replace('Enum', '')] || [];
                if (values.length > 0) {
                    // Add actual enum values found in code
                    values.forEach(value => {
                        // Create reasonable string values for enums
                        content += `    ${value}: '${value}',\n`;
                    });
                } else {
                    // Add comment for manual configuration
                    content += `    // Add enum values as needed\n`;
                }
                
                content += `  },\n`;
            });
            content += `\n`;
        }
        
        // Add other types (excluding those moved to enums)
        if (remainingOtherTypes.length > 0) {
            content += `  // Other Types\n`;
            remainingOtherTypes.sort().forEach(other => {
                content += `  ${other}: {},\n`;
            });
        }

        content += `};\n`;

        fs.writeFileSync(outputFile, content);
        this.success(`Generated: ${outputFile}`);
        
        console.log('');
        this.info(`Generated ${protoImports.size} proto types:`);
        console.log(`  Request types: ${requestTypes.length}`);
        console.log(`  Response types: ${responseTypes.length}`);
        console.log(`  Output types: ${outputTypes.length}`);
        console.log(`  Handler types: ${handlerTypes.length}`);
        console.log(`  Enum types: ${allEnumTypes.length} (with ${Object.keys(enumValues).length} having values)`);
        console.log(`  Data types: ${dataTypes.length}`);
        console.log(`  Other types: ${remainingOtherTypes.length}`);
        
        // Show found enums and their values
        if (Object.keys(enumValues).length > 0) {
            console.log('');
            this.info('Found enum values:');
            Object.entries(enumValues).forEach(([enumName, values]) => {
                if (values.length > 0) {
                    console.log(`    ${enumName}: [${values.join(', ')}]`);
                } else {
                    console.log(`    ${enumName}: (no values found)`);
                }
            });
        }
        
        return { 
            imports: protoImports.size,
            categories: {
                request: requestTypes.length,
                response: responseTypes.length,
                output: outputTypes.length,
                handlers: handlerTypes.length,
                enums: allEnumTypes.length,
                enumsWithValues: Object.keys(enumValues).filter(e => enumValues[e].length > 0).length,
                data: dataTypes.length,
                other: remainingOtherTypes.length
            }
        };
    }

    // Generate Jest setup file
    generateJestSetup() {
        this.step('Step 8: Generating Jest setup file (jest.setup.js)');
        
        // Find service-specific environment variables
        const envCommand = `grep -r "process\\.env\\." ${this.srcDir}/ --include="*.ts" | sed 's/.*process\\.env\\.\\([A-Z_][A-Z0-9_]*\\).*/\\1/' | sort | uniq`;
        const envVars = this.executeCommand('Environment variables', envCommand);
        
        // Filter valid environment variables
        const validEnvVars = envVars.filter(env => 
            env && 
            /^[A-Z][A-Z0-9_]*$/.test(env) && 
            !env.includes('/') && 
            !env.includes('.') &&
            env.length > 1
        );

        // Find service name from package.json or directory
        let serviceName = 'test-service';
        try {
            const packageJsonPath = path.join(this.serviceDir, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                serviceName = packageJson.name || 'test-service';
            }
        } catch (error) {
            // Use directory name as fallback
            serviceName = path.basename(process.cwd());
        }

        // Generate port number based on service name
        const getServicePort = (name) => {
            const portMap = {
                'api-gateway-service': '50060',
                'auth-management-service': '50052',
                'user-management-service': '50053',
                'product-management-service': '50054',
                'widget-management-service': '50055',
                'survey-management-service': '50056',
                'notification-management-service': '50057',
                'sample-management-service': '50058',
                'catalogue-management-service': '50059',
                'health-management-service': '50061'
            };
            return portMap[name] || '50050';
        };

        const servicePort = getServicePort(serviceName);

        // Common environment variables
        const commonEnvVars = new Set([
            'NODE_ENV',
            'DATABASE_URL',
            'JWT_SECRET',
            'ACCESS_JWT_TOKEN',
            'ACCESS_JWT_EXPIRE',
            'REFRESH_TOKEN',
            'REFRESH_TOKEN_EXPIRE',
            'VERIFY_JWT_TOKEN',
            'VERIFY_JWT_EXPIRE',
            'RESET_JWT_TOKEN',
            'RESET_JWT_EXPIRE',
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET'
        ]);

        // Service-specific environment variables
        const serviceSpecificVars = validEnvVars.filter(env => !commonEnvVars.has(env));

        // Categorize environment variables
        const authVars = validEnvVars.filter(env => 
            env.includes('JWT') || env.includes('TOKEN') || env.includes('AUTH') || env.includes('GOOGLE')
        );
        
        const serviceVars = validEnvVars.filter(env => 
            env.includes('SERVICE') && (env.includes('HOST') || env.includes('PORT'))
        );

        // Extract service names from found variables to ensure both HOST and PORT are included
        const serviceNames = new Set();
        validEnvVars.forEach(env => {
            if (env.includes('SERVICE')) {
                if (env.endsWith('_HOST') || env.endsWith('_PORT')) {
                    const serviceName = env.replace('_HOST', '').replace('_PORT', '');
                    serviceNames.add(serviceName);
                }
            }
        });

        const outputFile = path.join(this.serviceDir, 'jest.setup.js');
        
        let content = `// Auto-generated Jest setup file

// Global test setup
beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset environment variables
    process.env.NODE_ENV = 'test';
`;

        // Add service port
        content += `    process.env.${serviceName.toUpperCase().replace(/-/g, '_')}_PORT = '${servicePort}';\n`;
        
        // Add common environment variables
        content += `
    // Database configuration
    process.env.DATABASE_URL = 'test-database-url';
`;

        // Add authentication variables if found
        if (authVars.length > 0) {
            content += `
    // JWT and Authentication configuration\n`;
            
            // Standard JWT variables
            if (authVars.includes('ACCESS_JWT_TOKEN')) {
                content += `    process.env.ACCESS_JWT_TOKEN = 'test-access-token-secret';\n`;
            }
            if (authVars.includes('ACCESS_JWT_EXPIRE')) {
                content += `    process.env.ACCESS_JWT_EXPIRE = '15m';\n`;
            }
            if (authVars.includes('REFRESH_TOKEN')) {
                content += `    process.env.REFRESH_TOKEN = 'test-refresh-token-secret';\n`;
            }
            if (authVars.includes('REFRESH_TOKEN_EXPIRE')) {
                content += `    process.env.REFRESH_TOKEN_EXPIRE = '7d';\n`;
            }
            if (authVars.includes('VERIFY_JWT_TOKEN')) {
                content += `    process.env.VERIFY_JWT_TOKEN = 'test-verify-token-secret';\n`;
            }
            if (authVars.includes('VERIFY_JWT_EXPIRE')) {
                content += `    process.env.VERIFY_JWT_EXPIRE = '24h';\n`;
            }
            if (authVars.includes('RESET_JWT_TOKEN')) {
                content += `    process.env.RESET_JWT_TOKEN = 'test-reset-token-secret';\n`;
            }
            if (authVars.includes('RESET_JWT_EXPIRE')) {
                content += `    process.env.RESET_JWT_EXPIRE = '1h';\n`;
            }
            if (authVars.includes('JWT_SECRET')) {
                content += `    process.env.JWT_SECRET = 'test-jwt-secret';\n`;
            }
            
            // OAuth variables
            if (authVars.includes('GOOGLE_CLIENT_ID')) {
                content += `    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';\n`;
            }
            if (authVars.includes('GOOGLE_CLIENT_SECRET')) {
                content += `    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';\n`;
            }
        }

        // Add service configuration
        if (serviceVars.length > 0 || serviceNames.size > 0) {
            content += `
    // Service configuration\n`;
            
            // Standard services with default ports
            const standardServices = [
                { name: 'AUTH_SERVICE', port: '50052' },
                { name: 'USER_SERVICE', port: '50053' },
                { name: 'PRODUCT_SERVICE', port: '50054' },
                { name: 'WIDGET_SERVICE', port: '50055' },
                { name: 'SURVEY_SERVICE', port: '50056' },
                { name: 'NOTIFICATION_SERVICE', port: '50057' },
                { name: 'SAMPLE_SERVICE', port: '50058' },
                { name: 'CATALOGUE_SERVICE', port: '50059' },
                { name: 'API_GATEWAY_SERVICE', port: '50060' },
                { name: 'HEALTH_SERVICE', port: '50061' }
            ];

            // First, handle services found in environment variables
            serviceNames.forEach(serviceName => {
                const hostVar = `${serviceName}_HOST`;
                const portVar = `${serviceName}_PORT`;
                
                // Find the port from standard services or default
                const standardService = standardServices.find(s => s.name === serviceName);
                const defaultPort = standardService ? standardService.port : '50050';
                
                // Always add both HOST and PORT for any service found
                content += `    process.env.${hostVar} = 'localhost';\n`;
                content += `    process.env.${portVar} = '${defaultPort}';\n`;
            });

            // Then, handle any additional standard services that might be referenced
            standardServices.forEach(service => {
                const hostVar = `${service.name}_HOST`;
                const portVar = `${service.name}_PORT`;
                
                // Only add if not already added above
                if (!serviceNames.has(service.name)) {
                    // Check if this service is referenced in serviceVars but not in serviceNames
                    if (serviceVars.includes(hostVar) || serviceVars.includes(portVar)) {
                        content += `    process.env.${hostVar} = 'localhost';\n`;
                        content += `    process.env.${portVar} = '${service.port}';\n`;
                    }
                }
            });
        }

        // Add other environment variables
        const otherVars = serviceSpecificVars.filter(env => 
            !authVars.includes(env) && 
            !serviceVars.includes(env) &&
            !env.includes('PORT') &&
            !env.includes('HOST')
        );

        if (otherVars.length > 0) {
            content += `
    // Other configuration\n`;
            otherVars.forEach(env => {
                content += `    process.env.${env} = 'test-${env.toLowerCase().replace(/_/g, '-')}';\n`;
            });
        }

        content += `});

afterEach(() => {
    // Cleanup after each test
    jest.restoreAllMocks();
});

// Mock @grpc/grpc-js for gRPC services
jest.mock('@grpc/grpc-js', () => ({
    credentials: {
        createInsecure: jest.fn(),
        createSsl: jest.fn(),
    },
    status: {
        OK: 0,
        CANCELLED: 1,
        UNKNOWN: 2,
        INVALID_ARGUMENT: 3,
        DEADLINE_EXCEEDED: 4,
        NOT_FOUND: 5,
        ALREADY_EXISTS: 6,
        PERMISSION_DENIED: 7,
        UNAUTHENTICATED: 16,
        RESOURCE_EXHAUSTED: 8,
        FAILED_PRECONDITION: 9,
        ABORTED: 10,
        OUT_OF_RANGE: 11,
        UNIMPLEMENTED: 12,
        INTERNAL: 13,
        UNAVAILABLE: 14,
        DATA_LOSS: 15,
    },
    Metadata: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        clone: jest.fn(),
    })),
    loadPackageDefinition: jest.fn(),
    loadSync: jest.fn(),
}));

// Increase timeout for integration tests
jest.setTimeout(30000);

// Console error suppression for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Warning:') || 
             args[0].includes('Deprecated:') ||
             args[0].includes('ReactDOM.render is deprecated'))
        ) {
            return;
        }
        originalConsoleError.call(console, ...args);
    };
    
    console.warn = (...args) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('Warning:')
        ) {
            return;
        }
        originalConsoleWarn.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
});

// gRPC test utilities for consistent test setup
global.grpcTestUtils = {
    createMockCall: (metadata = {}, request = {}) => ({
        metadata: new Map(Object.entries(metadata)),
        getPeer: jest.fn().mockReturnValue('127.0.0.1:12345'),
        cancelled: false,
        request,
        deadline: Date.now() + 30000, // 30 second timeout
    }),
    createMockCallback: () => {
        const callback = jest.fn();
        callback.mockImplementation((error, response) => {
            if (error) {
                throw error;
            }
            return response;
        });
        return callback;
    },
    createMockStream: () => ({
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
        emit: jest.fn(),
        cancel: jest.fn(),
    }),
};

// Mock error generators for testing error scenarios
global.mockErrors = {
    networkError: () => new Error('ECONNREFUSED: Connection refused'),
    timeoutError: () => new Error('DEADLINE_EXCEEDED: Deadline exceeded'),
    serviceUnavailable: () => new Error('UNAVAILABLE: Service unavailable'),
    authError: () => new Error('UNAUTHENTICATED: Authentication failed'),
    permissionError: () => new Error('PERMISSION_DENIED: Permission denied'),
    internalError: () => new Error('INTERNAL: Internal server error'),
};
`;

        fs.writeFileSync(outputFile, content);
        this.success(`Generated: ${outputFile}`);
        
        console.log('');
        this.info(`Generated Jest setup with:`);
        console.log(`  Service: ${serviceName} (port: ${servicePort})`);
        console.log(`  Environment variables: ${validEnvVars.length}`);
        console.log(`  Auth variables: ${authVars.length}`);
        console.log(`  Service variables: ${serviceVars.length}`);
        console.log(`  Other variables: ${otherVars.length}`);
        
        return { 
            serviceName,
            servicePort,
            envVars: validEnvVars.length,
            authVars: authVars.length,
            serviceVars: serviceVars.length,
            serviceNames: serviceNames.size,
            otherVars: otherVars.length
        };
    }



    // Generate Jest config file
    generateJestConfig() {
        this.step('Step 9: Generating Jest config file (jest.config.js)');
        
        // Determine service name from package.json, directory name, or default
        let serviceName = 'Test Service';
        let packageName = '';
        
        try {
            const packageJsonPath = path.join(this.serviceDir, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                packageName = packageJson.name || '';
            }
        } catch (error) {
            this.warning('Could not read package.json, using directory name');
        }
        
        // If package name exists, use it; otherwise use directory name
        if (packageName) {
            serviceName = packageName
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        } else {
            // Use current directory name as fallback
            const currentDir = path.basename(process.cwd());
            serviceName = currentDir
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
        
        const outputFile = path.join(this.serviceDir, 'jest.config.js');
        
        const content = `module.exports = {
        displayName: '${serviceName}',
        preset: 'ts-jest',
        testEnvironment: 'node',
        roots: ['<rootDir>/src', '<rootDir>/__tests__'],
        testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.spec.ts'],
        collectCoverageFrom: [
            'src/**/*.ts',
            '!src/**/*.d.ts',
            '!src/**/index.ts',
            '!src/server.ts',
            '!src/client.ts',
        ],
        coverageDirectory: 'coverage',
        coverageReporters: ['text', 'lcov', 'html'],
        setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
        clearMocks: true,
        restoreMocks: true,
        resetMocks: true,
        moduleDirectories: ['node_modules', '<rootDir>/__tests__/__mocks__'],
    };
    `;

        fs.writeFileSync(outputFile, content);
        this.success(`Generated: ${outputFile}`);
        
        console.log('');
        this.info(`Service display name: ${serviceName}`);
        this.info(`Package name: ${packageName || 'Not found'}`);
        
        return { 
            serviceName,
            packageName: packageName || 'unknown'
        };
    }

    // Generate other standard mocks (only if dependencies found)
    generateOtherMocks(dependencies) {
        this.info('Generating other standard mock files...');

        const mocks = {};
        
        // No additional mocks needed - proto is handled separately
        
        Object.entries(mocks).forEach(([filename, content]) => {
            const filePath = path.join(this.mockDir, '@atc', filename);
            fs.writeFileSync(filePath, content);
            this.success(`Generated: ${filePath}`);
        });
        
        return Object.keys(mocks).length;
    }

    // Main execution
    async run() {
        try {
            this.log('🚀 Mock Generator', 'bright');
            console.log('');
            
            // Check if src directory exists
            if (!fs.existsSync(this.srcDir)) {
                this.error(`Source directory '${this.srcDir}' not found!`);
                this.warning('Make sure you are in the correct service directory.');
                return;
            }
            
            this.createDirectories();
            
            // Step 1: Identify dependencies
            const dependencies = this.identifyDependencies();
            
            // Step 2: Generate database mock (if @atc/db found)
            let dbStats = { operations: 0, enums: 0, types: 0 };
            if (dependencies.includes('@atc/db')) {
                dbStats = this.generateDatabaseMock();
            } else {
                this.info('Skipping database mock - @atc/db not found in dependencies');
            }
            
            // Step 3: Generate logger mock (if @atc/logger found)
            let loggerStats = { methods: 0 };
            if (dependencies.includes('@atc/logger')) {
                loggerStats = this.generateLoggerMock();
            } else {
                this.info('Skipping logger mock - @atc/logger not found in dependencies');
            }
            
            // Step 4: Generate common mock (if @atc/common found)
            let commonStats = { imports: 0 };
            if (dependencies.includes('@atc/common')) {
                commonStats = this.generateCommonMock();
            } else {
                this.info('Skipping common mock - @atc/common not found in dependencies');
            }
            
            // Step 5: Generate gRPC config mock (if @atc/grpc-config found)
            let grpcStats = { hasServiceConfig: false, hasServiceDefinitions: false };
            if (dependencies.includes('@atc/grpc-config')) {
                grpcStats = this.generateGrpcConfigMock();
            } else {
                this.info('Skipping gRPC config mock - @atc/grpc-config not found in dependencies');
            }
            
            // Step 6: Generate gRPC server mock (if @atc/grpc-server found)
            let grpcServerStats = { imports: 0, isBaseClass: false };
            if (dependencies.includes('@atc/grpc-server')) {
                grpcServerStats = this.generateGrpcServerMock();
            } else {
                this.info('Skipping gRPC server mock - @atc/grpc-server not found in dependencies');
            }
            
            // Step 7: Generate proto mock (if @atc/proto found)
            let protoStats = { imports: 0, categories: {} };
            if (dependencies.includes('@atc/proto')) {
                protoStats = this.generateProtoMock();
            } else {
                this.info('Skipping proto mock - @atc/proto not found in dependencies');
            }
            
            // Step 8: Generate Jest setup file
            console.log('');
            const jestSetupStats = this.generateJestSetup();

             // Step : Generate Jest config file
            console.log('');
            const jestConfig = this.generateJestConfig();
            
            // Generate other standard mocks (only for found dependencies)
            const otherMocksCount = this.generateOtherMocks(dependencies);
            
            console.log('');
            this.log('📊 Generation Summary:', 'blue');
            console.log(`  Dependencies found: ${dependencies.length}`);
            console.log(`  Database operations: ${dbStats.operations}`);
            console.log(`  Database enums: ${dbStats.enums}`);
            console.log(`  Database types: ${dbStats.types}`);
            console.log(`  Logger methods: ${loggerStats.methods}`);
            console.log(`  Common imports: ${commonStats.imports}`);
            console.log(`  gRPC serviceConfig: ${grpcStats.hasServiceConfig ? 'Yes' : 'No'}`);
            console.log(`  gRPC serviceDefinitions: ${grpcStats.hasServiceDefinitions ? 'Yes' : 'No'}`);
            console.log(`  gRPC server imports: ${grpcServerStats.imports}`);
            console.log(`  gRPC BaseGrpcServer class: ${grpcServerStats.isBaseClass ? 'Yes' : 'No'}`);
            console.log(`  Proto types: ${protoStats.imports}`);
            console.log(`  Proto enums with values: ${protoStats.categories.enumsWithValues || 0}`);
            console.log(`  Jest setup service: ${jestSetupStats.serviceName}`);
            console.log(`  Jest setup env vars: ${jestSetupStats.envVars}`);
            console.log(`  Jest setup services: ${jestSetupStats.serviceNames}`);
            console.log(`  Jest config service: ${jestConfig.serviceName}`);
            console.log(`  Jest config package: ${jestConfig.packageName}`);
            console.log(`  Other mocks generated: ${otherMocksCount}`);
            
            console.log('');
            this.success('Mock generation finished!');
            this.info(`📁 Generated files in: ${this.mockDir}/@atc/`);
            this.info(`📁 Jest setup file: jest.setup.js`);
            this.info(`📁 Jest config file: jest.config.js`);
            this.info(`📁 Jest setup file: jest.setup.js`);
            
            // Show Jest configuration suggestion
            console.log('');
            this.log('📋 Jest Configuration:', 'yellow');
            
        } catch (error) {
            this.error(`Error: ${error.message}`);
            process.exit(1);
        }
    }
}

// Run the generator if this file is executed directly
if (require.main === module) {
    const generator = new MockGenerator();
    generator.run();
}

module.exports = MockGenerator;