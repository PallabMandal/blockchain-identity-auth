# Architecture (As Implemented)

This document describes the architecture currently implemented in code.

## High-Level Components

- Frontend: React app in `frontend/src/App.js`
- Backend: Express API in `backend/server.js` and `backend/routes.js`
- Blockchain: Ganache local node (`http://127.0.0.1:7545`, chain ID `1337`)
- Contracts:
  - `DIDRegistry.sol`
  - `CredentialRegistry.sol`
  - `AuditLog.sol`

## Trust and Signing Model

### Implemented

- User wallet signs write transactions in browser via MetaMask.
- Frontend uses `ethers.BrowserProvider(window.ethereum)` and signer-based contract instances.
- Backend does not construct wallets from user-provided private keys and does not sign writes.

### Not Implemented

- No server-side transaction relayer.
- No true zero-knowledge proof protocol.

## Contract Architecture

### DIDRegistry

Responsibilities:

- Register credential schema hashes.
- Register DID documents (owner, DID string, public key, schema hash).
- Read DID state.

### CredentialRegistry

Responsibilities:

- Issue, verify, revoke credentials.
- Store presentations with `proofHash` naming.
- Integrate with `AuditLog` for issue/verify events.
- Enforce issuer RBAC.

Security controls implemented:

- `owner` set in constructor.
- `isIssuer` mapping.
- `addIssuer(address)` restricted to owner.
- `issueCredential(...)` restricted by `onlyIssuer`.

Constructor wiring:

- `constructor(address _auditLog)`
- Deployed with AuditLog address from deploy script.

### AuditLog

Responsibilities:

- Persist immutable action records.
- Provide audit trail queries by DID and recency.

Current integration:

- `CredentialRegistry.issueCredential` logs `CREDENTIAL_ISSUED`.
- `CredentialRegistry.verifyCredential` logs `CREDENTIAL_VERIFIED`.

## Backend API Architecture

### Active Read Endpoints

- `GET /api/v1/did/:didHash`
- `GET /api/v1/credential/:credentialId`
- `GET /api/v1/audit/did/:didHash`
- `GET /api/v1/audit/recent/:limit`
- `GET /api/v1/health`

### Disabled Write Endpoints

The following routes exist but intentionally return HTTP 410 to enforce wallet-based signing in frontend:

- `POST /api/v1/did/register-schema`
- `POST /api/v1/did/register`
- `POST /api/v1/credential/issue`
- `POST /api/v1/credential/verify`

## Runtime Flow

### DID registration

1. User submits DID data in frontend.
2. Frontend gets MetaMask signer.
3. Frontend calls `DIDRegistry.registerSchema` (if needed) and `registerDID` directly.
4. Transaction mined on Ganache.
5. UI shows DID hash.

### Credential issue/verify

1. Frontend computes hash-based proof payload (`proofHash`).
2. Frontend calls `CredentialRegistry.issueCredential(...)` via MetaMask signer.
3. Contract enforces issuer RBAC.
4. Contract logs audit action to `AuditLog`.
5. Frontend parses `CredentialIssued` event for credential ID.
6. Verify flow calls `verifyCredential(...)` similarly and logs `CREDENTIAL_VERIFIED`.

### Audit visibility

- Frontend phase 3 calls backend read endpoints to fetch audit records.

## Deployment Architecture

In `scripts/deploy.js`:

1. Deploy `DIDRegistry`.
2. Deploy `AuditLog`.
3. Deploy `CredentialRegistry(auditLogAddress)`.
4. Append addresses to `backend/.env`.

## Network Configuration

- Hardhat networks configured with chain ID `1337` for Ganache/localhost entries.
- Backend default `GANACHE_NETWORK_ID` fallback is `1337`.

## Validation Status

- Contract test present in `test/credential.js`.
- Verified passing with:

```bash
$env:HARDHAT_DISABLE_VSCODE_EXTENSION_PROMPT='true'; npx hardhat test
```

## Accuracy Note

Older docs in this repo previously described backend write-signing and zero-knowledge verification. Those behaviors are not current implementation and should not be used to explain this codebase.
