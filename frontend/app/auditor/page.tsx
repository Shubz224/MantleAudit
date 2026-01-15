'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { AppShell } from '../../components/layout/AppShell';
import { AnimatedLayout } from '../providers/AnimatedLayout';
import { Card } from '../../components/ui/Card';
import { TransactionTable } from '../../components/features/TransactionTable';
import { AuditPanel } from '../../components/features/AuditPanel';
import { Search, Shield } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AuditorDashboard() {
    const [transactions, setTransactions] = useState([]);
    const [vaultTransactions, setVaultTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vaultLoading, setVaultLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [auditResult, setAuditResult] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS?.toLowerCase();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            fetchTransactions();
            fetchVaultTransactions();
        }
    }, [mounted]);

    const fetchVaultTransactions = async () => {
        setVaultLoading(true);
        try {
            console.log('🏦 [AUDITOR] Fetching vault transactions...');

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/transaction/vault`);
            const data = await res.json();

            if (data.success) {
                console.log('✅ [AUDITOR] Found', data.transactions.length, 'vault transactions');
                setVaultTransactions(data.transactions);
            }
        } catch (error) {
            console.error('❌ [AUDITOR] Vault tx error:', error);
        } finally {
            setVaultLoading(false);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            console.log('🔍 [AUDITOR] Fetching transactions...');

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/transaction`);
            const data = await res.json();

            if (data.success) {
                console.log('✅ [AUDITOR] Found', data.transactions.length, 'transactions from backend');

                // Reverse to show newest first
                const sortedTxs = data.transactions.reverse().map((tx: any) => {
                    // Check if this is a vault transaction by comparing sender address
                    const isVaultTx = tx.from?.toLowerCase() === VAULT_ADDRESS;

                    if (isVaultTx) {
                        console.log('🏦 [AUDITOR] Vault transaction detected:', tx.id);
                    }

                    return {
                        ...tx,
                        id: tx.id,
                        protocol: tx.protocol === '0x0000000000000000000000000000000000000000' ? 'Private Protocol' : tx.protocol,
                        status: 'Pending Audit',
                        isVaultTx, // Add vault flag
                        pacHash: tx.pac || tx.privateActivityCommitment // PAC hash if available
                    };
                });

                const vaultTxCount = sortedTxs.filter((t: any) => t.isVaultTx).length;
                console.log('🏦 [AUDITOR] Vault transactions:', vaultTxCount);

                setTransactions(sortedTxs);
            }
        } catch (error) {
            console.error('❌ [AUDITOR] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAudit = async (tx: any) => {
        console.log('[AUDITOR] Opening audit panel for:', tx.id);
        if (tx.isVaultTx) {
            console.log('🏦 [AUDITOR] This is a VAULT transaction');
            console.log('🔐 [AUDITOR] PAC Hash:', tx.pacHash || 'Not available');
        }

        // Open panel immediately
        setSelectedTx(tx);
        setAuditResult(null);

        // For demo purposes
        setTimeout(() => {
            setAuditResult({
                passed: true,
                title: 'KYC Verified Successfully',
                description: 'Identity confirmed via ZK proof. No sanctions match found.'
            });
        }, 1500);
    };

    if (!mounted) {
        return (
            <AnimatedLayout>
                <AppShell>
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center py-12">
                            <p className="text-sm text-[#9BA4AE]">Loading...</p>
                        </div>
                    </div>
                </AppShell>
            </AnimatedLayout>
        );
    }

    const vaultTxCount = transactions.filter((t: any) => t.isVaultTx).length;

    return (
        <AnimatedLayout>
            <AppShell>
                <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
                    {/* Header */}
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-semibold text-[#E6EDF3]">Audit Console</h1>
                            <p className="text-sm text-[#9BA4AE] mt-1">
                                Real-time compliance verification & monitoring
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-[#0B0E11] rounded-lg border border-white/[0.06]">
                                <p className="text-xs text-[#9BA4AE]">Total Transactions</p>
                                <p className="text-lg font-semibold text-[#E6EDF3]">{transactions.length}</p>
                            </div>
                            {vaultTxCount > 0 && (
                                <div className="px-4 py-2 bg-[#6ED6C9]/10 rounded-lg border border-[#6ED6C9]/20">
                                    <p className="text-xs text-[#9BA4AE]">Vault Transactions</p>
                                    <p className="text-lg font-semibold text-[#6ED6C9] flex items-center gap-1">
                                        <Shield className="w-4 h-4" />
                                        {vaultTxCount}
                                    </p>
                                </div>
                            )}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BA4AE]" />
                                <input
                                    type="text"
                                    placeholder="Search transaction ID..."
                                    className="pl-10 pr-4 py-2 bg-[#161B22] border border-white/[0.06] rounded-full text-sm text-[#E6EDF3] w-64 focus:outline-none focus:border-[#6ED6C9] transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex gap-8 h-full flex-col">
                        {/* Regular Transactions */}
                        {/* <Card className="flex-1 overflow-hidden flex flex-col" padding="lg">
                            <h3 className="text-lg font-semibold text-[#E6EDF3] mb-4">Regular Transactions</h3>
                            <div className="flex-1 overflow-y-auto">
                                <TransactionTable
                                    transactions={transactions}
                                    loading={loading}
                                    onSelectTx={handleAudit}
                                />
                            </div>
                        </Card> */}

                        {/* Vault Transactions Section */}
                        <Card className="flex-1 overflow-hidden flex flex-col bg-gradient-to-br from-[#6ED6C9]/5 to-[#0B0E11] border-[#6ED6C9]/20" padding="lg">
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className="w-5 h-5 text-[#6ED6C9]" />
                                <h3 className="text-lg font-semibold text-[#E6EDF3]">Vault Transactions (Privacy Enabled)</h3>
                                <span className="px-3 py-1 bg-[#6ED6C9]/20 text-[#6ED6C9] text-xs rounded-full font-medium">
                                    {vaultTransactions.length} transactions
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <TransactionTable
                                    transactions={vaultTransactions}
                                    loading={vaultLoading}
                                    onSelectTx={handleAudit}
                                />
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Slide-out Panel */}
                <AnimatePresence>
                    {selectedTx && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedTx(null)}
                                className="fixed inset-0 bg-black z-40 backdrop-blur-sm"
                            />
                            <AuditPanel
                                tx={selectedTx}
                                onClose={() => setSelectedTx(null)}
                            />
                        </>
                    )}
                </AnimatePresence>
            </AppShell>
        </AnimatedLayout>
    );
}
