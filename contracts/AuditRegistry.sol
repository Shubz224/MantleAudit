// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title AuditRegistry
 * @notice Stores cryptographic commitments of private transactions without revealing details
 * @dev Privacy-preserving transaction registry for BlackBox system
 */
contract AuditRegistry {
    /// @notice Structure representing a private transaction commitment
    struct PrivateTx {
        bytes32 txId;              // Unique transaction identifier
        bytes32 commitmentHash;    // Hash of (amount, user, nonce) - privacy preserved
        uint256 timestamp;         // Block timestamp of registration
        address protocol;          // Protocol/dApp where transaction occurred
        bool exists;               // Flag to check if transaction exists
    }

    /// @notice Mapping from transaction ID to private transaction data
    mapping(bytes32 => PrivateTx) public transactions;

    /// @notice Array of all transaction IDs for enumeration
    bytes32[] public transactionIds;

    /// @notice Emitted when a new private transaction is registered
    event TransactionRegistered(
        bytes32 indexed txId,
        bytes32 commitmentHash,
        address indexed protocol,
        uint256 timestamp
    );

    /**
     * @notice Register a new private transaction commitment
     * @param txId Unique identifier for the transaction
     * @param commitmentHash Cryptographic commitment hash(amount, user, nonce)
     * @param protocol Address of the protocol where transaction occurred
     */
    function registerTx(
        bytes32 txId,
        bytes32 commitmentHash,
        address protocol
    ) external {
        require(txId != bytes32(0), "Invalid transaction ID");
        require(commitmentHash != bytes32(0), "Invalid commitment hash");
        require(!transactions[txId].exists, "Transaction already registered");

        transactions[txId] = PrivateTx({
            txId: txId,
            commitmentHash: commitmentHash,
            timestamp: block.timestamp,
            protocol: protocol,
            exists: true
        });

        transactionIds.push(txId);

        emit TransactionRegistered(txId, commitmentHash, protocol, block.timestamp);
    }

    /**
     * @notice Get transaction details by ID
     * @param txId Transaction identifier
     * @return Transaction data
     */
    function getTransaction(bytes32 txId) external view returns (PrivateTx memory) {
        require(transactions[txId].exists, "Transaction does not exist");
        return transactions[txId];
    }

    /**
     * @notice Get total number of registered transactions
     * @return Total count
     */
    function getTransactionCount() external view returns (uint256) {
        return transactionIds.length;
    }

    /**
     * @notice Get transaction ID by index
     * @param index Index in the array
     * @return Transaction ID
     */
    function getTransactionIdByIndex(uint256 index) external view returns (bytes32) {
        require(index < transactionIds.length, "Index out of bounds");
        return transactionIds[index];
    }
}
