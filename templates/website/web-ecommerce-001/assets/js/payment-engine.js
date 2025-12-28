/**
 * AHteam - Universal Payment Engine
 * Standardized Adapter Interface for Global & Local Payments
 */
const AHPayment = (() => {
    const adapters = {};
    let activeAdapter = null;

    return {
        /**
         * Register a new payment adapter
         */
        registerAdapter(id, adapter) {
            adapters[id] = adapter;
            console.log(`💳 Payment Engine: Registered ${id}`);
        },

        /**
         * Set the active payment method
         */
        setMethod(id) {
            if (!adapters[id]) {
                console.error(`❌ Payment Engine: Method ${id} not found.`);
                return false;
            }
            activeAdapter = adapters[id];
            console.log(`💳 Payment Engine: Method set to ${id}`);
            return true;
        },

        /**
         * Initialize payment process
         */
        async process(orderData) {
            if (!activeAdapter) {
                alert('الرجاء اختيار طريقة الدفع أولاً');
                return;
            }

            console.log('💳 Payment Engine: Processing order...', orderData);

            try {
                const result = await activeAdapter.pay(orderData);
                if (result.success) {
                    window.dispatchEvent(new CustomEvent('payment-success', { detail: result }));
                } else {
                    window.dispatchEvent(new CustomEvent('payment-error', { detail: result }));
                }
                return result;
            } catch (error) {
                console.error('❌ Payment Engine: Fatal Error', error);
                return { success: false, error: 'حدث خطأ أثناء معالجة الدفع' };
            }
        },

        getMethods() {
            return Object.keys(adapters);
        }
    };
})();

// Export for browser
window.AHPayment = AHPayment;
