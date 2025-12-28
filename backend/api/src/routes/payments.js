// AHteam API - Payment Routes
const express = require('express');
const router = express.Router();

// ============================================
// PAYMENT GATEWAY INTEGRATIONS (Egypt Market)
// ============================================

// PayMob Configuration
const PAYMOB_CONFIG = {
    API_KEY: process.env.PAYMOB_API_KEY,
    INTEGRATION_ID_CARD: process.env.PAYMOB_INTEGRATION_CARD,
    INTEGRATION_ID_WALLET: process.env.PAYMOB_INTEGRATION_WALLET,
    IFRAME_ID: process.env.PAYMOB_IFRAME_ID,
    BASE_URL: 'https://accept.paymob.com/api'
};

// ============================================
// 1. PayMob (Cards + Wallets)
// ============================================
router.post('/paymob/init', async (req, res) => {
    try {
        const { orderId, amount, currency = 'EGP' } = req.body;

        // Step 1: Get auth token
        const authRes = await fetch(`${PAYMOB_CONFIG.BASE_URL}/auth/tokens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: PAYMOB_CONFIG.API_KEY })
        });
        const { token } = await authRes.json();

        // Step 2: Register order
        const orderRes = await fetch(`${PAYMOB_CONFIG.BASE_URL}/ecommerce/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                auth_token: token,
                delivery_needed: false,
                amount_cents: amount * 100,
                currency,
                merchant_order_id: orderId
            })
        });
        const order = await orderRes.json();

        // Step 3: Get payment key
        const paymentRes = await fetch(`${PAYMOB_CONFIG.BASE_URL}/acceptance/payment_keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth_token: token,
                amount_cents: amount * 100,
                expiration: 3600,
                order_id: order.id,
                billing_data: req.body.billing || {
                    first_name: 'Customer',
                    last_name: 'Name',
                    email: 'customer@email.com',
                    phone_number: '01000000000',
                    country: 'EG',
                    city: 'Cairo',
                    street: 'NA'
                },
                currency,
                integration_id: PAYMOB_CONFIG.INTEGRATION_ID_CARD
            })
        });
        const { token: paymentKey } = await paymentRes.json();

        res.json({
            success: true,
            paymentKey,
            iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_CONFIG.IFRAME_ID}?payment_token=${paymentKey}`,
            orderId: order.id
        });
    } catch (error) {
        console.error('PayMob init error:', error);
        res.status(500).json({ error: 'Payment initialization failed' });
    }
});

// PayMob Webhook (callback)
router.post('/paymob/callback', async (req, res) => {
    try {
        const { obj } = req.body;

        if (obj.success === true) {
            // Update order payment status
            console.log('✅ PayMob Payment Success:', obj.order.merchant_order_id);
            // TODO: Update order in database
        } else {
            console.log('❌ PayMob Payment Failed:', obj.order.merchant_order_id);
        }

        res.json({ received: true });
    } catch (error) {
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// ============================================
// 2. InstaPay
// ============================================
router.post('/instapay/init', async (req, res) => {
    try {
        const { orderId, amount, phoneNumber } = req.body;

        // InstaPay requires phone number for wallet payment
        res.json({
            success: true,
            method: 'instapay',
            instructions: {
                ar: 'افتح تطبيق انستاباي وادخل الرقم التالي لإتمام الدفع',
                en: 'Open InstaPay app and enter the following number to complete payment'
            },
            paymentNumber: process.env.INSTAPAY_NUMBER || '01XXXXXXXXX',
            amount,
            reference: orderId
        });
    } catch (error) {
        res.status(500).json({ error: 'InstaPay initialization failed' });
    }
});

// ============================================
// 3. Electronic Wallets (Vodafone Cash, Etisalat, Orange)
// ============================================
router.post('/wallet/init', async (req, res) => {
    try {
        const { orderId, amount, walletType } = req.body;

        const walletNumbers = {
            vodafone: process.env.VODAFONE_CASH_NUMBER || '01XXXXXXXXX',
            etisalat: process.env.ETISALAT_CASH_NUMBER || '01XXXXXXXXX',
            orange: process.env.ORANGE_CASH_NUMBER || '01XXXXXXXXX'
        };

        res.json({
            success: true,
            method: 'wallet',
            walletType,
            instructions: {
                ar: `حول المبلغ ${amount} ج.م إلى الرقم التالي`,
                en: `Transfer ${amount} EGP to the following number`
            },
            walletNumber: walletNumbers[walletType] || walletNumbers.vodafone,
            amount,
            reference: orderId
        });
    } catch (error) {
        res.status(500).json({ error: 'Wallet initialization failed' });
    }
});

// ============================================
// 4. Bank Transfer
// ============================================
router.post('/bank/init', async (req, res) => {
    try {
        const { orderId, amount } = req.body;

        res.json({
            success: true,
            method: 'bank_transfer',
            bankDetails: {
                bankName: process.env.BANK_NAME || 'البنك الأهلي المصري',
                accountName: process.env.BANK_ACCOUNT_NAME || 'شركة التقوى للتجارة',
                accountNumber: process.env.BANK_ACCOUNT_NUMBER || 'XXXX-XXXX-XXXX-XXXX',
                iban: process.env.BANK_IBAN || 'EG00 0000 0000 0000 0000 0000 0000',
                swiftCode: process.env.BANK_SWIFT || 'NBEGEGCX'
            },
            instructions: {
                ar: 'قم بالتحويل البنكي واذكر رقم الطلب في الملاحظات',
                en: 'Make bank transfer and mention order number in notes'
            },
            amount,
            reference: orderId
        });
    } catch (error) {
        res.status(500).json({ error: 'Bank transfer initialization failed' });
    }
});

// ============================================
// 5. Visa/Mastercard (via PayMob or Stripe)
// ============================================
router.post('/card/init', async (req, res) => {
    try {
        const { orderId, amount, cardType } = req.body;

        // Use PayMob for card payments in Egypt
        // Redirect to PayMob init
        const paymobRes = await fetch(`http://localhost:${process.env.PORT || 4000}/api/payments/paymob/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, amount })
        });

        const paymobData = await paymobRes.json();

        res.json({
            success: true,
            method: cardType || 'card',
            ...paymobData
        });
    } catch (error) {
        res.status(500).json({ error: 'Card payment initialization failed' });
    }
});

// ============================================
// Get Available Payment Methods
// ============================================
router.get('/methods', (req, res) => {
    res.json({
        methods: [
            {
                id: 'visa',
                name: 'Visa',
                nameAr: 'فيزا',
                icon: 'visa',
                enabled: true
            },
            {
                id: 'mastercard',
                name: 'Mastercard',
                nameAr: 'ماستركارد',
                icon: 'mastercard',
                enabled: true
            },
            {
                id: 'instapay',
                name: 'InstaPay',
                nameAr: 'انستاباي',
                icon: 'instapay',
                enabled: true
            },
            {
                id: 'vodafone_cash',
                name: 'Vodafone Cash',
                nameAr: 'فودافون كاش',
                icon: 'vodafone',
                enabled: true
            },
            {
                id: 'etisalat_cash',
                name: 'Etisalat Cash',
                nameAr: 'اتصالات كاش',
                icon: 'etisalat',
                enabled: true
            },
            {
                id: 'orange_cash',
                name: 'Orange Cash',
                nameAr: 'اورانج كاش',
                icon: 'orange',
                enabled: true
            },
            {
                id: 'bank_transfer',
                name: 'Bank Transfer',
                nameAr: 'تحويل بنكي',
                icon: 'bank',
                enabled: true
            }
        ]
    });
});

// Verify Payment (for manual methods)
router.post('/verify', async (req, res) => {
    try {
        const { orderId, method, transactionId, screenshot } = req.body;

        // TODO: Save verification request for admin review
        console.log(`📝 Payment verification request: Order ${orderId}, Method: ${method}`);

        res.json({
            success: true,
            message: 'Payment verification submitted. We will confirm within 24 hours.',
            messageAr: 'تم إرسال طلب التحقق. سيتم التأكيد خلال 24 ساعة.'
        });
    } catch (error) {
        res.status(500).json({ error: 'Verification submission failed' });
    }
});

module.exports = router;
