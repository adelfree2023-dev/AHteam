/**
 * ============================================
 * AHteam Generator - Main Entry Point (Updated)
 * ============================================
 * 
 * Generates:
 * - Website from templates/website
 * - Admin from templates/admin
 * ============================================
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { validate } from './validator.js';
import { processFile, shouldProcessFile } from './binder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ROOT_DIR = path.resolve(__dirname, '../..');
const CONFIG_PATH = path.join(ROOT_DIR, 'project.config.json');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates');
const OUTPUT_DIR = path.join(ROOT_DIR, 'generated');

/**
 * Main generator function
 */
async function generate() {
    console.log('🏭 AHteam Generator v1.2.0\n');
    console.log('================================\n');

    // Load config
    const config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'));

    // Generate Website if enabled
    if (config.features?.website?.enabled) {
        console.log('📄 Generating Website...\n');
        await generateWebsite(config);
    }

    // Generate Admin
    console.log('\n📊 Generating Admin Panel...\n');
    await generateAdmin(config);

    // Generate Android
    console.log('\n📱 Generating Android App...\n');
    await generateAndroid(config);

    console.log('\n================================');
    console.log('✅ All Generation Complete!\n');
    console.log(`📁 Website: ${path.join(OUTPUT_DIR, 'website')}`);
    console.log(`📁 Admin: ${path.join(OUTPUT_DIR, 'admin')}`);
    console.log(`📁 Android: ${path.join(OUTPUT_DIR, 'android')}`);
    console.log('');
}

/**
 * Generate Website
 */
async function generateWebsite(config) {
    const templatePath = path.join(TEMPLATES_DIR, 'website', 'web-ecommerce-001');
    const websiteOutput = path.join(OUTPUT_DIR, 'website');

    // Validate
    const validation = validate(CONFIG_PATH, templatePath);
    if (!validation.valid) {
        console.log('❌ Website validation failed');
        return;
    }

    // Prepare output
    await fs.ensureDir(websiteOutput);
    await fs.emptyDir(websiteOutput);

    // Copy and process pages
    const pagesDir = path.join(templatePath, 'pages');
    if (await fs.pathExists(pagesDir)) {
        const pages = await fs.readdir(pagesDir);
        for (const page of pages) {
            const sourcePath = path.join(pagesDir, page);
            const destPath = path.join(websiteOutput, page);
            let content = await fs.readFile(sourcePath, 'utf-8');
            content = processFile(content, config, page);
            await fs.writeFile(destPath, content);
            console.log(`   ✅ ${page}`);
        }
    }

    // Copy assets
    const assetsDir = path.join(templatePath, 'assets');
    if (await fs.pathExists(assetsDir)) {
        await copyAndProcessDir(assetsDir, path.join(websiteOutput, 'assets'), config);
        console.log('   ✅ assets/');
    }

    // Copy data
    const dataDir = path.join(templatePath, 'data');
    if (await fs.pathExists(dataDir)) {
        await fs.copy(dataDir, path.join(websiteOutput, 'data'));
        console.log('   ✅ data/');
    }

    // Generate docs
    await generateWebsiteDocs(config, websiteOutput);
}

/**
 * Generate Admin Panel
 */
async function generateAdmin(config) {
    const templatePath = path.join(TEMPLATES_DIR, 'admin', 'admin-basic-001');
    const adminOutput = path.join(OUTPUT_DIR, 'admin');

    // Prepare output
    await fs.ensureDir(adminOutput);
    await fs.emptyDir(adminOutput);

    // Copy and process pages
    const pagesDir = path.join(templatePath, 'pages');
    if (await fs.pathExists(pagesDir)) {
        const pages = await fs.readdir(pagesDir);
        for (const page of pages) {
            const sourcePath = path.join(pagesDir, page);
            const destPath = path.join(adminOutput, page);
            let content = await fs.readFile(sourcePath, 'utf-8');
            content = processFile(content, config, page);
            await fs.writeFile(destPath, content);
            console.log(`   ✅ ${page}`);
        }
    }

    // Copy and process assets
    const assetsDir = path.join(templatePath, 'assets');
    if (await fs.pathExists(assetsDir)) {
        await copyAndProcessDir(assetsDir, path.join(adminOutput, 'assets'), config);
        console.log('   ✅ assets/');
    }

    // Generate admin docs
    await generateAdminDocs(config, adminOutput);
}

/**
 * Copy directory and process text files
 */
async function copyAndProcessDir(sourceDir, destDir, config) {
    await fs.ensureDir(destDir);
    const items = await fs.readdir(sourceDir, { withFileTypes: true });

    for (const item of items) {
        const sourcePath = path.join(sourceDir, item.name);
        const destPath = path.join(destDir, item.name);

        if (item.isDirectory()) {
            await copyAndProcessDir(sourcePath, destPath, config);
        } else {
            if (shouldProcessFile(item.name)) {
                let content = await fs.readFile(sourcePath, 'utf-8');
                content = processFile(content, config, item.name);
                await fs.writeFile(destPath, content);
            } else {
                await fs.copy(sourcePath, destPath);
            }
        }
    }
}

/**
 * Generate Website docs
 */
async function generateWebsiteDocs(config, outputPath) {
    const readme = `# ${config.project.name} - Website

## Quick Start
\`\`\`bash
# Serve locally
npx serve .
\`\`\`

## Files
- index.html - Home page
- products.html - Products
- cart.html - Shopping cart
- about.html - About us
- contact.html - Contact

## Generated by AHteam Factory
`;
    await fs.writeFile(path.join(outputPath, 'README.md'), readme);
    console.log('   ✅ README.md');
}

/**
 * Generate Admin docs
 */
async function generateAdminDocs(config, outputPath) {
    const readme = `# ${config.project.name} - Admin Panel

## Quick Start
\`\`\`bash
# Serve locally
npx serve -p 3001 .
\`\`\`

## Login
- Username: admin
- Password: admin123

## Pages
- login.html - Login page
- dashboard.html - Dashboard
- content.html - Edit content
- settings.html - Store settings

## Features
- ✅ Local Authentication
- ✅ Config Editor
- ✅ No external dependencies

## Generated by AHteam Factory
`;
    await fs.writeFile(path.join(outputPath, 'README.md'), readme);
    console.log('   ✅ README.md');
}

/**
 * Generate Android App
 */
async function generateAndroid(config) {
    const templatePath = path.join(TEMPLATES_DIR, 'android', 'android-webview-001');
    const androidOutput = path.join(OUTPUT_DIR, 'android');

    // Prepare output
    await fs.ensureDir(androidOutput);
    await fs.emptyDir(androidOutput);

    // Copy entire template structure
    await copyAndProcessDir(templatePath, androidOutput, config);
    console.log('   ✅ Android project structure');

    // Generate README
    await generateAndroidDocs(config, androidOutput);
}

/**
 * Generate Android docs
 */
async function generateAndroidDocs(config, outputPath) {
    const readme = `# ${config.project.name} - Android App

## المتطلبات
- Android Studio Arctic Fox أو أحدث
- JDK 11 أو أحدث

## البناء
1. افتح المشروع في Android Studio
2. انتظر sync الـ Gradle
3. Build → Build APK(s)

## تسجيل الدخول
- هذا تطبيق WebView
- لا يتطلب تسجيل دخول خاص

## Generated by AHteam Factory
`;
    await fs.writeFile(path.join(outputPath, 'README.md'), readme);
    console.log('   ✅ README.md');
}

// Run generator
generate().catch(err => {
    console.error('❌ Generation failed:', err.message);
    process.exit(1);
});
