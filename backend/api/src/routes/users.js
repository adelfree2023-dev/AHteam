// AHteam API - Users Routes
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (Admin only)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, role } = req.query;

        const where = role ? { role } : {};

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    _count: { select: { orders: true } }
                }
            }),
            prisma.user.count({ where })
        ]);

        res.json({ users, total, pages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                avatar: true,
                isActive: true,
                createdAt: true,
                addresses: true,
                _count: { select: { orders: true, reviews: true } }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const { name, phone, avatar } = req.body;

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { name, phone, avatar },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                avatar: true
            }
        });

        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Toggle user status
router.patch('/:id/toggle', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id } });

        const updated = await prisma.user.update({
            where: { id: req.params.id },
            data: { isActive: !user.isActive }
        });

        res.json({ isActive: updated.isActive });
    } catch (error) {
        console.error('Toggle user error:', error);
        res.status(500).json({ error: 'Failed to toggle user status' });
    }
});

module.exports = router;
