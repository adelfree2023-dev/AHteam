/**
 * AHteam - Stateless Commerce Engine
 * Handles Cart, Stock, and Orders without server-side session
 */

class AHCommerce {
    constructor(storeId, apiBaseUrl) {
        this.storeId = storeId;
        this.apiBaseUrl = apiBaseUrl;
        this.cart = this.loadCart();
        this.listeners = [];
    }

    // --- Cart Management ---

    loadCart() {
        const saved = localStorage.getItem(`ahteam_cart_${this.storeId}`);
        return saved ? JSON.parse(saved) : [];
    }

    saveCart() {
        localStorage.setItem(`ahteam_cart_${this.storeId}`, JSON.stringify(this.cart));
        this.notify();
    }

    addItem(product, quantity = 1) {
        const existing = this.cart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += quantity;
        } else {
            this.cart.push({ ...product, quantity });
        }
        this.saveCart();
    }

    removeItem(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
    }

    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(0, quantity);
            if (item.quantity === 0) return this.removeItem(productId);
            this.saveCart();
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCartCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    // --- Inventory / API Hooks ---

    async checkStock(productId) {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/stock/${this.storeId}/${productId}`);
            return await res.json(); // { inStock: true, count: 5 }
        } catch (err) {
            console.error('❌ Stock check failed:', err);
            return { inStock: true, count: 99 }; // Fallback to "assume in stock"
        }
    }

    async submitOrder(customerData) {
        const order = {
            storeId: this.storeId,
            customer: customerData,
            items: this.cart,
            total: this.getCartTotal(),
            timestamp: new Date().toISOString()
        };

        try {
            const res = await fetch(`${this.apiBaseUrl}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            });
            const result = await res.json();
            if (result.success) this.clearCart();
            return result;
        } catch (err) {
            console.error('❌ Order submission failed:', err);
            throw err;
        }
    }

    // --- Event Logic ---

    onUpdate(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.cart));
    }
}

// Global instance
window.AHCommerce = new AHCommerce(
    '[[project.id]]',
    '[[api.baseUrl]]'
);
