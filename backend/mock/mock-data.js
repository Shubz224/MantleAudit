/**
 * Mock Data for BlackBox Demo
 * Includes KYC credentials, sanctioned addresses, and sample transactions
 */

// Mock KYC credentials (for demo purposes)
const kycCredentials = {
    'user1': {
        userSecret: '0x1234567890abcdef',
        kycCredentialHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        isValid: true
    },
    'user2': {
        userSecret: '0xfedcba0987654321',
        kycCredentialHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        isValid: true
    },
    'sanctioned_user': {
        userSecret: '0xbadactor12345678',
        kycCredentialHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        isValid: false
    }
};

// Sanctioned addresses (for AML failure demo)
const sanctionedAddresses = [
    '0x1234567890123456789012345678901234567890', // Mock sanctioned address
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // Another sanctioned address
];

// Mock blacklist Merkle root
const blacklistMerkleRoot = '0x9876543210987654321098765432109876543210987654321098765432109876';

// Sample transactions for demo
const sampleTransactions = [
    {
        txId: '0x' + 'a'.repeat(64),
        user: 'user1',
        protocol: '0x' + '1'.repeat(40),
        amount: 1000,
        timestamp: Date.now() - 3600000,
        description: 'Tokenized bond yield distribution'
    },
    {
        txId: '0x' + 'b'.repeat(64),
        user: 'user2',
        protocol: '0x' + '2'.repeat(40),
        amount: 5000,
        timestamp: Date.now() - 7200000,
        description: 'Tokenized bond yield distribution'
    },
    {
        txId: '0x' + 'c'.repeat(64),
        user: 'sanctioned_user',
        protocol: '0x' + '3'.repeat(40),
        amount: 2000,
        timestamp: Date.now() - 1800000,
        description: 'Tokenized bond yield distribution (WILL FAIL AML)'
    }
];

// Yield thresholds for compliance
const yieldThresholds = {
    minimum: 100,
    standard: 500,
    institutional: 1000
};

module.exports = {
    kycCredentials,
    sanctionedAddresses,
    blacklistMerkleRoot,
    sampleTransactions,
    yieldThresholds
};
