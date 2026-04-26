# Start Here

Use this file as the shortest trustworthy entry point.

## Current Reality in One Minute

- **Academic Certificates**: System issues and verifies academic credentials with student info, college, course, grade, and passing year.
- **QR Codes**: Each certificate generates a QR code for easy sharing and scanning.
- **Wallet Signing**: All writes (DID registration, certificate issue/verify) are signed via MetaMask in the frontend.
- **Backend Read-Only**: Backend provides read APIs for credentials and audit trails; write APIs intentionally return HTTP 410.
- **Issuer Control**: Certificate issuance is RBAC-restricted to authorized issuers on-chain.
- **Audit Trail**: All certificate operations logged immutably; queryable per credential.
- **Chain ID**: Defaults to `1337` for Ganache.

## Minimal Run Steps

1. Start Ganache at `http://127.0.0.1:7545`.
2. From project root:

```bash
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network ganache
```

3. Configure and run backend:

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

4. Configure and run frontend:

```bash
cd ../frontend
npm install
echo REACT_APP_API_URL=http://localhost:5000/api/v1 > .env.local
npm start
```

5. Connect MetaMask to chain `1337` and import a Ganache account.

## Verification Checklist

- Phase 1 DID registration triggers MetaMask transaction.
- Phase 2 issue/verify triggers MetaMask transactions.
- Phase 3 reads audit data via backend APIs.
- `npx hardhat test` passes (`test/credential.js`).

## Read Next

- `QUICK_START.md` for command-first setup.
- `SETUP_GUIDE.md` for detailed explanations.
- `ARCHITECTURE.md` for component and flow details.
