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
    Copy,
    ArrowDownUp,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import { useWalletStatus } from '../../hooks/useWallet';
import { ConnectButton } from '../../components/wallet/ConnectButton';
import { TOKENS } from '../../config/chains';

// Vault ABI (minimal for our needs)
const VAULT_ABI = [
    "function getDepositorBalance(address user, address token) view returns (uint256)",
    "function executePrivateTransfer(address token, address to, uint256 amount, bytes32 pac) returns (bytes32)"
];

// RWA Token List
const RWA_TOKENS = [
    { id: 'rwa-real-estate', name: 'Real Estate Token', symbol: 'RET', price: 125.50, change: 2.3 },
    { id: 'rwa-treasury', name: 'US Treasury Token', symbol: 'UST', price: 100.25, change: 0.5 },
    { id: 'rwa-gold', name: 'Tokenized Gold', symbol: 'TGLD', price: 1850.75, change: -1.2 },
    { id: 'rwa-carbon', name: 'Carbon Credits', symbol: 'CCR', price: 45.80, change: 5.7 },
];

export default function UserTradePage() {
    const { address, isConnected } = useWalletStatus();

    // UI State
    const [tradeType, setTradeType] = useState<'swap' | 'send' | 'rwa'>('send');
    const [selectedToken, setSelectedToken] = useState(TOKENS.MNT);
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');

    // Swap State
    const [swapFromToken, setSwapFromToken] = useState(TOKENS.MNT);
    const [swapToToken, setSwapToToken] = useState(TOKENS.USDT);
    const [swapAmount, setSwapAmount] = useState('');

    // RWA State
    const [selectedRWA, setSelectedRWA] = useState(RWA_TOKENS[0]);
    const [rwaAmount, setRwaAmount] = useState('');
    const [rwaAction, setRwaAction] = useState<'buy' | 'sell'>('buy');

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

            // Step 5: Execute Private Transfer via Backend API (preserves privacy!)
            setProgress(85);
            console.log('📤 [TX] Executing private transfer via backend API...');

            const transferResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vault/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: selectedToken,
                    recipient: recipient,
                    amount: ethers.parseEther(amount).toString(),
                    pac: generatedPac,
                    userAddress: address  // NEW: tell backend which user's balance to use
                })
            });

            if (!transferResponse.ok) {
                const errorData = await transferResponse.json();
                throw new Error(errorData.error || 'Transfer failed');
            }

            const transferData = await transferResponse.json();
            console.log('⏳ [TX] Transaction sent, waiting for confirmation...');
            console.log('🔗 [TX] Hash:', transferData.txHash);

            // Wait a bit for block confirmation
            await new Promise(resolve => setTimeout(resolve, 3000));

            setProgress(100);
            console.log('✅ [TX] Transaction confirmed!');
            console.log('🎉 [TX] Block:', transferData.blockNumber);
            console.log('⛽ [TX] Gas used:', transferData.gasUsed);
            console.log('🔍 [TX] Explorer:', transferData.explorerUrl);
            console.log('🏦 [PRIVACY] Sent via backend - your wallet address is HIDDEN!');

            setTxHash(transferData.txHash);
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

    const handleSwap = async () => {
        if (!isConnected || !address) {
            alert('Please connect your wallet first');
            return;
        }

        if (!swapAmount) {
            alert('Please enter swap amount');
            return;
        }

        alert(`Swap ${swapAmount} ${swapFromToken === TOKENS.MNT ? 'MNT' : swapFromToken === TOKENS.USDT ? 'USDT' : 'METH'} to ${swapToToken === TOKENS.MNT ? 'MNT' : swapToToken === TOKENS.USDT ? 'USDT' : 'METH'}`);
    };

    const handleRWATrade = async () => {
        if (!isConnected || !address) {
            alert('Please connect your wallet first');
            return;
        }

        if (!rwaAmount) {
            alert('Please enter amount');
            return;
        }

        alert(`${rwaAction === 'buy' ? 'Buy' : 'Sell'} ${rwaAmount} ${selectedRWA.symbol} at $${selectedRWA.price}`);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    // Get available tokens for swap (excluding the selected one)
    const getAvailableSwapTokens = (excludeToken: string) => {
        const allTokens = [
            { value: TOKENS.MNT, label: 'MNT (Native Mantle)' },
            { value: TOKENS.USDT, label: 'Mock USDT' },
            { value: TOKENS.METH, label: 'Mock METH' }
        ];
        return allTokens.filter(token => token.value !== excludeToken);
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
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <ArrowRightLeft className="w-4 h-4" />
                                    <span>Swap</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setTradeType('rwa')}
                                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${tradeType === 'rwa'
                                    ? 'bg-[#6ED6C9] text-[#0B0E11]'
                                    : 'bg-[#161B22] text-[#9BA4AE] hover:text-[#E6EDF3]'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>RWA Tokens</span>
                                </div>
                            </button>
                        </div>

                        {/* SEND SECTION */}
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

                        {/* SWAP SECTION */}
                        {tradeType === 'swap' && (
                            <div className="space-y-6">
                                {/* From Token */}
                                <div>
                                    <label className="block text-xs font-medium text-[#9BA4AE] uppercase mb-2">
                                        From
                                    </label>
                                    <div className="bg-[#0B0E11] border border-white/[0.06] rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <select
                                                value={swapFromToken}
                                                onChange={(e) => {
                                                    const newToken = e.target.value;
                                                    setSwapFromToken(newToken);
                                                    // If the new from token is the same as to token, swap them
                                                    if (newToken === swapToToken) {
                                                        setSwapToToken(swapFromToken);
                                                    }
                                                }}
                                                className="bg-[#161B22] border border-white/[0.06] rounded-lg px-3 py-2 text-[#E6EDF3] focus:outline-none focus:border-[#6ED6C9] transition-colors"
                                            >
                                                <option value={TOKENS.MNT}>MNT (Native Mantle)</option>
                                                <option value={TOKENS.USDT}>Mock USDT</option>
                                                <option value={TOKENS.METH}>Mock METH</option>
                                            </select>
                                        </div>
                                        <input
                                            type="number"
                                            value={swapAmount}
                                            onChange={(e) => setSwapAmount(e.target.value)}
                                            placeholder="0.0"
                                            className="w-full bg-transparent text-2xl text-[#E6EDF3] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Swap Direction Icon */}
                                <div className="flex justify-center">
                                    <div className="bg-[#161B22] border border-white/[0.06] rounded-xl p-2">
                                        <ArrowDownUp className="w-5 h-5 text-[#6ED6C9]" />
                                    </div>
                                </div>

                                {/* To Token */}
                                <div>
                                    <label className="block text-xs font-medium text-[#9BA4AE] uppercase mb-2">
                                        To
                                    </label>
                                    <div className="bg-[#0B0E11] border border-white/[0.06] rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <select
                                                value={swapToToken}
                                                onChange={(e) => {
                                                    const newToken = e.target.value;
                                                    setSwapToToken(newToken);
                                                    // If the new to token is the same as from token, swap them
                                                    if (newToken === swapFromToken) {
                                                        setSwapFromToken(swapToToken);
                                                    }
                                                }}
                                                className="bg-[#161B22] border border-white/[0.06] rounded-lg px-3 py-2 text-[#E6EDF3] focus:outline-none focus:border-[#6ED6C9] transition-colors"
                                            >
                                                {getAvailableSwapTokens(swapFromToken).map(token => (
                                                    <option key={token.value} value={token.value}>{token.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="text-2xl text-[#E6EDF3]">
                                            {swapAmount ? (parseFloat(swapAmount) * 0.98).toFixed(4) : '0.0'}
                                        </div>
                                    </div>
                                </div>

                                {/* Swap Button */}
                                <Button
                                    onClick={handleSwap}
                                    disabled={!isConnected || !swapAmount}
                                    className="w-full"
                                    size="lg"
                                >
                                    Swap
                                    <ArrowRightLeft className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        {/* RWA SECTION */}
                        {tradeType === 'rwa' && (
                            <div className="space-y-6">
                                {/* RWA Token List */}
                                <div>
                                    <label className="block text-xs font-medium text-[#9BA4AE] uppercase mb-3">
                                        Select RWA Token
                                    </label>
                                    <div className="space-y-2">
                                        {RWA_TOKENS.map((token) => (
                                            <button
                                                key={token.id}
                                                onClick={() => setSelectedRWA(token)}
                                                className={`w-full bg-[#0B0E11] border rounded-xl p-4 text-left transition-all ${selectedRWA.id === token.id
                                                        ? 'border-[#6ED6C9] bg-[#6ED6C9]/5'
                                                        : 'border-white/[0.06] hover:border-white/[0.12]'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-[#E6EDF3]">{token.name}</p>
                                                        <p className="text-xs text-[#9BA4AE] mt-1">{token.symbol}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-[#E6EDF3]">${token.price.toFixed(2)}</p>
                                                        <p className={`text-xs mt-1 flex items-center gap-1 justify-end ${token.change >= 0 ? 'text-[#6ED6C9]' : 'text-red-400'
                                                            }`}>
                                                            {token.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                            {Math.abs(token.change)}%
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Buy/Sell Toggle */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setRwaAction('buy')}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${rwaAction === 'buy'
                                                ? 'bg-[#6ED6C9] text-[#0B0E11]'
                                                : 'bg-[#161B22] text-[#9BA4AE]'
                                            }`}
                                    >
                                        Buy
                                    </button>
                                    <button
                                        onClick={() => setRwaAction('sell')}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${rwaAction === 'sell'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-[#161B22] text-[#9BA4AE]'
                                            }`}
                                    >
                                        Sell
                                    </button>
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <label className="block text-xs font-medium text-[#9BA4AE] uppercase mb-2">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        value={rwaAmount}
                                        onChange={(e) => setRwaAmount(e.target.value)}
                                        placeholder="0.0"
                                        className="w-full bg-[#0B0E11] border border-white/[0.06] rounded-xl px-4 py-3 text-[#E6EDF3] focus:outline-none focus:border-[#6ED6C9] transition-colors"
                                    />
                                    {rwaAmount && (
                                        <p className="text-xs text-[#9BA4AE] mt-2">
                                            Total: ${(parseFloat(rwaAmount) * selectedRWA.price).toFixed(2)}
                                        </p>
                                    )}
                                </div>

                                {/* Trade Button */}
                                <Button
                                    onClick={handleRWATrade}
                                    disabled={!isConnected || !rwaAmount}
                                    className={`w-full ${rwaAction === 'sell' ? 'bg-red-500 hover:bg-red-600' : ''}`}
                                    size="lg"
                                >
                                    {rwaAction === 'buy' ? 'Buy' : 'Sell'} {selectedRWA.symbol}
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
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
