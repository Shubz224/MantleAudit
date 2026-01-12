const express = require('express');
const router = express.Router();
const contractService = require('../services/contract-service');
const { ethers } = require('ethers');

/**
 * Register a new private transaction
 * POST /api/transaction/register
 */
router.post('/register', async (req, res) => {
    try {
        const { amount, recipient, protocol, userSignature } = req.body;

        // Generate commitment hash (simplified for demo - in production would use proper ZK commitment)
        const commitmentHash = ethers.id(JSON.stringify({ amount, recipient, timestamp: Date.now() }));

        // Generate unique transaction ID
        const txId = ethers.id(`${commitmentHash}_${Date.now()}`);

        console.log(`[API] Registering transaction ${txId}`);
        console.log(`[API] Commitment: ${commitmentHash}`);

        // Call smart contract to register transaction
        const tx = await contractService.registerTransaction({
            txId,
            commitmentHash,
            protocol: protocol || ethers.ZeroAddress
        });

        console.log(`[API] Transaction registered on-chain: ${tx}`);

        res.json({
            success: true,
            txId,
            commitmentHash,
            txHash: tx,
            message: 'Transaction registered on blockchain'
        });

    } catch (error) {
        console.error('[API] Transaction registration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get all registered transactions
 * GET /api/transactions
 */
router.get('/', async (req, res) => {
    try {
        console.log('[API] Fetching transactions from blockchain...');

        const transactions = await contractService.getAllTransactions();

        console.log(`[API] Found ${transactions.length} transactions`);

        res.json({
            success: true,
            transactions: transactions.map(tx => ({
                id: tx.txId, // Frontend expects 'id'
                commitmentHash: tx.commitmentHash,
                timestamp: new Date(Number(tx.timestamp) * 1000).toLocaleString(),
                protocol: tx.protocol === '0x0000000000000000000000000000000000000000' ? 'Private Protocol' : tx.protocol,
                exists: tx.exists
            }))
        });

    } catch (error) {
        console.error('[API] Transaction fetch error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            transactions: []
        });
    }
});

/**
 * Get vault transactions (sent FROM vault address)
 * GET /api/transaction/vault
 * IMPORTANT: This must come BEFORE /:txId route!
 */
router.get('/vault', async (req, res) => {
    try {
        console.log('[API] Fetching vault transactions from blockchain...');

        const vaultTxs = await contractService.getVaultTransactions();

        console.log(`[API] Found ${vaultTxs.length} vault transactions`);

        res.json({
            success: true,
            transactions: vaultTxs.map(tx => ({
                id: tx.hash,
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: tx.value,
                timestamp: new Date(Number(tx.timestamp) * 1000).toLocaleString(),
                blockNumber: tx.blockNumber,
                isVaultTx: true,
                status: 'Pending Audit', // REQUIRED for StatusPill component
                protocol: 'Vault Transfer',
                pacHash: tx.pac // PAC HASH! ✅
            }))
        });

    } catch (error) {
        console.error('[API] Vault transaction fetch error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            transactions: []
        });
    }
});

/**
 * Get single transaction details
 * GET /api/transaction/:txId
 */
router.get('/:txId', async (req, res) => {
    try {
        const { txId } = req.params;

        const transaction = await contractService.getTransaction(txId);

        res.json({
            success: true,
            transaction
        });

    } catch (error) {
        console.error('[API] Transaction fetch error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
