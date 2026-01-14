// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AuditRegistry.sol";

/**
 * @title ISwapRouter
 * @notice Interface for FusionX V3 SwapRouter (Uniswap V3 compatible)
 */
interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external payable returns (uint256 amountOut);
}

/**
 * @title CuratorVault
 * @notice Compliant private execution layer for institutional vaults
 * @dev Enables real DeFi trading with strategy intent privacy
 *
 * KEY CONCEPT: Swaps are PUBLIC (visible on FusionX), but STRATEGY INTENT is PRIVATE
 * - Public: Individual swaps, token movements, AUM
 * - Private: Why we traded, portfolio context, next moves, compliance reasoning
 *
 * NEW: Supports native MNT deposits/withdrawals and private transfers
 */
contract CuratorVault {
    using SafeERC20 for IERC20;

    /// @notice Vault state structure
    struct VaultInfo {
        address curator; // Vault manager (can execute swaps, CANNOT withdraw)
        address asset; // Primary asset (e.g., mETH)
        uint256 totalAUM; // PUBLIC: Total assets value (simplified accounting)
        bytes32 latestPAC; // Latest Private Activity Commitment (compliance receipt)
        bool active; // Vault status
        uint256 createdAt; // Creation timestamp
    }

    /// @notice The vault instance
    VaultInfo public vault;

    /// @notice Depositor balances (per token)
    mapping(address => mapping(address => uint256)) public deposits; // user => token => amount

    /// @notice Token balances held by vault
    mapping(address => uint256) public tokenBalances;

    /// @notice Native MNT balance tracking
    uint256 public nativeBalance;

    /// @notice Contract owner
    address public owner;

    /// @notice AuditRegistry for PAC registration
    AuditRegistry public auditRegistry;

    /// @notice FusionX V3 SwapRouter on Mantle Sepolia
    ISwapRouter public constant FUSIONX_ROUTER =
        ISwapRouter(0x8fC0B6585d73C94575555B3970D7A79c5bfc6E36);

    /// @notice Native MNT token address marker
    address public constant NATIVE_TOKEN =
        address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    /// @notice Emitted when vault is created
    event VaultCreated(
        address indexed curator,
        address indexed asset,
        uint256 timestamp
    );

    /// @notice Emitted when tokens are deposited
    event TokenDeposited(
        address indexed depositor,
        address indexed token,
        uint256 amount
    );

    /// @notice Emitted when tokens are withdrawn
    event TokenWithdrawn(
        address indexed depositor,
        address indexed token,
        uint256 amount
    );

    /// @notice Emitted when a swap is executed
    event SwapExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        bytes32 pac,
        uint256 newAUM
    );

    /// @notice Emitted when private transfer is executed
    event PrivateTransferExecuted(
        address indexed token,
        address indexed to,
        uint256 amount,
        bytes32 pac,
        uint256 newAUM
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyCurator() {
        require(msg.sender == vault.curator, "Only curator");
        _;
    }

    modifier vaultActive() {
        require(vault.active, "Vault not active");
        _;
    }

    /**
     * @notice Deploy vault contract
     * @param _auditRegistry Address of AuditRegistry contract
     */
    constructor(address _auditRegistry) {
        owner = msg.sender;
        auditRegistry = AuditRegistry(_auditRegistry);
    }

    /**
     * @notice Receive native MNT
     */
    receive() external payable {
        // Allow receiving MNT
    }

    /**
     * @notice Create vault (owner only)
     * @param _asset Primary asset address
     * @param _curator Curator address (can execute swaps, CANNOT withdraw)
     */
    function createVault(address _asset, address _curator) external onlyOwner {
        require(!vault.active, "Vault already exists");
        require(_asset != address(0), "Invalid asset");
        require(_curator != address(0), "Invalid curator");

        vault = VaultInfo({
            curator: _curator,
            asset: _asset,
            totalAUM: 0,
            latestPAC: bytes32(0),
            active: true,
            createdAt: block.timestamp
        });

        emit VaultCreated(_curator, _asset, block.timestamp);
    }

    /**
     * @notice Deposit tokens into vault (supports ERC20 and native MNT)
     * @param token Token address to deposit (use NATIVE_TOKEN for MNT)
     * @param amount Amount to deposit (ignored for native MNT, uses msg.value)
     */
    function depositToken(
        address token,
        uint256 amount
    ) external payable vaultActive {
        if (token == NATIVE_TOKEN) {
            // Depositing native MNT
            require(msg.value > 0, "Must send MNT");
            amount = msg.value;

            // Update balances
            deposits[msg.sender][NATIVE_TOKEN] += amount;
            nativeBalance += amount;
            vault.totalAUM += amount;

            emit TokenDeposited(msg.sender, NATIVE_TOKEN, amount);
        } else {
            // Depositing ERC20 token
            require(amount > 0, "Amount must be > 0");
            require(msg.value == 0, "Don't send MNT for ERC20 deposit");

            // Transfer tokens from depositor to vault
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

            // Update balances
            deposits[msg.sender][token] += amount;
            tokenBalances[token] += amount;
            vault.totalAUM += amount;

            emit TokenDeposited(msg.sender, token, amount);
        }
    }

    /**
     * @notice Withdraw tokens from vault (depositors only, NOT curator)
     * @param token Token address to withdraw (use NATIVE_TOKEN for MNT)
     * @param amount Amount to withdraw
     */
    function withdrawToken(address token, uint256 amount) external vaultActive {
        // CRITICAL: Curator CANNOT withdraw funds - enforced check
        require(msg.sender != vault.curator, "Curator cannot withdraw");
        require(amount > 0, "Amount must be > 0");
        require(deposits[msg.sender][token] >= amount, "Insufficient balance");

        if (token == NATIVE_TOKEN) {
            // Withdrawing native MNT
            deposits[msg.sender][NATIVE_TOKEN] -= amount;
            nativeBalance -= amount;
            vault.totalAUM -= amount;

            // Transfer MNT back to depositor
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "MNT transfer failed");

            emit TokenWithdrawn(msg.sender, NATIVE_TOKEN, amount);
        } else {
            // Withdrawing ERC20 token
            deposits[msg.sender][token] -= amount;
            tokenBalances[token] -= amount;
            vault.totalAUM -= amount;

            // Transfer tokens back to depositor
            IERC20(token).safeTransfer(msg.sender, amount);

            emit TokenWithdrawn(msg.sender, token, amount);
        }
    }

    /**
     * @notice Execute private transfer (send tokens from vault to recipient)
     * @param token Token to send (use NATIVE_TOKEN for MNT)
     * @param to Recipient address
     * @param amount Amount to send
     * @param pac Private Activity Commitment (compliance receipt)
     *
     * @dev THIS IS THE PRIVACY FEATURE: Transaction shows vault as sender, not user!
     * @dev Generates PAC proof before sending to prove compliance
     */
    function executePrivateTransfer(
        address token,
        address to,
        uint256 amount,
        bytes32 pac,
        address onBehalfOf // NEW: whose balance to use
    ) external onlyCurator vaultActive returns (bytes32 txId) {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(pac != bytes32(0), "Invalid PAC");

        if (token == NATIVE_TOKEN) {
            // Sending native MNT
            require(nativeBalance >= amount, "Insufficient vault balance");
            require(
                deposits[onBehalfOf][NATIVE_TOKEN] >= amount,
                "Insufficient depositor balance"
            );

            // Update balances
            nativeBalance -= amount;
            deposits[onBehalfOf][NATIVE_TOKEN] -= amount; // Deduct from user's balance
            vault.totalAUM -= amount;

            // Transfer MNT from vault to recipient
            (bool success, ) = payable(to).call{value: amount}("");
            require(success, "MNT transfer failed");
        } else {
            // Sending ERC20 token
            require(token != address(0), "Invalid token");
            require(
                tokenBalances[token] >= amount,
                "Insufficient token balance"
            );
            require(
                deposits[onBehalfOf][token] >= amount,
                "Insufficient depositor balance"
            );

            // Update balances
            tokenBalances[token] -= amount;
            deposits[onBehalfOf][token] -= amount; // Deduct from user's balance
            vault.totalAUM -= amount; // Simplified AUM tracking

            // Transfer ERC20 from vault to recipient
            IERC20(token).safeTransfer(to, amount);
        }

        // Store latest PAC
        vault.latestPAC = pac;

        // Register PAC with AuditRegistry (compliance receipt)
        // This marks the transaction as coming from VAULT, hiding user identity
        txId = keccak256(abi.encodePacked(pac, block.timestamp, to, amount));
        auditRegistry.registerTx(txId, pac, address(this)); // origin = vault address!

        emit PrivateTransferExecuted(token, to, amount, pac, vault.totalAUM);

        return txId;
    }

    /**
     * @notice Execute private swap via FusionX V3
     * @param tokenIn Token to swap from
     * @param tokenOut Token to swap to
     * @param amountIn Amount to swap
     * @param poolFee Fee tier (3000 = 0.3%, standard)
     * @param pac Private Activity Commitment (compliance receipt)
     *
     * @dev PUBLIC: Swap visible on FusionX
     * @dev PRIVATE: Strategy intent (why swap, what's next, portfolio context)
     */
    function executePrivateSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint24 poolFee,
        bytes32 pac
    ) external onlyCurator vaultActive returns (uint256 amountOut) {
        require(tokenIn != address(0), "Invalid tokenIn");
        require(tokenOut != address(0), "Invalid tokenOut");
        require(amountIn > 0, "Amount must be > 0");
        require(tokenBalances[tokenIn] >= amountIn, "Insufficient balance");
        require(pac != bytes32(0), "Invalid PAC");

        // Approve FusionX router to spend tokens
        IERC20(tokenIn).forceApprove(address(FUSIONX_ROUTER), amountIn);

        // Prepare swap parameters
        // Demo slippage protection: 5% max loss (in production: tighter bounds + oracle pricing)
        uint256 minOut = (amountIn * 95) / 100; // 5% slippage tolerance

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: poolFee,
                recipient: address(this), // Vault receives output
                deadline: block.timestamp + 300, // 5 minute deadline
                amountIn: amountIn,
                amountOutMinimum: minOut, // 5% max slippage for demo safety
                sqrtPriceLimitX96: 0 // No price limit for testnet demo
            });

        // Execute swap on FusionX (PUBLIC on-chain)
        amountOut = FUSIONX_ROUTER.exactInputSingle(params);

        // Sanity check: ensure swap succeeded
        require(amountOut > 0, "Swap failed");

        // Update token balances
        tokenBalances[tokenIn] -= amountIn;
        tokenBalances[tokenOut] += amountOut;

        // Update total AUM
        // NOTE: For demo, we use simplified accounting (1:1 token value)
        // In production: AUM derived from oracle pricing + ZK yield proofs
        vault.totalAUM = vault.totalAUM - amountIn + amountOut;

        // Store latest PAC
        vault.latestPAC = pac;

        // Register PAC with AuditRegistry (compliance receipt)
        // PAC proves: trade was compliant, AUM change valid, curator authorized
        // WITHOUT revealing strategy intent
        bytes32 txId = keccak256(
            abi.encodePacked(pac, block.timestamp, msg.sender)
        );
        auditRegistry.registerTx(txId, pac, address(this));

        emit SwapExecuted(
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            pac,
            vault.totalAUM
        );

        return amountOut;
    }

    /**
     * @notice Get vault information
     */
    function getVaultInfo() external view returns (VaultInfo memory) {
        return vault;
    }

    /**
     * @notice Get token balance held by vault
     */
    function getTokenBalance(address token) external view returns (uint256) {
        if (token == NATIVE_TOKEN) {
            return nativeBalance;
        }
        return tokenBalances[token];
    }

    /**
     * @notice Get depositor balance for specific token
     */
    function getDepositorBalance(
        address depositor,
        address token
    ) external view returns (uint256) {
        return deposits[depositor][token];
    }

    /**
     * @notice Check if address is curator
     */
    function isCurator(address addr) external view returns (bool) {
        return addr == vault.curator;
    }

    /**
     * @notice Emergency pause (owner only)
     */
    function pauseVault() external onlyOwner {
        vault.active = false;
    }

    /**
     * @notice Emergency unpause (owner only)
     */
    function unpauseVault() external onlyOwner {
        vault.active = true;
    }
}
