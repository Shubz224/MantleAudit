# MantleAudit: Privacy-Preserving Compliance on Mantle Network

**MantleAudit** is a decentralized application (dApp) built on the **Mantle Network** that combines **secure vault management** with **privacy-preserving compliance** for DeFi. It features a **Curator Vault** system where users can manage mETH (Mantle ETH) assets with transaction-level privacy, while leveraging **Zero-Knowledge Proofs (ZKPs)** to prove compliance (AML, KYC, Yield) without revealing sensitive transaction data.

## 🚀 Introduction

In traditional finance, compliance is mandatory but often invasive. In DeFi, privacy is preferred but often lacks compliance tools for institutional adoption. Additionally, institutional investors and curators need secure vault systems to manage assets while maintaining privacy around their trading strategies.

**MantleAudit bridges this gap with two core components:**

### 🏦 Secure Curator Vault
A smart contract-based vault system that allows curators to:
- **Manage mETH assets** with full transparency on total AUM (Assets Under Management)
- **Execute private transactions** where individual trade details remain hidden
- **Record Private Activity Commitments (PACs)** - only commitment hashes are stored on-chain
- **Maintain security** - curators have NO withdrawal rights (enforced by smart contract)
- **Protect trading strategies** - position sizes, entry/exit points, and individual trades are never exposed

### 🔐 Privacy-Preserving Compliance
By performing compliance checks (like AML verification) via ZK proofs, we verify that a transaction is legal **on-chain** without ever exposing the sender, receiver, or amount publicly. This "Privacy by Default" approach protects user data while satisfying regulatory requirements.

**The Result**: Institutional-grade asset management with privacy protection AND regulatory compliance.

## ✨ Key Features

### Vault Management
*   **Secure Curator Vault**: Smart contract-enforced vault where curators manage mETH assets
*   **Non-Custodial Security**: Curators have NO withdrawal rights - only depositors can withdraw
*   **Transparent AUM**: Total vault assets are publicly visible for investor confidence
*   **Private Transactions**: Individual trade details, amounts, and strategies remain hidden
*   **Real Blockchain Integration**: All transactions are real on-chain operations with MetaMask signing

### Privacy & Compliance
*   **Privacy by Default (PACs)**: All trades generate a "Private Activity Commitment" (PAC). Only the commitment hash is stored on-chain, keeping trade details hidden.
*   **Hybrid Verification System**:
    *   **On-Chain (AML)**: Real-time Groth16 proof verification on Mantle Sepolia for critical checks.
    *   **Off-Chain (KYC/Yield)**: Efficient off-chain verification with on-chain signed attestations to save gas.
*   **Real-Time Proofs**: Genuine circuit generation and verification running in the browser and backend.

### Mantle Integration
*   **Low Fees**: Transaction costs are negligible (~$0.03/audit) thanks to Mantle's L2 architecture.
*   **EigenDA**: Leveraging EigenDA for cost-effective data availability.
*   **mETH Support**: Native integration with Mantle's liquid staking token.

## 🛠️ How It Works

### Vault Operations Flow
1.  **Vault Setup**: Curator initializes a vault on Mantle Sepolia via smart contract deployment
2.  **Asset Management**: Users can deposit mETH into the vault (visible in total AUM)
3.  **Private Trading**: Curator executes trades and records Private Activity Commitments (PACs)
4.  **On-Chain Recording**: Only the PAC hash is submitted to the **CuratorVault** smart contract - trade details remain private
5.  **Security Guarantee**: Smart contract enforces that curator cannot withdraw funds

### Compliance Verification Flow
1.  **Transaction Submission**: A user submits a private transaction via the Frontend
2.  **Privacy Layer**: The system generates a Private Activity Commitment (PAC) comprising the transaction details
3.  **Blockchain Storage**: The PAC hash is stored in the **AuditRegistry** smart contract on Mantle Sepolia
4.  **Auditor Review**: An auditor (or regulator) views the transaction list. They cannot see amounts or participants, only metadata
5.  **ZK Verification**: The auditor runs "Verify AML", which generates a ZK proof proving the sender is not on a sanctions list. This proof is verified fast and cheap on-chain
6.  **Compliance Confirmation**: The audit result is recorded on-chain with an immutable trail on Mantle Explorer

## 💻 Tech Stack

*   **Blockchain**: Mantle v2 Skadi (Mantle Sepolia Testnet)
*   **Smart Contracts**: Solidity
*   **ZK Proofs**: Circom, SnarkJS, Groth16
*   **Frontend**: Next.js, React, Tailwind CSS
*   **Backend**: Node.js, Express
*   **Wallet**: MetaMask

## 🏁 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or pnpm
*   MetaMask installed in browser

### Installation

1.  Clone the repository:
    ```bash
    git clone <your-repo-url>
    cd MantleAudit
    ```

2.  Install dependencies for both backend and frontend:
    ```bash
    cd backend && npm install
    cd ../frontend && npm install
    ```

### Running the Project

You need two terminal windows running simultaneously.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Access the application at `http://localhost:3001`.

### ⚡ Quick Demo Flow

1.  **Initialize Vault** (One time only):
    ```bash
    cd backend && npm run vault:create
    ```
2.  **Connect Wallet**: Open the app and connect MetaMask to **Mantle Sepolia**.
3.  **Get Tokens**: Click **"💧 Get Test mETH"** to mint test tokens.
4.  **Record Privacy**: Click **"🔒 Record PAC"** to submit a private transaction.
    *   *Watch the backend terminal logs for real-time proof generation!*
    *   *Check the link to Mantle Explorer to see the on-chain record.*
5.  **Audit**: Navigate to the **Auditor Dashboard** (`/auditor`) to verify the proofs.

## 🔗 Smart Contract Addresses (Mantle Sepolia)

| Contract | Address |
| :--- | :--- |
| **AuditRegistry** | `0xFA205eCd3de21facf67c4f8e87DB3e4bc7612DDA` |
| **MockMETH** | `0xaA0a9cEa004b9bB9Fb60c882d267956DEC9c6e03` |
| **CuratorVault** | `0x8e552DC456E7C1BA7E85761a335463136E45238E` |