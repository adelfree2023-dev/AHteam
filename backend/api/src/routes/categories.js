// AHteam API - Categories Routes
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories (tree structure)
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { parentId: null },
            include: {
                children: {
                    include: {
                        children: true,
                        _count: { select: { products: true } }
                    }
                },
                _count: { select: { products: true } }
            }
        });

        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Get single category with products
router.get('/:slug', async (req, res) => {
    try {
        const category = await prisma.category.findUnique({
            where: { slug: req.params.slug },
            include: {
                children: true,
                products: {
                    where: { isActive: true },
                    take: 20,
                    include: {
                        _count: { select: { reviews: true } }
                    }
                }
            }
        });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
});

// Create category
router.post('/', async (req, res) => {
    try {
        const { name, description, image, parentId } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const category = await prisma.category.create({
            data: { name, slug, description, image, parentId }
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

module.exports = router;
