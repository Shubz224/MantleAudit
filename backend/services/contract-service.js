const ethers = require('ethers');
require('dotenv').config();

const REGISTRY_ABI = require('../../artifacts/contracts/AuditRegistry.sol/AuditRegistry.json').abi;
const VERIFIER_ABI = require('../../artifacts/contracts/AuditVerifier.sol/AuditVerifier.json').abi;
const MOCK_METH_ABI = require('../../artifacts/contracts/MockMETH.sol/MockMETH.json').abi;
const CURATOR_VAULT_ABI = require('../../artifacts/contracts/CuratorVault.sol/CuratorVault.json').abi;

class ContractService {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.MANTLE_RPC_URL);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

        this.registryContract = new ethers.Contract(
            process.env.CONTRACT_ADDRESS_REGISTRY,
            REGISTRY_ABI,
            this.wallet
        );

        this.verifierContract = new ethers.Contract(
            process.env.CONTRACT_ADDRESS_VERIFIER,
            VERIFIER_ABI,
            this.wallet
        );

        this.mockMETHContract = new ethers.Contract(
            process.env.CONTRACT_ADDRESS_MOCK_METH,
            MOCK_METH_ABI,
            this.wallet
        );

        this.vaultContract = new ethers.Contract(
            process.env.CONTRACT_ADDRESS_CURATOR_VAULT,
            CURATOR_VAULT_ABI,
            this.wallet
        );
    }

    async registerTransaction({ txId, commitmentHash, protocol }) {
        try {
            const tx = await this.registryContract.registerTx(txId, commitmentHash, protocol);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error("Error registering transaction:", error);
            throw error;
        }
    }

    async submitAuditVerification(txId, auditType, passed, proofData) {
        try {
            let tx;
            const mockSig = "0x";

            if (auditType === 'AML') {
                tx = await this.verifierContract.submitAMLAttestation(txId, passed, mockSig);
            } else if (auditType === 'KYC') {
                tx = await this.verifierContract.submitKYCAttestation(txId, passed, mockSig);
            } else if (auditType === 'YIELD') {
                tx = await this.verifierContract.submitYieldAttestation(txId, passed, mockSig);
            } else {
                throw new Error(`Unknown audit type: ${auditType}`);
            }

            const receipt = await tx.wait();
            return receipt.hash;
        } catch (error) {
            console.error("Error submitting audit verification:", error);
            throw error;
        }
    }

    async getAuditResult(txId, auditType) {
        try {
            let enumType;
            if (typeof auditType === 'number') {
                enumType = auditType;
            } else {
                const typeMap = { 'KYC': 0, 'AML': 1, 'YIELD': 2 };
                enumType = typeMap[auditType];
            }

            const result = await this.verifierContract.getAuditResult(txId, enumType);
            const typeNames = ['KYC', 'AML', 'YIELD'];

            return {
                passed: result.passed,
                timestamp: Number(result.timestamp),
                auditor: result.auditor,
                type: typeNames[enumType]
            };
        } catch (error) {
            console.error("Error getting audit result:", error);
            return null;
        }
    }

    async getAllProofsForTransaction(txId) {
        try {
            const proofs = {};
            for (let i = 0; i < 3; i++) {
                try {
                    const result = await this.getAuditResult(txId, i);
                    if (result && result.timestamp > 0) {
                        const type = ['kyc', 'aml', 'yield'][i];
                        proofs[type] = {
                            passed: result.passed,
                            timestamp: result.timestamp,
                            auditor: result.auditor
                        };
                    }
                } catch (proofError) {
                    console.warn(`Could not fetch proof ${i}:`, proofError.message);
                }
            }
            return proofs;
        } catch (error) {
            console.error("Error getting proofs:", error);
            return {};
        }
    }

    async getAllTransactions() {
        try {
            console.log('[REGULAR-TXS] Fetching transactions from Registry...');
            console.log('[REGULAR-TXS] Registry Address:', this.registryContract.target);

            const count = await this.registryContract.getTransactionCount();
            console.log('[REGULAR-TXS] Total count on-chain:', count.toString());
            const transactions = [];

            for (let i = 0; i < count; i++) {
                const txId = await this.registryContract.getTransactionIdByIndex(i);
                const tx = await this.registryContract.getTransaction(txId);

                // Determine transaction type based on protocol field
                let type = 'Unknown';
                let hasProofs = false;

                const protocol = tx.protocol.toLowerCase();
                if (protocol.includes('deposit')) {
                    type = 'Deposit';
                    hasProofs = false;
                } else if (protocol.includes('withdraw')) {
                    type = 'Withdraw';
                    hasProofs = false;
                } else if (protocol.includes('swap')) {
                    type = 'Private Swap';
                    hasProofs = true;
                } else if (protocol.includes('transfer') || protocol.includes('send')) {
                    type = 'Private Transfer';
                    hasProofs = true;
                } else {
                    // Default: if commitmentHash exists, assume it has proofs
                    hasProofs = tx.commitmentHash && tx.commitmentHash !== '0x0000000000000000000000000000000000000000000000000000000000000000';
                    type = hasProofs ? 'Private Transfer' : 'Transaction';
                }

                transactions.push({
                    txId: tx.txId,
                    commitmentHash: tx.commitmentHash,
                    timestamp: tx.timestamp,
                    protocol: tx.protocol,
                    type: type,
                    hasProofs: hasProofs,
                    exists: tx.exists
                });
            }
            return transactions;
        } catch (error) {
            console.error("Error fetching transactions:", error);
            return [];
        }
    }

    // VAULT METHODS
    async getVaultInfo() {
        try {
            const vaultInfo = await this.vaultContract.getVaultInfo();
            return {
                curator: vaultInfo.curator,
                asset: vaultInfo.asset,
                totalAUM: vaultInfo.totalAUM.toString(),
                latestPAC: vaultInfo.latestPAC,
                active: vaultInfo.active,
                createdAt: Number(vaultInfo.createdAt)
            };
        } catch (error) {
            console.error("Error getting vault info:", error);
            throw error;
        }
    }

    async getUserShares(address) {
        try {
            const shares = await this.vaultContract.getUserShares(address);
            return shares.toString();
        } catch (error) {
            console.error("Error getting user shares:", error);
            throw error;
        }
    }

    async getUserSharePercentage(address) {
        try {
            const percentage = await this.vaultContract.getUserSharePercentage(address);
            return percentage.toString();
        } catch (error) {
            console.error("Error getting share percentage:", error);
            throw error;
        }
    }

    async getUserTokenValue(address) {
        try {
            const value = await this.vaultContract.getUserTokenValue(address);
            return value.toString();
        } catch (error) {
            console.error("Error getting user token value:", error);
            throw error;
        }
    }

    async getUserComplianceTxId(address) {
        try {
            const txId = await this.vaultContract.getUserComplianceTxId(address);
            return txId;
        } catch (error) {
            console.error("Error getting compliance txId:", error);
            throw error;
        }
    }

    async recordPrivateActivity(pac, curatorAddress) {
        try {
            const curatorWallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            const vaultWithCurator = this.vaultContract.connect(curatorWallet);
            const tx = await vaultWithCurator.recordPrivateActivity(pac);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error("Error recording PAC:", error);
            throw error;
        }
    }

    async getMETHBalance(address) {
        try {
            const balance = await this.mockMETHContract.balanceOf(address);
            return balance.toString();
        } catch (error) {
            console.error("Error getting mETH balance:", error);
            throw error;
        }
    }

    async mintMETH(toAddress, amount) {
        try {
            const tx = await this.mockMETHContract.mint(toAddress, amount);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error("Error minting mETH:", error);
            throw error;
        }
    }

    async executeSwap(tokenIn, tokenOut, amountIn, poolFee, pac, swapComplianceTxId) {
        try {
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            const vaultWithSigner = this.vaultContract.connect(wallet);

            const tx = await vaultWithSigner.executePrivateSwap(
                tokenIn,
                tokenOut,
                amountIn,
                poolFee,
                pac,
                swapComplianceTxId
            );

            const receipt = await tx.wait();

            return {
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error("Error executing swap:", error);
            throw error;
        }
    }

    async executePrivateTransfer(token, recipient, amount, pac, onBehalfOf) {
        try {
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            const vaultWithSigner = this.vaultContract.connect(wallet);

            const tx = await vaultWithSigner.executePrivateTransfer(
                token,
                recipient,
                amount,
                pac,
                onBehalfOf  // NEW: which user's balance to use
            );

            const receipt = await tx.wait();

            return {
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error("Error executing private transfer:", error);
            throw error;
        }
    }

    async depositToVault(token, amount, complianceTxId) {
        try {
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            const vaultWithSigner = this.vaultContract.connect(wallet);

            const tx = await vaultWithSigner.depositToken(token, amount, complianceTxId);
            const receipt = await tx.wait();

            return {
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error("Error depositing:", error);
            throw error;
        }
    }

    async withdrawFromVault(token, shareAmount) {
        try {
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            const vaultWithSigner = this.vaultContract.connect(wallet);

            const tx = await vaultWithSigner.withdrawToken(token, shareAmount);
            const receipt = await tx.wait();

            return {
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error("Error withdrawing:", error);
            throw error;
        }
    }

    /**
     * Get vault transactions using EVENT FILTERING (100x faster!)
     * Fetches PrivateTransferExecuted events which include PAC hash
     */
    async getVaultTransactions() {
        try {
            console.log('[VAULT-TXS] Fetching vault transactions using events...');
            console.log('[VAULT-TXS] Contract Address:', this.vaultContract.target);

            // Query PrivateTransferExecuted events from the vault
            const filter = this.vaultContract.filters.PrivateTransferExecuted();
            const currentBlock = await this.provider.getBlockNumber();
            const startBlock = Math.max(0, currentBlock - 9000); // 9k blocks (safe under 10k RPC limit)

            console.log('[VAULT-TXS] Querying events from block', startBlock, 'to', currentBlock);

            const events = await this.vaultContract.queryFilter(filter, startBlock, currentBlock);

            console.log('[VAULT-TXS] Found', events.length, 'PrivateTransferExecuted events');

            const vaultTxs = [];

            for (const event of events.slice(-20)) { // Last 20 events
                try {
                    const block = await this.provider.getBlock(event.blockNumber);

                    vaultTxs.push({
                        hash: event.transactionHash,
                        from: this.vaultContract.target, // Vault address
                        to: event.args.to,
                        value: event.args.amount.toString(),
                        token: event.args.token,
                        pac: event.args.pac, // PAC HASH! ✅
                        timestamp: block?.timestamp || 0,
                        blockNumber: event.blockNumber,
                        gasUsed: '0'
                    });

                    console.log('[VAULT-TXS] ✓ Transaction:', event.transactionHash, 'PAC:', event.args.pac);
                } catch (err) {
                    console.error('[VAULT-TXS] Error processing event:', err.message);
                }
            }

            console.log('[VAULT-TXS] Returning', vaultTxs.length, 'vault transactions');
            return vaultTxs;

        } catch (error) {
            console.error('[VAULT-TXS] Error fetching vault transactions:', error);
            return [];
        }
    }
}

module.exports = new ContractService();
