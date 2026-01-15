import { type Address } from 'viem';

export const EIP712_DOMAIN = {
    name: 'BlackBox',
    version: '1',
    chainId: 5003,
} as const;

export const TRANSACTION_TYPES = {
    TransactionRegistration: [
        { name: 'amount', type: 'uint256' },
        { name: 'protocol', type: 'address' },
        { name: 'timestamp', type: 'uint256' },
    ],
} as const;

export const PROOF_TYPES = {
    ProofAuthorization: [
        { name: 'txId', type: 'string' },
        { name: 'proofType', type: 'string' },
        { name: 'timestamp', type: 'uint256' },
    ],
} as const;

export interface TransactionMessage {
    amount: bigint;
    protocol: Address;
    timestamp: bigint;
}

export interface ProofMessage {
    txId: string;
    proofType: 'KYC' | 'AML' | 'YIELD';
    timestamp: bigint;
}
