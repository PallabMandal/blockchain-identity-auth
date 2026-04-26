# Project Summary (Current Implementation)

## Snapshot

- Project type: Academic Certificate Verification Portal (local blockchain)
- Contracts: DIDRegistry, CredentialRegistry (academic certificates), AuditLog
- Frontend: React + ethers + MetaMask signing + QR code generation
- Backend: Express read API + audit trail aggregation + health endpoint
- Network defaults: Ganache RPC `http://127.0.0.1:7545`, chain ID `1337`
- Key Feature: QR-enabled certificate distribution with full audit trail

## Security and Architecture Upgrades Applied

1. Removed frontend/backend private-key transaction signing paths.
2. Shifted write transactions to MetaMask signer in frontend.
3. Added issuer RBAC to `CredentialRegistry` (`owner`, `isIssuer`, `addIssuer`, `onlyIssuer`).
4. Renamed misleading presentation field from `zeroKnowledgeProof` to `proofHash`.
5. Integrated `AuditLog` calls in issue/verify credential flows.
6. Aligned network defaults to chain ID 1337.
7. Added working Hardhat test in `test/credential.js`.

## What Works Now

### Frontend

- Wallet connect and account display.
- **Phase 1**: Student DID registration (binds wallet to identity).
- **Phase 2**: Admin issues academic certificates with QR codes; students/employers verify certificates using credential ID or scanned QR.
- Certificate details (issuer, student, college, course, grade, passing year, status) via backend read API.
- Credential audit trail (issued, verified events) with actor addresses and timestamps via backend read API.

### Backend

- Contract-read APIs and health endpoint.
- No server-side transaction signing for write routes.
- Write routes explicitly return HTTP 410 to force wallet flow.

### Contracts

- `CredentialRegistry` constructor requires AuditLog address.
- Issuer-only credential issuance enforced.
- Audit records appended on issue and verify.

## Known Constraints

- No true zero-knowledge protocol is implemented.
- Presentation uses hash-based proof field (`proofHash`).
- This setup is local-dev oriented (Ganache + local env files).

## Test Status

Command:

```bash
$env:HARDHAT_DISABLE_VSCODE_EXTENSION_PROMPT='true'; npx hardhat test
```

Result:

- 1 passing test (`CredentialRegistry` should issue a credential).

## Recommended Reading Order

1. `START_HERE.md`
2. `QUICK_START.md`
3. `SETUP_GUIDE.md`
4. `ARCHITECTURE.md`
5. `README.md`
