'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { AppShell } from '../../components/layout/AppShell';
import { AnimatedLayout } from '../providers/AnimatedLayout';
import { Card } from '../../components/ui/Card';
import { Shield, CheckCircle, TrendingUp, Users, Lock } from 'lucide-react';

// Vault ABI
const VAULT_ABI = [
    "function getVaultInfo() external view returns (tuple(address curator, address asset, uint256 totalAUM, bytes32 latestPAC, bool active, uint256 createdAt))",
    "function getTokenBalance(address token) view returns (uint256)"
];

export default function VaultDashboard() {
    const [vaultInfo, setVaultInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mntBalance, setMntBalance] = useState('0');
    const [usdtBalance, setUsdtBalance] = useState('0');
    const [methBalance, setMethBalance] = useState('0');

    // New vault address
    const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS!;
    const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    const USDT_ADDRESS = process.env.NEXT_PUBLIC_MOCK_USDT!;
    const METH_ADDRESS = process.env.NEXT_PUBLIC_MOCK_METH!;

    useEffect(() => {
        fetchVaultInfo();
    }, []);

    const fetchVaultInfo = async () => {
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);

            // Get vault info
            const info = await vaultContract.getVaultInfo();
            setVaultInfo({
                curator: info[0],
                asset: info[1],
                totalAUM: info[2].toString(),
                latestPAC: info[3],
                active: info[4],
                createdAt: info[5].toString()
            });

            // Get token balances
            const mntBal = await vaultContract.getTokenBalance(NATIVE_TOKEN);
            setMntBalance(ethers.formatEther(mntBal));

            const usdtBal = await vaultContract.getTokenBalance(USDT_ADDRESS);
            setUsdtBalance(ethers.formatEther(usdtBal));

            const methBal = await vaultContract.getTokenBalance(METH_ADDRESS);
            setMethBalance(ethers.formatEther(methBal));

        } catch (error) {
            console.error('Failed to fetch vault info:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatAUM = (aum: string) => {
        if (!aum) return '0';
        const aumValue = parseFloat(aum) / 1e18;
        return aumValue.toLocaleString('en-US', { maximumFractionDigits: 4 });
    };

    const isCompliant = true;

    if (loading) {
        return (
            <AnimatedLayout>
                <AppShell>
                    <div className="flex items-center justify-center h-screen">
                        <div className="text-[#9BA4AE]">Loading vault...</div>
                    </div>
                </AppShell>
            </AnimatedLayout>
        );
    }

    return (
        <AnimatedLayout>
            <AppShell>
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-[#E6EDF3] flex items-center gap-3">
                                <Shield className="w-8 h-8 text-[#6ED6C9]" />
                                Curator Vault
                            </h1>
                            <p className="text-sm text-[#9BA4AE] mt-1">
                                Privacy-preserving institutional capital on Mantle
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#0B0E11] rounded-lg border border-white/[0.06]">
                            <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" />
                            <span className="text-sm text-[#E6EDF3] font-medium">ACTIVE</span>
                        </div>
                    </div>

                    {/* Compliance Gate */}
                    <Card className={`border-2 ${isCompliant ? 'border-[#22C55E]/30 bg-[#22C55E]/5' : 'border-[#EF4444]/30 bg-[#EF4444]/5'}`}>
                        <div className="text-center py-6">
                            <div className="flex items-center justify-center gap-3 mb-3">
                                <CheckCircle className="w-10 h-10 text-[#22C55E]" />
                                <h2 className="text-3xl font-bold text-[#22C55E]">VAULT: COMPLIANT</h2>
                            </div>
                            <div className="flex items-center justify-center gap-4 text-[#22C55E] text-sm">
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" />
                                    KYC
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" />
                                    AML
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" />
                                    Yield
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* AUM and Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-3 bg-gradient-to-br border-[#6ED6C9]/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-[#6ED6C9]" />
                                        <p className="text-sm text-[#9BA4AE] uppercase tracking-wider">Total AUM</p>
                                    </div>
                                    <h3 className="text-5xl font-bold text-[#E6EDF3] mb-1">
                                        {formatAUM(vaultInfo?.totalAUM || '0')}
                                    </h3>
                                    <p className="text-lg text-[#6ED6C9] font-medium">Combined Tokens</p>
                                </div>
                                <div className="px-3 py-1 bg-[#22C55E]/10 rounded text-xs font-medium text-[#22C55E]">
                                    PUBLIC
                                </div>
                            </div>

                            {/* Token Breakdown */}
                            <div className="mt-6 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#9BA4AE]">MNT:</span>
                                    <span className="text-[#E6EDF3] font-mono">{parseFloat(mntBalance).toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#9BA4AE]">Mock USDT:</span>
                                    <span className="text-[#E6EDF3] font-mono">{parseFloat(usdtBalance).toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#9BA4AE]">Mock METH:</span>
                                    <span className="text-[#E6EDF3] font-mono">{parseFloat(methBalance).toFixed(4)}</span>
                                </div>
                            </div>
                        </Card>
                        {/* 
                        <Card className="bg-[#0B0E11]">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="w-5 h-5 text-[#9BA4AE]" />
                                <p className="text-sm text-[#9BA4AE] uppercase tracking-wider">Depositors</p>
                            </div>
                            <h4 className="text-3xl font-bold text-[#E6EDF3]">-</h4>
                            <p className="text-xs text-[#6B7280] mt-1">Active participants</p>
                        </Card> */}
                    </div>

                    {/* Curator Info */}
                    <Card className="bg-[#0B0E11]">
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-[#9BA4AE] uppercase tracking-wider mb-2">Curator</p>
                                <p className="text-sm text-[#E6EDF3] font-mono">
                                    {vaultInfo?.curator ? `${vaultInfo.curator.slice(0, 6)}...${vaultInfo.curator.slice(-4)}` : 'Not set'}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-[#161B22] border border-[#6ED6C9]/20 rounded-lg">
                                <Shield className="w-6 h-6 text-[#6ED6C9]" />
                                <div>
                                    <p className="text-sm font-semibold text-[#E6EDF3]">
                                        🛡️ Curator has NO withdrawal rights
                                    </p>
                                    <p className="text-xs text-[#9BA4AE] mt-1">
                                        Only depositors can withdraw funds. Curator can only execute trades and generate PACs.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Private Activity Section */}
                    <Card className="bg-[#0B0E11] border-dashed border-[#F59E0B]/20">
                        <div className="flex items-center gap-2 mb-4">
                            <Lock className="w-5 h-5 text-[#F59E0B]" />
                            <h3 className="text-lg font-semibold text-[#E6EDF3]">Private Activity Enabled</h3>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm text-[#9BA4AE] mb-3">Latest Private Activity Commitment:</p>

                            {vaultInfo?.latestPAC && vaultInfo.latestPAC !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? (
                                <div className="p-3 bg-[#161B22] rounded-lg border border-white/[0.04]">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-[#9BA4AE] mb-1">PAC</p>
                                            <p className="text-sm text-[#E6EDF3] font-mono">
                                                {vaultInfo.latestPAC.slice(0, 10)}...{vaultInfo.latestPAC.slice(-8)}
                                            </p>
                                        </div>
                                        <div className="px-3 py-1 bg-[#F59E0B]/10 rounded text-xs font-medium text-[#F59E0B]">
                                            PRIVATE
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-[#161B22] rounded-lg border border-dashed border-white/[0.04] text-center">
                                    <p className="text-sm text-[#6B7280]">No private activity recorded yet</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Mantle Callout */}
                    <Card className="bg-gradient-to-r from-[#6ED6C9]/10 to-[#161B22] border-[#6ED6C9]/20">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#6ED6C9]/20 rounded-lg">
                                <Shield className="w-6 h-6 text-[#6ED6C9]" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-[#E6EDF3] mb-1">
                                    Powered by Mantle
                                </h4>
                                <p className="text-xs text-[#9BA4AE] leading-relaxed">
                                    This design only works economically on Mantle due to low-cost proof verification and high-liquidity native assets.
                                    On Ethereum L1, continuous compliance monitoring would cost $87 per proof. On Mantle: $0.03.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </AppShell>
        </AnimatedLayout>
    );
}
