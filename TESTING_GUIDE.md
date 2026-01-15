# Testing Guide - Mantle Umbra Vaults

## Quick Start (Complete Flow Test)

### Prerequisites
- MetaMask connected to Mantle Sepolia
- Some MNT for gas (you have 3994 MNT ✅)

---

## Step 1: Start the Services

```bash
# Terminal 1 - Backend
cd /home/shubz/mantle/backend
npm run dev

# Terminal 2 - Frontend  
cd /home/shubz/mantle/frontend
npm run dev
```

**Expected output:**
- Backend: `🚀 BlackBox Backend running on port 3000`
- Frontend: `ready - started server on 0.0.0.0:3001`

---

## Step 2: Initialize the Vault (One-Time Setup)

The vault contract is deployed but needs to be created/initialized. We need to do this via a script:

```bash
# Terminal 3 - From project root
cd /home/shubz/mantle
node scripts/create-vault.js
```

**This script needs to be created** - let me create it for you!

---

## Step 3: Get Test mETH Tokens

### Option A: Via Frontend (when implemented)
Navigate to: `http://localhost:3001/vault`
Click "Get Test mETH" button

### Option B: Via API (works now!)
```bash
# Get 1000 mETH for your wallet
curl -X POST http://localhost:3000/api/vault/faucet \
  -H "Content-Type: application/json" \
  -d '{
    "address": "YOUR_WALLET_ADDRESS",
    "amount": "1000000000000000000000"
  }'
```

**Check your balance:**
```bash
curl http://localhost:3000/api/vault/meth-balance/YOUR_WALLET_ADDRESS
```

---

## Step 4: View Vault Dashboard

Open: `http://localhost:3001/vault`

**You should see:**
- 🟢 VAULT: COMPLIANT (big green banner)
- Total AUM: 0 mETH (initially)
- Curator address
- 🛡️ "Curator has NO withdrawal rights" badge
- Private Activity section (empty initially)

---

## Step 5: Deposit mETH (Requires Frontend - Coming Next)

This requires the deposit modal which we'll add. For now, you can interact via MetaMask directly:

1. Open MetaMask
2. Import mETH token: `0xaA0a9cEa004b9bB9Fb60c882d267956DEC9c6e03`
3. Approve CuratorVault to spend mETH
4. Call deposit function

---

## Step 6: Record a Private Activity Commitment (PAC)

### Via API:
```bash
curl -X POST http://localhost:3000/api/vault/pac \
  -H "Content-Type: application/json" \
  -d '{
    "pac": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "curatorAddress": "0xEF8b133D82dF774Ccc0Ed4337Ac5d91Ff5755340"
  }'
```

**In the backend logs you'll see:**
```
[PAC] 🔒 Recording Private Activity Commitment...
[PAC] Curator: 0xEF8b...
[PAC] PAC Hash: 0x1234...
[PAC] Submitting transaction to blockchain...
[PAC] Transaction submitted: 0xabc...
[PAC] ✅ PAC Recorded on-chain!
[PAC] NOTE: Trade details are PRIVATE - only commitment hash is stored
```

**Refresh the vault dashboard** - you'll see the PAC displayed!

---

## Step 7: Verify the PAC in Auditor Dashboard

1. Navigate to: `http://localhost:3001/auditor`
2. Login (any email works)
3. Find the PAC transaction
4. Click to verify
5. Generate ZK proofs (KYC, AML, Yield)

---

## What's Missing (To Complete Full Flow)

1. **Vault Creation Script** - Initialize the vault (needed once)
2. **Deposit Modal** - UI to deposit mETH
3. **PAC Recording UI** - Button to record activity from dashboard
4. **Navigation Link** - Link from main dashboard to vault

---

## Quick Demo Flow (Once Setup is Done)

1. **Show Vault Dashboard** (30s)
   - Point to compliance gate: "🟢 VAULT: COMPLIANT"
   - Point to AUM: "10,000 mETH publicly visible"
   - Point to badge: "Curator has NO withdrawal rights"

2. **Record PAC** (45s)
   - Click "Record PAC" button
   - Show backend logs: "PAC Recorded, details PRIVATE"
   - Refresh dashboard: see new PAC hash

3. **Auditor Verification** (60s)
   - Switch to auditor dashboard
   - Show PAC in transaction list
   - Verify compliance proofs
   - "Compliant but private!"

4. **Cost Comparison** (15s)
   - Point to Mantle callout
   - "$0.03 vs $87 on Ethereum L1"

**Total: ~2:30 minutes** ✅

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000
# Kill the process if needed
kill -9 <PID>
```

### Frontend won't connect to backend
Check `frontend/.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

### Vault shows "Loading..." forever
1. Check backend is running
2. Check backend logs for errors
3. Verify contract addresses in backend/.env

### No PACs showing up
1. Check if vault was created/initialized
2. Check backend logs when calling `/api/vault/pac`
3. Verify transaction on explorer

---

## Next Steps to Complete

Want me to create:
1. ✅ Vault creation script
2. ✅ Deposit modal UI
3. ✅ PAC recording button
4. ✅ Navigation from main dashboard

Let me know which you want first!
