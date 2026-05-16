# Quick Start

This file is intentionally practical and strictly aligned with current code behavior.

## What This System Does Today

- Frontend signs blockchain writes via MetaMask.
- Backend serves read APIs and health/audit aggregation.
- Backend write APIs return HTTP 410 (disabled by design).
- Chain ID defaults: 1337.

## 1. Start Ganache

- Run Ganache UI (Quickstart) on `http://127.0.0.1:7545`.
- Keep Ganache running.

## 2. Deploy Contracts

From project root:

```bash
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network ganache
```

Deployment order is:

1. DIDRegistry
2. AuditLog
3. CredentialRegistry (constructor receives AuditLog address)

<!-- ## 3. Configure Backend

```bash
cd backend
copy .env.example .env
``` -->

Fill deployed addresses in `backend/.env` and verify:

```env
GANACHE_RPC_URL=http://127.0.0.1:7545
GANACHE_NETWORK_ID=1337
PORT=5000
```

Start backend:

```bash
npm install
npm run dev
```

## 4. Configure Frontend

```bash
cd ../frontend
npm install
echo REACT_APP_API_URL=http://localhost:5000/api/v1 > .env.local
npm start
```

## 5. Configure MetaMask

- Add/custom network:
  - RPC URL: `http://127.0.0.1:7545`
  - Chain ID: `1337`
  - Symbol: `ETH`
- Import a Ganache account private key into MetaMask.

## 6. Functional Smoke Test

### DID Registration (frontend)

- Open app at `http://localhost:3000`.
- Phase 1: enter DID string only.

- Approve MetaMask prompts.
- Expect success message with DID hash.

### Credential Issue + Verify (Academic Certificate) (frontend)

- Phase 2: Fill academic certificate form:
  - Student Wallet Address: paste student's 0x wallet address
  - Student Name: full name
  - College Name: institution name
  - Course: course name
  - Grade: final grade
  - Passing Year: graduation year
- Click **Issue Academic Certificate**.
- Approve MetaMask tx; app logs `CREDENTIAL_ISSUED` action on-chain.
- App computes `keccak256(credentialPayload)` and stores the hash on-chain as `credentialHash`.
- App extracts `credentialId` from emitted event.
- **QR Code** appears with shareable URL containing credential ID.
- Student/employer can:
  - Paste raw credential ID into verification input, OR
  - Scan QR code and paste the URL into verification input.
- Click **Get Details** to fetch certificate from backend (issuer, student, timestamps, status, **credentialHash**).
- **Integrity Check**: The app automatically recomputes the hash of the stored certificate payload and compares it against the on-chain `credentialHash`. If the grade or any field was tampered with, the hash will differ and verification will fail.
- Click **Verify & Check Integrity** to mark credential verified on-chain. This step:
  1. Fetches the on-chain credential record.
  2. Verifies the hash of your payload matches the stored `credentialHash` (detects tampering).
  3. Checks credential exists, is not revoked, and not expired.
  4. Logs `CREDENTIAL_VERIFIED` action on-chain.
- **Audit Trail** displays all operations (issued, verified) with actor addresses and timestamps.

### Audit Reads (backend read API)

- Phase 3 uses backend read routes:
  - GET `/audit/did/:didHash` - Full audit trail with enriched DID string
  - GET `/audit/did/:didHash/ids` - Audit record IDs only (lightweight)
  - GET `/audit/credential/:credentialId` - Audit trail for a credential
  - GET `/audit/recent/:limit` - Most recent N audit records system-wide
  - GET `/audit/recent/:limit`

## API Notes

Active read routes:

- GET `/api/v1/did/:didHash`
- GET `/api/v1/credential/:credentialId`
- GET `/api/v1/audit/did/:didHash`
- GET `/api/v1/audit/recent/:limit`
- GET `/api/v1/health`

Disabled write routes (return 410):

- POST `/api/v1/did/register-schema`
- POST `/api/v1/did/register`
- POST `/api/v1/credential/issue`
- POST `/api/v1/credential/verify`

## Contract Test

From project root:

```bash
$env:HARDHAT_DISABLE_VSCODE_EXTENSION_PROMPT='true'; npx hardhat test
```

Expected: 1 passing test for credential issuance.

## Important Accuracy Note

The system uses hash-based proof storage (`proofHash`) on-chain:

- Full certificate data (name, college, course, grade, year, timestamp) is stored off-chain.
- Only the keccak256 hash of the certificate payload is stored on-chain (immutable and tamper-proof).
- This keeps on-chain storage minimal while ensuring certificate integrity.
