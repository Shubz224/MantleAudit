'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mantleSepolia } from '../../config/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

const config = createConfig(
    getDefaultConfig({
        chains: [mantleSepolia],
        transports: {
            [mantleSepolia.id]: http(),
        },
        walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
        appName: 'BlackBox',
        appDescription: 'Privacy-preserving compliance and audit system',
        appUrl: 'https://BlackBox.xyz',
        appIcon: 'https://BlackBox.xyz/logo.png',
    })
);

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider
                    theme="midnight"
                    customTheme={{
                        '--ck-connectbutton-font-size': '16px',
                        '--ck-connectbutton-border-radius': '24px',
                        '--ck-connectbutton-color': '#E6EDF3',
                        '--ck-connectbutton-background': '#6ED6C9',
                        '--ck-connectbutton-background-secondary': '#5AC2B5',
                        '--ck-connectbutton-hover-background': '#5AC2B5',
                        '--ck-body-background': '#0B0E11',
                        '--ck-body-background-secondary': '#161B22',
                        '--ck-primary-button-background': '#6ED6C9',
                        '--ck-primary-button-hover-background': '#5AC2B5',
                    }}
                >
                    {children}
                </ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
