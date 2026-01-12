'use client';

import { AppShell } from '../../components/layout/AppShell';
import { AnimatedLayout } from '../providers/AnimatedLayout';
import { Card } from '../../components/ui/Card';
import { Shield } from 'lucide-react';

export default function CuratorPage() {
    return (
        <AnimatedLayout>
            <AppShell>
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-3xl font-semibold text-[#E6EDF3]">Curator Dashboard</h1>
                        <p className="text-sm text-[#9BA4AE] mt-1">
                            Manage vault operations and execute compliant trades
                        </p>
                    </div>

                    <Card padding="lg" className="text-center py-12">
                        <Shield className="w-12 h-12 text-[#6ED6C9] mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-[#E6EDF3] mb-2">
                            Curator Dashboard Coming Soon
                        </h2>
                        <p className="text-sm text-[#9BA4AE]">
                            Advanced vault management features will be available here
                        </p>
                    </Card>
                </div>
            </AppShell>
        </AnimatedLayout>
    );
}
