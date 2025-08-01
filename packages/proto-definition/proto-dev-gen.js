const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function getAllProtoFiles(dir) {
    let results = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            results = results.concat(await getAllProtoFiles(fullPath));
        } else if (item.endsWith('.proto')) {
            results.push(fullPath);
        }
    }

    return results;
}

async function generateProtos() {
    const baseProtoDir = './src/proto';
    const baseGeneratedDir = './src/generated';

    // Create base generated directory if it doesn't exist
    if (!fs.existsSync(baseGeneratedDir)) {
        fs.mkdirSync(baseGeneratedDir, { recursive: true });
    }

    // Get all proto files recursively
    const protoFiles = await getAllProtoFiles(baseProtoDir);

    // Generate for each proto file
    for (const protoFile of protoFiles) {
        // Get the relative path from the base proto directory
        const relativePath = path.relative(baseProtoDir, protoFile);
        // Get the directory part of the relative path
        const dirName = path.dirname(relativePath);
        // Create the corresponding output directory
        const outputDir = path.join(baseGeneratedDir, dirName);

        // Create directory structure
        fs.mkdirSync(outputDir, { recursive: true });

        // Generate types for this proto file
        const command = `npx proto-loader-gen-types --longs=String --enums=String --defaults --oneofs --keepCase --grpcLib=@grpc/grpc-js --outDir=${outputDir} --proto_path=${baseProtoDir} ${protoFile}`;
        
        try {
            console.log(`Generating types for ${relativePath}...`);
            await execAsync(command);
            console.log(`Successfully generated types for ${relativePath}`);
        } catch (error) {
            console.error(`Error generating types for ${relativePath}:`, error);
        }
    }
}

generateProtos().catch(console.error);