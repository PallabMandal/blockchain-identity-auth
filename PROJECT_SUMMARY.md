# Project Summary (Current Implementation)

## Snapshot

- Project type: Academic Certificate Verification Portal (local blockchain)
- Contracts: DIDRegistry, CredentialRegistry (academic certificates), AuditLog
- Frontend: React + ethers + MetaMask signing + QR code generation
- Backend: Express read API + audit trail aggregation + health endpoint
- Network defaults: Ganache RPC `http://127.0.0.1:7545`, chain ID `1337`
- Key Feature: QR-enabled certificate distribution with on-chain integrity verification

## Security and Architecture Upgrades Applied

1. Removed frontend/backend private-key transaction signing paths.
2. Shifted write transactions to MetaMask signer in frontend.
3. Added issuer RBAC to `CredentialRegistry` (`owner`, `isIssuer`, `addIssuer`, `onlyIssuer`).
4. Renamed misleading presentation field from `zeroKnowledgeProof` to `proofHash`.
5. Integrated `AuditLog` calls in issue/verify credential flows.
6. Aligned network defaults to chain ID 1337.
7. Added working Hardhat test in `test/credential.js`.
8. Implemented hash-based credential integrity verification:
   - `verifyCredential()` requires credential ID and payload hash.
   - Contract validates submitted hash against stored `credentialHash`.
   - Frontend computes `keccak256(JSON.stringify(payload))` and confirms integrity before verification.

## What Works Now

### Frontend

- Wallet connect, balance, and network display.
- **Phase 1**: Student DID registration (binds wallet to identity; schema auto-registered if missing).
- **Phase 2**: Admin issues academic certificates with QR codes; students/employers verify using credential ID or scanned QR URL.
- **Phase 3**: Audit read UI for DID audit IDs, full DID audit records, and recent audit records.
- Certificate payload stored locally in the issuing browser for integrity checks on later verification.

### Backend

- Contract-read APIs and health endpoint.
- No server-side transaction signing for write routes.
- Write routes explicitly return HTTP 410 to force wallet flow.

### Contracts

- `CredentialRegistry` constructor requires AuditLog address.
- Issuer-only credential issuance enforced.
- Audit records appended on issue and verify.
- `verifyCredentialIntegrity` view used by frontend before verification.

## Known Constraints

- No true zero-knowledge protocol is implemented.
- Presentation uses hash-based proof field (`proofHash`).
- Full integrity checks require the original payload (stored in browser localStorage on the issuing machine).
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
