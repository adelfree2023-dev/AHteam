/**
 * ============================================
 * AHteam Export Engine
 * ============================================
 * 
 * Final Delivery + Disappear
 * 
 * Creates ZIP from /payment/orders/{orderId}/
 * NOT from Trial!
 * ============================================
 */

import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ORDERS_DIR = path.join(__dirname, '../../payment/orders');
const EXPORTS_DIR = path.join(__dirname, '../exports');
const EXPORTS_REGISTRY = path.join(__dirname, '../exports-registry.json');

/**
 * Load exports registry
 */
async function loadExportsRegistry() {
    try {
        if (await fs.pathExists(EXPORTS_REGISTRY)) {
            return JSON.parse(await fs.readFile(EXPORTS_REGISTRY, 'utf-8'));
        }
    } catch (e) { }
    return { exports: [] };
}

/**
 * Save exports registry
 */
async function saveExportsRegistry(registry) {
    await fs.writeFile(EXPORTS_REGISTRY, JSON.stringify(registry, null, 2));
}

/**
 * Create documentation files
 */
async function createDocs(orderPath, orderId) {
    const docsPath = path.join(orderPath, 'docs');
    await fs.ensureDir(docsPath);

    // INSTALL.md
    await fs.writeFile(path.join(docsPath, 'INSTALL.md'), `# Installation Guide

## Requirements
- Node.js 18+ (for Website/Admin)
- Android Studio (for Android app)

## Website
\`\`\`bash
cd website
npx serve .
\`\`\`

## Admin
\`\`\`bash
cd admin
npx serve -p 3001 .
\`\`\`

## Android
1. Open \`android/\` in Android Studio
2. Sync Gradle
3. Build APK

---
Order: ${orderId}
`);

    // BUILD.md
    await fs.writeFile(path.join(docsPath, 'BUILD.md'), `# Build Instructions

## Website (Static)
No build required. Just serve the files.

## Admin (Static)
No build required. Just serve the files.

## Android
\`\`\`bash
cd android
./gradlew assembleRelease
\`\`\`

APK location: \`android/app/build/outputs/apk/release/\`

---
Order: ${orderId}
`);

    // DEPLOY.md
    await fs.writeFile(path.join(docsPath, 'DEPLOY.md'), `# Deployment Guide

## Website Hosting Options
- Netlify (recommended)
- Vercel
- GitHub Pages
- Any static hosting

## Admin Deployment
- Run on local machine
- Or deploy to private server

## Android
- Build APK locally
- Upload to Play Store (optional)
- Or distribute directly

---
Order: ${orderId}
`);

    // DISCLAIMERS.md
    await fs.writeFile(path.join(docsPath, 'DISCLAIMERS.md'), `# Legal Disclaimers

## Ownership
This project is now YOUR property.
You have full ownership and responsibility.

## No Support
This is a one-time delivery.
No ongoing support is provided.

## No Warranty
Provided "as-is" without warranty.

## Independence
This project does NOT connect to:
- AHteam servers
- Any external services
- Any analytics or tracking

You are completely independent.

---
Order: ${orderId}
Generated: ${new Date().toISOString()}
`);

    return docsPath;
}

/**
 * Create .env.example
 */
async function createEnvExample(orderPath) {
    await fs.writeFile(path.join(orderPath, '.env.example'), `# Environment Variables Template
# Copy this file to .env and fill in your values

# Website Settings
WEBSITE_URL=https://your-domain.com

# Admin Settings
ADMIN_PORT=3001

# Note: No secrets needed - this is a static project
`);
}

/**
 * Create main README
 */
async function createMainReadme(orderPath, orderId, plan) {
    const hasAndroid = plan === 'premium';

    await fs.writeFile(path.join(orderPath, 'README.md'), `# Your Project

## Contents
- \`/website\` - Marketing website (static)
- \`/admin\` - Admin panel (static)
${hasAndroid ? '- `/android` - Android app (WebView)' : ''}
- \`/docs\` - Documentation

## Quick Start

### Website
\`\`\`bash
cd website
npx serve .
\`\`\`
Open: http://localhost:3000

### Admin
\`\`\`bash
cd admin
npx serve -p 3001 .
\`\`\`
Open: http://localhost:3001
Login: admin / admin123

${hasAndroid ? `### Android
Open \`android/\` folder in Android Studio and build.
` : ''}

## Documentation
See \`/docs\` folder for detailed guides.

---
Order: ${orderId}
Plan: ${plan}
Generated: ${new Date().toISOString()}
`);
}

/**
 * Export order to ZIP
 */
export async function exportOrder(orderId) {
    console.log(`\\n📦 Exporting Order: ${orderId}\\n`);

    // Check order exists
    const orderPath = path.join(ORDERS_DIR, orderId);
    if (!await fs.pathExists(orderPath)) {
        throw new Error(`Order not found: ${orderId}`);
    }

    // Load order metadata
    const orderMeta = JSON.parse(
        await fs.readFile(path.join(orderPath, 'order.json'), 'utf-8')
    );

    // Create docs
    console.log('📝 Creating documentation...');
    await createDocs(orderPath, orderId);
    await createEnvExample(orderPath);
    await createMainReadme(orderPath, orderId, orderMeta.plan);

    // Create exports directory
    await fs.ensureDir(EXPORTS_DIR);

    // ZIP filename
    const zipName = `AHteam-${orderId}.zip`;
    const zipPath = path.join(EXPORTS_DIR, zipName);

    // Create ZIP
    console.log('🗜️  Creating ZIP...');
    await createZip(orderPath, zipPath, orderId);

    // Calculate expiration (72 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    // Register export
    const registry = await loadExportsRegistry();
    registry.exports.push({
        orderId,
        zipName,
        zipPath,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        downloaded: false
    });
    await saveExportsRegistry(registry);

    console.log(`\\n✅ Export complete!`);
    console.log(`   ZIP: ${zipPath}`);
    console.log(`   Expires: ${expiresAt.toISOString()}`);

    return {
        success: true,
        orderId,
        zipName,
        zipPath,
        expiresAt: expiresAt.toISOString()
    };
}

/**
 * Create ZIP file
 */
async function createZip(sourceDir, zipPath, orderId) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`   Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
            resolve();
        });

        archive.on('error', reject);
        archive.pipe(output);

        // Add directories (exclude order.json from client package)
        const items = fs.readdirSync(sourceDir);
        for (const item of items) {
            if (item === 'order.json') continue; // Don't include internal metadata

            const itemPath = path.join(sourceDir, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                archive.directory(itemPath, item);
            } else {
                archive.file(itemPath, { name: item });
            }
        }

        archive.finalize();
    });
}

/**
 * Get export info
 */
export async function getExport(orderId) {
    const registry = await loadExportsRegistry();
    return registry.exports.find(e => e.orderId === orderId);
}

/**
 * Mark as downloaded
 */
export async function markDownloaded(orderId) {
    const registry = await loadExportsRegistry();
    const exp = registry.exports.find(e => e.orderId === orderId);
    if (exp) {
        exp.downloaded = true;
        exp.downloadedAt = new Date().toISOString();
        await saveExportsRegistry(registry);
    }
}

// CLI execution
if (process.argv[2]) {
    const orderId = process.argv[2];
    exportOrder(orderId).catch(err => {
        console.error('Export failed:', err.message);
        process.exit(1);
    });
}
