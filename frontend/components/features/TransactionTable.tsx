'use client';

import { motion } from 'framer-motion';
import { StatusPill } from '../ui/Badge';
import { TableSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { FileText, ExternalLink, Shield, Lock } from 'lucide-react';

interface Transaction {
    id: string;
    protocol: string;
    timestamp: string;
    status: string;
    type?: string;  // NEW: Deposit, Withdraw, Private Transfer, Private Swap
    hasProofs?: boolean;  // NEW: true only for Private Transfer/Swap
    commitmentHash?: string;
    isVaultTx?: boolean;
    pacHash?: string;
}

interface TransactionTableProps {
    transactions: Transaction[];
    loading?: boolean;
    onSelectTx?: (tx: Transaction) => void;
}

export function TransactionTable({ transactions, loading = false, onSelectTx }: TransactionTableProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-[#5ac2b5] animate-spin"
                >
                    <path
                        d="M7 3H3v4h4V3zm0 14H3v4h4v-4zM17 3h4v4h-4V3zm4 14h-4v4h4v-4zM8 8h2v2H8V8zm4 2h-2v4H8v2h2v-2h4v2h2v-2h-2v-4h2V8h-2v2h-2z"
                        fill="currentColor"
                    />
                </svg>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <EmptyState
                icon={<FileText className="w-full h-full" />}
                title="No transactions yet"
                description="Submit a transaction from the User Dashboard to get started."
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
                <thead>
                    <tr className="border-b border-white/[0.04]">
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#9BA4AE] font-medium">
                            TX ID
                        </th>
                        {/* <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#9BA4AE] font-medium">
                            Type
                        </th> */}
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#9BA4AE] font-medium">
                            Status
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#9BA4AE] font-medium">
                            Time
                        </th>
                        {/* <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#9BA4AE] font-medium">
                            Action
                        </th> */}
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((tx, index) => (
                        <motion.tr
                            key={tx.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02, duration: 0.15 }}
                            onClick={() => {
                                // Only open panel for vault transactions with proofs
                                if (tx.hasProofs || tx.isVaultTx) {
                                    onSelectTx?.(tx);
                                }
                            }}
                            className={`border-b border-white/[0.04] ${tx.hasProofs || tx.isVaultTx ? 'hover:bg-white/[0.02] cursor-pointer' : ''} transition-all duration-150 ${tx.isVaultTx ? 'bg-[#6ED6C9]/5' : ''
                                }`}
                        >
                            <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm text-[#E6EDF3]">
                                        {tx.id.slice(0, 10)}...{tx.id.slice(-4)}
                                    </span>
                                    {tx.isVaultTx && (
                                        <span className="px-2 py-0.5 bg-[#6ED6C9]/20 text-[#6ED6C9] text-xs rounded-full flex items-center gap-1 font-medium">
                                            <Shield className="w-3 h-3" />
                                            Vault
                                        </span>
                                    )}
                                    {tx.pacHash && (
                                        <span className="px-2 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] text-xs rounded-full flex items-center gap-1">
                                            <Lock className="w-3 h-3" />
                                            PAC
                                        </span>
                                    )}
                                </div>
                            </td>
                            {/* <td className="py-4 px-4">
                                {tx.type && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${tx.type === 'Deposit' ? 'bg-emerald-500/10 text-emerald-400' :
                                        tx.type === 'Withdraw' ? 'bg-rose-500/10 text-rose-400' :
                                            tx.type === 'Private Transfer' ? 'bg-blue-500/10 text-blue-400' :
                                                tx.type === 'Private Swap' ? 'bg-purple-500/10 text-purple-400' :
                                                    'bg-gray-500/10 text-gray-400'
                                        }`}>
                                        {tx.type}
                                    </span>
                                )}
                            </td> */}
                            <td className="py-4 px-4">
                                <StatusPill status="Success" />
                            </td>
                            <td className="py-4 px-4 text-sm text-[#9BA4AE]">
                                {tx.timestamp}
                            </td>
                            {/* <td className="py-4 px-4">
                                {tx.hasProofs || tx.isVaultTx ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectTx?.(tx);
                                        }}
                                        className="text-[#6ED6C9] hover:text-[#5AC2B5] text-sm font-medium flex items-center gap-1 transition-colors"
                                    >
                                        View Proofs
                                    </button>
                                ) : (
                                    <a
                                        href={`https://sepolia.mantle.xyz/tx/${tx.txId || tx.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-[#9BA4AE] hover:text-[#6ED6C9] text-sm font-medium flex items-center gap-1 transition-colors"
                                    >
                                        Explorer <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </td> */}
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
