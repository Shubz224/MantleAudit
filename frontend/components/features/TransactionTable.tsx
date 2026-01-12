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
        return <TableSkeleton rows={5} />;
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
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#9BA4AE] font-medium">
                            Protocol
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#9BA4AE] font-medium">
                            Status
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#9BA4AE] font-medium">
                            Time
                        </th>
                        <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[#9BA4AE] font-medium">
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((tx, index) => (
                        <motion.tr
                            key={tx.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02, duration: 0.15 }}
                            onClick={() => onSelectTx?.(tx)}
                            className={`border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-all duration-150 ${tx.isVaultTx ? 'bg-[#6ED6C9]/5' : ''
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
                            <td className="py-4 px-4 text-sm text-[#E6EDF3]">
                                {tx.protocol}
                            </td>
                            <td className="py-4 px-4">
                                <StatusPill status={tx.status} />
                            </td>
                            <td className="py-4 px-4 text-sm text-[#9BA4AE]">
                                {tx.timestamp}
                            </td>
                            <td className="py-4 px-4">
                                <button className="text-[#6ED6C9] hover:text-[#5AC2B5] text-sm font-medium flex items-center gap-1 transition-colors">
                                    View <ExternalLink className="w-3 h-3" />
                                </button>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
