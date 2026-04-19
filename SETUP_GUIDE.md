# Detailed Setup Guide

## Quick Start (5 minutes)

### Prerequisites Check

- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm 8+ installed (`npm --version`)
- [ ] Ganache downloaded and installed
- [ ] MetaMask browser extension installed

### 1. Start Ganache

```bash
# Open Ganache application
# Click "QUICKSTART"
# Note the RPC server: http://127.0.0.1:7545
# Remember: 10 accounts × 100 ETH each
```

### 2. Deploy Smart Contracts

```bash
cd blockchain_auth/modern

# Install dependencies
npm install

# Deploy contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network ganache

# Copy contract addresses from output
```

### 3. Setup Backend

```bash
cd backend

# Create .env file
cp .env.example .env

# Update .env with contract addresses from Step 2
# Example:
# DID_REGISTRY_ADDRESS=0x5FbDB2315678afccb333f8a9c01dfe54075d3d5c
# CREDENTIAL_REGISTRY_ADDRESS=0xb3C1e3476b0d5Eae1ce9C6d8e5b4fa8E8F53fC32
# AUDIT_LOG_ADDRESS=0x8c3e76e3b5e4f3c2d1a0b5e6f7d8a9b0c1d2e3f4

# Install dependencies
npm install

# Start backend
npm run dev

# Should show: "Server running on http://localhost:5000"
```

### 4. Setup Frontend

```bash
cd frontend

# Create .env.local
echo "REACT_APP_API_URL=http://localhost:5000/api/v1" > .env.local

# Install dependencies
npm install

# Start frontend
npm start

# Browser will open to http://localhost:3000
```

### 5. Setup MetaMask

```
1. Click MetaMask icon
2. Click Network dropdown
3. Click "Add a network"
4. Fill in:
   - Network Name: Ganache
   - RPC URL: http://127.0.0.1:7545
   - Chain ID: 1337 (or the value shown in Ganache)
   - Currency: ETH
5. Save and switch to Ganache network
6. Import account with private key from Ganache
```

### 6. Test the System

```
1. Go to http://localhost:3000
2. Click "Phase 1: Registration & Issuance"
3. Enter DID string and public key
4. Click "Register DID"
5. Check response for success
```

---

## Detailed Component Explanations

### Smart Contracts

#### DIDRegistry.sol

```solidity
// Manages DIDs (Decentralized Identifiers)
// Each DID is a unique identifier on the blockchain

Key Data:
- didString: "did:blockchain:123abc" (human-readable ID)
- publicKey: User's public key for verification
- owner: Address that created the DID
- schemaHash: Hash of the credential schema
- active: Whether DID is currently valid

Key Operations:
1. registerDID() - Create new DID
   - Requires schema to be registered first
   - Stores DID document on blockchain
   - Emits DIDCreated event

2. updateDID() - Modify DID document
   - Only owner can update
   - Updates timestamp
   - Emits DIDUpdated event

3. revokeDID() - Disable DID
   - Only owner can revoke
   - Sets active flag to false
   - Cannot be reactivated
```

#### CredentialRegistry.sol

```solidity
// Manages Verifiable Credentials (VCs)
// VCs are digitally signed claims about an entity

Key Data:
- credentialId: Unique ID for credential
- issuerDID: Who issued the credential
- subjectDID: Who the credential is about
- credentialType: Type of credential (e.g., "GovernmentID")
- expiresAt: When credential becomes invalid
- verified: Whether credential has been verified

Key Operations:
1. issueCredential() - Issue new credential
   - Issuer creates credential for subject
   - Sets expiration date
   - Stores credential hash (not full credential)

2. verifyCredential() - Verify credential validity
   - Check if not revoked
   - Check if not expired
   - Mark as verified
   - Allows verifier to confirm credential

3. createPresentation() - Create Verifiable Presentation
   - User presents credentials to verifier
   - Includes zero-knowledge proof
   - Can include multiple credentials

4. verifyPresentation() - Verify presentation
   - Verify all credentials in presentation
   - Verify zero-knowledge proof
   - Grant/deny access based on result
```

#### AuditLog.sol

```solidity
// Maintains immutable audit trail
// Records every action for compliance and audit

Key Data:
- recordId: Unique record number
- action: Type of action (enum)
- actor: Address that performed action
- subjectDID: Affected DID
- timestamp: When action occurred
- details: Human-readable description

Key Operations:
1. logAction() - Record action
   - Called by other contracts
   - Creates immutable record
   - Emits AuditLogged event

2. getDIDAuditTrail() - Get DID's history
   - Returns all records for a DID
   - Shows complete history
   - Useful for audit purposes

3. getRecentAuditRecords() - Get recent records
   - Returns last N records
   - Useful for monitoring
   - Shows system activity
```

### Backend Server

#### server.js

```javascript
// Express.js HTTP server
// Handles API requests

Key Responsibilities:
1. Accept HTTP requests from frontend
2. Extract parameters from request
3. Call smart contract methods via Ethers.js
4. Return results to frontend
5. Handle errors gracefully

Port: 5000
Endpoints: /api/v1/*
```

#### routes.js

```javascript
// API endpoints implementation

Routes:
PHASE 1 (Registration):
- POST /did/register-schema - Register credential schema
- POST /did/register - Register new DID
- GET /did/:didHash - Get DID details

PHASE 2 (Authentication):
- POST /credential/issue - Issue credential
- POST /credential/verify - Verify credential
- GET /credential/:credentialId - Get credential details

PHASE 3 (Audit):
- GET /audit/did/:didHash - Get DID audit trail
- GET /audit/recent/:limit - Get recent records

Health:
- GET /health - Check system status
```

#### contractABIs.js

```javascript
// Contract ABIs (Application Binary Interfaces)
// Define function signatures for contract interaction

Contains ABIs for:
- DIDRegistry
- CredentialRegistry
- AuditLog

Used by Ethers.js/backend services to:
- Call contract functions
- Encode function parameters
- Decode return values
- Watch for events
```

### Frontend Application

#### App.js

```javascript
// Main React component
// Manages UI and user interactions

Key Features:
1. Phase Navigation
   - Switch between 3 phases
   - Show/hide relevant components

2. MetaMask Integration
   - Request account access
   - Display user address
   - Show ETH balance

3. API Integration
   - Call backend endpoints
   - Display results
   - Handle errors

4. Form Handling
   - Collect user input
   - Validate data
   - Submit to backend

Components:
- Phase1Component: DID registration
- Phase2Component: Credential verification
- Phase3Component: Audit trail viewing
```

#### web3Service.js

```javascript
// Bridge between React and blockchain

Two main classes:

1. Web3Service
   - Initialize Web3 with MetaMask
   - Get user accounts
   - Sign messages
   - Check balance
   - Get network info

2. APIService
   - Call backend endpoints
   - Handle HTTP requests
   - Process responses
   - Error handling
```

---

## Transaction Flow Example

### Scenario: Alice registers a DID

**Step 1: Frontend**

```
User enters:
- DID String: "did:blockchain:alice123"
- Public Key: "-----BEGIN PUBLIC KEY-----..."
- Clicks "Register DID" button
```

**Step 2: Frontend → Backend**

```
POST /api/v1/did/register
{
  "didString": "did:blockchain:alice123",
  "publicKey": "-----BEGIN PUBLIC KEY-----...",
  "schemaHash": "0x...",
  "fromAddress": "0x7a5C...",
  "privateKey": "0x123a..."
}
```

**Step 3: Backend Processing**

```
1. Validate input parameters
2. Hash DID string: keccak256("did:blockchain:alice123")
3. Build transaction:
   - To: DIDRegistry contract address
   - Function: registerDID()
   - Parameters: didString, publicKey, schemaHash
4. Estimate gas required
5. Sign transaction with private key
6. Send signed transaction to Ganache
```

**Step 4: Smart Contract Execution**

```solidity
1. Receive registerDID() call
2. Validate:
   - Schema is registered
   - DID doesn't already exist
3. Store DID document:
   - owner = msg.sender (0x7a5C...)
   - didString = "did:blockchain:alice123"
   - publicKey = "-----BEGIN PUBLIC KEY-----..."
   - created = block.timestamp
   - active = true
4. Update mappings
5. Emit DIDCreated event
6. Return success
```

**Step 5: Backend Response**

```
{
  "success": true,
  "didHash": "0x5f4d...",
  "didString": "did:blockchain:alice123",
  "transactionHash": "0x9a2b...",
  "message": "DID registered successfully"
}
```

**Step 6: Frontend Display**

```
✅ Success: DID registered!
Hash: 0x5f4d...

Clear form fields
Show success message
Update UI state
```

---

## Testing the System

### Unit Test: Register and Retrieve DID

```bash
# Terminal 1: Ganache (already running)

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Frontend
cd frontend
npm start

# Open browser: http://localhost:3000

# Test Steps:
1. Connect MetaMask to Ganache
2. Phase 1 → Enter DID details → Click Register
3. Copy returned DID hash
4. Click "Get DID Details"
5. Paste DID hash
6. Verify details match what was submitted
```

### Unit Test: Issue and Verify Credential

```bash
# Prerequisites: DID already registered

# In Frontend:
1. Switch to Phase 2
2. Enter issuer DID, subject DID, credential type
3. Click "Issue Credential"
4. Copy returned credential ID
5. Click "Verify Credential"
6. Paste credential ID
7. Click "Verify"
8. Check verification result
```

### Unit Test: Audit Trail

```bash
# Prerequisites: Multiple actions performed

# In Frontend:
1. Switch to Phase 3
2. Enter a DID hash
3. Click "Get Audit Trail"
4. View record IDs
5. Click "Recent Records"
6. View audit entries in table
7. Verify all actions are logged
```

---

## Ganache Account Management

### Get Account Details

```bash
# In Ganache UI:
1. Select account
2. Click 🔑 icon to reveal private key
3. Copy without 0x prefix
4. Add to hardhat.config.js with 0x prefix
```

### Add More Accounts

```bash
# Option 1: Use Ganache default accounts (10 included)

# Option 2: Create custom account
1. In Ganache: Click account + button
2. MetaMask: Click Import Account
3. Paste private key
4. Account now available in both
```

### Reset Ganache

```bash
# If you need a fresh blockchain:
1. Close Ganache
2. Delete database files (if using persistent)
3. Relaunch Ganache
4. Deploy contracts again
```

---

## Environment Variables

### Backend (.env)

```env
# Required
GANACHE_RPC_URL=http://127.0.0.1:7545
GANACHE_NETWORK_ID=1337
PORT=5000

# Set after deployment
DID_REGISTRY_ADDRESS=0x...
CREDENTIAL_REGISTRY_ADDRESS=0x...
AUDIT_LOG_ADDRESS=0x...

# Optional
IPFS_API_URL=http://127.0.0.1:5001
JWT_SECRET=your_secret_here
```

### Frontend (.env.local)

```env
# Required
REACT_APP_API_URL=http://localhost:5000/api/v1
```

---

## Common Tasks

### Deploy Contracts to New Network

```bash
# 1. Update network in hardhat.config.js
networks: {
  mynetwork: {
    url: "http://...",
    chainId: ...,
    accounts: ["0x..."]
  }
}

# 2. Deploy
npx hardhat run scripts/deploy.js --network mynetwork

# 3. Update .env with new addresses
```

### Add New Smart Contract

```bash
# 1. Create contract file
# contracts/NewContract.sol

# 2. Compile
npx hardhat compile

# 3. Create deployment script
# scripts/deployNew.js

# 4. Deploy
npx hardhat run scripts/deployNew.js --network ganache
```

### Debug Blockchain Calls

```javascript
// In backend, add logging:
console.log("Sending transaction:", {
  to: contractAddress,
  data: encodedFunction,
  from: fromAddress,
  gas: gasEstimate,
  gasPrice: gasPrice,
});

// Check transaction receipt:
const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
console.log("Receipt:", receipt);
console.log("Block Number:", receipt.blockNumber);
console.log("Gas Used:", receipt.gasUsed);
```

### Check Contract State

```javascript
// In backend or frontend console:
const contract = new web3.eth.Contract(ABI, address);
const result = await contract.methods.getDID(didHash).call();
console.log("DID Document:", result);
```

---

## Performance Tips

1. **Batch Operations**: Combine multiple calls into single transaction
2. **Use Events**: Listen for events instead of polling
3. **Cache Data**: Store frequently accessed data in frontend
4. **Optimize Gas**: Use efficient Solidity patterns
5. **Pagination**: Limit returned data for large datasets

---

## Security Considerations

1. **Never Share Private Keys**: Keep them in .env, never commit
2. **Validate Input**: Check all parameters in backend
3. **Use HTTPS**: In production, only use HTTPS
4. **Rate Limiting**: Add rate limits to API endpoints
5. **Access Control**: Implement proper authentication
6. **Contract Audits**: Have contracts audited before production

---

This guide should cover everything needed to get the system running!
