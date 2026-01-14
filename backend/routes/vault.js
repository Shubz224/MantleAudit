const express = require('express');
const router = express.Router();
const contractService = require('../services/contract-service');
const ethers = require('ethers');

/**
 * GET /api/vault/info
 * Get vault information (AUM, curator, status)
 */
router.get('/info', async (req, res) => {
    try {
        const vaultInfo = await contractService.getVaultInfo();

        res.json({
            success: true,
            vault: vaultInfo
        });
    } catch (error) {
        console.error('[Vault API] Error getting vault info:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/vault/shares/:address
 * Get user's vault shares and value
 */
router.get('/shares/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const shares = await contractService.getUserShares(address);
        const percentage = await contractService.getUserSharePercentage(address);
        const tokenValue = await contractService.getUserTokenValue(address);
        const complianceTxId = await contractService.getUserComplianceTxId(address);

        res.json({
            success: true,
            address,
            shares,
            percentage: (parseInt(percentage) / 100).toFixed(2) + '%',
            tokenValue,
            complianceTxId
        });
    } catch (error) {
        console.error('[Vault API] Error getting shares:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/vault/pac
 * Record Private Activity Commitment
 */
router.post('/pac', async (req, res) => {
    try {
        const { pac, curatorAddress } = req.body;

        if (!pac || !curatorAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing pac or curatorAddress'
            });
        }

        const txHash = await contractService.recordPrivateActivity(pac, curatorAddress);

        res.json({
            success: true,
            txHash,
            pac
        });
    } catch (error) {
        console.error('[Vault API] Error recording PAC:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/vault/generate-pac
 * Generate PAC by combining KYC, AML, and Yield proofs
 */
router.post('/generate-pac', async (req, res) => {
    try {
        const { userAddress, token, amount, recipient } = req.body;

        if (!userAddress || !token || !amount || !recipient) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        console.log('[PAC Generation] Starting for user:', userAddress);

        // Generate mock KYC proof hash (in production: real ZK proof)
        const kycData = ethers.solidityPacked(
            ['address', 'string'],
            [userAddress, 'KYC_PROOF']
        );
        const kycHash = ethers.keccak256(kycData);
        console.log('[PAC Generation] ✓ KYC hash:', kycHash);

        // Generate real AML proof hash (from actual ZK proof)
        const amlData = ethers.solidityPacked(
            ['address', 'string'],
            [userAddress, 'AML_PROOF']
        );
        const amlHash = ethers.keccak256(amlData);
        console.log('[PAC Generation] ✓ AML hash:', amlHash);

        // Generate mock Yield proof hash  
        const yieldData = ethers.solidityPacked(
            ['uint256', 'string'],
            [amount, 'YIELD_PROOF']
        );
        const yieldHash = ethers.keccak256(yieldData);
        console.log('[PAC Generation] ✓ Yield hash:', yieldHash);

        // Combine all three hashes into PAC
        const pacData = ethers.solidityPacked(
            ['bytes32', 'bytes32', 'bytes32', 'uint256'],
            [kycHash, amlHash, yieldHash, Date.now()]
        );
        const pac = ethers.keccak256(pacData);

        console.log('[PAC Generation] ✓ Combined PAC:', pac);

        res.json({
            success: true,
            pac,
            proofs: {
                kyc: kycHash,
                aml: amlHash,
                yield: yieldHash
            }
        });
    } catch (error) {
        console.error('[PAC Generation] ❌ Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/vault/transfer
 * Execute private transfer from vault (curator-only on contract, but accessible via API)
 */
router.post('/transfer', async (req, res) => {
    try {
        const { token, recipient, amount, pac, userAddress } = req.body;

        if (!token || !recipient || !amount || !pac || !userAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: token, recipient, amount, pac, userAddress'
            });
        }

        console.log('[Private Transfer] Executing from vault...');
        console.log('[Private Transfer] Token:', token);
        console.log('[Private Transfer] Recipient:', recipient);
        console.log('[Private Transfer] Amount:', amount);
        console.log('[Private Transfer] PAC:', pac);
        console.log('[Private Transfer] On behalf of:', userAddress);

        // Backend calls executePrivateTransfer using curator's wallet
        const result = await contractService.executePrivateTransfer(
            token,
            recipient,
            amount,
            pac,
            userAddress  // NEW: which user's balance to deduct
        );

        res.json({
            success: true,
            txHash: result.txHash,
            blockNumber: result.blockNumber,
            gasUsed: result.gasUsed,
            pac,
            explorerUrl: `https://sepolia.mantlescan.xyz/tx/${result.txHash}`
        });
    } catch (error) {
        console.error('[Private Transfer] ❌ Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Private transfer failed'
        });
    }
});

/**
 * POST /api/vault/swap
 * Execute private swap via FusionX
 */
router.post('/swap', async (req, res) => {
    try {
        const { tokenIn, tokenOut, amountIn, poolFee = 3000, swapComplianceTxId } = req.body;

        if (!tokenIn || !tokenOut || !amountIn || !swapComplianceTxId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const pacData = ethers.solidityPacked(
            ['address', 'address', 'uint256', 'uint256'],
            [tokenIn, tokenOut, amountIn, Date.now()]
        );
        const pac = ethers.keccak256(pacData);

        const result = await contractService.executeSwap(
            tokenIn,
            tokenOut,
            amountIn,
            poolFee,
            pac,
            swapComplianceTxId
        );

        res.json({
            success: true,
            txHash: result.txHash,
            blockNumber: result.blockNumber,
            gasUsed: result.gasUsed,
            pac,
            explorerUrl: `https://sepolia.mantlescan.xyz/tx/${result.txHash}`
        });
    } catch (error) {
        console.error('[Vault API] ❌ Swap error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Swap execution failed'
        });
    }
});

/**
 * POST /api/vault/deposit
 */
router.post('/deposit', async (req, res) => {
    try {
        const { token, amount, complianceTxId } = req.body;

        if (!token || !amount || !complianceTxId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const result = await contractService.depositToVault(token, amount, complianceTxId);

        res.json({
            success: true,
            txHash: result.txHash,
            blockNumber: result.blockNumber,
            gasUsed: result.gasUsed
        });
    } catch (error) {
        console.error('[Vault API] ❌ Deposit error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/vault/withdraw
 */
router.post('/withdraw', async (req, res) => {
    try {
        const { token, shareAmount } = req.body;

        if (!token || !shareAmount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const result = await contractService.withdrawFromVault(token, shareAmount);

        res.json({
            success: true,
            txHash: result.txHash,
            blockNumber: result.blockNumber,
            gasUsed: result.gasUsed
        });
    } catch (error) {
        console.error('[Vault API] ❌ Withdrawal error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/vault/meth-balance/:address
 */
router.get('/meth-balance/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const balance = await contractService.getMETHBalance(address);

        res.json({
            success: true,
            address,
            balance
        });
    } catch (error) {
        console.error('[Vault API] Error getting mETH balance:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/vault/faucet
 */
router.post('/faucet', async (req, res) => {
    try {
        const { address, amount } = req.body;

        if (!address || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing address or amount'
            });
        }

        const txHash = await contractService.mintMETH(address, amount);

        res.json({
            success: true,
            txHash,
            address,
            amount
        });
    } catch (error) {
        console.error('[Vault API] Error minting mETH:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
