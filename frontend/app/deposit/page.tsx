'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { AppShell } from '../../components/layout/AppShell';
import { AnimatedLayout } from '../providers/AnimatedLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Check,
    Wallet,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { useWalletStatus } from '../../hooks/useWallet';
import { ConnectButton } from '../../components/wallet/ConnectButton';
import { TOKENS } from '../../config/chains';

// Vault ABI
const VAULT_ABI = [
    "function depositToken(address token, uint256 amount) payable",
    "function withdrawToken(address token, uint256 amount)",
    "function getDepositorBalance(address user, address token) view returns (uint256)",
    "function getTokenBalance(address token) view returns (uint256)"
];

export default function DepositPage() {
    const { address, isConnected } = useWalletStatus();

    // Deposit State
    const [depositToken, setDepositToken] = useState(TOKENS.MNT);
    const [depositAmount, setDepositAmount] = useState('');
    const [isDepositing, setIsDepositing] = useState(false);

    // Withdraw State
    const [withdrawToken, setWithdrawToken] = useState(TOKENS.MNT);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    // Balance State
    const [totalVaultBalance, setTotalVaultBalance] = useState('0');
    const [userVaultBalance, setUserVaultBalance] = useState('0');
    const [txHash, setTxHash] = useState<string | null>(null);

    useEffect(() => {
        if (isConnected && address) {
            fetchBalances();
        }
    }, [isConnected, address, depositToken, withdrawToken]);

    const fetchBalances = async () => {
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const vaultContract = new ethers.Contract(
                process.env.NEXT_PUBLIC_VAULT_ADDRESS!,
                VAULT_ABI,
                provider
            );

            // Get total vault balance for selected deposit token
            const total = await vaultContract.getTokenBalance(depositToken);
            setTotalVaultBalance(ethers.formatEther(total));

            // Get user's balance in vault for selected withdraw token
            const userBal = await vaultContract.getDepositorBalance(address, withdrawToken);
            setUserVaultBalance(ethers.formatEther(userBal));
        } catch (error) {
            console.error('Error fetching balances:', error);
        }
    };

    const handleDeposit = async () => {
        if (!isConnected || !address || !depositAmount) {
            alert('Please connect wallet and enter amount');
            return;
        }

        setIsDepositing(true);
        setTxHash(null);

        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const vaultContract = new ethers.Contract(
                process.env.NEXT_PUBLIC_VAULT_ADDRESS!,
                VAULT_ABI,
                signer
            );

            let tx;
            if (depositToken === TOKENS.MNT) {
                // Deposit native MNT
                tx = await vaultContract.depositToken(
                    TOKENS.MNT,
                    0, // amount ignored for MNT
                    { value: ethers.parseEther(depositAmount) }
                );
            } else {
                // Deposit ERC20 token
                // Note: User needs to approve token first
                tx = await vaultContract.depositToken(
                    depositToken,
                    ethers.parseEther(depositAmount)
                );
            }

            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            await fetchBalances();
            setDepositAmount('');
        } catch (error: any) {
            console.error('Deposit failed:', error);
            alert(`Deposit failed: ${error.message}`);
        } finally {
            setIsDepositing(false);
        }
    };

    const handleWithdraw = async () => {
        if (!isConnected || !address || !withdrawAmount) {
            alert('Please connect wallet and enter amount');
            return;
        }

        setIsWithdrawing(true);
        setTxHash(null);

        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const vaultContract = new ethers.Contract(
                process.env.NEXT_PUBLIC_VAULT_ADDRESS!,
                VAULT_ABI,
                signer
            );

            const tx = await vaultContract.withdrawToken(
                withdrawToken,
                ethers.parseEther(withdrawAmount)
            );

            const receipt = await tx.wait();
            setTxHash(receipt.hash);
            await fetchBalances();
            setWithdrawAmount('');
        } catch (error: any) {
            console.error('Withdraw failed:', error);
            alert(`Withdraw failed: ${error.message}`);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const getTokenSymbol = (token: string) => {
        if (token === TOKENS.MNT) return 'MNT';
        if (token === TOKENS.USDT) return 'USDT';
        if (token === TOKENS.METH) return 'METH';
        return 'TOKEN';
    };

    return (
        <AnimatedLayout>
            <AppShell>
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-[#E6EDF3]">Vault Deposits</h1>
                            <p className="text-sm text-[#9BA4AE] mt-1">
                                Deposit and withdraw tokens from the vault
                            </p>
                        </div>
                        {!isConnected && <ConnectButton />}
                    </div>

                    {/* Balance Cards */}
                    {isConnected && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card padding="lg">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-[#6ED6C9]/10 text-[#6ED6C9]">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-medium text-[#9BA4AE]">Total Vault Balance</h3>
                                </div>
                                <p className="text-2xl font-semibold text-[#E6EDF3]">
                                    {parseFloat(totalVaultBalance).toFixed(4)} {getTokenSymbol(depositToken)}
                                </p>
                                <p className="text-xs text-[#9BA4AE] mt-1">All depositors combined</p>
                            </Card>

                            <Card padding="lg">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-medium text-[#9BA4AE]">Your Vault Balance</h3>
                                </div>
                                <p className="text-2xl font-semibold text-[#E6EDF3]">
                                    {parseFloat(userVaultBalance).toFixed(4)} {getTokenSymbol(withdrawToken)}
                                </p>
                                <p className="text-xs text-[#9BA4AE] mt-1">Available to withdraw</p>
                            </Card>
                        </div>
                    )}

                    {/* Deposit and Withdraw */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Deposit Column */}
                        <Card padding="lg">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-[#6ED6C9]/10 text-[#6ED6C9]">
                                    <ArrowDownCircle className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-semibold text-[#E6EDF3]">Deposit to Vault</h2>
                            </div>

                            <div className="space-y-6">
                                {/* Token Selector */}
                                <div>
                                    <label className="block text-xs font-medium text-[#9BA4AE] uppercase mb-2">
                                        Token
                                    </label>
                                    <select
                                        value={depositToken}
                                        onChange={(e) => setDepositToken(e.target.value)}
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
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        placeholder="0.0"
                                        className="w-full bg-[#0B0E11] border border-white/[0.06] rounded-xl px-4 py-3 text-[#E6EDF3] focus:outline-none focus:border-[#6ED6C9] transition-colors"
                                    />
                                </div>

                                <Button
                                    onClick={handleDeposit}
                                    loading={isDepositing}
                                    disabled={!isConnected || !depositAmount}
                                    className="w-full"
                                    size="lg"
                                >
                                    Deposit {getTokenSymbol(depositToken)}
                                </Button>
                            </div>
                        </Card>

                        {/* Withdraw Column */}
                        <Card padding="lg">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]">
                                    <ArrowUpCircle className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-semibold text-[#E6EDF3]">Withdraw from Vault</h2>
                            </div>

                            <div className="space-y-6">
                                {/* Token Selector */}
                                <div>
                                    <label className="block text-xs font-medium text-[#9BA4AE] uppercase mb-2">
                                        Token
                                    </label>
                                    <select
                                        value={withdrawToken}
                                        onChange={(e) => setWithdrawToken(e.target.value)}
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
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="0.0"
                                        className="w-full bg-[#0B0E11] border border-white/[0.06] rounded-xl px-4 py-3 text-[#E6EDF3] focus:outline-none focus:border-[#6ED6C9] transition-colors"
                                    />
                                    <p className="text-xs text-[#9BA4AE] mt-2">
                                        Available: {parseFloat(userVaultBalance).toFixed(4)}
                                    </p>
                                </div>

                                <Button
                                    onClick={handleWithdraw}
                                    loading={isWithdrawing}
                                    disabled={!isConnected || !withdrawAmount}
                                    className="w-full"
                                    size="lg"
                                    variant="secondary"
                                >
                                    Withdraw {getTokenSymbol(withdrawToken)}
                                </Button>

                                <div className="flex items-center gap-2 text-xs text-[#6B7280] justify-center bg-[#0B0E11] py-2 rounded-lg border border-white/[0.04]">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Curator cannot withdraw - only depositors</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Success Message */}
                    {txHash && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="bg-[#6ED6C9]/10 border-[#6ED6C9]/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Check className="w-5 h-5 text-[#6ED6C9]" />
                                        <div>
                                            <h3 className="text-sm font-medium text-[#E6EDF3]">Transaction Successful</h3>
                                            <p className="text-xs text-[#9BA4AE] mt-1 font-mono">{txHash}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => window.open(`https://sepolia.mantlescan.xyz/tx/${txHash}`, '_blank')}
                                    >
                                        View on Explorer
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </AppShell>
        </AnimatedLayout>
    );
}
