import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANALYTICS_FILE = path.join(__dirname, '../analytics.json');

export async function logEvent(event) {
    try {
        let data = { funnel: [], summary: { landingVisits: 0, trialsStarted: 0, previewsViewed: 0, buyClicked: 0, paymentSuccess: 0, downloadComplete: 0 } };

        if (await fs.pathExists(ANALYTICS_FILE)) {
            data = JSON.parse(await fs.readFile(ANALYTICS_FILE, 'utf-8'));
        }

        // Add to funnel log
        data.funnel.push({
            event,
            timestamp: new Date().toISOString()
        });

        // Update summary
        if (data.summary[event] !== undefined) {
            data.summary[event]++;
        }

        // Keep only last 1000 logs
        if (data.funnel.length > 1000) {
            data.funnel = data.funnel.slice(-1000);
        }

        await fs.writeFile(ANALYTICS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Failed to log event:', error.message);
    }
}
