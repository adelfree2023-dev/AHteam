/**
 * ============================================
 * AHteam Trial Cleanup Job
 * ============================================
 * 
 * Deletes expired trials
 * Run via cron: node cleanup.js
 * ============================================
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRIAL_DIR = path.join(__dirname, '../projects');
const REGISTRY_PATH = path.join(__dirname, '../registry.json');

/**
 * Load registry
 */
async function loadRegistry() {
    try {
        if (await fs.pathExists(REGISTRY_PATH)) {
            return JSON.parse(await fs.readFile(REGISTRY_PATH, 'utf-8'));
        }
    } catch (e) {
        console.error('Error loading registry:', e);
    }
    return { trials: [] };
}

/**
 * Save registry
 */
async function saveRegistry(registry) {
    await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

/**
 * Check if trial is expired
 */
function isExpired(trial) {
    const expiresAt = new Date(trial.expiresAt);
    return new Date() > expiresAt;
}

/**
 * Main cleanup function
 */
async function cleanup() {
    console.log('🧹 AHteam Trial Cleanup');
    console.log('========================\n');
    console.log(`📅 ${new Date().toISOString()}\n`);

    const registry = await loadRegistry();
    const expired = registry.trials.filter(isExpired);
    const active = registry.trials.filter(t => !isExpired(t));

    console.log(`📊 Total trials: ${registry.trials.length}`);
    console.log(`   Active: ${active.length}`);
    console.log(`   Expired: ${expired.length}\n`);

    if (expired.length === 0) {
        console.log('✅ No expired trials to clean up.');
        return;
    }

    console.log('🗑️  Cleaning up expired trials:\n');

    for (const trial of expired) {
        const trialPath = path.join(TRIAL_DIR, trial.id);

        try {
            // Delete trial directory
            if (await fs.pathExists(trialPath)) {
                await fs.remove(trialPath);
                console.log(`   ✅ Deleted: ${trial.id} (${trial.projectName})`);
            } else {
                console.log(`   ⚠️  Not found: ${trial.id}`);
            }
        } catch (error) {
            console.log(`   ❌ Error deleting ${trial.id}: ${error.message}`);
        }
    }

    // Update registry - keep only active trials
    registry.trials = active;
    await saveRegistry(registry);

    console.log('\n✅ Cleanup complete!');
    console.log(`   Removed: ${expired.length} trials`);
    console.log(`   Remaining: ${active.length} trials`);
}

// Run cleanup
cleanup().catch(err => {
    console.error('❌ Cleanup failed:', err.message);
    process.exit(1);
});
