// AHteam E-commerce Platform API
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AHteam API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Internal Server Error'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 AHteam API running on http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
});

module.exports = app;
