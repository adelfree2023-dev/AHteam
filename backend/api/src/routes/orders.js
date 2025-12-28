// AHteam API - Orders Routes
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Generate order number
function generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
}

// Get user orders
router.get('/', async (req, res) => {
    try {
        // TODO: Get userId from auth middleware
        const { userId, status, page = 1, limit = 10 } = req.query;

        const where = userId ? { userId } : {};
        if (status) where.status = status;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    items: { include: { product: { select: { name: true, images: true } } } },
                    user: { select: { name: true, email: true } }
                }
            }),
            prisma.order.count({ where })
        ]);

        res.json({ orders, total, pages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get single order
router.get('/:orderNumber', async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { orderNumber: req.params.orderNumber },
            include: {
                items: { include: { product: true } },
                user: { select: { name: true, email: true, phone: true } }
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Create order (checkout)
router.post('/', async (req, res) => {
    try {
        const { userId, items, shippingAddress, paymentMethod } = req.body;

        // Calculate totals
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product) continue;

            subtotal += product.price * item.quantity;
            orderItems.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                variantInfo: item.variantInfo
            });
        }

        const shipping = 50; // Fixed shipping for now
        const tax = subtotal * 0.14; // 14% VAT Egypt
        const total = subtotal + shipping + tax;

        const order = await prisma.order.create({
            data: {
                orderNumber: generateOrderNumber(),
                userId,
                subtotal,
                shipping,
                tax,
                total,
                shippingAddress,
                paymentMethod,
                items: { create: orderItems }
            },
            include: { items: true }
        });

        res.status(201).json(order);
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { status }
        });

        res.json(order);
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

module.exports = router;
