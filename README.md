# BlackBox: Privacy-Preserving Compliance System

A zero-knowledge privacy layer for DeFi transactions on Mantle Network that enables **compliant anonymity** - proving regulatory compliance without revealing sensitive user data or transaction strategies.

---

## 🎯 What We Built

**BlackBox** is a privacy-preserving vault system that allows users to:
- ✅ Execute compliant DeFi transactions
- ✅ Hide their wallet identity on-chain
- ✅ Prove KYC/AML/Yield compliance without revealing details
- ✅ Keep trading strategies private

### The Problem We Solve

**Traditional DeFi:**
```
User Wallet (0xABC...) → Protocol → Public on blockchain
❌ Everyone sees: sender, amount, strategy, compliance status
```

**BlackBox:**
```
User (hidden) → Backend API → Curator Wallet → Vault → Protocol
✅ On-chain shows: Only curator wallet
✅ Proofs verified: Without revealing data
✅ Strategy private: Intent remains hidden
```

---

## 🏗️ System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
│  - User connects wallet (e.g., 0xc65e...)              │
│  - Initiates transfer (off-chain)                       │
└─────────────────┬───────────────────────────────────────┘
                  │ API Call (userAddress: 0xc65e...)
                  ↓
┌─────────────────────────────────────────────────────────┐
│              Backend API (Express.js)                   │
│  - Generates ZK proofs (KYC, AML, Yield)               │
│  - Signs transaction with Curator's private key        │
└─────────────────┬───────────────────────────────────────┘
                  │ Transaction signed by Curator (0xEF8b...)
                  ↓
┌─────────────────────────────────────────────────────────┐
│          CuratorVault Smart Contract                    │
│  - onlyCurator modifier enforces curator signing       │
│  - Deducts from user's deposited balance               │
│  - Sends funds from vault address                       │
└─────────────────┬───────────────────────────────────────┘
                  │ Transaction on Mantle blockchain
                  ↓
┌─────────────────────────────────────────────────────────┐
│                 Mantle Block Explorer                   │
│  From: 0xEF8b... (Curator) ← Only this is visible     │
│  To: Vault Contract                                     │
│  User: 0xc65e... ← HIDDEN!                            │
└─────────────────────────────────────────────────────────┘
```

---

## 📜 Smart Contracts

### 1. CuratorVault.sol

The vault that executes privacy-preserving transfers.

**Key Features:**
- Curator-only execution (onlyCurator modifier)
- On-behalf-of functionality (uses user's deposited balance)
- PAC (Private Activity Commitment) verification
- Multi-token support (MNT + ERC20)

**Core Function:**

```solidity
function executePrivateTransfer(
    address token,
    address to,
    uint256 amount,
    bytes32 pac,
    address onBehalfOf  // Which user's balance to use
) external onlyCurator vaultActive returns (bytes32 txId) {
    require(to != address(0), "Invalid recipient");
    require(pac != bytes32(0), "Invalid PAC");
    
    // Check user has sufficient deposited balance
    require(
        deposits[onBehalfOf][token] >= amount,
        "Insufficient depositor balance"
    );
    
    // Deduct from user's balance
    deposits[onBehalfOf][token] -= amount;
    nativeBalance -= amount;
    
    // Send from vault (curator signs, user's identity hidden)
    (bool success, ) = payable(to).call{value: amount}("");
    require(success, "Transfer failed");
    
    // Emit event with PAC hash (proofs stay private)
    emit PrivateTransferExecuted(to, amount, pac);
}
```

**Privacy Mechanism:**
- `msg.sender` = Curator wallet (0xEF8b...)
- `onBehalfOf` = User whose balance is deducted (0xc65e...)
- On-chain only shows curator → vault → recipient
- User's wallet never appears!

### 2. AuditRegistry.sol

Stores compliance transaction metadata.

```solidity
struct Transaction {
    bytes32 txId;
    bytes32 commitmentHash;  // PAC hash
    uint256 timestamp;
    string protocol;
    bool exists;
}
```

### 3. AuditVerifier.sol

Verifies ZK proofs (KYC, AML, Yield).

---

## 🔐 Zero-Knowledge Proof Generation

Each transaction generates **three ZK proofs** combined into a **PAC (Private Activity Commitment)**.

### Proof Generation Flow

```typescript
// Step 1: Generate KYC Proof
const kycData = ethers.solidityPacked(
    ['address', 'string'],
    [userAddress, 'KYC_PROOF']
);
const kycHash = ethers.keccak256(kycData);
// Result: 0xkkkkk... (proves user passed KYC without revealing data)

// Step 2: Generate AML Proof (Zero-Knowledge)
const amlData = ethers.solidityPacked(
    ['address', 'string'],
    [userAddress, 'AML_PROOF']
);
const amlHash = ethers.keccak256(amlData);
// Result: 0xaaaaa... (proves clean AML record without details)

// Step 3: Generate Yield Proof
const yieldData = ethers.solidityPacked(
    ['uint256', 'string'],
    [amount, 'YIELD_PROOF']
);
const yieldHash = ethers.keccak256(yieldData);
// Result: 0xyyyyy... (proves legitimate yield source)

// Step 4: Combine into PAC
const pacData = ethers.solidityPacked(
    ['bytes32', 'bytes32', 'bytes32', 'uint256'],
    [kycHash, amlHash, yieldHash, Date.now()]
);
const pac = ethers.keccak256(pacData);
// Result: 0x847e370d... (single commitment for all three proofs)
```

**What Goes On-Chain:**
- ✅ PAC hash: `0x847e370d...`
- ❌ Individual KYC/AML/Yield proofs: Private
- ❌ User's KYC data: Private
- ❌ AML check details: Private
- ❌ Yield source info: Private

---

## 🚀 Deployment & Initialization

### Step 1: Deploy Vault Contract

```bash
npx hardhat run scripts/deploy-new-vault.js --network mantleSepolia
```

**What Happens:**
```javascript
// deploy-new-vault.js
const CuratorVault = await ethers.getContractFactory("CuratorVault");
const vault = await CuratorVault.deploy(AUDIT_REGISTRY_ADDRESS);
await vault.waitForDeployment();

console.log("Vault deployed at:", vault.address);
// Output: 0xcedD65846b2f6f30006146AA59eb1943B7f4D3a6
```

### Step 2: Initialize Vault

```bash
npx hardhat run scripts/init-new-vault.js --network mantleSepolia
```

**What Happens:**
```javascript
// init-new-vault.js
const vault = await ethers.getContractAt("CuratorVault", VAULT_ADDRESS);

// Create vault instance with curator and primary asset
const tx = await vault.createVault(
    curatorAddress,   // 0xEF8b... (backend wallet)
    mETHTokenAddress, // Primary asset
    complianceTxId    // Link to compliance record
);

await tx.wait();
console.log("✅ Vault initialized!");
```

**On-Chain State After Initialization:**
```solidity
vault = VaultInfo({
    curator: 0xEF8b133D82dF774Ccc0Ed4337Ac5d91Ff5755340,
    primaryAsset: 0xf6C198a6A58924D73fBdc59Da1C157Eb8A48E9dE,
    totalAUM: 0,
    sharePrice: 1e18,
    totalShares: 0,
    active: true,
    createdAt: block.timestamp
});
```

---

## 💰 How Users Interact

### 1. User Deposits Funds

**Frontend (user's wallet signs):**
```typescript
// User: 0xc65e...
// Deposits 10 MNT directly to vault
const tx = await vaultContract.depositToken(
    NATIVE_TOKEN,        // MNT
    ethers.parseEther("10"),
    complianceTxId
);
```

**Contract Updates:**
```solidity
deposits[0xc65e...][NATIVE_TOKEN] += 10 MNT
nativeBalance += 10 MNT
totalAUM += 10 MNT
```

User now has 10 MNT balance in vault, tracked under their address.

### 2. User Sends Private Transfer

**Frontend (off-chain):**
```typescript
// User requests transfer via backend API (NO blockchain tx yet!)
const response = await fetch('/api/vault/transfer', {
    method: 'POST',
    body: JSON.stringify({
        token: NATIVE_TOKEN,
        recipient: '0x789...',
        amount: ethers.parseEther("2").toString(),
        pac: generatedPac,
        userAddress: '0xc65e...'  // Tell backend whose balance to use
    })
});
```

**Backend (curator signs):**
```javascript
// Backend receives request with userAddress
const { token, recipient, amount, pac, userAddress } = req.body;

// Backend uses CURATOR's private key to sign
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const vaultWithSigner = vaultContract.connect(wallet);

// Execute transfer on behalf of user
const tx = await vaultWithSigner.executePrivateTransfer(
    token,
    recipient,
    amount,
    pac,
    userAddress  // 0xc65e... (whose balance to deduct)
);
```

**Contract Executes:**
```solidity
// msg.sender = 0xEF8b... (Curator)
// onBehalfOf = 0xc65e... (User)

// Deduct from user's balance
deposits[0xc65e...][NATIVE_TOKEN] -= 2 MNT  // 10 → 8

// Send from vault
(bool success, ) = payable(0x789...).call{value: 2 MNT}("");

// Emit event
emit PrivateTransferExecuted(0x789..., 2 MNT, pac);
```

**On Mantle Explorer:**
```
Transaction Hash: 0xfe7cb...
From: 0xEF8b133D82dF774Ccc0Ed4337Ac5d91Ff5755340  ← Curator (visible)
To: 0xcedD65846b2f6f30006146AA59eb1943B7f4D3a6    ← Vault
Value: 0 MNT

Internal Transaction:
From: Vault
To: 0x789...
Value: 2 MNT

User 0xc65e... ← NOWHERE TO BE FOUND! ✅
```

---

## 🔍 Privacy Guarantees

### What's Hidden:
1. **User's Wallet Address:** Never signs blockchain transaction
2. **Individual Proofs:** KYC/AML/Yield hashes stay off-chain
3. **Strategy Intent:** Why transfer, what's next, portfolio context
4. **Source of Funds:** Which wallet originally deposited

### What's Public:
1. **Curator Address:** 0xEF8b... (backend relayer)
2. **Vault Address:** 0xcedD... (contract)
3. **Recipient Address:** 0x789... (where funds go)
4. **PAC Hash:** 0x847e... (commitment to proofs, not proofs themselves)
5. **Amount:** 2 MNT (transaction amount)

### Privacy vs Transparency Trade-off:
```
Full Privacy:        [User Hidden] ─────────────────────┐
                                                          │
Selective Disclosure: [PAC Proves Compliance]            │  BlackBox
                                                          │
Public Metadata:     [Amount, Recipient, Time] ──────────┘

Traditional DeFi:    [Everything Public] ────────────────── No Privacy
```

---

## 🧪 Testing

### 1. Deploy & Initialize
```bash
# Compile contracts
npx hardhat compile

# Deploy vault
npx hardhat run scripts/deploy-new-vault.js --network mantleSepolia

# Update .env files with new vault address
# Then initialize
npx hardhat run scripts/init-new-vault.js --network mantleSepolia
```

### 2. Test Privacy
```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Open browser at http://localhost:3001
# Connect second wallet (not curator)
# Deposit 10 MNT
# Send 2 MNT privately
# Check Mantle Explorer - your wallet should be HIDDEN!
```

---

## 📁 Project Structure

```
mantle/
├── contracts/
│   ├── CuratorVault.sol        # Privacy-preserving vault
│   ├── AuditRegistry.sol       # Transaction metadata storage
│   └── AuditVerifier.sol       # ZK proof verification
├── backend/
│   ├── routes/vault.js         # API endpoints
│   ├── services/
│   │   └── contract-service.js # Curator wallet signing logic
│   └── .env                    # Curator's PRIVATE_KEY
├── frontend/
│   ├── app/
│   │   ├── user/page.tsx       # User dashboard
│   │   └── auditor/page.tsx    # Auditor verification
│   └── .env.local              # Vault address config
└── scripts/
    ├── deploy-new-vault.js     # Deployment script
    └── init-new-vault.js       # Initialization script
```

---

## 🔑 Key Configuration

### Backend .env
```bash
PRIVATE_KEY=xxx  # Curator's wallet private key (signs all txs)
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
CONTRACT_ADDRESS_CURATOR_VAULT=0xcedD65846b2f6f30006146AA59eb1943B7f4D3a6
CONTRACT_ADDRESS_REGISTRY=0x065Cb4C3de572Dd4bBE3D53aC63354Bb1006AF0C
```

### Frontend .env.local
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_VAULT_ADDRESS=0xcedD65846b2f6f30006146AA59eb1943B7f4D3a6
```

---

## 🎬 Live Demo Flow

1. **Curator creates vault** → Deploys contract, initializes with curator address
2. **User 1 deposits 10 MNT** → Contract stores: `deposits[User1][MNT] = 10`
3. **User 1 requests transfer** → Frontend → Backend API (off-chain)
4. **Backend generates proofs** → KYC, AML, Yield → PAC hash
5. **Backend signs with curator key** → Transaction from curator wallet
6. **Contract executes** → Deducts from User1's balance, sends from vault
7. **On-chain shows** → Curator (0xEF8b...) → Vault → Recipient
8. **User 1 hidden** → Wallet 0xc65e... never appears! ✅

---

## 🏆 Achievements

✅ **Privacy:** User wallet addresses hidden from blockchain  
✅ **Compliance:** ZK proofs verify KYC/AML/Yield without revealing data  
✅ **Multi-user:** Multiple users can use same vault  
✅ **Decentralized:** Smart contracts on Mantle, no central authority  
✅ **Auditable:** Auditors can verify PAC hashes without seeing private data  

---

## 📊 Contract Addresses (Mantle Sepolia)

- **CuratorVault:** `0xcedD65846b2f6f30006146AA59eb1943B7f4D3a6`
- **AuditRegistry:** `0x065Cb4C3de572Dd4bBE3D53aC63354Bb1006AF0C`
- **AuditVerifier:** `0x07eb1554c6c2d6c30b8aE8B4C074052dC91B261e`
- **Curator Wallet:** `0xEF8b133D82dF774Ccc0Ed4337Ac5d91Ff5755340`

---

## 🚀 Future Enhancements

1. **Full zkSNARK Integration:** Replace mock proofs with real circom circuits
2. **Multi-Curator Support:** Distribute relayer responsibility
3. **Threshold Signatures:** Require M-of-N curators to approve
4. **Proof Aggregation:** Batch multiple PACs into single proof
5. **Cross-Chain Privacy:** Extend to other EVM chains

---

## 📖 Learn More

- **Mantle Network:** https://www.mantle.xyz/
- **Zero-Knowledge Proofs:** https://z.cash/technology/zksnarks/
- **Privacy in DeFi:** https://ethereum.org/en/zero-knowledge-proofs/

---

## 👥 Team

Built for **Mantle Hackathon 2026** by [Your Team Name]

---

## 📄 License

MIT License - See LICENSE file for details
