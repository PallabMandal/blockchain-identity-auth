# Detailed Setup Guide

This guide documents exactly what is implemented now, without speculative features.

## Overview

- Contracts: DIDRegistry, CredentialRegistry, AuditLog
- Frontend: React + ethers, wallet-based signing through MetaMask
- Backend: Express read API + health endpoint; no server-side transaction signing
- Network defaults: Ganache RPC `http://127.0.0.1:7545`, chain ID `1337`

## Step 1: Install Dependencies

From repo root:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

## Step 2: Deploy Contracts

From repo root:

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network ganache
```

Deployment behavior from `scripts/deploy.js`:

- Deploy DIDRegistry
- Deploy AuditLog
- Deploy CredentialRegistry with constructor argument `auditLogAddress`
- Append contract addresses into `backend/.env`

## Step 3: Backend Setup

```bash
cd backend
copy .env.example .env
```

Ensure this content is correct:

```env
GANACHE_RPC_URL=http://127.0.0.1:7545
GANACHE_NETWORK_ID=1337
PORT=5000
DID_REGISTRY_ADDRESS=<address>
CREDENTIAL_REGISTRY_ADDRESS=<address>
AUDIT_LOG_ADDRESS=<address>
```

Start backend:

```bash
npm run dev
```

## Step 4: Frontend Setup

```bash
cd ../frontend
echo REACT_APP_API_URL=http://localhost:5000/api/v1 > .env.local
npm start
```

Optional fallback envs if backend health contract address discovery is unavailable:

```env
REACT_APP_DID_REGISTRY_ADDRESS=<address>
REACT_APP_CREDENTIAL_REGISTRY_ADDRESS=<address>
REACT_APP_AUDIT_LOG_ADDRESS=<address>
```

## Step 5: MetaMask Setup

- Add network:
  - RPC URL: `http://127.0.0.1:7545`
  - Chain ID: `1337`
  - Symbol: `ETH`
- Import one Ganache account into MetaMask.

## Smart Contract Behavior (Current)

### DIDRegistry

- Registers schema hash via `registerSchema(string)`.
- Registers DID via `registerDID(string,string,bytes32)`.
- Used by frontend directly with MetaMask signer.

### CredentialRegistry

- Constructor: `constructor(address _auditLog)`.
- Owner initialized on deployment.
- RBAC:
  - `mapping(address => bool) public isIssuer`
  - `addIssuer(address)` only owner
  - `issueCredential(...)` restricted by `onlyIssuer`
- Verification:
  - `verifyCredential(bytes32 credentialId, bytes32 submittedHash)` marks credential verified after hash checks.
  - `verifyCredentialIntegrity(bytes32 credentialId, bytes32 payloadHash)` is used by the frontend as a view helper.
- Presentation field:
  - `proofHash` naming is used.

### AuditLog

- `logAction(...)` called by CredentialRegistry for:
  - CREDENTIAL_ISSUED
  - CREDENTIAL_VERIFIED
- Frontend logs `DID_CREATED` after successful DID registration (if AuditLog address is available).
- Read APIs:
  - `getDIDAuditTrail(bytes32)`
  - `getRecentAuditRecords(uint256)`

## Backend API Behavior (Current)

**Read routes (active):**

DID and Credential reads:

- GET `/api/v1/did/:didHash`
- GET `/api/v1/credential/:credentialId`

Audit trail reads:

- GET `/api/v1/audit/did/:didHash` - Full audit trail with enriched DID data
- GET `/api/v1/audit/did/:didHash/ids` - Audit record IDs only (lightweight)
- GET `/api/v1/audit/credential/:credentialId` - Audit trail for a credential
- GET `/api/v1/audit/recent/:limit` - Most recent N audit records system-wide

Health and system:

- GET `/api/v1/health`
- GET `/` (root endpoint with system info)

**Write routes (disabled intentionally, return HTTP 410):**

- POST `/api/v1/did/register-schema`
- POST `/api/v1/did/register`
- POST `/api/v1/credential/issue`
- POST `/api/v1/credential/verify`

## Frontend Transaction Flow (Current)

Implemented in `frontend/src/App.js`:

- `getSigner()` obtains `ethers.BrowserProvider(window.ethereum)` signer.
- **Phase 1**: Student registers DID directly to DIDRegistry from browser wallet (binds wallet to identity). The UI auto-registers a basic schema and uses an empty publicKey.
- **Phase 2**: Admin issues academic certificates:
  - Collects: student wallet address, student name, college name, course, grade, passing year.
  - Validates student wallet is a valid Ethereum address.
  - Looks up student DID from student wallet address.
  - Creates off-chain certificate payload as JSON.
  - Hashes payload with keccak256 (only hash stored on-chain).
  - Calls `CredentialRegistry.issueCredential(issuerDID, subjectDID, "ACADEMIC_CERTIFICATE", proofHash, 3650)` with 10-year expiry.
  - Generates QR code containing credential ID and verification URL.
  - Parses `CredentialIssued` event to extract credential ID.
  - Stores payload in browser localStorage for integrity checks during later verification.
- **Verification**:
  - Frontend normalizes credential ID (handles both raw ID and QR URLs).
  - If payload is available, recomputes hash and verifies it against `credentialHash`.
  - Calls `verifyCredential(credentialId, payloadHash)` via signer.
  - If payload is missing, warns and uses the on-chain hash only (no full payload check).

## Testing

Run contract tests:

```bash
$env:HARDHAT_DISABLE_VSCODE_EXTENSION_PROMPT='true'; npx hardhat test
```

Current result in this workspace: credential issuance test passes.

## Accuracy Note

This codebase does not currently implement true zero-knowledge proof generation/verification. It stores and processes hash-based proof values.
