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
- Register DID documents (owner, DID string, public key field, schema hash).
- Read DID state and map wallet address to DID.

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

Integrity verification:

- `verifyCredential(bytes32 credentialId, bytes32 submittedHash)` checks submitted hash matches stored `credentialHash`.
- `verifyCredentialIntegrity(bytes32 credentialId, bytes32 payloadHash)` is a read-only helper used by the frontend.

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
- Frontend logs `DID_CREATED` to AuditLog after DID registration (if AuditLog address is available).

## Backend API Architecture

### Active Read Endpoints

**DID Endpoints:**

- `GET /api/v1/did/:didHash` - Retrieve DID document (owner, didString, publicKey, schemaHash, timestamps)

**Credential Endpoints:**

- `GET /api/v1/credential/:credentialId` - Retrieve credential details (issuerDID, subjectDID, type, timestamps, revoked, verified)

**Audit Endpoints:**

- `GET /api/v1/audit/did/:didHash` - Retrieve full audit trail for a DID with enriched DID string lookups
- `GET /api/v1/audit/did/:didHash/ids` - Retrieve audit record IDs only for a DID (lightweight path)
- `GET /api/v1/audit/credential/:credentialId` - Retrieve audit trail for a credential
- `GET /api/v1/audit/recent/:limit` - Retrieve the most recent N audit records across all DIDs

**Health Endpoint:**

- `GET /api/v1/health` - Returns blockchain connection status, block number, gas price, and contract addresses

### Disabled Write Endpoints

The following routes exist but intentionally return HTTP 410 to enforce wallet-based signing in frontend:

- `POST /api/v1/did/register-schema` - Schema registration (HTTP 410)
- `POST /api/v1/did/register` - DID registration (HTTP 410)
- `POST /api/v1/credential/issue` - Credential issuance (HTTP 410)
- `POST /api/v1/credential/verify` - Credential verification (HTTP 410)

## Runtime Flow

### DID registration

1. User submits DID data in frontend.
2. Frontend gets MetaMask signer.
3. Frontend auto-registers a simple schema (name + email) if missing.
4. Frontend calls `DIDRegistry.registerDID` directly (publicKey is left empty in the UI flow).
5. Transaction mined on Ganache; DID hash is `keccak256(didString)`.
6. Frontend logs `DID_CREATED` to AuditLog if AuditLog address is available.

### Credential issue/verify (Academic Certificates)

1. Frontend Phase 2 form collects:
   - Student wallet address (to look up student DID)
   - Student name, college, course, grade, passing year
2. Frontend builds off-chain payload:
   ```js
   {
     studentName,
       collegeName,
       courseName,
       grade,
       passingYear,
       studentAddress,
       issuerAddress,
       issuedAt;
   }
   ```
3. Frontend computes `keccak256(JSON.stringify(payload))` (only hash goes on-chain).
4. Frontend resolves issuer and student DIDs from wallet addresses.
5. Frontend calls `CredentialRegistry.issueCredential(issuerDID, subjectDID, "ACADEMIC_CERTIFICATE", proofHash, 3650)` via MetaMask signer.
6. Contract:
   - Enforces `onlyIssuer` access control.
   - Creates credential record with status `verified=false`.
   - Logs `CREDENTIAL_ISSUED` action to `AuditLog`.
   - Emits `CredentialIssued` event.
7. Frontend:
   - Parses event to extract `credentialId`.
   - Generates QR code: `https://host?credentialId=0x...`
   - Stores payload in browser localStorage for later integrity checks.
8. Verification flow (employer/verifier):
   - Inputs credential ID (raw or from QR URL).
   - Frontend normalizes input (extracts credentialId from QR URL if needed).
   - Frontend fetches on-chain credential record (includes `credentialHash`).
   - If payload is available (current browser), frontend recomputes hash and verifies it matches `credentialHash`.
   - Frontend calls `verifyCredentialIntegrity` (read-only) and then `verifyCredential(credentialId, payloadHash)`.
   - If payload is not available, frontend warns and calls `verifyCredential` using the on-chain hash only (no full payload check).
   - Contract validates credential exists, hash matches, not revoked, and not expired.
   - On success, contract sets `verified=true` and logs `CREDENTIAL_VERIFIED`.
9. Audit trail:
   - Frontend calls backend `GET /api/v1/audit/credential/:credentialId`.
   - Returns list of audit records with actor address and timestamp.

### Audit visibility

- Frontend phase 3 calls backend read endpoints to fetch audit records and recent activity.

## Deployment Architecture

In `scripts/deploy.js`:

1. Deploy `DIDRegistry`.
2. Deploy `AuditLog`.
3. Deploy `CredentialRegistry(auditLogAddress)`.
4. Append addresses to `backend/.env` (preserving other env settings).

## Network Configuration

- Hardhat networks configured with chain ID `1337` for Ganache/localhost entries.
- Backend default `GANACHE_NETWORK_ID` fallback is `1337`.

## Validation Status

- Contract test present in `test/credential.js`.
- Verified passing with:

```bash
$env:HARDHAT_DISABLE_VSCODE_EXTENSION_PROMPT='true'; npx hardhat test
```
