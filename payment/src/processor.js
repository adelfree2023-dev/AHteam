/**
 * ============================================
 * AHteam Payment System
 * ============================================
 * 
 * Payment = Ownership + Disappear
 * 
 * ❌ No Runtime after payment
 * ❌ No Trial upgrade
 * ✅ Fresh generation
 * ✅ Order creation
 * ✅ Trial deletion
 * ============================================
 */

import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ROOT_DIR = path.resolve(__dirname, '../../..');
const ORDERS_DIR = path.join(__dirname, '../orders');
const ORDERS_REGISTRY = path.join(__dirname, '../orders-registry.json');
const TRIAL_REGISTRY = path.join(__dirname, '../../trial/registry.json');
const TRIAL_PROJECTS = path.join(__dirname, '../../trial/projects');
const GENERATED_DIR = path.join(ROOT_DIR, 'generated');

/**
 * Load orders registry
 */
export async function loadOrdersRegistry() {
    try {
        if (await fs.pathExists(ORDERS_REGISTRY)) {
            return JSON.parse(await fs.readFile(ORDERS_REGISTRY, 'utf-8'));
        }
    } catch (e) {
        console.error('Error loading orders registry:', e);
    }
    return { orders: [] };
}

/**
 * Save orders registry
 */
export async function saveOrdersRegistry(registry) {
    await fs.writeFile(ORDERS_REGISTRY, JSON.stringify(registry, null, 2));
}

/**
 * Load trial registry
 */
async function loadTrialRegistry() {
    try {
        if (await fs.pathExists(TRIAL_REGISTRY)) {
            return JSON.parse(await fs.readFile(TRIAL_REGISTRY, 'utf-8'));
        }
    } catch (e) {
        console.error('Error loading trial registry:', e);
    }
    return { trials: [] };
}

/**
 * Save trial registry
 */
async function saveTrialRegistry(registry) {
    await fs.writeFile(TRIAL_REGISTRY, JSON.stringify(registry, null, 2));
}

/**
 * Process payment and create order
 * 
 * IMPORTANT: Does NOT use trial files!
 * Generates fresh project.
 */
export async function processPayment(paymentData) {
    const { trialId, email, plan, paymentId, amount } = paymentData;

    console.log('\n💳 Processing Payment...');
    console.log(`   Trial: ${trialId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Plan: ${plan}`);
    console.log(`   Amount: ${amount}`);

    // 1. Generate Order ID
    const orderId = `ORD-${Date.now()}-${uuidv4().split('-')[0]}`;
    console.log(`   Order: ${orderId}`);

    // 2. Create order directory
    const orderPath = path.join(ORDERS_DIR, orderId);
    await fs.ensureDir(orderPath);

    // 3. IMPORTANT: Generate FRESH project (NOT trial files!)
    console.log('\n🏭 Generating Fresh Project...');

    // Copy from /generated (freshly generated)
    // NOT from /trial/projects/{trialId}
    await fs.copy(
        path.join(GENERATED_DIR, 'website'),
        path.join(orderPath, 'website')
    );
    console.log('   ✅ Website');

    await fs.copy(
        path.join(GENERATED_DIR, 'admin'),
        path.join(orderPath, 'admin')
    );
    console.log('   ✅ Admin');

    await fs.copy(
        path.join(GENERATED_DIR, 'android'),
        path.join(orderPath, 'android')
    );
    console.log('   ✅ Android');

    // 4. Create order metadata
    const orderMeta = {
        orderId,
        trialId,
        email,
        plan,
        paymentId,
        amount,
        status: 'completed',
        createdAt: new Date().toISOString(),
        includes: {
            website: true,
            admin: true,
            android: plan === 'premium'
        }
    };

    await fs.writeFile(
        path.join(orderPath, 'order.json'),
        JSON.stringify(orderMeta, null, 2)
    );

    // 5. Register order
    const ordersRegistry = await loadOrdersRegistry();
    ordersRegistry.orders.push(orderMeta);
    await saveOrdersRegistry(ordersRegistry);

    // 6. DELETE Trial (important!)
    console.log('\n🗑️  Deleting Trial...');
    await deleteTrial(trialId);
    console.log('   ✅ Trial deleted');

    console.log('\n✅ Payment processed successfully!');
    console.log(`   Order: ${orderId}`);
    console.log(`   Ready for export (Phase K)`);

    return {
        success: true,
        orderId,
        orderPath
    };
}

/**
 * Delete trial after payment
 */
async function deleteTrial(trialId) {
    // Delete trial files
    const trialPath = path.join(TRIAL_PROJECTS, trialId);
    if (await fs.pathExists(trialPath)) {
        await fs.remove(trialPath);
    }

    // Remove from registry
    const registry = await loadTrialRegistry();
    registry.trials = registry.trials.filter(t => t.id !== trialId);
    await saveTrialRegistry(registry);
}

/**
 * Get order by ID
 */
export async function getOrder(orderId) {
    const orderPath = path.join(ORDERS_DIR, orderId, 'order.json');
    if (await fs.pathExists(orderPath)) {
        return JSON.parse(await fs.readFile(orderPath, 'utf-8'));
    }
    return null;
}

/**
 * List all orders
 */
export async function listOrders() {
    const registry = await loadOrdersRegistry();
    return registry.orders;
}
