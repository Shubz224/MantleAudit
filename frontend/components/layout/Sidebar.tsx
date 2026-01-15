'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Shield, Search, Settings, Vault, Coins } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

const MENU_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FileText, label: 'User Dashboard', href: '/user' },
    { icon: Vault, label: 'Vault', href: '/vault' },
    { icon: Coins, label: 'Vault Deposits', href: '/deposit' },
    { icon: Search, label: 'Auditor', href: '/auditor' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <Tooltip.Provider delayDuration={100}>
            <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-16 bg-[var(--glass-bg)] border-r border-[var(--glass-border)] backdrop-blur-[8px] z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col items-center gap-2 py-6">
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Tooltip.Root key={item.href}>
                                <Tooltip.Trigger asChild>
                                    <Link href={item.href}>
                                        <div
                                            className={`
                        p-3 rounded-xl transition-all duration-150
                        ${isActive
                                                    ? 'bg-[#6ED6C9]/10 text-[#6ED6C9]'
                                                    : 'text-[#9BA4AE] hover:bg-white/5 hover:text-[#E6EDF3]'
                                                }
                      `}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>
                                    </Link>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                    <Tooltip.Content
                                        side="right"
                                        sideOffset={8}
                                        className="px-3 py-1.5 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-lg text-sm text-[#E6EDF3] shadow-lg"
                                    >
                                        {item.label}
                                        <Tooltip.Arrow className="fill-[#161B22]" />
                                    </Tooltip.Content>
                                </Tooltip.Portal>
                            </Tooltip.Root>
                        );
                    })}
                </div>
            </aside>
        </Tooltip.Provider>
    );
}
