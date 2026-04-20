# Blockchain-Based Secure Identity Authentication System

A local blockchain identity demo using Ethereum smart contracts, MetaMask, Ganache, a React frontend, and an Express backend.

## Current Truth (Important)

- Transaction signing is client-side via MetaMask in the frontend.
- Backend does not sign blockchain write transactions.
- Backend write routes still exist but return HTTP 410 to force wallet-based writes.
- Credential issuance is restricted by on-chain issuer role-based access control (RBAC).
- Presentation proof uses a hash field (`proofHash`), not real zero-knowledge proof verification.
- Ganache chain ID is configured as 1337 in project defaults.

## Project Structure

```text
blockchain_auth/modern/
├── contracts/
│   ├── DIDRegistry.sol
│   ├── CredentialRegistry.sol
│   └── AuditLog.sol
├── backend/
│   ├── server.js
│   ├── routes.js
│   ├── config.js
│   ├── contractABIs.js
│   └── .env.example
├── frontend/
│   └── src/
│       ├── App.js
│       └── services/web3Service.js
├── scripts/deploy.js
├── hardhat.config.js
└── test/credential.js
```

## Prerequisites

- Node.js 16+
- Ganache running on `http://127.0.0.1:7545`
- MetaMask browser extension

## Setup

### 1. Install dependencies (root)

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Deploy contracts

From project root:

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network ganache
```

Deployment order in `scripts/deploy.js`:

1. `DIDRegistry`
2. `AuditLog`
3. `CredentialRegistry(auditLogAddress)`

The script appends deployed addresses to `backend/.env`.

### 3. Backend configuration

Create `backend/.env` from `backend/.env.example` and ensure:

```env
GANACHE_RPC_URL=http://127.0.0.1:7545
GANACHE_NETWORK_ID=1337
PORT=5000

DID_REGISTRY_ADDRESS=<deployed address>
CREDENTIAL_REGISTRY_ADDRESS=<deployed address>
AUDIT_LOG_ADDRESS=<deployed address>
```

### 4. Frontend configuration

Create `frontend/.env.local`:

```env
REACT_APP_API_URL=http://localhost:5000/api/v1
```

Optional (fallback if backend health response is unavailable):

```env
REACT_APP_DID_REGISTRY_ADDRESS=<deployed address>
REACT_APP_CREDENTIAL_REGISTRY_ADDRESS=<deployed address>
```

### 5. Start services

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm start
```

## API Reality

Base URL: `http://localhost:5000/api/v1`

### Read routes (active)

- `GET /did/:didHash`
- `GET /credential/:credentialId`
- `GET /audit/did/:didHash`
- `GET /audit/recent/:limit`
- `GET /health`

### Write routes (intentionally disabled server-side)

These routes return HTTP 410 with guidance to use MetaMask in frontend:

- `POST /did/register-schema`
- `POST /did/register`
- `POST /credential/issue`
- `POST /credential/verify`

## Smart Contract Highlights

### DIDRegistry

- Stores schema hashes and DID documents.
- `registerSchema` and `registerDID` are called directly from frontend using MetaMask signer.

### CredentialRegistry

- Constructor requires `auditLog` address.
- RBAC fields:
  - `owner`
  - `mapping(address => bool) public isIssuer`
- Access control:
  - `addIssuer(address)` only by owner
  - `issueCredential(...)` requires `onlyIssuer`
- Audit integration:
  - Logs `CREDENTIAL_ISSUED` and `CREDENTIAL_VERIFIED` to `AuditLog`.
- Presentation field naming:
  - Uses `proofHash` (not `zeroKnowledgeProof`).

### AuditLog

- Stores immutable audit records and provides read APIs.
- Exposes `getDIDAuditTrail` and `getRecentAuditRecords`.

## Frontend Flow

In `frontend/src/App.js`:

- `getSigner()` uses `ethers.BrowserProvider(window.ethereum)`.
- DID registration and credential issue/verify use direct contract calls with signer.
- Proof payload is hashed before issue:

```js
const proofHash = keccak256(toUtf8Bytes(JSON.stringify(data)));
```

## Test Status

Contract test exists and passes:

```bash
$env:HARDHAT_DISABLE_VSCODE_EXTENSION_PROMPT='true'; npx hardhat test
```

Expected:

- `CredentialRegistry` test passes (`should issue a credential`).

## Troubleshooting

- If writes fail in frontend, confirm MetaMask is connected to chain ID 1337 and correct account is selected.
- If issue credential reverts with authorization error, ensure deployer (owner) has added intended issuer via `addIssuer`.
- If backend health fails, verify `backend/.env` contract addresses and Ganache RPC URL.

## Notes

This documentation reflects the implementation currently present in this repository. No zero-knowledge proving system is implemented; only hash-based proof placeholders are used.
