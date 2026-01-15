const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const proofRoutes = require('./routes/proof');
const auditRoutes = require('./routes/audit');
const transactionRoutes = require('./routes/transaction');
const vaultRoutes = require('./routes/vault');

dotenv.config(); // Load from backend/.env (current directory)

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/proof', proofRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/vault', vaultRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'BlackBox Backend API' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`🚀 BlackBox Backend running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}`);
});

module.exports = app;
