# 🚀 QUICK START - 10 Minutes to Running System

## Prerequisites Checklist

- ✅ Node.js 16+ installed
- ✅ Ganache installed & ready
- ✅ MetaMask browser extension installed
- ✅ Code editor (VS Code recommended)

---

## Step-by-Step: Copy & Paste Commands

### Terminal 1: Launch Ganache

```bash
# 1. Open Ganache application
# 2. Click "QUICKSTART"
# 3. Wait for 10 accounts to appear
# 4. Keep this running (don't close)

# Ganache is now: http://127.0.0.1:7545
```

### Terminal 2: Deploy Smart Contracts

```bash
# Navigate to project
cd blockchain_auth/modern

# Install Hardhat
npm install

# Compile contracts
npx hardhat compile

# Deploy to Ganache
npx hardhat run scripts/deploy.js --network ganache

# ⭐ SAVE THESE ADDRESSES (appears in output):
# DID_REGISTRY_ADDRESS: 0x...
# CREDENTIAL_REGISTRY_ADDRESS: 0x...
# AUDIT_LOG_ADDRESS: 0x...
```

### Terminal 3: Start Backend Server

```bash
# In new terminal
cd blockchain_auth/modern/backend

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env and paste the contract addresses from Terminal 2
# (Just copy the three addresses to their lines)

# Start server
npm run dev

# You should see:
# ✅ Blockchain Identity Authentication Backend
# 📍 Server running on http://localhost:5000
```

### Terminal 4: Start Frontend

```bash
# In new terminal
cd blockchain_auth/modern/frontend

# Install dependencies
npm install

# Create .env.local
echo REACT_APP_API_URL=http://localhost:5000/api/v1 > .env.local

# Start React
npm start
# Browser opens: http://localhost:3000
```

### Browser: Setup MetaMask

```
1. Click MetaMask icon in browser
2. Click Network dropdown → "Add a network"
3. Fill in:
   - Network Name: Ganache
   - RPC URL: http://127.0.0.1:7545
   - Chain ID: 1337 (or the value shown in Ganache)
   - Currency Symbol: ETH
4. Click "Save"
5. Switch to Ganache network

Next, import test account:
1. In Ganache, click 🔑 icon next to first account
2. Copy private key
3. In MetaMask, click profile → "Import Account"
4. Paste private key
5. Click "Import"

You should now see 100 ETH balance in MetaMask!
```

---

## Testing: Execute Your First Transaction

### Phase 1: Register a DID

```
1. Go to http://localhost:3000
2. Click "Phase 1: Registration & Issuance"
3. Enter:
   - DID String: did:blockchain:myuser123-<unique-suffix>
   - Public Key: -----BEGIN PUBLIC KEY-----
                 MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
                 -----END PUBLIC KEY-----
4. Click "Register DID"
5. You should see:
   ✅ Success: DID registered!

If you see this, the system works! 🎉
```

### Phase 2: Verify Credential

```
1. Click "Phase 2: Authentication & Verification"
2. Click "🧾 Issue Test Credential"
3. The app auto-fills a valid Credential ID
4. Click "📄 Get Details"
5. Click "✅ Verify"
6. You should see verification success message

NOTE:
- Do not paste contract addresses here.
- Credential ID must be 0x + 64 hex characters.
```

### Phase 3: Check Audit Trail

```
1. Click "Phase 3: Access & Audit"
2. Enter DID hash from Phase 1 response
3. Click "Get Audit Trail"
4. Click "Recent Records"
5. See all blockchain transactions logged
```

---

## Troubleshooting - Fast Fixes

### "Cannot connect to Ganache"

```bash
# Check Ganache is running:
# 1. Look for Ganache window
# 2. Verify shows 10 accounts with 100 ETH
# 3. Check port 7545 is shown

# If problem persists:
# Close Ganache → Reopen → Click QUICKSTART
```

### "MetaMask not found" or "No accounts"

```bash
# 1. Install MetaMask: https://metamask.io
# 2. Click MetaMask icon
# 3. Create wallet or restore
# 4. Follow "Setup MetaMask" section above
```

### "Contract addresses not found"

```bash
# 1. Check Terminal 2 shows deployment success
# 2. Copy ALL three addresses from output
# 3. Paste into backend/.env
# 4. Save file
# 5. Restart backend: Stop with Ctrl+C, then npm run dev
```

### "Backend not responding"

```bash
# Check Terminal 3:
# Should show: "Server running on http://localhost:5000"

# If not:
# Stop with Ctrl+C
# Check .env file has correct paths
# Run: npm run dev again
```

### "Frontend blank page"

```bash
# Check Terminal 4:
# Should show: "Compiled successfully!"

# If not:
# Check browser console: F12 → Console tab
# Look for red errors
# Click in MetaMask and approve connection

# If still blank:
# Stop with Ctrl+C
# Delete node_modules folder
# Run: npm install again
# Run: npm start again
```

---

## What Just Happened?

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   YOUR COMPUTER                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐         ┌──────────────┐              │
│  │  Browser     │────────→│  React App   │              │
│  │  :3000       │←────────│  (Frontend)  │              │
│  └──────────────┘         └──────────────┘              │
│         ▲                        ▲                        │
│         │ MetaMask             │ API Calls               │
│         │                       │                        │
│  ┌──────┴───────────────────────┴──────┐                │
│  │        Backend API Server           │                │
│  │        Express.js :5000             │                │
│  └──────┬───────────────────────┬──────┘                │
│         │                       │                        │
│         │ Ethers.js Calls       │                        │
│         │                       │                        │
│  ┌──────┴───────────────────────┴──────┐                │
│  │     Ganache Local Blockchain        │                │
│  │     :7545 (5 Accounts: 100 ETH)    │                │
│  │                                     │                │
│  │  ┌──────────────────────────────┐  │                │
│  │  │  Smart Contracts:            │  │                │
│  │  │  • DIDRegistry               │  │                │
│  │  │  • CredentialRegistry        │  │                │
│  │  │  • AuditLog                  │  │                │
│  │  └──────────────────────────────┘  │                │
│  └─────────────────────────────────────┘                │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User fills form in Browser (Phase 1, 2, or 3)
   ↓
2. React sends HTTP request to Backend (:5000)
   ↓
3. Backend receives request
   ↓
4. Backend calls Smart Contract via Ethers.js
   ↓
5. Smart Contract executes on Ganache blockchain
   ↓
6. Transaction completes, events logged
   ↓
7. Backend sends response back to React
   ↓
8. React displays result to user
   ↓
9. MetaMask shows transaction confirmation
```

---

## File Locations

```
blockchain_auth/modern/
├── contracts/              ← Smart Contracts (Solidity)
├── backend/                ← API Server (Node.js/Express)
│   ├── server.js          ← Main server
│   ├── routes.js          ← API endpoints
│   ├── .env               ← Configuration (CREATE THIS)
│   └── package.json
├── frontend/               ← UI (React)
│   ├── src/App.js         ← Main component
│   ├── .env.local         ← Configuration (CREATE THIS)
│   └── package.json
├── scripts/
│   └── deploy.js          ← Deployment script
├── README.md              ← Full documentation
└── SETUP_GUIDE.md         ← Detailed guide
```

---

## Common Tasks

### See All Ganache Accounts

```
Open Ganache → Accounts tab
Click 🔑 icon to copy private key
Use in MetaMask to switch accounts
```

### Check Account Balance

```
MetaMask → Shows balance in top right
Click to see more details
```

### View Blockchain Transactions

```
Ganache → Transactions tab
Shows all transactions sent to blockchain
Click transaction to see details
```

### Check Smart Contract State

```
Backend logs show contract calls
Frontend shows results in UI
Ganache Contracts tab shows deployed contracts
```

### Reset Everything

```bash
# Complete reset:
1. Close all terminals (Ctrl+C)
2. Close Ganache
3. Reopen Ganache → QUICKSTART
4. Run deploy script again
5. Restart backend
6. Restart frontend
7. Refresh browser
```

---

## Next Steps

### After Getting "Hello World" Working:

1. ✅ Understand smart contracts (read contracts/ folder)
2. ✅ Explore API endpoints (visit http://localhost:5000)
3. ✅ Test all three phases thoroughly
4. ✅ Check audit trail in Phase 3
5. ✅ Try with different test accounts

### Ready to Deploy to Testnet?

See README.md → Production Deployment section

---

## Support

**System Not Working?**

1. Check all 4 terminals are running
2. See "Troubleshooting" section above
3. Check browser console (F12) for errors
4. Check backend terminal for error messages

**Want to Add Features?**

1. See README.md → Smart Contract Components
2. Smart contracts in contracts/ folder
3. API routes in backend/routes.js
4. UI components in frontend/src/

---

## Cheat Sheet: Important URLs

| Component    | URL                   | Purpose    |
| ------------ | --------------------- | ---------- |
| Frontend     | http://localhost:3000 | Main UI    |
| Backend      | http://localhost:5000 | API Server |
| Backend Docs | http://localhost:5000 | API Docs   |
| Ganache      | http://127.0.0.1:7545 | Blockchain |
| MetaMask     | Browser Plugin        | Wallet     |

---

## Test Account Info

Default Ganache accounts:

- Account 1: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
- Account 2: 0xFFcf8FDEE72ac11b5c542428B7a3A3A7bf01Ce5
- Account 3: 0x22d491Bde2303f2f43325b2108D26f1eBA3526E2
- ... and 7 more

All have: 100 ETH balance

---

**Estimated Time: 10 minutes from zero to fully working system! 🚀**

Good luck! 🎉
