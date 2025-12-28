// AHteam API - Products Routes
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult, query } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// Get all products (with pagination & filters)
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            minPrice,
            maxPrice,
            search,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build where clause
        const where = { isActive: true };

        if (category) {
            where.category = { slug: category };
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Get products
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { [sortBy]: order },
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                    seller: { select: { id: true, storeName: true } },
                    _count: { select: { reviews: true } }
                }
            }),
            prisma.product.count({ where })
        ]);

        res.json({
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product
router.get('/:slug', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { slug: req.params.slug },
            include: {
                category: true,
                seller: { select: { id: true, storeName: true, storeSlug: true } },
                variants: true,
                reviews: {
                    include: { user: { select: { id: true, name: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Calculate average rating
        const avgRating = await prisma.review.aggregate({
            where: { productId: product.id },
            _avg: { rating: true },
            _count: true
        });

        res.json({
            ...product,
            rating: {
                average: avgRating._avg.rating || 0,
                count: avgRating._count
            }
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create product (Admin/Seller only)
router.post('/', [
    body('name').notEmpty().trim(),
    body('price').isFloat({ min: 0 }),
    body('categoryId').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, price, comparePrice, sku, stock, images, categoryId, sellerId } = req.body;

        // Generate slug
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');

        const product = await prisma.product.create({
            data: {
                name,
                slug: `${slug}-${Date.now()}`,
                description,
                price,
                comparePrice,
                sku,
                stock: stock || 0,
                images: images || [],
                categoryId,
                sellerId
            },
            include: { category: true }
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
            include: { category: true }
        });

        res.json(product);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        await prisma.product.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
