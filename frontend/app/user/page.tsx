'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { AppShell } from '../../components/layout/AppShell';
import { AnimatedLayout } from '../providers/AnimatedLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProofProgress } from '../../components/ui/ProofProgress';
import {
    Send,
    ArrowRightLeft,
    ArrowRight,
    Lock,
    Check,
    AlertCircle,
    Shield,
    Copy
} from 'lucide-react';
import { useWalletStatus } from '../../hooks/useWallet';
import { ConnectButton } from '../../components/wallet/ConnectButton';
import { TOKENS } from '../../config/chains';

// Vault ABI (minimal for our needs)
const VAULT_ABI = [
    "function getDepositorBalance(address user, address token) view returns (uint256)",
    "function executePrivateTransfer(address token, address to, uint256 amount, bytes32 pac) returns (bytes32)"
];

export default function UserTradePage() {
    const { address, isConnected } = useWalletStatus();

    // UI State
    const [tradeType, setTradeType] = useState<'swap' | 'send'>('send');
    const [selectedToken, setSelectedToken] = useState(TOKENS.MNT);
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');

    // Balance & Transaction State
    const [vaultBalance, setVaultBalance] = useState('0');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [pacHash, setPacHash] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    // Proof Status
    const [proofStage, setProofStage] = useState<'kyc' | 'aml' | 'yield' | 'done' | null>(null);

    useEffect(() => {
        if (isConnected && address) {
            fetchVaultBalance();
        }
    }, [isConnected, address, selectedToken]);

    const fetchVaultBalance = async () => {
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const vaultContract = new ethers.Contract(
                process.env.NEXT_PUBLIC_VAULT_ADDRESS!,
                VAULT_ABI,
                provider
            );

            // Force fresh data by getting latest block first
            const latestBlock = await provider.getBlockNumber();
            console.log('[BALANCE] Fetching from block:', latestBlock);

            const balance = await vaultContract.getDepositorBalance(address, selectedToken);
            const formattedBalance = ethers.formatEther(balance);

            console.log('[BALANCE] Raw balance:', balance.toString());
            console.log('[BALANCE] Formatted:', formattedBalance);

            setVaultBalance(formattedBalance);
        } catch (error) {
            console.error('Error fetching balance:', error);
            setVaultBalance('0');
        }
    };

    const handleSend = async () => {
        if (!isConnected || !address) {
            alert('Please connect your wallet first');
            return;
        }

        if (!amount || !recipient) {
            alert('Please enter amount and recipient address');
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setPacHash(null);
        setTxHash(null);

        try {
            console.log('🚀 [SEND] Starting private transfer...');
            console.log('📊 [SEND] Amount:', amount, selectedToken === TOKENS.MNT ? 'MNT' : 'Token');
            console.log('📫 [SEND] Recipient:', recipient);
            console.log('🏦 [SEND] Vault Address:', process.env.NEXT_PUBLIC_VAULT_ADDRESS);

            // Step 1: Generate KYC Proof (Mock for demo)
            setProofStage('kyc');
            setProgress(20);
            console.log('✓ [PROOF 1/3] Generating KYC proof...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            const kycHash = '0x' + 'k'.repeat(64); // Mock hash
            console.log('✅ [PROOF 1/3] KYC hash:', kycHash);

            // Step 2: Generate AML Proof (Mock for demo - real proof would use backend)
            setProofStage('aml');
            setProgress(45);
            console.log('✓ [PROOF 2/3] Generating AML proof (ZK)...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            const amlHash = '0x' + 'a'.repeat(64); // Mock hash
            console.log('✅ [PROOF 2/3] AML hash:', amlHash);

            // Step 3: Generate Yield Proof (Mock for demo)
            setProofStage('yield');
            setProgress(65);
            console.log('✓ [PROOF 3/3] Generating Yield proof...');
            await new Promise(resolve => setTimeout(resolve, 800));
            const yieldHash = '0x' + 'y'.repeat(64); // Mock hash
            console.log('✅ [PROOF 3/3] Yield hash:', yieldHash);

            // Step 4: Combine into PAC
            setProofStage('done');
            setProgress(80);
            console.log('🔐 [PAC] Combining KYC + AML + Yield into PAC...');
            const pacResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vault/generate-pac`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress: address,
                    token: selectedToken,
                    amount: ethers.parseEther(amount).toString(),
                    recipient
                })
            });
            const pacData = await pacResponse.json();
            const generatedPac = pacData.pac;
            setPacHash(generatedPac);
            console.log('✅ [PAC] PAC Generated:', generatedPac);
            console.log('📋 [PAC] Proof breakdown:', {
                kyc: pacData.proofs?.kyc || kycHash,
                aml: pacData.proofs?.aml || amlHash,
                yield: pacData.proofs?.yield || yieldHash
            });

            // Step 5: Execute Private Transfer (from VAULT address!)
            setProgress(85);
            console.log('📤 [TX] Executing private transfer from VAULT...');
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const vaultContract = new ethers.Contract(
                process.env.NEXT_PUBLIC_VAULT_ADDRESS!,
                VAULT_ABI,
                signer
            );

            const tx = await vaultContract.executePrivateTransfer(
                selectedToken,
                recipient,
                ethers.parseEther(amount),
                generatedPac
            );

            console.log('⏳ [TX] Transaction sent, waiting for confirmation...');
            console.log('🔗 [TX] Hash:', tx.hash);
            setProgress(95);

            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            setProgress(100);

            console.log('✅ [TX] Transaction confirmed!');
            console.log('🎉 [TX] Block:', receipt.blockNumber);
            console.log('⛽ [TX] Gas used:', receipt.gasUsed.toString());
            console.log('🔍 [TX] Explorer:', `https://sepolia.mantlescan.xyz/tx/${receipt.hash}`);
            console.log('🏦 [PRIVACY] Sent FROM vault address (your identity hidden!)');

            // Refresh balance
            console.log('🔄 [BALANCE] Refreshing vault balance...');
            await fetchVaultBalance();
            console.log('✓ [BALANCE] Balance updated');

            setTimeout(() => {
                setIsProcessing(false);
                setProgress(0);
                setProofStage(null);
            }, 3000);

        } catch (error: any) {
            console.error('❌ [ERROR] Send failed:', error);
            console.error('❌ [ERROR] Details:', error.message);
            alert(`Transaction failed: ${error.message}`);
            setIsProcessing(false);
            setProgress(0);
            setProofStage(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    return (
        <AnimatedLayout>
            <AppShell>
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-[#E6EDF3]">Private Trading</h1>
                            <p className="text-sm text-[#9BA4AE] mt-1">
                                Execute trades via vault address for maximum privacy
                            </p>
                        </div>
                        {!isConnected && <ConnectButton />}
                    </div>

                    {/* Balance Card */}
                    {isConnected && (
                        <Card padding="lg" className="">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[#9BA4AE] uppercase mb-1">Your Vault Balance</p>
                                    <p className="text-2xl font-semibold text-[#E6EDF3]">
                                        {parseFloat(vaultBalance).toFixed(4)} {selectedToken === TOKENS.MNT ? 'MNT' : selectedToken === TOKENS.USDT ? 'USDT' : 'METH'}
                                    </p>
                                </div>
                                <div className="px-4 py-2 bg-[#6ED6C9]/20 rounded-lg border border-[#6ED6C9]/30">
                                    <p className="text-xs text-[#6ED6C9] font-medium">✓ Compliant</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Trade Type Toggle */}
                    <Card padding="lg">
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={() => setTradeType('send')}
                                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${tradeType === 'send'
                                    ? 'bg-[#6ED6C9] text-[#0B0E11]'
                                    : 'bg-[#161B22] text-[#9BA4AE] hover:text-[#E6EDF3]'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Send className="w-4 h-4" />
                                    <span>Send (Private)</span>
                                    <Shield className="w-3 h-3" />
                                </div>
                            </button>
                            <button
                                onClick={() => setTradeType('swap')}
                                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${tradeType === 'swap'
                                    ? 'bg-[#6ED6C9] text-[#0B0E11]'
                                    : 'bg-[#161B22] text-[#9BA4AE] hover:text-[#E6EDF3]'
                                    }`}
                                disabled
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <ArrowRightLeft className="w-4 h-4" />
                                    <span>Swap (Coming Soon)</span>
                                </div>
                            </button>
                        </div>

                        {tradeType === 'send' && (
                            <div>
                                {isProcessing ? (
                                    <div className="space-y-4">
                                        <ProofProgress progress={progress} />
                                        <div className="text-center">
                                            <p className="text-sm text-[#9BA4AE]">
                                                {proofStage === 'kyc' && '✓ Generating KYC proof...'}
                                                {proofStage === 'aml' && '✓ Generating AML proof (ZK)...'}
                                                {proofStage === 'yield' && '✓ Generating Yield proof...'}
                                                {proofStage === 'done' && '✓ Executing private transfer...'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Token Selector */}
                                        <div>
                                            <label className="block text-xs font-medium text-[#9BA4AE] uppercase mb-2">
                                                Token
                                            </label>
                                            <select
                                                value={selectedToken}
                                                onChange={(e) => setSelectedToken(e.target.value)}
                                                className="w-full bg-[#0B0E11] border border-white/[0.06] rounded-xl px-4 py-3 text-[#E6EDF3] focus:outline-none focus:border-[#6ED6C9] transition-colors"
                                            >
                                                <option value={TOKENS.MNT}>MNT (Native Mantle)</option>
                                                <option value={TOKENS.USDT}>Mock USDT</option>
                                                <option value={TOKENS.METH}>Mock METH</option>
                                            </select>
                                        </div>

                                        {/* Amount Input */}
                                        <div>
                                            <label className="block text-xs font-medium text-[#9BA4AE] uppercase mb-2">
                                                Amount
                                            </label>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0.0"
                                                className="w-full bg-[#0B0E11] border border-white/[0.06] rounded-xl px-4 py-3 text-[#E6EDF3] focus:outline-none focus:border-[#6ED6C9] transition-colors"
                                            />
                                            <p className="text-xs text-[#9BA4AE] mt-2">
                                                Available: {parseFloat(vaultBalance).toFixed(4)}
                                            </p>
                                        </div>

                                        {/* Recipient Address */}
                                        <div>
                                            <label className="block text-xs font-medium text-[#9BA4AE] uppercase mb-2">
                                                Recipient Address
                                            </label>
                                            <input
                                                type="text"
                                                value={recipient}
                                                onChange={(e) => setRecipient(e.target.value)}
                                                placeholder="0x..."
                                                className="w-full bg-[#0B0E11] border border-white/[0.06] rounded-xl px-4 py-3 text-[#E6EDF3] focus:outline-none focus:border-[#6ED6C9] transition-colors font-mono text-sm"
                                            />
                                        </div>

                                        {/* Privacy Notice */}
                                        <div className="bg-[#6ED6C9]/10 border border-[#6ED6C9]/20 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <Lock className="w-5 h-5 text-[#6ED6C9] flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-[#6ED6C9]">Privacy Enabled</p>
                                                    <p className="text-xs text-[#9BA4AE] mt-1">
                                                        Transaction will be sent FROM vault address, hiding your identity. PAC proof generated for regulatory compliance.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Send Button */}
                                        <Button
                                            onClick={handleSend}
                                            disabled={!isConnected || !amount || !recipient}
                                            className="w-full"
                                            size="lg"
                                        >
                                            Generate Proof & Send
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Success Card */}
                    {pacHash && txHash && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="bg-[#6ED6C9]/10 border-[#6ED6C9]/20">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Check className="w-6 h-6 text-[#6ED6C9]" />
                                        <h3 className="text-lg font-semibold text-[#E6EDF3]">Transaction Successful!</h3>
                                    </div>

                                    <div className="space-y-3">
                                        {/* PAC Hash */}
                                        <div className="bg-[#0B0E11] rounded-xl p-4 border border-white/[0.06]">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs text-[#9BA4AE] uppercase">PAC Hash</p>
                                                <button
                                                    onClick={() => copyToClipboard(pacHash)}
                                                    className="text-xs text-[#6ED6C9] hover:text-[#E6EDF3] flex items-center gap-1"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    Copy
                                                </button>
                                            </div>
                                            <p className="text-sm font-mono text-[#E6EDF3] break-all">{pacHash}</p>
                                        </div>

                                        {/* TX Hash */}
                                        <div className="bg-[#0B0E11] rounded-xl p-4 border border-white/[0.06]">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs text-[#9BA4AE] uppercase">Transaction Hash</p>
                                                <button
                                                    onClick={() => copyToClipboard(txHash)}
                                                    className="text-xs text-[#6ED6C9] hover:text-[#E6EDF3] flex items-center gap-1"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    Copy
                                                </button>
                                            </div>
                                            <p className="text-sm font-mono text-[#E6EDF3] break-all">{txHash}</p>
                                        </div>
                                    </div>

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => window.open(`https://sepolia.mantlescan.xyz/tx/${txHash}`, '_blank')}
                                    >
                                        View on Mantle Explorer
                                    </Button>

                                    <div className="text-xs text-[#9BA4AE] text-center">
                                        ✓ Sent from <span className="font-mono text-[#6ED6C9]">Vault Address</span> (Your identity hidden!)
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </AppShell>
        </AnimatedLayout>
    );
}
