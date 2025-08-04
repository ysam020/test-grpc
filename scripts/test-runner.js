#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Runs your single root/scripts/setup-test.js in each service directory
 * No changes to individual service package.json files needed
 *
 * Usage:
 *   npm run setup:test:all                    # Run in all services except api-gateway
 *   npm run setup:test:service -- auth       # Run only in auth-management-service
 *   npm run setup:test:service -- user,product # Run in multiple services
 */

class TestSetupRunner {
    constructor() {
        this.rootDir = process.cwd();
        this.appsDir = path.join(this.rootDir, 'apps');
        this.setupScriptPath = path.join(
            this.rootDir,
            'scripts',
            'setup-test.js',
        );
        this.excludedServices = ['api-gateway-service'];
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m', // cyan
            success: '\x1b[32m', // green
            warning: '\x1b[33m', // yellow
            error: '\x1b[31m', // red
            reset: '\x1b[0m',
        };
        console.log(
            `${colors[type]}[${type.toUpperCase()}]${colors.reset} ${message}`,
        );
    }

    validateSetupScript() {
        if (!fs.existsSync(this.setupScriptPath)) {
            throw new Error(
                `Setup script not found at: ${this.setupScriptPath}`,
            );
        }
    }

    getAllServices() {
        if (!fs.existsSync(this.appsDir)) {
            throw new Error('apps/ directory not found');
        }

        return fs.readdirSync(this.appsDir).filter((item) => {
            const servicePath = path.join(this.appsDir, item);
            return fs.statSync(servicePath).isDirectory();
        });
    }

    getTargetServices(specificServices = []) {
        const allServices = this.getAllServices();
        if (specificServices.length === 0) {
            // Return all services except excluded ones
            return allServices.filter(
                (service) => !this.excludedServices.includes(service),
            );
        }

        // Convert short names to full service names and validate
        const targetServices = specificServices.map((service) => {
            const fullName = service.includes('-service')
                ? service
                : `${service}-management-service`;

            if (!allServices.includes(fullName)) {
                throw new Error(
                    `Service '${fullName}' not found in apps/ directory`,
                );
            }

            return fullName;
        });
        return targetServices;
    }

    runSetupInService(serviceName) {
        const servicePath = path.join(this.appsDir, serviceName);
        if (!fs.existsSync(servicePath)) {
            this.log(`❌ Service directory not found: ${serviceName}`, 'error');
            return false;
        }

        try {
            this.log(`🔧 Running setup-test.js in ${serviceName}`, 'info');
            // Injest test scripts in package.json
            this.injectTestScripts(servicePath);

            // Check files before
            const filesBefore = this.getTestFiles(servicePath);
            // Run the root setup script but with service directory as working directory
            const result = execSync(`node "${this.setupScriptPath}"`, {
                cwd: servicePath,
                stdio: 'pipe', // Capture output
                encoding: 'utf8',
                env: {
                    ...process.env,
                    SERVICE_NAME: serviceName,
                    SERVICE_PATH: servicePath,
                    ROOT_PATH: this.rootDir,
                },
            });

            // Show script output if there is any
            if (result && result.trim()) {
                this.log(`📝 Script output for ${serviceName}:`, 'info');
                console.log(result);
            }

            // Check files after
            const filesAfter = this.getTestFiles(servicePath);
            const newFiles = filesAfter.filter(
                (file) => !filesBefore.includes(file),
            );

            if (newFiles.length > 0) {
                this.log(
                    `📁 Created files in ${serviceName}: ${newFiles.join(', ')}`,
                    'success',
                );
            } else {
                this.log(
                    `⚠️  No new files created in ${serviceName}`,
                    'warning',
                );
            }

            this.log(`✅ Setup completed for ${serviceName}`, 'success');
            return true;
        } catch (error) {
            this.log(
                `❌ Setup failed for ${serviceName}: ${error.message}`,
                'error',
            );
            if (error.stdout) {
                this.log(`Script output: ${error.stdout}`, 'info');
            }
            if (error.stderr) {
                this.log(`Script errors: ${error.stderr}`, 'error');
            }
            return false;
        }
    }

    getTestFiles(servicePath) {
        const testFiles = [];
        try {
            const files = fs.readdirSync(servicePath);

            files.forEach((file) => {
                const filePath = path.join(servicePath, file);
                const stat = fs.statSync(filePath);

                if (
                    stat.isFile() &&
                    (file.includes('jest') || file.includes('test'))
                ) {
                    testFiles.push(file);
                } else if (
                    stat.isDirectory() &&
                    (file.startsWith('__') || file.includes('test'))
                ) {
                    testFiles.push(`${file}/`);
                }
            });
        } catch (error) {
            // Ignore errors reading directory
        }

        return testFiles;
    }

    runTestsInService(serviceName) {
        const servicePath = path.join(this.appsDir, serviceName);

        try {
            this.log(`🧪 Running tests in ${serviceName}`, 'info');

            // Try running tests - first check if jest is available locally
            try {
                execSync('npx jest', {
                    cwd: servicePath,
                    stdio: 'inherit',
                    env: { ...process.env, NODE_ENV: 'test' },
                });
            } catch {
                // Fallback to direct jest command
                try {
                    execSync('jest', {
                        cwd: servicePath,
                        stdio: 'inherit',
                        env: { ...process.env, NODE_ENV: 'test' },
                    });
                } catch {
                    // Final fallback - try from root with project filter
                    execSync(`npx jest --projects apps/${serviceName}`, {
                        cwd: this.rootDir,
                        stdio: 'inherit',
                        env: { ...process.env, NODE_ENV: 'test' },
                    });
                }
            }

            this.log(`✅ Tests completed for ${serviceName}`, 'success');
            return true;
        } catch (error) {
            this.log(
                `❌ Tests failed for ${serviceName}: ${error.message}`,
                'error',
            );
            return false;
        }
    }

    setupTests(specificServices = []) {
        this.validateSetupScript();

        const targetServices = this.getTargetServices(specificServices);

        if (targetServices.length === 0) {
            this.log('No services to setup', 'warning');
            return;
        }

        this.log(
            `🚀 Running setup for ${targetServices.length} service(s): ${targetServices.join(', ')}`,
            'info',
        );
        this.log(`📁 Using setup script: ${this.setupScriptPath}`, 'info');

        let successCount = 0;
        let failureCount = 0;

        for (const service of targetServices) {
            const success = this.runSetupInService(service);
            if (success) {
                successCount++;
            } else {
                failureCount++;
            }
        }

        this.log(`\n📊 Setup Summary:`, 'info');
        this.log(`✅ Successful: ${successCount}`, 'success');
        if (failureCount > 0) {
            this.log(`❌ Failed: ${failureCount}`, 'error');
        }
    }

    runTests(specificServices = []) {
        const targetServices = this.getTargetServices(specificServices);
        if (targetServices.length === 0) {
            this.log('No services to test', 'warning');
            return;
        }

        this.log(
            `🧪 Running tests for ${targetServices.length} service(s): ${targetServices.join(', ')}`,
            'info',
        );

        let successCount = 0;
        let failureCount = 0;

        for (const service of targetServices) {
            // First ensure setup is done
            // const setupSuccess = this.runSetupInService(service);
            // if (!setupSuccess) {
            //   failureCount++;
            //   continue;
            // }

            // Then run tests
            const testSuccess = this.runTestsInService(service);
            if (testSuccess) {
                successCount++;
            } else {
                failureCount++;
            }
        }

        this.log(`\n📊 Test Summary:`, 'info');
        this.log(`✅ Successful: ${successCount}`, 'success');
        if (failureCount > 0) {
            this.log(`❌ Failed: ${failureCount}`, 'error');
        }
    }

    listServices() {
        const allServices = this.getAllServices();
        const targetServices = allServices.filter(
            (service) => !this.excludedServices.includes(service),
        );

        this.log('📋 Available services:', 'info');
        targetServices.forEach((service) => {
            const shortName = service.replace('-management-service', '');
            this.log(`  • ${service} (short: ${shortName})`, 'info');
        });

        this.log(`\n🚫 Excluded services:`, 'warning');
        this.excludedServices.forEach((service) => {
            this.log(`  • ${service}`, 'warning');
        });
    }

    injectTestScripts(servicePath) {
        const packageJsonPath = path.join(servicePath, 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
            this.log(
                `⚠️  package.json not found in ${servicePath}, skipping script injection.`,
                'warning',
            );
            return;
        }

        try {
            const packageJson = JSON.parse(
                fs.readFileSync(packageJsonPath, 'utf8'),
            );

            const testScripts = {
                test: 'jest',
                'test:watch': 'jest --watch',
                'test:coverage': 'jest --coverage',
                'test:unit': 'jest --testPathPattern=__tests__',
                'test:handlers': 'jest --testPathPattern=handlers',
                'test:services': 'jest --testPathPattern=services',
                'test:validations': 'jest --testPathPattern=validations',
                'test:ci': 'jest --ci --coverage --watchAll=false',
            };

            let addedScripts = [];

            packageJson.scripts = packageJson.scripts || {};

            for (const [key, value] of Object.entries(testScripts)) {
                if (!(key in packageJson.scripts)) {
                    packageJson.scripts[key] = value;
                    addedScripts.push(key);
                }
            }

            if (addedScripts.length > 0) {
                fs.writeFileSync(
                    packageJsonPath,
                    JSON.stringify(packageJson, null, 2),
                );
                this.log(
                    `📝 Added test scripts: ${addedScripts.join(', ')} in ${path.basename(servicePath)}/package.json`,
                    'info',
                );
            } else {
                this.log(
                    `ℹ️  All test scripts already present in ${path.basename(servicePath)}`,
                    'info',
                );
            }
        } catch (err) {
            this.log(
                `❌ Failed to update package.json in ${path.basename(servicePath)}: ${err.message}`,
                'error',
            );
        }
    }
}

// Command line interface
function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const serviceArg = args[1];

    const runner = new TestSetupRunner();

    try {
        switch (command) {
            case 'setup':
                if (serviceArg) {
                    const services = serviceArg.split(',').map((s) => s.trim());
                    runner.setupTests(services);
                } else {
                    runner.setupTests(); // All services except excluded
                }
                break;

            case 'test':
                if (serviceArg) {
                    const services = serviceArg.split(',').map((s) => s.trim());
                    runner.runTests(services);
                } else {
                    runner.runTests(); // All services except excluded
                }
                break;

            case 'both':
                if (serviceArg) {
                    const services = serviceArg.split(',').map((s) => s.trim());
                    runner.setupTests(services);
                    runner.runTests(services);
                } else {
                    runner.setupTests();
                    runner.runTests();
                }
                break;

            case 'list':
                runner.listServices();
                break;

            default:
                console.log(`
Usage:
  node scripts/test-runner.js setup [service1,service2]     # Run setup-test.js in services
  node scripts/test-runner.js test [service1,service2]      # Run tests in services  
  node scripts/test-runner.js both [service1,service2]      # Setup + test
  node scripts/test-runner.js list                          # List available services

Examples:
  node scripts/test-runner.js setup                         # Setup all services except api-gateway
  node scripts/test-runner.js setup auth                    # Setup only auth-management-service
  node scripts/test-runner.js test user,product             # Test specific services
  node scripts/test-runner.js both sample                   # Setup and test sample-management-service

Your setup script location: scripts/setup-test.js
        `);
        }
    } catch (error) {
        runner.log(`💥 Operation failed: ${error.message}`, 'error');
        process.exit(1);
    }
}

// if (require.main === module) {
main();
// }

module.exports = { TestSetupRunner };
