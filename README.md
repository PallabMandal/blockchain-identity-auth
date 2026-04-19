# Blockchain-Based Secure Identity Authentication System

A complete decentralized identity and credential management system built on blockchain technology using Ethereum smart contracts, MetaMask, and Ganache.

## 📋 Table of Contents

- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [System Components](#system-components)
- [Workflow Examples](#workflow-examples)

---

## 🏗️ System Architecture

The system implements a three-phase identity authentication flow:

### **PHASE 1: Registration & Issuance**

- User requests credential and creates DID (Decentralized Identifier)
- Issuer verifies identity and issues Verifiable Credential (VC)
- DID and schema anchored on blockchain
- **Smart Contract**: `DIDRegistry.sol`

### **PHASE 2: Authentication & Verification**

- User presents VC to Verifier
- Zero-knowledge proofs used for privacy
- VP (Verifiable Presentation) verified against blockchain
- Verification status returned
- **Smart Contract**: `CredentialRegistry.sol`

### **PHASE 3: Access & Audit**

- Grant/Deny access based on verification
- Immutable audit trail maintained
- All operations logged on blockchain
- **Smart Contract**: `AuditLog.sol`

---

## 📁 Project Structure

```
blockchain_auth/modern/
├── contracts/
│   ├── DIDRegistry.sol           # DID management
│   ├── CredentialRegistry.sol    # Credential issuance & verification
│   └── AuditLog.sol              # Audit trail
├── backend/
│   ├── package.json
│   ├── server.js                 # Express server
│   ├── routes.js                 # API routes
│   ├── config.js                 # Configuration
│   ├── contractABIs.js           # Smart contract ABIs
│   └── .env.example
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js                # Main React component
│       ├── App.css               # Styling
│       ├── index.js
│       └── services/
│           └── web3Service.js    # Web3 & API integration
├── scripts/
│   └── deploy.js                 # Smart contract deployment
├── hardhat.config.js
├── README.md
└── SETUP_GUIDE.md
```

---

## 📋 Prerequisites

### Required Software

- **Node.js** v16+ ([Download](https://nodejs.org))
- **npm** v8+ (comes with Node.js)
- **MetaMask** browser extension ([Install](https://metamask.io))
- **Ganache** for local blockchain ([Download](https://www.trufflesuite.com/ganache))

### System Requirements

- 4GB RAM minimum
- 500MB disk space
- Windows, macOS, or Linux

---

## 🚀 Installation

### Step 1: Prepare Ganache

1. **Download & Install Ganache**

   - Download from: https://www.trufflesuite.com/ganache
   - Install and launch the application

2. **Configure Ganache**

   - Click "QUICKSTART" to start with default settings
   - Ganache will run on `http://127.0.0.1:7545`
   - Note the available accounts and private keys

3. **Verify Ganache is Running**
   - Check if port 7545 is accessible
   - You should see 10 test accounts with 100 ETH each

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

This will install:

- Express.js (server framework)
- Ethers.js (contract interaction)
- Dotenv (environment configuration)
- CORS & Body Parser (middleware)

### Step 3: Install Frontend Dependencies

```bash
cd frontend
npm install
```

This will install:

- React 18+
- Web3.js
- Axios (HTTP client)
- React Router DOM

### Step 4: Install Hardhat (Smart Contract Development)

From project root:

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

---

## ⚙️ Configuration

### Step 1: Create Backend Environment File

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# Ganache Configuration
GANACHE_RPC_URL=http://127.0.0.1:7545
GANACHE_NETWORK_ID=1337

# Server Configuration
PORT=5000
NODE_ENV=development

# Will be filled after smart contract deployment
DID_REGISTRY_ADDRESS=
CREDENTIAL_REGISTRY_ADDRESS=
AUDIT_LOG_ADDRESS=
```

### Step 2: (Optional) Set a Ganache Private Key for Hardhat

Hardhat can use unlocked Ganache accounts automatically. If you want to pin the deployer, set:

```env
GANACHE_PRIVATE_KEY=0xYourPrivateKey
```

### Step 3: Setup MetaMask

1. **Open MetaMask Extension**
2. **Add Ganache Network**
   - Click Network dropdown → "Custom RPC"
   - Network Name: `Ganache Local`
   - RPC URL: `http://127.0.0.1:7545`

- Chain ID: `1337` (or value shown in Ganache)
- Currency Symbol: `ETH`
- Click Save

3. **Import Test Account**

   - Click Account icon → Import Account
   - Choose "Private Key"
   - Paste private key from Ganache
   - Click Import

4. **Verify Connection**
   - Switch to Ganache Local network
   - Should show 100 ETH balance

---

## ▶️ Running the Project

### Complete Startup Sequence

#### Terminal 1: Smart Contract Deployment

```bash
# From project root
cd contracts

# Compile smart contracts
npx hardhat compile

# Deploy to Ganache
npx hardhat run scripts/deploy.js --network ganache
```

**Expected Output:**

```
🚀 Starting smart contract deployment...

📍 Deploying contracts using account: 0x...
💰 Account balance: X.XX ETH

📝 Deploying DIDRegistry...
✅ DIDRegistry deployed to: 0x...

📝 Deploying CredentialRegistry...
✅ CredentialRegistry deployed to: 0x...

📝 Deploying AuditLog...
✅ AuditLog deployed to: 0x...

📋 Contract addresses saved to backend/.env
```

#### Terminal 2: Backend Server

```bash
cd backend

# Install dependencies (if not already done)
npm install

# Create .env file with contract addresses
# (Should be auto-filled by deploy script)

# Start development server
npm run dev
```

**Expected Output:**

```
✅ Blockchain Identity Authentication Backend
📍 Server running on http://localhost:5000
🔗 Connected to Ganache at http://127.0.0.1:7545
📡 Network ID: 1337

📚 API Documentation: http://localhost:5000
```

#### Terminal 3: Frontend Application

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Create .env.local file
echo "REACT_APP_API_URL=http://localhost:5000/api/v1" > .env.local

# Start React development server
npm start
```

**Expected Output:**

```
Compiled successfully!

You can now view blockchain-auth-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### Verify All Services are Running

1. **Backend API** - Visit: http://localhost:5000

   - Should show API documentation

2. **Frontend** - Visit: http://localhost:3000

   - Should show identity authentication interface
   - Connect MetaMask wallet

3. **Check Blockchain Connection**
   - Click "Health Check" in UI
   - Should show connected blockchain status

---

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api/v1
```

### PHASE 1: Registration & Issuance APIs

#### Register Schema

```http
POST /did/register-schema
Content-Type: application/json

{
  "schema": "{\"type\":\"VerifiableCredential\"}",
  "fromAddress": "0x...",
  "privateKey": "0x..."
}

Response:
{
  "success": true,
  "schemaHash": "0x...",
  "transactionHash": "0x...",
  "message": "Schema registered successfully"
}
```

#### Register DID

```http
POST /did/register
Content-Type: application/json

{
  "didString": "did:blockchain:123abc",
  "publicKey": "-----BEGIN PUBLIC KEY-----...",
  "schemaHash": "0x...",
  "fromAddress": "0x...",
  "privateKey": "0x..."
}

Response:
{
  "success": true,
  "didHash": "0x...",
  "didString": "did:blockchain:123abc",
  "transactionHash": "0x...",
  "message": "DID registered successfully"
}
```

#### Get DID Details

```http
GET /did/{didHash}

Response:
{
  "success": true,
  "did": {
    "owner": "0x...",
    "didString": "did:blockchain:123abc",
    "publicKey": "...",
    "created": 1234567890,
    "updated": 1234567890,
    "active": true,
    "schemaHash": "0x..."
  }
}
```

### PHASE 2: Authentication & Verification APIs

#### Issue Credential

```http
POST /credential/issue
Content-Type: application/json

{
  "issuerDID": "0x...",
  "subjectDID": "0x...",
  "credentialType": "GovernmentID",
  "credentialHash": "0x...",
  "expiryDays": 365,
  "fromAddress": "0x...",
  "privateKey": "0x..."
}

Response:
{
  "success": true,
  "credentialId": "0x...",
  "transactionHash": "0x...",
  "message": "Credential issued successfully"
}
```

#### Verify Credential

```http
POST /credential/verify
Content-Type: application/json

{
  "credentialId": "0x...",
  "fromAddress": "0x...",
  "privateKey": "0x..."
}

Response:
{
  "success": true,
  "credentialId": "0x...",
  "verified": true,
  "transactionHash": "0x...",
  "message": "Credential verified successfully"
}
```

#### Get Credential Details

```http
GET /credential/{credentialId}

Response:
{
  "success": true,
  "credential": {
    "credentialId": "0x...",
    "issuerDID": "0x...",
    "subjectDID": "0x...",
    "credentialType": "GovernmentID",
    "issuedAt": 1234567890,
    "expiresAt": 1234567890,
    "revoked": false,
    "verified": true
  }
}
```

### PHASE 3: Access & Audit APIs

#### Get DID Audit Trail

```http
GET /audit/did/{didHash}

Response:
{
  "success": true,
  "didHash": "0x...",
  "auditRecords": [1, 2, 3, 4, 5]
}
```

#### Get Recent Audit Records

```http
GET /audit/recent/{limit}

Example: /audit/recent/10

Response:
{
  "success": true,
  "records": [
    {
      "recordId": 1,
      "action": 0,
      "actor": "0x...",
      "subjectDID": "0x...",
      "timestamp": 1234567890,
      "details": "DID Created"
    },
    ...
  ]
}
```

### Health Check

```http
GET /health

Response:
{
  "success": true,
  "status": "running",
  "blockchain": {
    "connected": true,
    "blockNumber": 42,
    "gasPrice": "2.5 Gwei"
  },
  "contracts": {
    "didRegistry": "0x...",
    "credentialRegistry": "0x...",
    "auditLog": "0x..."
  }
}
```

---

## 🔗 Smart Contract Components

### DIDRegistry.sol

**Purpose**: Manages Decentralized Identifiers (DIDs)

**Key Functions**:

- `registerDID()` - Create new DID
- `updateDID()` - Update DID document
- `revokeDID()` - Revoke DID
- `registerSchema()` - Register credential schema
- `getDID()` - Retrieve DID information

**Events**:

- `DIDCreated` - Emitted when DID is created
- `DIDUpdated` - Emitted when DID is updated
- `DIDRevoked` - Emitted when DID is revoked
- `SchemaRegistered` - Emitted when schema is registered

### CredentialRegistry.sol

**Purpose**: Issues and verifies verifiable credentials

**Key Functions**:

- `issueCredential()` - Issue VC to subject
- `verifyCredential()` - Mark credential as verified
- `revokeCredential()` - Revoke credential
- `createPresentation()` - Create verifiable presentation
- `verifyPresentation()` - Verify presentation

**Events**:

- `CredentialIssued` - When credential is issued
- `CredentialVerified` - When credential is verified
- `CredentialRevoked` - When credential is revoked
- `PresentationVerified` - When presentation is verified

### AuditLog.sol

**Purpose**: Maintains immutable audit trail

**Key Functions**:

- `logAction()` - Log blockchain action
- `getDIDAuditTrail()` - Get DID's audit history
- `getRecentAuditRecords()` - Get last N records

**Action Types**:

```
0: DID_CREATED
1: DID_UPDATED
2: DID_REVOKED
3: CREDENTIAL_ISSUED
4: CREDENTIAL_VERIFIED
5: CREDENTIAL_REVOKED
6: PRESENTATION_CREATED
7: PRESENTATION_VERIFIED
8: ACCESS_GRANTED
9: ACCESS_DENIED
```

---

## 📝 Workflow Examples

### Example 1: Complete Registration Flow

```bash
# 1. Register Schema
curl -X POST http://localhost:5000/api/v1/did/register-schema \
  -H "Content-Type: application/json" \
  -d '{
    "schema": "{\"type\":\"VerifiableCredential\"}",
    "fromAddress": "0x...",
    "privateKey": "0x..."
  }'

# 2. Register DID
curl -X POST http://localhost:5000/api/v1/did/register \
  -H "Content-Type: application/json" \
  -d '{
    "didString": "did:blockchain:user123",
    "publicKey": "-----BEGIN PUBLIC KEY-----...",
    "schemaHash": "0x...",
    "fromAddress": "0x...",
    "privateKey": "0x..."
  }'

# 3. Get DID Details
curl http://localhost:5000/api/v1/did/0x...
```

### Example 2: Credential Issuance Flow

```bash
# 1. Issuer registers DID (if not already done)

# 2. Issue Credential
curl -X POST http://localhost:5000/api/v1/credential/issue \
  -H "Content-Type: application/json" \
  -d '{
    "issuerDID": "0x...",
    "subjectDID": "0x...",
    "credentialType": "GovernmentID",
    "credentialHash": "0x...",
    "expiryDays": 365,
    "fromAddress": "0x...",
    "privateKey": "0x..."
  }'

# 3. Verify Credential
curl -X POST http://localhost:5000/api/v1/credential/verify \
  -H "Content-Type: application/json" \
  -d '{
    "credentialId": "0x...",
    "fromAddress": "0x...",
    "privateKey": "0x..."
  }'

# 4. Get Credential Details
curl http://localhost:5000/api/v1/credential/0x...
```

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to Ganache"

**Solution**:

1. Ensure Ganache is running on port 7545
2. Check `GANACHE_RPC_URL` in `.env`
3. Verify firewall settings allow localhost:7545

### Issue: "MetaMask connection failed"

**Solution**:

1. Ensure MetaMask is installed
2. Add Ganache network to MetaMask
3. Import test account with private key
4. Switch to Ganache Local network

### Issue: "Contract not deployed"

**Solution**:

1. Run deployment script: `npx hardhat run scripts/deploy.js --network ganache`
2. Check `.env` has contract addresses
3. Verify Ganache network ID matches (1337 or value shown in Ganache)

### Issue: "Gas estimation failed"

**Solution**:

1. Ensure account has sufficient ETH (100 ETH in test accounts)
2. Check gas price settings in contract calls
3. Verify contract state is valid

### Issue: "Frontend won't connect to backend"

**Solution**:

1. Ensure backend server is running on port 5000
2. Check CORS settings in server.js
3. Verify API_URL in frontend environment
4. Check browser console for errors

---

## 📊 Key Features

✅ **Decentralized Identity Management**

- Create and manage DIDs on blockchain
- Immutable identity records
- Public key infrastructure

✅ **Verifiable Credentials**

- Issue credentials with expiration
- Verify credentials authenticity
- Revoke compromised credentials

✅ **Zero-Knowledge Proofs**

- Privacy-preserving verification
- No data exposure during verification
- Proof of knowledge framework

✅ **Audit Trail**

- Immutable transaction history
- Complete action tracking
- Compliance and audit capabilities

✅ **MetaMask Integration**

- Web3 wallet connectivity
- Secure transaction signing
- User-controlled private keys

✅ **RESTful APIs**

- Complete REST API
- Easy integration with applications
- Comprehensive documentation

---

## 🚀 Next Steps

1. **Test the System**

   - Use the frontend UI to register DIDs
   - Issue and verify credentials
   - Check audit trails

2. **Explore Smart Contracts**

   - Review contract source code
   - Test edge cases
   - Understand gas consumption

3. **Production Deployment**

   - Deploy to testnet (Sepolia, Mumbai)
   - Setup production database
   - Implement rate limiting
   - Add authentication/authorization

4. **Extend Functionality**
   - Add more credential types
   - Implement revocation registry
   - Add IPFS for off-chain data
   - Implement DAO governance

---

## 📚 Resources

- [Ethereum Documentation](https://ethereum.org/developers)
- [Solidity Smart Contracts](https://docs.soliditylang.org/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)
- [MetaMask Developer Docs](https://docs.metamask.io/)
- [Hardhat Documentation](https://hardhat.org/)
- [React Documentation](https://react.dev/)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👤 Support

For issues and questions:

1. Check the Troubleshooting section
2. Review API documentation
3. Check smart contract comments
4. Review console logs for errors

---

**Last Updated**: April 2026
**Version**: 1.0.0
