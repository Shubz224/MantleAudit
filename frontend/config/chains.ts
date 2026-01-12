import { defineChain } from 'viem';

export const mantleSepolia = defineChain({
    id: 5003,
    name: 'Mantle Sepolia',
    network: 'mantle-sepolia',
    nativeCurrency: {
        decimals: 18,
        name: 'MNT',
        symbol: 'MNT',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.sepolia.mantle.xyz'],
        },
        public: {
            http: ['https://rpc.sepolia.mantle.xyz'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Mantle Sepolia Explorer',
            url: 'https://explorer.sepolia.mantle.xyz',
        },
    },
    testnet: true,
});


export const TOKENS = {
    MNT: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",  // Native Mantle
    USDT: "0xCc75AFc81847983e3E1937fC07d564b68d18aEbc", // Mock USDT
    METH: "0xf6C198a6A58924D73fBdc59Da1C157Eb8A48E9dE"  // Mock METH
};