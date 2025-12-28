/**
 * ============================================
 * AHteam Master Cleanup - Phase L
 * ============================================
 * 
 * Zero Liability State
 * 
 * Deletes:
 * - Downloaded order files
 * - Expired trials
 * - Expired exports
 * - Sensitive logs
 * 
 * Keeps:
 * - Minimal order metadata (ID, Email, Timestamp)
 * ============================================
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const TRIAL_DIR = path.join(ROOT_DIR, 'trial/projects');
const TRIAL_REGISTRY = path.join(ROOT_DIR, 'trial/registry.json');
const ORDERS_DIR = path.join(ROOT_DIR, 'payment/orders');
const ORDERS_REGISTRY = path.join(ROOT_DIR, 'payment/orders-registry.json');
const EXPORTS_DIR = path.join(ROOT_DIR, 'export/exports');
const EXPORTS_REGISTRY = path.join(ROOT_DIR, 'export/exports-registry.json');
const HISTORY_FILE = path.join(ROOT_DIR, 'order-history.json');

/**
 * Main cleanup function
 */
async function cleanup() {
    console.log('🧹 AHteam Master Cleanup - Phase L');
    console.log('=====================================');
    console.log('🎯 Goal: Zero Liability State');
    console.log(`📅 ${new Date().toISOString()}\n`);

    let stats = {
        trialsDeleted: 0,
        ordersDeleted: 0,
        exportsDeleted: 0,
        historyKept: 0
    };

    // 1. Clean expired trials
    console.log('1️⃣  Cleaning Expired Trials...\n');
    stats.trialsDeleted = await cleanTrials();

    // 2. Clean downloaded orders
    console.log('\n2️⃣  Cleaning Downloaded Orders...\n');
    stats.ordersDeleted = await cleanDownloadedOrders();

    // 3. Clean expired/downloaded exports
    console.log('\n3️⃣  Cleaning Exports...\n');
    stats.exportsDeleted = await cleanExports();

    // 4. Summary
    console.log('\n=====================================');
    console.log('✅ Cleanup Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Trials deleted:  ${stats.trialsDeleted}`);
    console.log(`   Orders deleted:  ${stats.ordersDeleted}`);
    console.log(`   Exports deleted: ${stats.exportsDeleted}`);
    console.log(`   History kept:    ${stats.historyKept}`);
    console.log('\n🔒 Zero Liability State Achieved!\n');
}

/**
 * Clean expired trials
 */
async function cleanTrials() {
    let deleted = 0;

    try {
        let registry = { trials: [] };
        if (await fs.pathExists(TRIAL_REGISTRY)) {
            registry = JSON.parse(await fs.readFile(TRIAL_REGISTRY, 'utf-8'));
        }

        const now = new Date();
        const expired = registry.trials.filter(t => new Date(t.expiresAt) < now);

        for (const trial of expired) {
            const trialPath = path.join(TRIAL_DIR, trial.id);
            if (await fs.pathExists(trialPath)) {
                await fs.remove(trialPath);
                console.log(`   ✅ Deleted trial: ${trial.id}`);
                deleted++;
            }
        }

        // Update registry
        registry.trials = registry.trials.filter(t => new Date(t.expiresAt) >= now);
        await fs.writeFile(TRIAL_REGISTRY, JSON.stringify(registry, null, 2));

    } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
    }

    return deleted;
}

/**
 * Clean downloaded orders (files only, keep metadata)
 */
async function cleanDownloadedOrders() {
    let deleted = 0;

    try {
        // Load exports to find downloaded orders
        let exportsRegistry = { exports: [] };
        if (await fs.pathExists(EXPORTS_REGISTRY)) {
            exportsRegistry = JSON.parse(await fs.readFile(EXPORTS_REGISTRY, 'utf-8'));
        }

        // Load orders registry
        let ordersRegistry = { orders: [] };
        if (await fs.pathExists(ORDERS_REGISTRY)) {
            ordersRegistry = JSON.parse(await fs.readFile(ORDERS_REGISTRY, 'utf-8'));
        }

        // Load/create history
        let history = { orders: [] };
        if (await fs.pathExists(HISTORY_FILE)) {
            history = JSON.parse(await fs.readFile(HISTORY_FILE, 'utf-8'));
        }

        // Find downloaded exports
        const downloaded = exportsRegistry.exports.filter(e => e.downloaded);

        for (const exp of downloaded) {
            // Find order
            const order = ordersRegistry.orders.find(o => o.orderId === exp.orderId);

            if (order) {
                // Save minimal metadata to history
                history.orders.push({
                    orderId: order.orderId,
                    email: order.email,
                    plan: order.plan,
                    amount: order.amount,
                    createdAt: order.createdAt,
                    downloadedAt: exp.downloadedAt,
                    // NO SOURCE, NO FILES, NO PATHS
                });

                // Delete order files
                const orderPath = path.join(ORDERS_DIR, order.orderId);
                if (await fs.pathExists(orderPath)) {
                    await fs.remove(orderPath);
                    console.log(`   ✅ Deleted order files: ${order.orderId}`);
                    deleted++;
                }

                // Remove from orders registry
                ordersRegistry.orders = ordersRegistry.orders.filter(o => o.orderId !== order.orderId);
            }
        }

        // Save history
        await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));

        // Update orders registry
        await fs.writeFile(ORDERS_REGISTRY, JSON.stringify(ordersRegistry, null, 2));

    } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
    }

    return deleted;
}

/**
 * Clean exports (downloaded and expired)
 */
async function cleanExports() {
    let deleted = 0;

    try {
        let registry = { exports: [] };
        if (await fs.pathExists(EXPORTS_REGISTRY)) {
            registry = JSON.parse(await fs.readFile(EXPORTS_REGISTRY, 'utf-8'));
        }

        const now = new Date();
        const toDelete = registry.exports.filter(e =>
            e.downloaded || new Date(e.expiresAt) < now
        );

        for (const exp of toDelete) {
            // Delete ZIP
            if (await fs.pathExists(exp.zipPath)) {
                await fs.remove(exp.zipPath);
                console.log(`   ✅ Deleted ZIP: ${exp.zipName}`);
                deleted++;
            }
        }

        // Keep only active exports
        registry.exports = registry.exports.filter(e =>
            !e.downloaded && new Date(e.expiresAt) >= now
        );
        await fs.writeFile(EXPORTS_REGISTRY, JSON.stringify(registry, null, 2));

    } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
    }

    return deleted;
}

// Run cleanup
cleanup().catch(err => {
    console.error('❌ Cleanup failed:', err.message);
    process.exit(1);
});
