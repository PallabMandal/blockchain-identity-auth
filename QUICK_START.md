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

## 3. Configure Backend

```bash
cd backend
copy .env.example .env
```

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
- Phase 1: enter DID string and public key.
- Example public key value:

```text
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE6M6lM1Q7m9qk3wQ6F2f9xWJbWw4h
VQk3A0v3f0hTz8S2d9W7pA5q5mYq9m+Wc9xWQw8Q2sJ3jP1u3vLkN0RzVw==
-----END PUBLIC KEY-----
```

- Approve MetaMask prompts.
- Expect success message with DID hash.

### Credential Issue + Verify (frontend)

- Phase 2: click issue.
- Approve MetaMask tx.
- App extracts `credentialId` from emitted event.
- Click verify and approve MetaMask tx.

### Audit Reads (backend read API)

- Phase 3 uses backend read routes:
  - GET `/audit/did/:didHash`
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

The system does not implement a true zero-knowledge proof protocol. It currently uses a hash-based proof field (`proofHash`).
