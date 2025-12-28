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
import { logEvent } from '../../scripts/analytics-wrapper.js';

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

        // Funnel: Trial Started
        await logEvent('trialsStarted');

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

    // Funnel: Preview Viewed (only track main HTML requests, not assets)
    if (req.path === '/' || req.path === '/index.html' || req.path === '/admin/login.html') {
        await logEvent('previewsViewed');
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
 * Payment Processing - Creates fresh order, deletes trial
 */
app.post('/api/payment/process', async (req, res) => {
    try {
        const { trialId, email, plan, amount, paymentId } = req.body;

        console.log('\\n💳 Processing Payment...');
        console.log(`   Trial: ${trialId}`);
        console.log(`   Email: ${email}`);
        console.log(`   Plan: ${plan}`);

        // Validate trial exists
        const registry = await loadRegistry();
        const trial = registry.trials.find(t => t.id === trialId);

        if (!trial) {
            return res.status(404).json({ success: false, error: 'Trial not found' });
        }

        // Generate Order ID
        const orderId = `ORD-${Date.now()}`;

        // Create order directory
        const ordersDir = path.join(__dirname, '../../payment/orders');
        const orderPath = path.join(ordersDir, orderId);
        await fs.ensureDir(orderPath);

        // IMPORTANT: Copy from /generated (FRESH), NOT from trial!
        console.log('   Generating fresh project...');

        await fs.copy(
            path.join(GENERATED_DIR, 'website'),
            path.join(orderPath, 'website')
        );

        await fs.copy(
            path.join(GENERATED_DIR, 'admin'),
            path.join(orderPath, 'admin')
        );

        if (plan === 'premium') {
            await fs.copy(
                path.join(GENERATED_DIR, 'android'),
                path.join(orderPath, 'android')
            );
        }

        // Save order metadata
        const orderMeta = {
            orderId,
            trialId,
            email,
            plan,
            paymentId,
            amount,
            status: 'completed',
            createdAt: new Date().toISOString()
        };

        await fs.writeFile(
            path.join(orderPath, 'order.json'),
            JSON.stringify(orderMeta, null, 2)
        );

        // Register order
        const ordersRegistryPath = path.join(__dirname, '../../payment/orders-registry.json');
        let ordersRegistry = { orders: [] };
        if (await fs.pathExists(ordersRegistryPath)) {
            ordersRegistry = JSON.parse(await fs.readFile(ordersRegistryPath, 'utf-8'));
        }
        ordersRegistry.orders.push(orderMeta);
        await fs.writeFile(ordersRegistryPath, JSON.stringify(ordersRegistry, null, 2));

        // DELETE Trial
        console.log('   Deleting trial...');
        const trialPath = path.join(TRIAL_DIR, trialId);
        if (await fs.pathExists(trialPath)) {
            await fs.remove(trialPath);
        }
        registry.trials = registry.trials.filter(t => t.id !== trialId);
        await saveRegistry(registry);

        console.log(`✅ Payment processed: ${orderId}`);

        // Funnel: Payment Success
        await logEvent('paymentSuccess');

        res.json({
            success: true,
            orderId,
            message: 'Payment successful. Project ready for export.'
        });

    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Export order to ZIP (after payment)
 */
app.post('/api/export/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        console.log(`\\n📦 Exporting: ${orderId}`);

        // Check order exists
        const ordersDir = path.join(__dirname, '../../payment/orders');
        const orderPath = path.join(ordersDir, orderId);

        if (!await fs.pathExists(orderPath)) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // Load order metadata
        const orderMeta = JSON.parse(
            await fs.readFile(path.join(orderPath, 'order.json'), 'utf-8')
        );

        // Create docs directory
        const docsPath = path.join(orderPath, 'docs');
        await fs.ensureDir(docsPath);

        // Create INSTALL.md
        await fs.writeFile(path.join(docsPath, 'INSTALL.md'),
            `# Installation\\n\\n` +
            `## Website\\n\`\`\`bash\\ncd website\\nnpx serve .\\n\`\`\`\\n\\n` +
            `## Admin\\n\`\`\`bash\\ncd admin\\nnpx serve -p 3001 .\\n\`\`\`\\n\\n` +
            `Order: ${orderId}`
        );

        // Create README
        await fs.writeFile(path.join(orderPath, 'README.md'),
            `# Your Project\\n\\n` +
            `- /website - Marketing site\\n` +
            `- /admin - Admin panel\\n` +
            (orderMeta.plan === 'premium' ? `- /android - Android app\\n` : '') +
            `\\nOrder: ${orderId}\\nGenerated: ${new Date().toISOString()}`
        );

        // Create exports dir
        const exportsDir = path.join(__dirname, '../../export/exports');
        await fs.ensureDir(exportsDir);

        // Create ZIP using archiver
        const archiver = (await import('archiver')).default;
        const zipName = `AHteam-${orderId}.zip`;
        const zipPath = path.join(exportsDir, zipName);

        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(output);

            // Add all files except order.json
            const items = fs.readdirSync(orderPath);
            for (const item of items) {
                if (item === 'order.json') continue;
                const itemPath = path.join(orderPath, item);
                if (fs.statSync(itemPath).isDirectory()) {
                    archive.directory(itemPath, item);
                } else {
                    archive.file(itemPath, { name: item });
                }
            }

            archive.finalize();
        });

        // Calculate expiration (72 hours)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 72);

        // Register export
        const exportsRegistryPath = path.join(__dirname, '../../export/exports-registry.json');
        let exportsRegistry = { exports: [] };
        if (await fs.pathExists(exportsRegistryPath)) {
            exportsRegistry = JSON.parse(await fs.readFile(exportsRegistryPath, 'utf-8'));
        }
        exportsRegistry.exports.push({
            orderId,
            zipName,
            zipPath,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            downloaded: false
        });
        await fs.writeFile(exportsRegistryPath, JSON.stringify(exportsRegistry, null, 2));

        console.log(`✅ Export ready: ${zipName}`);

        res.json({
            success: true,
            orderId,
            downloadUrl: `/api/download/${orderId}`,
            expiresAt: expiresAt.toISOString()
        });

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Download ZIP (for paid orders only)
 */
app.get('/api/download/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        // Find export
        const exportsRegistryPath = path.join(__dirname, '../../export/exports-registry.json');
        let exportsRegistry = { exports: [] };
        if (await fs.pathExists(exportsRegistryPath)) {
            exportsRegistry = JSON.parse(await fs.readFile(exportsRegistryPath, 'utf-8'));
        }

        const exp = exportsRegistry.exports.find(e => e.orderId === orderId);

        if (!exp) {
            return res.status(404).json({ error: 'Export not found. Please create export first.' });
        }

        // Check expiration
        if (new Date(exp.expiresAt) < new Date()) {
            return res.status(410).json({ error: 'Download link expired' });
        }

        // Check file exists
        if (!await fs.pathExists(exp.zipPath)) {
            return res.status(404).json({ error: 'ZIP file not found' });
        }

        // Mark as downloaded
        exp.downloaded = true;
        exp.downloadedAt = new Date().toISOString();
        await fs.writeFile(exportsRegistryPath, JSON.stringify(exportsRegistry, null, 2));

        // Funnel: Download Complete
        await logEvent('downloadComplete');

        // Send file
        res.download(exp.zipPath, exp.zipName);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * API: Track generic event (e.g. buyClicked)
 */
app.post('/api/analytics/track', async (req, res) => {
    try {
        const { event } = req.body;
        if (event) {
            await logEvent(event);
            return res.json({ success: true });
        }
        res.status(400).json({ success: false, error: 'No event provided' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
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
      <title>AHteam Showroom</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0f172a;
          --bg-light: #1e293b;
          --primary: #3b82f6;
          --accent: #22c55e;
          --text: #f8fafc;
          --text-muted: #94a3b8;
          --border: rgba(255,255,255,0.1);
        }
        body { font-family: 'Tajawal', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; padding: 2rem; }
        .container { max-width: 900px; margin: 0 auto; }
        
        .header { text-align: center; margin-bottom: 3rem; }
        .header h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; }
        .header h1 span { color: var(--primary); }
        .header p { color: var(--text-muted); font-size: 1.1rem; }

        .btn { border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-accent { background: var(--accent); color: #000; }
        .btn:hover { transform: translateY(-2px); opacity: 0.9; }

        .create-section { background: var(--bg-light); padding: 2rem; border-radius: 16px; border: 1px solid var(--border); margin-bottom: 3rem; text-align: center; }
        
        .trials-grid { display: grid; gap: 1.5rem; }
        .trial-card { background: var(--bg-light); border-radius: 16px; padding: 2rem; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .trial-info h3 { font-size: 1.25rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
        .trial-info p { color: var(--text-muted); font-size: 0.9rem; }
        .badge { background: rgba(34, 197, 94, 0.1); color: var(--accent); padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.75rem; border: 1px solid rgba(34, 197, 94, 0.2); }
        
        .trial-actions { display: flex; gap: 1rem; }
        .action-link { background: rgba(255,255,255,0.05); color: var(--text); padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-size: 0.9rem; border: 1px solid var(--border); transition: all 0.2s; }
        .action-link:hover { background: rgba(255,255,255,0.1); }
        .action-buy { background: var(--accent); color: #000; font-weight: 800; border-color: var(--accent); }

        .empty { text-align: center; padding: 4rem; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px dashed var(--border); }
        
        footer { margin-top: 4rem; text-align: center; color: var(--text-muted); font-size: 0.8rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏭 <span>AH</span>team Showroom</h1>
          <p>جرّب الأنظمة قبل الشراء • ملكية كاملة</p>
        </div>

        <div class="create-section">
          <h2 style="margin-bottom: 1rem;">جاهز لإنشاء مشروع جديد؟</h2>
          <button class="btn btn-primary" onclick="createTrial()">🚀 ابدأ تجربة جديدة</button>
        </div>

        <h2 style="margin-bottom: 1.5rem;">تجاربك الحالية</h2>
        <div class="trials-grid">
          ${activeTrials.length === 0 ? `
            <div class="empty">
              <p>لا توجد تجارب نشطة حالياً</p>
            </div>
          ` : activeTrials.map(t => `
            <div class="trial-card">
              <div class="trial-info">
                <h3>${t.projectName} <span class="badge">نشط</span></h3>
                <p>ID: ${t.id}</p>
                <p>تنتهي في: ${new Date(t.expiresAt).toLocaleDateString('ar-EG')} (باقي ${Math.ceil((new Date(t.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))} أيام)</p>
              </div>
              <div class="trial-actions">
                <a href="/preview/${t.id}/" target="_blank" class="action-link">🌐 عرض الموقع</a>
                <a href="/preview/${t.id}/admin/login.html" target="_blank" class="action-link">📊 لوحة التحكم</a>
                <a href="#" onclick="buyProject('${t.id}', '${t.projectName}')" class="action-link action-buy">💰 شراء وامتلاك</a>
              </div>
            </div>
          `).join('')}
        </div>

        <footer>
          🔒 نظام تجارب آمن • AHteam v1.0
        </footer>
      </div>
      
      <script>
        async function createTrial() {
          const name = prompt('اسم المشروع:', 'مشروعي الجديد');
          if (!name) return;
          
          const res = await fetch('/api/trial/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName: name, duration: 7 })
          });
          
          const data = await res.json();
          if (data.success) {
            location.reload();
          } else {
            alert('حدث خطأ: ' + data.error);
          }
        }
        
        async function buyProject(trialId, projectName) {
          const email = prompt('ادخل بريدك الإلكتروني لاستلام الكود:', '');
          if (!email) return;
          
          if (!confirm('هل أنت متأكد من شراء ' + projectName + '؟\\n\\nالسعر: 199$\\nالمحتوى: موقع + لوحة تحكم + تطبيق أندرويد + ملكية كاملة')) {
            return;
          }
          
          // Track Buy Clicked
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'buyClicked' })
          });
          
          const res = await fetch('/api/payment/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trialId,
              email,
              plan: 'premium',
              amount: 199,
              paymentId: 'SIM-' + Date.now()
            })
          });
          
          const data = await res.json();
          if (data.success) {
            alert('✅ تم الدفع بنجاح!\\n\\nرقم الطلب: ' + data.orderId + '\\n\\nمشروعك جاهز للتحميل من صفحة الـ Export.');
            location.reload();
          } else {
            alert('❌ فشل الدفع: ' + data.error);
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
