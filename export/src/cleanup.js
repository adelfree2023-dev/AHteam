/**
 * ============================================
 * AHteam Export Cleanup
 * ============================================
 * 
 * Cleans up expired exports and downloaded orders
 * ============================================
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPORTS_DIR = path.join(__dirname, '../exports');
const EXPORTS_REGISTRY = path.join(__dirname, '../exports-registry.json');
const ORDERS_DIR = path.join(__dirname, '../../payment/orders');
const ORDERS_REGISTRY = path.join(__dirname, '../../payment/orders-registry.json');

async function cleanup() {
    console.log('🧹 AHteam Export Cleanup');
    console.log('========================\\n');

    // Load exports registry
    let exportsRegistry = { exports: [] };
    if (await fs.pathExists(EXPORTS_REGISTRY)) {
        exportsRegistry = JSON.parse(await fs.readFile(EXPORTS_REGISTRY, 'utf-8'));
    }

    const now = new Date();
    let cleaned = 0;

    for (const exp of exportsRegistry.exports) {
        const expired = new Date(exp.expiresAt) < now;
        const downloaded = exp.downloaded;

        // Clean if expired OR downloaded
        if (expired || downloaded) {
            console.log(`🗑️  Cleaning: ${exp.orderId}`);
            console.log(`   Reason: ${expired ? 'Expired' : 'Downloaded'}`);

            // Delete ZIP
            if (await fs.pathExists(exp.zipPath)) {
                await fs.remove(exp.zipPath);
                console.log('   ✅ ZIP deleted');
            }

            // Delete order files
            const orderPath = path.join(ORDERS_DIR, exp.orderId);
            if (await fs.pathExists(orderPath)) {
                await fs.remove(orderPath);
                console.log('   ✅ Order files deleted');
            }

            cleaned++;
        }
    }

    // Update registries - keep only non-cleaned
    const remaining = exportsRegistry.exports.filter(e => {
        const expired = new Date(e.expiresAt) < now;
        return !expired && !e.downloaded;
    });

    exportsRegistry.exports = remaining;
    await fs.writeFile(EXPORTS_REGISTRY, JSON.stringify(exportsRegistry, null, 2));

    console.log(`\\n✅ Cleanup complete!`);
    console.log(`   Cleaned: ${cleaned}`);
    console.log(`   Remaining: ${remaining.length}`);
}

cleanup().catch(err => {
    console.error('Cleanup failed:', err.message);
    process.exit(1);
});
