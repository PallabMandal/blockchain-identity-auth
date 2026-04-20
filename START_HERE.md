# Start Here

Use this file as the shortest trustworthy entry point.

## Current Reality in One Minute

- Writes are signed by MetaMask in frontend (`frontend/src/App.js`).
- Backend write APIs are disabled intentionally (HTTP 410).
- Backend is used for read/health/audit endpoints.
- Credential issuance is RBAC-restricted on-chain (`isIssuer`).
- Proof terminology is hash-based (`proofHash`), not true zero-knowledge.
- Chain ID defaults to `1337`.

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
