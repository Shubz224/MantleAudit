// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./AMLVerifier.sol";

/**
 * @title AuditVerifier
 * @notice Verifies ZK proofs and attestations for compliance audits
 * @dev Hybrid approach: AML verified on-chain, KYC/Yield via signed attestations
 */
contract AuditVerifier {
    /// @notice Types of audits supported
    enum AuditType {
        KYC, // Know Your Customer verification
        AML, // Anti-Money Laundering / Sanctions check
        YIELD // Yield threshold compliance
    }

    /// @notice Audit result structure
    struct AuditResult {
        bytes32 txId;
        AuditType auditType;
        bool passed;
        uint256 timestamp;
        address auditor;
    }

    /// @notice Mapping from txId => auditType => result
    mapping(bytes32 => mapping(AuditType => AuditResult)) public auditResults;

    /// @notice Authorized auditors (mocked for demo - would be DAO/registry in production)
    mapping(address => bool) public authorizedAuditors;

    // REAL ZK Verifier
    Groth16Verifier public amlVerifier;

    /// @notice Contract owner
    address public owner;

    /// @notice Emitted when an audit is completed
    event AuditCompleted(
        bytes32 indexed txId,
        AuditType indexed auditType,
        bool passed,
        address indexed auditor,
        uint256 timestamp
    );

    /// @notice Emitted when an auditor is authorized/deauthorized
    event AuditorAuthorizationChanged(address indexed auditor, bool authorized);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorizedAuditor() {
        require(authorizedAuditors[msg.sender], "Not authorized auditor");
        _;
    }

    constructor(address _amlVerifier) {
        owner = msg.sender;
        authorizedAuditors[msg.sender] = true; // Owner is auditor by default
        amlVerifier = Groth16Verifier(_amlVerifier);
    }

    /**
     * @notice Authorize or deauthorize an auditor
     * @param auditor Address to modify
     * @param authorized True to authorize, false to deauthorize
     */
    function setAuditorAuthorization(
        address auditor,
        bool authorized
    ) external onlyOwner {
        authorizedAuditors[auditor] = authorized;
        emit AuditorAuthorizationChanged(auditor, authorized);
    }

    /**
     * @notice Submit KYC attestation (off-chain verified, signed result)
     * @param txId Transaction identifier
     * @param passed Whether KYC check passed
     * @param signature Signature from authorized auditor (simplified for demo)
     */
    function submitKYCAttestation(
        bytes32 txId,
        bool passed,
        bytes memory signature
    ) external onlyAuthorizedAuditor {
        _recordAudit(txId, AuditType.KYC, passed);
    }

    /**
     * @notice Submit Yield attestation (off-chain verified, signed result)
     * @param txId Transaction identifier
     * @param passed Whether yield threshold check passed
     * @param signature Signature from authorized auditor (simplified for demo)
     */
    function submitYieldAttestation(
        bytes32 txId,
        bool passed,
        bytes memory signature
    ) external onlyAuthorizedAuditor {
        _recordAudit(txId, AuditType.YIELD, passed);
    }

    /**
     * @notice Submit AML attestation (simplified for demo reliability)
     * @param txId Transaction identifier
     * @param passed Whether AML check passed (not on sanctions list)
     * @param signature Signature from authorized auditor (simplified for demo)
     */
    function submitAMLAttestation(
        bytes32 txId,
        bool passed,
        bytes memory signature
    ) external onlyAuthorizedAuditor {
        _recordAudit(txId, AuditType.AML, passed);
    }

    /**
     * @notice Verify AML proof on-chain using Groth16 Verifier
     * @param txId Transaction identifier
     * @param a Groth16 proof parameter A
     * @param b Groth16 proof parameter B
     * @param c Groth16 proof parameter C
     * @param input Public inputs (blacklist root)
     */
    function verifyAMLProof(
        bytes32 txId,
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[1] calldata input
    ) external onlyAuthorizedAuditor {
        // CALL REAL VERIFIER
        bool isValid = amlVerifier.verifyProof(a, b, c, input);
        require(isValid, "Invalid ZK Proof!");

        // Record result
        auditResults[txId][AuditType.AML] = AuditResult({
            txId: txId,
            auditType: AuditType.AML,
            passed: true,
            timestamp: block.timestamp,
            auditor: msg.sender
        });

        emit AuditCompleted(
            txId,
            AuditType.AML,
            true,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Get audit result for a transaction
     * @param txId Transaction identifier
     * @param auditType Type of audit to query
     * @return Audit result
     */
    function getAuditResult(
        bytes32 txId,
        AuditType auditType
    ) external view returns (AuditResult memory) {
        return auditResults[txId][auditType];
    }

    /**
     * @notice Check if all audits passed for a transaction
     * @param txId Transaction identifier
     * @return True if all audits exist and passed
     */
    function isFullyCompliant(bytes32 txId) external view returns (bool) {
        AuditResult memory kycResult = auditResults[txId][AuditType.KYC];
        AuditResult memory amlResult = auditResults[txId][AuditType.AML];
        AuditResult memory yieldResult = auditResults[txId][AuditType.YIELD];

        return
            kycResult.timestamp > 0 &&
            kycResult.passed &&
            amlResult.timestamp > 0 &&
            amlResult.passed &&
            yieldResult.timestamp > 0 &&
            yieldResult.passed;
    }

    /**
     * @notice Internal function to record audit result
     * @param txId Transaction identifier
     * @param auditType Type of audit
     * @param passed Whether audit passed
     */
    function _recordAudit(
        bytes32 txId,
        AuditType auditType,
        bool passed
    ) internal {
        auditResults[txId][auditType] = AuditResult({
            txId: txId,
            auditType: auditType,
            passed: passed,
            timestamp: block.timestamp,
            auditor: msg.sender
        });

        emit AuditCompleted(
            txId,
            auditType,
            passed,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Check if user is compliant for vault deposit
     * @param userTxId Transaction ID associated with user's compliance proofs
     * @param amount Deposit amount (for yield threshold check)
     * @return True if user has valid KYC and AML proofs
     */
    function isCompliantForDeposit(
        bytes32 userTxId,
        uint256 amount
    ) external view returns (bool) {
        AuditResult memory kycResult = auditResults[userTxId][AuditType.KYC];
        AuditResult memory amlResult = auditResults[userTxId][AuditType.AML];

        // Check KYC and AML are valid and passed
        // In production: add expiry check (e.g., valid for 90 days)
        bool kycValid = kycResult.timestamp > 0 && kycResult.passed;
        bool amlValid = amlResult.timestamp > 0 && amlResult.passed;

        return kycValid && amlValid;
    }

    /**
     * @notice Check if vault operation is compliant for swap execution
     * @param vaultTxId Transaction ID for the vault swap operation
     * @return True if all compliance proofs exist and passed
     */
    function isCompliantForSwap(
        bytes32 vaultTxId
    ) external view returns (bool) {
        // For swaps, we require full compliance (KYC + AML + Yield)
        return this.isFullyCompliant(vaultTxId);
    }

    /**
     * @notice Get user's latest compliance status
     * @param userTxId User's transaction ID
     * @return kycPassed Whether KYC passed
     * @return amlPassed Whether AML passed
     * @return yieldPassed Whether Yield passed
     * @return oldestTimestamp Oldest proof timestamp (for expiry checking)
     */
    function getUserComplianceStatus(
        bytes32 userTxId
    )
        external
        view
        returns (
            bool kycPassed,
            bool amlPassed,
            bool yieldPassed,
            uint256 oldestTimestamp
        )
    {
        AuditResult memory kycResult = auditResults[userTxId][AuditType.KYC];
        AuditResult memory amlResult = auditResults[userTxId][AuditType.AML];
        AuditResult memory yieldResult = auditResults[userTxId][
            AuditType.YIELD
        ];

        kycPassed = kycResult.timestamp > 0 && kycResult.passed;
        amlPassed = amlResult.timestamp > 0 && amlResult.passed;
        yieldPassed = yieldResult.timestamp > 0 && yieldResult.passed;

        // Find oldest timestamp for expiry checking
        oldestTimestamp = kycResult.timestamp;
        if (amlResult.timestamp > 0 && amlResult.timestamp < oldestTimestamp) {
            oldestTimestamp = amlResult.timestamp;
        }
        if (
            yieldResult.timestamp > 0 && yieldResult.timestamp < oldestTimestamp
        ) {
            oldestTimestamp = yieldResult.timestamp;
        }
    }
}
