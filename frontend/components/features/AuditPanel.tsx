'use client';

import { motion } from 'framer-motion';
import { X, CheckCircle, XCircle, FileText, Calendar, Globe, Hash, AlertTriangle, ChevronRight, Lock, ShieldCheck, RefreshCw, Shield } from 'lucide-react';
import { Card } from '../ui/Card';
import { useState } from 'react';

interface AuditResult {
    passed: boolean;
    title: string;
    description: string;
    txHash?: string;
    auditor?: string;
    timestamp?: number;
}

interface AuditPanelProps {
    tx: any;
    onClose: () => void;
    // Removed fixed result prop, handling internal state or passed via simpler mechanism
}

export function AuditPanel({ tx, onClose }: AuditPanelProps) {
    const [verifying, setVerifying] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, AuditResult>>({});

    const runVerification = async (type: 'KYC' | 'AML' | 'YIELD') => {
        setVerifying(type);
        console.log(`[AUDITOR] Starting ${type} verification for TX ${tx.id}`);
        console.log(`[AUDITOR] Calling blockchain to verify ${type} attestation...`);

        try {
            // Call backend to verify the proof on blockchain
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/audit/verify/${tx.id}/${type.toLowerCase()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();
            console.log(`[AUDITOR] ${type} Verification Response:`, data);

            if (data.success && data.verified) {
                console.log(`[AUDITOR] ✅ ${type} proof VERIFIED on blockchain`);
                console.log(`[AUDITOR] Proof data:`, data.proof);

                setResults(prev => ({
                    ...prev,
                    [type]: {
                        passed: true,
                        title: `${type} Verified On-Chain`,
                        description: type === 'KYC' ? 'Identity confirmed via ZK proof on Mantle. ' :
                            type === 'AML' ? 'No sanctions match found. Verified on-chain.' :
                                'Wallet balance exceeds threshold. Verified on-chain.',
                        txHash: data.proof?.txHash,
                        auditor: data.proof?.auditor,
                        timestamp: data.proof?.timestamp
                    }
                }));
            } else {
                console.log(`[AUDITOR] ❌ ${type} proof NOT FOUND or FAILED verification`);
                setResults(prev => ({
                    ...prev,
                    [type]: {
                        passed: false,
                        title: `${type} Verification Failed`,
                        description: data.error || 'Proof not found on blockchain'
                    }
                }));
            }
        } catch (error) {
            console.error(`[AUDITOR] Error verifying ${type}:`, error);
            setResults(prev => ({
                ...prev,
                [type]: {
                    passed: false,
                    title: `${type} Verification Error`,
                    description: 'Failed to connect to blockchain'
                }
            }));
        } finally {
            setVerifying(null);
        }
    };

    const metadata = [
        { label: 'Transaction ID', value: tx.id, icon: Hash },
        { label: 'Timestamp', value: tx.timestamp, icon: Calendar },
        { label: 'Protocol', value: tx.protocol, icon: Globe },
        { label: 'Commitment', value: '0x' + tx.commitmentHash?.slice(2, 10) + '...', icon: FileText },
    ];

    const hiddenData = ['Transaction Amount', 'Sender Address', 'Recipient Address', 'Wallet Balance History'];

    return (
        <motion.div
            initial={{ x: 480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 480, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 w-[480px] bg-[#161B22] border-l border-white/[0.06] shadow-2xl z-50 overflow-y-auto"
        >
            <div className="p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-[#E6EDF3]">Audit Console</h2>
                        <p className="text-xs text-[#9BA4AE] mt-1">Verify compliance proofs</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/5 text-[#9BA4AE] hover:text-[#E6EDF3] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Verification Controls */}
                <div className="space-y-4">
                    {tx.isVaultTx ? (
                        // VAULT TRANSACTION: Show only PAC verification
                        <>
                            <h4 className="text-sm font-semibold text-[#E6EDF3] uppercase tracking-wider flex items-center gap-2">
                                <Shield className="w-4 h-4 text-[#6ED6C9]" />
                                Vault Transaction (Privacy Mode)
                            </h4>

                            <div className="bg-gradient-to-br from-[#6ED6C9]/10 to-[#0B0E11] rounded-xl border border-[#6ED6C9]/30 overflow-hidden">
                                <div className="p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-lg bg-[#6ED6C9]/20 text-[#6ED6C9]">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[#E6EDF3]">Private Activity Commitment (PAC)</p>
                                            <p className="text-xs text-[#9BA4AE]">KYC + AML + Yield Combined</p>
                                        </div>
                                    </div>

                                    {tx.pacHash ? (
                                        <>
                                            <div className="bg-[#0B0E11] rounded-lg p-3 mb-3">
                                                <p className="text-xs text-[#9BA4AE] mb-1">PAC Hash</p>
                                                <p className="text-xs font-mono text-[#6ED6C9] break-all">{tx.pacHash}</p>
                                            </div>

                                            <button
                                                onClick={() => window.open(`https://sepolia.mantlescan.xyz/tx/${tx.id}#eventlog`, '_blank')}
                                                className="w-full px-4 py-2 bg-[#6ED6C9] hover:bg-[#5AC2B5] text-[#0B0E11] rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                                            >
                                                <ShieldCheck className="w-4 h-4" />
                                                Verify PAC On-Chain
                                            </button>

                                            <p className="text-xs text-[#9BA4AE] mt-3 flex items-center gap-2">
                                                <AlertTriangle className="w-3 h-3" />
                                                Individual proofs (KYC/AML/Yield) remain private. Only PAC is public.
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-[#EF4444]">PAC hash not found for this transaction</p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        // REGULAR TRANSACTION: Show individual proof verification
                        <>
                            <h4 className="text-sm font-semibold text-[#E6EDF3] uppercase tracking-wider">Required Checks</h4>

                            {['KYC', 'AML', 'YIELD'].map((type) => {
                                const result = results[type];
                                const isVerifying = verifying === type;

                                return (
                                    <div key={type} className="bg-[#0B0E11] rounded-xl border border-white/[0.06] overflow-hidden">
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${result?.passed ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                                                    result ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                                                        'bg-[#161B22] text-[#9BA4AE]'
                                                    }`}>
                                                    <ShieldCheck className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[#E6EDF3]">{type} Compliance</p>
                                                    <p className="text-xs text-[#9BA4AE]">
                                                        {result?.passed ? 'Verified' : result ? 'Verification Failed' : 'Pending Verification'}
                                                    </p>
                                                </div>
                                            </div>

                                            {result ? (
                                                result.passed ? (
                                                    <div className="flex items-center gap-2 text-[#22C55E] text-xs font-medium px-3 py-1 bg-[#22C55E]/10 rounded-full">
                                                        <CheckCircle className="w-3 h-3" />
                                                        PASSED
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-[#EF4444] text-xs font-medium px-3 py-1 bg-[#EF4444]/10 rounded-full">
                                                        <XCircle className="w-3 h-3" />
                                                        FAILED
                                                    </div>
                                                )
                                            ) : (
                                                <button
                                                    onClick={() => runVerification(type as any)}
                                                    disabled={!!verifying}
                                                    className="px-4 py-2 bg-[#161B22] hover:bg-[#6ED6C9]/10 hover:text-[#6ED6C9] border border-white/[0.1] hover:border-[#6ED6C9]/30 rounded-lg text-xs font-medium text-[#E6EDF3] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                >
                                                    {isVerifying ? (
                                                        <>
                                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                                            Verifying...
                                                        </>
                                                    ) : (
                                                        'Verify Proof'
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {result && (
                                            <div className="bg-[#161B22]/50 px-4 py-3 border-t border-white/[0.04] space-y-2">
                                                <p className="text-xs text-[#9BA4AE]">{result.description}</p>
                                                {result.txHash && (
                                                    <button
                                                        onClick={() => window.open(`https://explorer.sepolia.mantle.xyz/tx/${result.txHash}`, '_blank')}
                                                        className="text-xs px-3 py-1.5 bg-[#6ED6C9]/10 hover:bg-[#6ED6C9]/20 border border-[#6ED6C9]/20 hover:border-[#6ED6C9]/30 rounded-lg text-[#6ED6C9] hover:text-white transition-all"
                                                    >
                                                        View on Explorer
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                <div className="h-px bg-white/[0.04]" />

                {/* Public Metadata */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <h4 className="text-sm font-semibold text-[#E6EDF3] uppercase tracking-wider">Public Metadata</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#22C55E]/10 text-[#22C55E] font-medium">VERIFIED</span>
                    </div>
                    <div className="space-y-3">
                        {metadata.map((item) => (
                            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-[#0B0E11] border border-white/[0.04]">
                                <div className="flex items-center gap-3 text-sm text-[#9BA4AE]">
                                    <item.icon className="w-4 h-4 opacity-50" />
                                    {item.label}
                                </div>
                                <div className="text-sm text-[#E6EDF3] font-mono truncate max-w-[200px]">
                                    {item.value || 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Private Data (Hidden) */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <h4 className="text-sm font-semibold text-[#E6EDF3] uppercase tracking-wider">Private Data</h4>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-[#F59E0B]/10 text-[#F59E0B] font-medium">
                            <Lock className="w-3 h-3" />
                            ZK HIDDEN
                        </div>
                    </div>
                    <div className="bg-[#0B0E11] rounded-xl border border-dashed border-[#F59E0B]/20 p-1">
                        {hiddenData.map((item, i) => (
                            <div key={item} className="flex items-center justify-between p-3 border-b border-white/[0.02] last:border-0 hover:bg-[#161B22]/50 transition-colors">
                                <span className="text-sm text-[#6B7280]">{item}</span>
                                <span className="text-xs bg-[#161B22] text-[#6B7280] px-2 py-1 rounded">
                                    HIDDEN
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-[#6B7280] mt-3 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" />
                        Zero-knowledge proof confirms validity without revealing this data.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
