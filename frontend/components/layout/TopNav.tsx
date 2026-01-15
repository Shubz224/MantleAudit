'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '../wallet/ConnectButton';

export function TopNav() {
    const pathname = usePathname();

    // Determine section name from pathname
    const getSectionName = () => {
        if (pathname === '/') return 'Dashboard';
        if (pathname === '/user') return 'User Dashboard';
        if (pathname === '/auditor') return 'Audit Console';
        if (pathname?.includes('/transactions')) return 'Transactions';
        return 'Dashboard';
    };

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-[var(--glass-bg)] backdrop-blur-[8px] border-b border-[var(--glass-border)] z-50 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between h-full px-6 relative">
                {/* Left: Section name */}
                <div className="text-[#9BA4AE] text-sm font-medium">
                    {getSectionName()}
                </div>

                {/* Center: Logo */}
                <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-[#5ac2b5]"
                    >
                        <path
                            d="M7 3H3v4h4V3zm0 14H3v4h4v-4zM17 3h4v4h-4V3zm4 14h-4v4h4v-4zM8 8h2v2H8V8zm4 2h-2v4H8v2h2v-2h4v2h2v-2h-2v-4h2V8h-2v2h-2z"
                            fill="currentColor"
                        />
                    </svg>
                    <span className="text-xl font-bold text-[#E6EDF3]">BlackBox</span>
                </Link>


                {/* Right: Network + Wallet */}
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-full bg-[#161B22] border border-white/[0.06] text-xs text-[#9BA4AE] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                        Mantle Sepolia
                    </div>
                    <ConnectButton />
                </div>
            </div>
        </nav>
    );
}
