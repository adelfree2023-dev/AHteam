/**
 * ============================================
 * AHteam Factory Admin - Server
 * ============================================
 * 
 * Internal Command & Control
 * 
 * ❌ No Internet exposure
 * ❌ No Public access
 * ✅ Localhost only
 * ============================================
 */

import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4000;

// Paths
const FACTORY_DIR = path.resolve(__dirname, '..');
const ORDERS_HISTORY = path.join(FACTORY_DIR, 'order-history.json');
const ORDERS_REGISTRY = path.join(FACTORY_DIR, 'payment/orders-registry.json');
const EXPORTS_REGISTRY = path.join(FACTORY_DIR, 'export/exports-registry.json');
const TRIAL_REGISTRY = path.join(FACTORY_DIR, 'trial/registry.json');
const TEMPLATES_DIR = path.join(FACTORY_DIR, 'templates');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * API: Get Stats
 */
app.get('/api/stats', async (req, res) => {
    try {
        // Orders count
        let ordersHistory = { orders: [] };
        if (await fs.pathExists(ORDERS_HISTORY)) {
            ordersHistory = JSON.parse(await fs.readFile(ORDERS_HISTORY, 'utf-8'));
        }

        // Active trials
        let trials = { trials: [] };
        if (await fs.pathExists(TRIAL_REGISTRY)) {
            trials = JSON.parse(await fs.readFile(TRIAL_REGISTRY, 'utf-8'));
        }

        // Exports
        let exports = { exports: [] };
        if (await fs.pathExists(EXPORTS_REGISTRY)) {
            exports = JSON.parse(await fs.readFile(EXPORTS_REGISTRY, 'utf-8'));
        }

        // Templates count
        const templateTypes = ['website', 'admin', 'android'];
        let templatesCount = 0;
        for (const type of templateTypes) {
            const typePath = path.join(TEMPLATES_DIR, type);
            if (await fs.pathExists(typePath)) {
                const dirs = await fs.readdir(typePath);
                templatesCount += dirs.length;
            }
        }

        res.json({
            totalOrders: ordersHistory.orders.length,
            activeTrials: trials.trials.filter(t => new Date(t.expiresAt) > new Date()).length,
            pendingExports: exports.exports.filter(e => !e.downloaded).length,
            totalTemplates: templatesCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * API: Get Orders
 */
app.get('/api/orders', async (req, res) => {
    try {
        let history = { orders: [] };
        if (await fs.pathExists(ORDERS_HISTORY)) {
            history = JSON.parse(await fs.readFile(ORDERS_HISTORY, 'utf-8'));
        }

        let pending = { orders: [] };
        if (await fs.pathExists(ORDERS_REGISTRY)) {
            pending = JSON.parse(await fs.readFile(ORDERS_REGISTRY, 'utf-8'));
        }

        // Combine and sort
        const allOrders = [
            ...history.orders.map(o => ({ ...o, status: 'cleaned' })),
            ...pending.orders.map(o => ({ ...o, status: 'pending' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(allOrders.slice(0, 50)); // Last 50
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * API: Get Templates
 */
app.get('/api/templates', async (req, res) => {
    try {
        const templates = [];
        const types = ['website', 'admin', 'android'];

        for (const type of types) {
            const typePath = path.join(TEMPLATES_DIR, type);
            if (await fs.pathExists(typePath)) {
                const dirs = await fs.readdir(typePath);
                for (const dir of dirs) {
                    const manifestPath = path.join(typePath, dir, 'manifest.json');
                    let manifest = { id: dir, name: dir };

                    if (await fs.pathExists(manifestPath)) {
                        manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
                    }

                    templates.push({
                        id: manifest.id || dir,
                        name: manifest.name || dir,
                        type,
                        version: manifest.version || '1.0.0',
                        status: 'active'
                    });
                }
            }
        }

        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * API: Get Logs (simple file-based)
 */
app.get('/api/logs', async (req, res) => {
    try {
        // Read trial server log if exists
        const logs = [];

        // Add system events
        logs.push({
            type: 'info',
            message: 'Factory Admin started',
            timestamp: new Date().toISOString()
        });

        // Read exports for events
        let exports = { exports: [] };
        if (await fs.pathExists(EXPORTS_REGISTRY)) {
            exports = JSON.parse(await fs.readFile(EXPORTS_REGISTRY, 'utf-8'));
        }

        for (const exp of exports.exports.slice(-10)) {
            logs.push({
                type: 'success',
                message: `Export created: ${exp.orderId}`,
                timestamp: exp.createdAt
            });
            if (exp.downloaded) {
                logs.push({
                    type: 'success',
                    message: `Downloaded: ${exp.orderId}`,
                    timestamp: exp.downloadedAt
                });
            }
        }

        res.json(logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Serve Admin Panel
 */
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server - LOCALHOST ONLY
app.listen(PORT, '127.0.0.1', () => {
    console.log('🏭 AHteam Factory Admin');
    console.log('========================');
    console.log(`🔒 Localhost only: http://127.0.0.1:${PORT}`);
    console.log('');
    console.log('Pages:');
    console.log('  Dashboard  /');
    console.log('  Orders     /orders');
    console.log('  Templates  /templates');
    console.log('  Logs       /logs');
    console.log('');
});
