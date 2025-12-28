/**
 * ============================================
 * AHteam Generator - Main Entry Point
 * ============================================
 * 
 * Generates standalone website from:
 * - project.config.json
 * - Website Template
 * 
 * Output: /generated/website
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
    console.log('🏭 AHteam Generator v1.0.0\n');
    console.log('================================\n');

    // Step 1: Validate Contract
    console.log('📋 Step 1: Validate Contract');
    const templatePath = path.join(TEMPLATES_DIR, 'website', 'web-ecommerce-001');
    const validation = validate(CONFIG_PATH, templatePath);

    if (!validation.valid) {
        console.log('\n❌ Generation stopped: Contract validation failed');
        process.exit(1);
    }

    const config = validation.config;

    // Step 2: Prepare output directory
    console.log('📁 Step 2: Prepare Output Directory');
    const websiteOutput = path.join(OUTPUT_DIR, 'website');
    await fs.ensureDir(websiteOutput);
    await fs.emptyDir(websiteOutput);
    console.log(`   Output: ${websiteOutput}\n`);

    // Step 3: Copy and process template files
    console.log('🔧 Step 3: Generate Website');
    await generateWebsite(config, templatePath, websiteOutput);

    // Step 4: Generate additional files
    console.log('\n📝 Step 4: Generate Documentation');
    await generateDocs(config, websiteOutput);

    // Step 5: Create package.json for generated project
    console.log('\n📦 Step 5: Create Project Files');
    await generateProjectFiles(config, websiteOutput);

    console.log('\n================================');
    console.log('✅ Generation Complete!\n');
    console.log(`📁 Output: ${websiteOutput}`);
    console.log('\nNext steps:');
    console.log('  cd generated/website');
    console.log('  npm install');
    console.log('  npm run dev');
    console.log('');
}

/**
 * Generate website from template
 */
async function generateWebsite(config, templatePath, outputPath) {
    // Copy pages
    const pagesDir = path.join(templatePath, 'pages');
    if (await fs.pathExists(pagesDir)) {
        const pages = await fs.readdir(pagesDir);
        for (const page of pages) {
            const sourcePath = path.join(pagesDir, page);
            const destPath = path.join(outputPath, page);

            let content = await fs.readFile(sourcePath, 'utf-8');
            content = processFile(content, config, page);
            await fs.writeFile(destPath, content);
            console.log(`   ✅ ${page}`);
        }
    }

    // Copy and process assets
    const assetsDir = path.join(templatePath, 'assets');
    if (await fs.pathExists(assetsDir)) {
        await copyAndProcessDir(assetsDir, path.join(outputPath, 'assets'), config);
        console.log('   ✅ assets/');
    }

    // Copy data
    const dataDir = path.join(templatePath, 'data');
    if (await fs.pathExists(dataDir)) {
        await fs.copy(dataDir, path.join(outputPath, 'data'));
        console.log('   ✅ data/');
    }
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
 * Generate documentation files
 */
async function generateDocs(config, outputPath) {
    // README.md
    const readme = `# ${config.project.name}

> ${config.business.name} - Marketing Website

## 🚀 Quick Start

\`\`\`bash
# Open in browser
open index.html
\`\`\`

## 📁 Structure

\`\`\`
├── index.html       # Home page
├── products.html    # Products page
├── about.html       # About page
├── contact.html     # Contact page
├── cart.html        # Shopping cart
├── assets/
│   ├── css/         # Stylesheets
│   ├── js/          # JavaScript
│   └── images/      # Images
└── data/
    └── sample.json  # Sample data
\`\`\`

## 📧 Contact

- Email: ${config.business.email}
- Phone: ${config.business.phone}

---

Generated by AHteam Factory
`;

    await fs.writeFile(path.join(outputPath, 'README.md'), readme);
    console.log('   ✅ README.md');

    // Build Instructions
    const buildInstructions = `# Build Instructions

## For Static Hosting

This website is fully static and can be hosted on any static hosting service.

### Option 1: Direct Upload

Simply upload all files to your hosting provider:
- Netlify
- Vercel
- GitHub Pages
- Any Apache/Nginx server

### Option 2: Local Server

\`\`\`bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
\`\`\`

## Configuration

All configuration is baked into the files during generation.
To change settings, regenerate the website with updated project.config.json.

## No Backend Required

This website:
- ✅ Works without a server
- ✅ No database needed
- ✅ No API dependencies
- ✅ Fully standalone

---

Generated: ${new Date().toISOString()}
`;

    await fs.writeFile(path.join(outputPath, 'BUILD_INSTRUCTIONS.md'), buildInstructions);
    console.log('   ✅ BUILD_INSTRUCTIONS.md');
}

/**
 * Generate project configuration files
 */
async function generateProjectFiles(config, outputPath) {
    // .gitignore
    const gitignore = `node_modules/
.DS_Store
*.log
`;
    await fs.writeFile(path.join(outputPath, '.gitignore'), gitignore);
    console.log('   ✅ .gitignore');
}

// Run generator
generate().catch(err => {
    console.error('❌ Generation failed:', err.message);
    process.exit(1);
});
