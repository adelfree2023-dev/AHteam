/**
 * ============================================
 * AHteam Trial Server
 * ============================================
 * 
 * Preview-only Runtime for Trials
 * 
 * ❌ No Download
 * ❌ No Export
 * ❌ No Source Access
 * ✅ Preview Only
 * ============================================
 */

import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Paths
const ROOT_DIR = path.resolve(__dirname, '../..');
const TRIAL_DIR = path.join(__dirname, '../projects');
const REGISTRY_PATH = path.join(__dirname, '../registry.json');
const GENERATOR_DIR = path.join(ROOT_DIR, 'generator');
const GENERATED_DIR = path.join(ROOT_DIR, 'generated');

// Middleware
app.use(cors());
app.use(express.json());

// Security headers
app.use((req, res, next) => {
    // Prevent file downloads
    res.setHeader('Content-Disposition', 'inline');
    // Prevent iframe embedding
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // No caching for trials
    res.setHeader('Cache-Control', 'no-store');
    next();
});

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
 * Create new trial
 */
app.post('/api/trial/create', async (req, res) => {
    try {
        const { projectName, duration = 7 } = req.body;

        // Generate trial ID
        const trialId = uuidv4().split('-')[0];

        // Calculate expiration
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(duration));

        // Create trial directory
        const trialPath = path.join(TRIAL_DIR, trialId);
        await fs.ensureDir(trialPath);

        // Copy generated website and admin
        await fs.copy(
            path.join(GENERATED_DIR, 'website'),
            path.join(trialPath, 'website')
        );
        await fs.copy(
            path.join(GENERATED_DIR, 'admin'),
            path.join(trialPath, 'admin')
        );

        // Register trial
        const registry = await loadRegistry();
        registry.trials.push({
            id: trialId,
            projectName: projectName || 'Trial Project',
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            duration: parseInt(duration),
            status: 'active'
        });
        await saveRegistry(registry);

        console.log(`✅ Trial created: ${trialId} (expires: ${expiresAt.toISOString()})`);

        res.json({
            success: true,
            trialId,
            urls: {
                website: `/preview/${trialId}/`,
                admin: `/preview/${trialId}/admin/`
            },
            expiresAt: expiresAt.toISOString()
        });

    } catch (error) {
        console.error('Error creating trial:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * List active trials
 */
app.get('/api/trial/list', async (req, res) => {
    try {
        const registry = await loadRegistry();
        const activeTrials = registry.trials.filter(t => !isExpired(t));

        res.json({
            success: true,
            trials: activeTrials.map(t => ({
                id: t.id,
                projectName: t.projectName,
                createdAt: t.createdAt,
                expiresAt: t.expiresAt,
                daysRemaining: Math.ceil((new Date(t.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get trial info
 */
app.get('/api/trial/:trialId', async (req, res) => {
    try {
        const { trialId } = req.params;
        const registry = await loadRegistry();
        const trial = registry.trials.find(t => t.id === trialId);

        if (!trial) {
            return res.status(404).json({ success: false, error: 'Trial not found' });
        }

        if (isExpired(trial)) {
            return res.status(410).json({ success: false, error: 'Trial expired' });
        }

        res.json({
            success: true,
            trial: {
                id: trial.id,
                projectName: trial.projectName,
                expiresAt: trial.expiresAt,
                daysRemaining: Math.ceil((new Date(trial.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Preview Website - Serve static files
 */
app.use('/preview/:trialId/', async (req, res, next) => {
    const { trialId } = req.params;
    const registry = await loadRegistry();
    const trial = registry.trials.find(t => t.id === trialId);

    if (!trial) {
        return res.status(404).send('Trial not found');
    }

    if (isExpired(trial)) {
        return res.status(410).send(`
      <html>
        <head><title>Trial Expired</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>⏰ Trial Expired</h1>
          <p>This trial has expired.</p>
          <p>Contact us to purchase the full version.</p>
        </body>
      </html>
    `);
    }

    next();
});

// Serve website files
app.use('/preview/:trialId/', (req, res, next) => {
    const trialId = req.params.trialId;
    const trialPath = path.join(TRIAL_DIR, trialId, 'website');
    express.static(trialPath)(req, res, next);
});

// Serve admin files
app.use('/preview/:trialId/admin/', (req, res, next) => {
    const trialId = req.params.trialId;
    const trialPath = path.join(TRIAL_DIR, trialId, 'admin');
    express.static(trialPath)(req, res, next);
});

/**
 * Block dangerous endpoints
 */
app.get('/api/export/*', (req, res) => {
    res.status(403).json({ error: 'Export not allowed in trial mode' });
});

app.get('/api/download/*', (req, res) => {
    res.status(403).json({ error: 'Download not allowed in trial mode' });
});

/**
 * Home page - Trial Dashboard
 */
app.get('/', async (req, res) => {
    const registry = await loadRegistry();
    const activeTrials = registry.trials.filter(t => !isExpired(t));

    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AHteam Trial System</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #fff; min-height: 100vh; padding: 2rem; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        .subtitle { color: #94a3b8; margin-bottom: 2rem; }
        .create-btn { background: #2563eb; color: #fff; border: none; padding: 1rem 2rem; border-radius: 8px; font-size: 1rem; cursor: pointer; margin-bottom: 2rem; }
        .create-btn:hover { background: #1d4ed8; }
        .trials { display: grid; gap: 1rem; }
        .trial-card { background: #1e293b; border-radius: 8px; padding: 1.5rem; }
        .trial-card h3 { margin-bottom: 0.5rem; }
        .trial-card p { color: #94a3b8; font-size: 0.875rem; margin-bottom: 0.5rem; }
        .trial-links { display: flex; gap: 1rem; margin-top: 1rem; }
        .trial-links a { background: #334155; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; color: #fff; font-size: 0.875rem; }
        .trial-links a:hover { background: #475569; }
        .badge { display: inline-block; background: #22c55e; color: #fff; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }
        .empty { text-align: center; color: #64748b; padding: 3rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏭 AHteam Trial System</h1>
        <p class="subtitle">Preview-only Showroom • No Download • No Export</p>
        
        <button class="create-btn" onclick="createTrial()">➕ Create New Trial</button>
        
        <h2 style="margin-bottom: 1rem;">Active Trials (${activeTrials.length})</h2>
        
        <div class="trials">
          ${activeTrials.length === 0 ? '<div class="empty">No active trials</div>' : ''}
          ${activeTrials.map(t => `
            <div class="trial-card">
              <h3>${t.projectName} <span class="badge">Active</span></h3>
              <p>ID: ${t.id}</p>
              <p>Expires: ${new Date(t.expiresAt).toLocaleDateString('ar-EG')} (${Math.ceil((new Date(t.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))} days)</p>
              <div class="trial-links">
                <a href="/preview/${t.id}/" target="_blank">🌐 Website</a>
                <a href="/preview/${t.id}/admin/login.html" target="_blank">📊 Admin</a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <script>
        async function createTrial() {
          const name = prompt('Project Name:', 'My Trial Project');
          if (!name) return;
          
          const duration = prompt('Duration (days):', '7');
          if (!duration) return;
          
          const res = await fetch('/api/trial/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName: name, duration: parseInt(duration) })
          });
          
          const data = await res.json();
          if (data.success) {
            alert('Trial created! ID: ' + data.trialId);
            location.reload();
          } else {
            alert('Error: ' + data.error);
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
    console.log(`🏭 AHteam Trial Server running on port ${PORT}`);
    console.log(`📁 Trials directory: ${TRIAL_DIR}`);
    console.log('');
    console.log('Endpoints:');
    console.log(`  Dashboard:  http://localhost:${PORT}/`);
    console.log(`  Create:     POST /api/trial/create`);
    console.log(`  List:       GET /api/trial/list`);
    console.log(`  Preview:    /preview/{trialId}/`);
    console.log('');
});
