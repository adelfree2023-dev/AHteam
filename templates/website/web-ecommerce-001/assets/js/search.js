/**
 * AHteam - Composable Search Utility
 * Pure client-side high-performance search engine
 */

class AHSearch {
    constructor(indexUrl) {
        this.indexUrl = indexUrl;
        this.index = [];
        this.results = [];
    }

    async init() {
        try {
            const res = await fetch(this.indexUrl);
            this.index = await res.json();
            console.log('🔍 Search Index Loaded:', this.index.length, 'items');
        } catch (err) {
            console.error('❌ Failed to load search index:', err);
        }
    }

    search(query) {
        if (!query) return this.index;
        const q = query.toLowerCase();

        return this.index.filter(item => {
            return item.name.toLowerCase().includes(q) ||
                item.category.toLowerCase().includes(q) ||
                (item.tags && item.tags.some(t => t.toLowerCase().includes(q))) ||
                Object.values(item.attributes).some(attr =>
                    String(attr).toLowerCase().includes(q)
                );
        });
    }

    filter(criteria) {
        // criteria: { category: '...', priceMax: 100, ... }
        return this.index.filter(item => {
            for (const key in criteria) {
                if (key === 'priceMax' && item.price > criteria[key]) return false;
                if (key === 'category' && item.category !== criteria[key]) return false;
                // Add more filters as needed
            }
            return true;
        });
    }
}

// Export for browser
window.AHSearch = AHSearch;
