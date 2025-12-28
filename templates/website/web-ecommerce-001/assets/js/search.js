/**
 * AHteam - Composable Search Utility
 * Pure client-side high-performance search engine (Faceted Mode)
 */

class AHSearch {
    constructor(indexUrl) {
        this.indexUrl = indexUrl;
        this.products = [];
        this.facets = {};
        this.metadata = {};
    }

    async init() {
        try {
            const res = await fetch(this.indexUrl);
            const data = await res.json();

            this.metadata = {
                generatedAt: data.generatedAt
            };
            this.products = data.products || [];
            this.facets = data.facets || {};

            console.log('🔍 Smart Search Index Loaded:', this.products.length, 'items');
            return data;
        } catch (err) {
            console.error('❌ Failed to load search index:', err);
        }
    }

    search(query) {
        if (!query) return this.products;
        const q = query.toLowerCase();

        return this.products.filter(item => {
            return item.name.toLowerCase().includes(q) ||
                item.category.toLowerCase().includes(q) ||
                (item.tags && item.tags.some(t => t.toLowerCase().includes(q))) ||
                (item.attributes && Object.values(item.attributes).some(attr =>
                    String(attr).toLowerCase().includes(q)
                ));
        });
    }

    /**
     * Advanced Multi-faceted Filtering
     * @param {Object} criteria - e.g. { category: 'fashion', color: 'Black', priceMax: 100 }
     */
    filter(criteria) {
        return this.products.filter(item => {
            for (const key in criteria) {
                const val = criteria[key];
                if (val === 'all' || val === '' || val === undefined) continue;

                if (key === 'priceMax' && item.basePrice > val) return false;
                if (key === 'priceMin' && item.basePrice < val) return false;
                if (key === 'category' && item.category !== val) return false;

                // Dynamic Attribute Filtering
                if (item.attributes && item.attributes[key]) {
                    const attrVal = item.attributes[key];
                    if (Array.isArray(attrVal)) {
                        if (!attrVal.includes(val)) return false;
                    } else if (attrVal !== val) {
                        return false;
                    }
                } else if (!['priceMax', 'priceMin', 'category'].includes(key)) {
                    // Filter key not found in item attributes and it's not a core filter
                    return false;
                }
            }
            return true;
        });
    }
}

// Export for browser
window.AHSearch = AHSearch;
