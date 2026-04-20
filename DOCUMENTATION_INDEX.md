# Documentation Index

This index points to documentation that matches the current code implementation.

## Core Docs

1. `START_HERE.md`
   - Fastest accurate overview.
   - Use this first.

2. `QUICK_START.md`
   - Command-first setup/run instructions.
   - Includes API behavior notes (active reads, disabled writes).

3. `SETUP_GUIDE.md`
   - Detailed setup and component-level behavior.
   - Includes current contract and backend/frontend flow details.

4. `ARCHITECTURE.md`
   - Architecture and trust/signing model.
   - Documents RBAC, AuditLog integration, and deployment wiring.

5. `README.md`
   - Full project guide and troubleshooting.

6. `PROJECT_SUMMARY.md`
   - Compact status and capability snapshot.

## Accuracy Guarantees for This Doc Set

These markdown files are aligned to code currently present in this repository:

- Frontend signs writes via MetaMask.
- Backend write routes are disabled (HTTP 410).
- Backend read endpoints remain active.
- Credential issuance is issuer-RBAC protected.
- Proof terminology is hash-based (`proofHash`).
- Chain ID defaults are 1337.

If code changes, re-validate docs before presenting externally.
