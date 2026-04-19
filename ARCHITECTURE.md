# System Architecture & Design Explanation

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USERS (Multi-Party System)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   User       │  │   Issuer     │  │   Verifier   │       │
│  │ (Holder)     │  │ (Provider)   │  │ (Service)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────┬──────────────────┬─────────────────────┬────────────┘
         │                  │                     │
         │ MetaMask        │ MetaMask           │ MetaMask
         │                  │                     │
┌────────┴────────────────────┴─────────────────────┴────────────┐
│                     FRONTEND LAYER (React)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  User Interface (Three Phases)                           │  │
│  │  - Phase 1: DID Registration & Credential Issuance      │  │
│  │  - Phase 2: Credential Authentication & Verification    │  │
│  │  - Phase 3: Access Control & Audit Trail               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │ HTTPS/REST API                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                    BACKEND LAYER (Node.js/Express)               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Server (:5000)                                      │   │
│  │  ├─ Request Validation                                   │   │
│  │  ├─ Smart Contract Interface                             │   │
│  │  ├─ Transaction Management                               │   │
│  │  └─ Response Formatting                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │ Ethers.js                           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│              BLOCKCHAIN LAYER (Ethereum/Ganache)                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Smart Contracts                                         │   │
│  │  ┌──────────────────┐  ┌──────────────────┐             │   │
│  │  │  DIDRegistry     │  │CredentialRegistry              │   │
│  │  ├─ Register DID    │  ├─ Issue Credential              │   │
│  │  ├─ Update DID      │  ├─ Verify Credential             │   │
│  │  ├─ Revoke DID      │  ├─ Revoke Credential             │   │
│  │  └─ Schema Mgmt     │  └─ Presentations                 │   │
│  │  └──────────────────┘  └──────────────────┘             │   │
│  │  ┌──────────────────┐                                    │   │
│  │  │  AuditLog        │                                    │   │
│  │  ├─ Log Actions     │                                    │   │
│  │  ├─ Audit Trail     │                                    │   │
│  │  └─ Compliance      │                                    │   │
│  │  └──────────────────┘                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Blockchain State Storage                                │   │
│  │  ├─ DIDs (User Identities)                               │   │
│  │  ├─ Credentials (Issued Claims)                          │   │
│  │  ├─ Presentations (Proof Bundles)                        │   │
│  │  ├─ Audit Records (Transaction Log)                      │   │
│  │  └─ Schemas (Credential Structures)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Three-Phase Workflow

### PHASE 1: Registration & Issuance

**Purpose**: Establish digital identities and issue verifiable credentials

**Participants**:

- User (DID Holder)
- Issuer (e.g., Government, Institution)
- Blockchain

**Process Flow**:

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 1: Registration & Issuance                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Step 1: Register Schema                                 │
│  ─────────────────────────                               │
│  Issuer: "I will issue credentials with this structure"  │
│  Action: registerSchema()                                │
│  Result: Schema hash stored on blockchain                │
│                                                           │
│  Step 2: User Registers DID                              │
│  ─────────────────────────────                           │
│  User: "Create a unique identifier for me"               │
│  Input:                                                   │
│    - DID String: did:blockchain:user123                  │
│    - Public Key: User's public key                       │
│    - Schema Hash: Reference to schema                    │
│  Action: registerDID()                                   │
│  Storage:                                                 │
│    {                                                      │
│      "owner": "0x7a5C...",                               │
│      "didString": "did:blockchain:user123",              │
│      "publicKey": "-----BEGIN PUBLIC KEY-----...",       │
│      "created": 1713607890,                              │
│      "active": true                                      │
│    }                                                      │
│                                                           │
│  Step 3: Issuer Issues Credential                        │
│  ───────────────────────────────────                     │
│  Issuer: "User123 is verified. Here's a credential"     │
│  Action: issueCredential()                               │
│  Input:                                                   │
│    - Subject: User's DID                                 │
│    - Type: "GovernmentID", "EducationCert", etc.         │
│    - Encrypted Data Hash: IPFS or storage reference      │
│    - Expiry: 365 days from now                           │
│  Storage:                                                 │
│    {                                                      │
│      "credentialId": "0x5d4e...",                        │
│      "issuerDID": "0x123a...",                           │
│      "subjectDID": "0x7a5c...",                          │
│      "credentialType": "GovernmentID",                   │
│      "issuedAt": 1713607890,                             │
│      "expiresAt": 1745143890,                            │
│      "verified": false                                   │
│    }                                                      │
│                                                           │
│  On-Chain Storage:                                        │
│  ─────────────────                                        │
│  ✓ DID Document (owner, keys, metadata)                  │
│  ✓ Schema Hash (credential template)                     │
│  ✓ Credential Metadata (issuer, subject, expiry)         │
│  ✓ Encrypted credential data reference                   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Smart Contract: DIDRegistry**

```solidity
// Store DID document on blockchain
struct DIDDocument {
    address owner;           // Who owns this DID
    string didString;        // "did:blockchain:123abc"
    string publicKey;        // PEM-encoded public key
    uint256 created;         // When DID was created
    uint256 updated;         // Last update timestamp
    bool active;             // Is DID currently valid?
    bytes32 schemaHash;      // Reference to schema
}

// Mappings for quick lookups
mapping(bytes32 => DIDDocument) public dids;      // didHash → document
mapping(address => bytes32) public addressToDID;  // address → didHash
mapping(bytes32 => bool) public schemaRegistry;   // schemaHash → exists
```

---

### PHASE 2: Authentication & Verification

**Purpose**: Verify credentials using zero-knowledge proofs without revealing sensitive data

**Participants**:

- User (Credential Holder)
- Verifier (e.g., Service Provider)
- Blockchain

**Process Flow**:

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 2: Authentication & Verification                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Step 1: User Presents Credential (Zero-Knowledge)      │
│  ─────────────────────────────────────────────────       │
│  User: "I have a valid government ID, but I won't       │
│         show you the actual document"                    │
│  Action: createPresentation()                            │
│  Input:                                                   │
│    - Credential IDs to present                           │
│    - Zero-Knowledge Proof                                │
│      (Proves: I have valid credential WITHOUT           │
│               revealing what it contains)                │
│  Note: Sensitive data stays private!                     │
│                                                           │
│  Zero-Knowledge Proof Example:                           │
│  ──────────────────────────────                          │
│  Claim: "I'm over 18"                                    │
│  Traditional: Show driver's license (reveals DOB)        │
│  Zero-Knowledge: Proof that DOB is before cutoff date   │
│                  (DOB stays private!)                    │
│                                                           │
│  Step 2: Verifier Checks Blockchain                      │
│  ─────────────────────────────────                       │
│  Verifier: "Let me verify this credential on blockchain" │
│  Action: verifyCredential()                              │
│  Checks:                                                  │
│    ✓ Credential exists on blockchain                    │
│    ✓ Issuer is trustworthy (issuer DID active)          │
│    ✓ Credential not revoked                             │
│    ✓ Credential not expired                             │
│    ✓ Zero-knowledge proof is valid                      │
│                                                           │
│  Step 3: Grant or Deny Access                            │
│  ─────────────────────────────                           │
│  Verifier: Based on verification result...               │
│  Action: Grant access OR Deny access                     │
│  Result Stored:                                           │
│    {                                                      │
│      "presentationId": "0x9a2b...",                      │
│      "verified": true,  // or false                      │
│      "timestamp": 1713607950,                            │
│      "verifier": "0x88f2..."                             │
│    }                                                      │
│                                                           │
│  Complete Transaction:                                    │
│  ───────────────────                                      │
│  User → "I have credential X (ZK proof)"                 │
│         ↓                                                  │
│  Verifier → Check X on blockchain                        │
│             Verify proof                                  │
│         ↓                                                  │
│  Blockchain → Confirm: X is valid, not revoked           │
│         ↓                                                  │
│  Result → ✅ Access Granted                              │
│           or ❌ Access Denied                             │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Smart Contract: CredentialRegistry**

```solidity
// Store verifiable credential
struct VerifiableCredential {
    bytes32 credentialId;      // Unique ID
    bytes32 issuerDID;         // Who issued it
    bytes32 subjectDID;        // For whom
    string credentialType;     // "GovernmentID", etc.
    bytes32 credentialHash;    // IPFS reference (not full data)
    uint256 issuedAt;          // Issue timestamp
    uint256 expiresAt;         // Expiration timestamp
    bool revoked;              // Is it revoked?
    bool verified;             // Is it verified?
}

// Store verifiable presentation (proof)
struct VerifiablePresentation {
    bytes32 presentationId;    // Unique ID
    bytes32 subjectDID;        // Who presented
    bytes32[] credentialIds;   // Which credentials
    string zeroKnowledgeProof; // Privacy-preserving proof
    uint256 presentedAt;       // When presented
    bool verified;             // Is proof valid?
}
```

**Privacy Guarantee**:

- Actual credential data never on blockchain
- Only hashes stored for verification
- Zero-knowledge proofs prove ownership/validity
- Sensitive PII remains private with user

---

### PHASE 3: Access & Audit

**Purpose**: Grant/deny access and maintain immutable audit trail for compliance

**Participants**:

- Service Provider (Access Controller)
- Blockchain (Immutable Record)
- Auditors (Compliance Checkers)

**Process Flow**:

```
┌─────────────────────────────────────────────────────────┐
│ PHASE 3: Access & Audit                                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Access Decision Logic:                                  │
│  ────────────────────                                    │
│  IF credential_verified AND NOT expired                  │
│    THEN → Grant Access                                   │
│  ELSE → Deny Access                                      │
│                                                           │
│  Example Decision Tree:                                  │
│  ──────────────────────                                  │
│        Start                                              │
│          ↓                                                │
│    Credential Valid?                                     │
│    ├─ NO → ❌ Deny Access                                │
│    └─ YES ↓                                              │
│       Issuer Trusted?                                    │
│       ├─ NO → ❌ Deny Access                              │
│       └─ YES ↓                                           │
│          Expired?                                        │
│          ├─ YES → ❌ Deny Access                          │
│          └─ NO ↓                                         │
│             Revoked?                                     │
│             ├─ YES → ❌ Deny Access                       │
│             └─ NO ↓                                      │
│                ✅ Grant Access                           │
│                                                           │
│  Immutable Audit Trail:                                  │
│  ─────────────────────                                   │
│  Every action logged to blockchain:                      │
│                                                           │
│  Action Types:                                           │
│  ├─ DID_CREATED      - User registered DID              │
│  ├─ DID_UPDATED      - User updated DID                 │
│  ├─ DID_REVOKED      - User revoked DID                 │
│  ├─ CREDENTIAL_ISSUED - Issuer issued credential        │
│  ├─ CREDENTIAL_VERIFIED - Verifier verified credential  │
│  ├─ CREDENTIAL_REVOKED - Issuer revoked credential      │
│  ├─ ACCESS_GRANTED  - User given access                 │
│  └─ ACCESS_DENIED   - User denied access                │
│                                                           │
│  Audit Record Example:                                   │
│  ────────────────────                                    │
│  {                                                        │
│    "recordId": 42,                                       │
│    "action": "ACCESS_GRANTED",                           │
│    "actor": "0x88f2...",         // Verifier             │
│    "subjectDID": "0x7a5c...",    // User                 │
│    "timestamp": 1713607950,       // When                │
│    "details": "User granted access to service",          │
│    "txHash": "0x9a2b..."         // Blockchain proof    │
│  }                                                        │
│                                                           │
│  Compliance Benefits:                                    │
│  ──────────────────                                      │
│  ✓ Complete audit trail (all actions logged)            │
│  ✓ Immutable records (cannot be altered)                │
│  ✓ Timestamp proof (exact time of action)               │
│  ✓ Actor identification (who performed action)          │
│  ✓ Regulatory compliance (GDPR, etc.)                   │
│  ✓ Dispute resolution (proof of access history)         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Smart Contract: AuditLog**

```solidity
// Immutable audit record
struct AuditRecord {
    uint256 recordId;          // Sequential ID
    ActionType action;         // Type of action
    address actor;             // Who did it
    bytes32 subjectDID;        // Affected DID
    bytes32 relatedEntity;     // Related ID (credential, etc.)
    string details;            // Description
    uint256 timestamp;         // When it happened
    string ipfsHash;           // Link to detailed data
}

// Action types (8-bit enum)
enum ActionType {
    DID_CREATED,               // 0
    DID_UPDATED,               // 1
    DID_REVOKED,               // 2
    CREDENTIAL_ISSUED,         // 3
    CREDENTIAL_VERIFIED,       // 4
    CREDENTIAL_REVOKED,        // 5
    PRESENTATION_CREATED,      // 6
    PRESENTATION_VERIFIED,     // 7
    ACCESS_GRANTED,            // 8
    ACCESS_DENIED              // 9
}
```

---

## 🔐 Security Architecture

### Encryption & Privacy Layers

```
┌─────────────────────────────────────────────────────────┐
│ User Device (Client-Side Encryption)                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Private Key Storage                                  │
│     ├─ MetaMask: Browser-based secure storage           │
│     ├─ Never transmitted to server                       │
│     ├─ Only used for transaction signing                │
│     └─ User retains full control                        │
│                                                           │
│  2. Data Encryption                                      │
│     ├─ Sensitive data encrypted before transmission      │
│     ├─ Only hash stored on blockchain                    │
│     ├─ Full data stored off-chain (IPFS)                │
│     └─ User retains encryption keys                     │
│                                                           │
│  3. Zero-Knowledge Proofs                                │
│     ├─ Prove knowledge without revealing                │
│     ├─ Privacy-preserving verification                   │
│     ├─ Verifier only learns proof is valid              │
│     └─ Sensitive attributes remain hidden               │
│                                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Blockchain (Transaction Verification)                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Digital Signatures                                   │
│     ├─ Every transaction signed with private key        │
│     ├─ Signature proves ownership                       │
│     ├─ Cannot be forged                                 │
│     └─ Verifiable by public key                         │
│                                                           │
│  2. Immutable Records                                    │
│     ├─ Once committed, cannot be altered               │
│     ├─ Cryptographic hash chain                         │
│     ├─ Changing one block invalidates all after        │
│     └─ Guaranteed data integrity                        │
│                                                           │
│  3. Consensus Mechanism                                  │
│     ├─ Multiple validators (Ganache: local)            │
│     ├─ Agreement required for acceptance                │
│     ├─ Prevents fraudulent transactions                │
│     └─ Ensures network security                        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Access Control Model

```
┌──────────────────────────────────────────────────────────┐
│ Three-Tier Access Control                                │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Tier 1: Authentication (Identity Verification)          │
│  ────────────────────────────────────────────             │
│  Question: "Are you who you claim to be?"                │
│  Method: Digital signature with private key              │
│  Proof: Blockchain transaction signature                │
│  Result: Verified identity (DID)                         │
│                                                            │
│  Tier 2: Authorization (Permission Check)                │
│  ─────────────────────────────────────────               │
│  Question: "Do you have the required credential?"        │
│  Method: Verify credential on blockchain                 │
│  Checks:                                                  │
│    ✓ Credential exists                                   │
│    ✓ Issued to your DID                                  │
│    ✓ Not expired                                         │
│    ✓ Not revoked                                         │
│  Result: Permission granted or denied                    │
│                                                            │
│  Tier 3: Audit (Accountability)                          │
│  ─────────────────────────────────                       │
│  Question: "What happened and when?"                     │
│  Method: Immutable audit log                             │
│  Records:                                                 │
│    ✓ Who accessed (actor address)                        │
│    ✓ What they accessed (resource)                       │
│    ✓ When they accessed (timestamp)                      │
│    ✓ If access was granted or denied                    │
│  Result: Complete audit trail for compliance             │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

---

## 📡 Data Flow Examples

### Example 1: Complete DID Registration Flow

```
USER BROWSER (React Frontend)
  │
  ├─ Input: DID="did:blockchain:alice", PublicKey="-----BEGIN..."
  │
  └─→ Component: Phase1Component.jsx
      └─→ Call: APIService.registerDID()
          │
          └─→ HTTP POST request
              │
              └──────────────────────────→ BACKEND (Express Server)
                                          │
                                          ├─ Route: POST /api/v1/did/register
                                          │
                                          ├─ Validate input
                                          │  └─ Check didString not empty
                                          │  └─ Check publicKey format
                                          │  └─ Check schemaHash exists
                                          │
                                          ├─ Prepare transaction
                                          │  └─ Contract: DIDRegistry
                                          │  └─ Function: registerDID()
                                          │  └─ Parameters: {didString, publicKey, schemaHash}
                                          │
                                          ├─ Estimate gas
                                          │  └─ Calculate required gas
                                          │  └─ Get current gas price
                                          │
                                          ├─ Sign transaction
                                          │  └─ Account: 0x7a5C... (from .env)
                                          │  └─ Private key: 0x123a... (from .env)
                                          │  └─ Nonce: Current account nonce
                                          │
                                          └─→ GANACHE BLOCKCHAIN (Ethereum)
                                              │
                                              ├─ Receive signed transaction
                                              │
                                              ├─ Execute smart contract
                                              │  └─ Contract: DIDRegistry.sol
                                              │  └─ Function: registerDID()
                                              │
                                              ├─ Contract logic:
                                              │  1. Hash DID string
                                              │     didHash = keccak256("did:blockchain:alice")
                                              │
                                              │  2. Validate schema registered
                                              │     require(schemaRegistry[schemaHash])
                                              │
                                              │  3. Validate DID doesn't exist
                                              │     require(dids[didHash].owner == 0x0)
                                              │
                                              │  4. Store DID document
                                              │     dids[didHash] = {
                                              │       owner: msg.sender,
                                              │       didString: "did:blockchain:alice",
                                              │       publicKey: "-----BEGIN...",
                                              │       created: block.timestamp,
                                              │       active: true,
                                              │       schemaHash: 0x...
                                              │     }
                                              │
                                              │  5. Update address mapping
                                              │     addressToDID[msg.sender] = didHash
                                              │
                                              │  6. Emit event
                                              │     event DIDCreated(didHash, owner, didString)
                                              │
                                              ├─ Create transaction receipt
                                              │  └─ txHash: 0x9a2b...
                                              │  └─ blockNumber: 42
                                              │  └─ gasUsed: 150,000
                                              │
                                              └─→ Return to Backend
                                                  │
                                                  └─ Receipt confirmation
                                                     ├─ transactionHash
                                                     ├─ blockNumber
                                                     └─ status: success
```

Backend receives confirmation and:

```javascript
// backend/routes.js
response.json({
  success: true,
  didHash: "0x5f4d...", // Computed from didString
  didString: "did:blockchain:alice",
  transactionHash: "0x9a2b...", // From blockchain
  message: "DID registered successfully",
});
```

Frontend receives response and:

```javascript
// frontend/src/App.js
// Display success message to user
setMessage("✅ Success: DID registered!");

// Clear form fields
setDidString("");
setPublicKey("");

// Update UI state
// Show success notification
```

---

## 💾 Data Storage Architecture

### Blockchain Storage (Permanent, Immutable)

```
DIDRegistry Contract:
├─ dids[] mapping
│  └─ Stores: { owner, didString, publicKey, created, updated, active, schemaHash }
│  └─ Access: O(1) by didHash
│  └─ Cost: ~200KB per DID (on mainnet: ~$200 at current gas prices)
│
├─ addressToDID[] mapping
│  └─ Stores: Address → DID hash
│  └─ Access: O(1) by address
│  └─ Used for: Quick lookup by wallet address
│
└─ schemaRegistry[] mapping
   └─ Stores: Schema hash → true/false
   └─ Used for: Validate schema exists before DID registration

CredentialRegistry Contract:
├─ credentials[] mapping
│  └─ Stores: { credentialId, issuerDID, subjectDID, type, hash, issued, expired, revoked, verified }
│  └─ Access: O(1) by credentialId
│  └─ Note: Only metadata stored, not actual credential data
│
├─ presentations[] mapping
│  └─ Stores: { presentationId, subjectDID, credentialIds[], zk_proof, presented, verified }
│  └─ Access: O(1) by presentationId
│  └─ Note: Proof of presentation, not proof data
│
└─ revokedCredentials[] mapping
   └─ Stores: Credential hash → true/false
   └─ Used for: Quick revocation check (O(1) lookup)

AuditLog Contract:
├─ auditRecords[] mapping
│  └─ Stores: { recordId, action, actor, subjectDID, relatedEntity, details, timestamp, ipfsHash }
│  └─ Linear storage: recordId 1, 2, 3, ...
│  └─ Access: O(1) by recordId
│
├─ didAuditTrail[] mapping
│  └─ Stores: DID hash → [recordId1, recordId2, ...]
│  └─ Used for: Get all records for specific DID
│
└─ credentialAuditTrail[] mapping
   └─ Stores: Credential hash → [recordId1, recordId2, ...]
   └─ Used for: Get all records for specific credential
```

### Off-Chain Storage (Optional)

```
IPFS (InterPlanetary File System):
├─ Credential Data
│  ├─ Encrypted with user's key
│  ├─ Referenced by hash on blockchain
│  ├─ User retains encryption key
│  └─ Only user can decrypt
│
└─ Additional Metadata
   ├─ Detailed credential fields
   ├─ Issuer information
   ├─ Verification documents
   └─ Proof of credential

Database (Backend):
├─ User Sessions (temporary)
├─ API Logs (for debugging)
├─ Caching Layer (for performance)
└─ Analytics Data (anonymized)
```

---

## ⚡ Performance Considerations

### Gas Consumption (Blockchain Costs)

```
Operation                  Gas Cost    Approximate Cost (at 2 Gwei)
─────────────────────────────────────────────────────────────────
Register DID               100,000     $0.0021 (on Mainnet)
Issue Credential            80,000     $0.0017
Verify Credential            50,000     $0.0011
Create Presentation          70,000     $0.0015
Log Audit Entry              40,000     $0.0009
─────────────────────────────────────────────────────────────────

Optimization Strategies:
├─ Batch operations: Multiple credentials in one transaction
├─ Storage optimization: Use bytes32 instead of strings where possible
├─ Event logs: Emit events instead of storing unnecessary data
└─ Off-chain storage: Keep PII off-chain (IPFS), only store hashes
```

### Response Time Architecture

```
PHASE 1: DID Registration (2-5 seconds)
├─ Frontend form submission: <100ms
├─ Backend validation: <100ms
├─ Web3 transaction signing: <500ms
├─ Ganache mining: 1-3 seconds (local network)
└─ Response to user: <100ms

PHASE 2: Credential Verification (<1 second)
├─ Frontend request: <50ms
├─ Backend contract call: <100ms (read-only, no mining)
├─ Blockchain state lookup: <100ms
└─ Response to user: <50ms

PHASE 3: Audit Retrieval (<500ms)
├─ Frontend request: <50ms
├─ Backend query: <100ms (read-only)
├─ Data formatting: <100ms
└─ Response to user: <50ms
```

---

## 🔌 Integration Points

### MetaMask Integration

```
Window.ethereum API
├─ eth_requestAccounts: Request user access
├─ eth_sendTransaction: Send transactions
├─ eth_sign: Sign messages
├─ eth_accounts: Get connected accounts
└─ eth_chainId: Get current network
```

### Web3.js Integration

```
Web3 Instance
├─ web3.eth.getAccounts()
├─ web3.eth.sendSignedTransaction()
├─ web3.eth.Contract(ABI, address)
├─ web3.utils.keccak256()
└─ web3.eth.estimateGas()
```

### Express.js API

```
REST Endpoints
├─ POST /api/v1/did/register
├─ GET /api/v1/did/:didHash
├─ POST /api/v1/credential/issue
├─ GET /api/v1/credential/:credentialId
├─ GET /api/v1/audit/recent/:limit
└─ GET /api/v1/health
```

---

## 📊 System Scalability

### Current Architecture (Ganache Local)

```
Throughput:
├─ Transactions per block: Unlimited (local network)
├─ Block time: 0-5 seconds
├─ Theoretical TPS: 50-100 TPS
└─ Real-world: 10-50 TPS (with batching)

Limitations:
├─ Single machine execution
├─ No horizontal scaling
├─ Suitable for: Development, testing, small deployments
└─ Not suitable for: High-volume production use
```

### Production Scaling (Ethereum L2)

```
Polygon Network (Recommended):
├─ TPS: 7,000+ per second
├─ Cost: 10,000x cheaper than Mainnet
├─ Finality: ~2 seconds
├─ Compatibility: 100% Ethereum compatible
└─ Suitable for: Large-scale identity systems

Arbitrum Network (Alternative):
├─ TPS: 40,000+ per second
├─ Cost: 100-200x cheaper than Mainnet
├─ Finality: ~1 second
├─ Compatibility: Full EVM compatibility
└─ Suitable for: Ultra-high-volume systems
```

---

## 🛡️ Security Analysis

### Threat Model & Mitigations

```
Threat 1: Private Key Compromise
─────────────────────────────────
Risk: Attacker gains private key
Impact: Can impersonate user, revoke DIDs
Mitigation:
  ✓ MetaMask: Browser-based key storage
  ✓ Never transmit private key to server
  ✓ Hardware wallet support available
  ✓ Key rotation capability

Threat 2: Credential Forgery
─────────────────────────────
Risk: Attacker creates fake credential
Impact: Unauthorized access
Mitigation:
  ✓ Digital signature verification
  ✓ Issuer DID verification
  ✓ On-chain revocation registry
  ✓ Zero-knowledge proof validation

Threat 3: Man-in-the-Middle (MITM)
──────────────────────────────────
Risk: Attacker intercepts API communication
Impact: Credential theft, impersonation
Mitigation:
  ✓ Use HTTPS/TLS in production
  ✓ Certificate pinning available
  ✓ Blockchain validation (immutable)
  ✓ Signature verification

Threat 4: Replay Attacks
──────────────────────────
Risk: Attacker reuses old transaction
Impact: Repeated credential verification
Mitigation:
  ✓ Nonce tracking (Ethereum standard)
  ✓ Timestamp validation
  ✓ One-time use proofs
  ✓ Transaction hash verification

Threat 5: Smart Contract Vulnerability
───────────────────────────────────────
Risk: Bug in contract code
Impact: Stolen funds, unauthorized access
Mitigation:
  ✓ Code audit recommended
  ✓ OpenZeppelin patterns used
  ✓ Access controls implemented
  ✓ Event logging for monitoring
```

---

## 📈 Deployment Readiness Checklist

- [ ] Smart contracts audited
- [ ] Backend API secured (HTTPS, rate limiting)
- [ ] Frontend CORS configured
- [ ] Environment variables secured
- [ ] MetaMask testnet configured
- [ ] Database backups setup
- [ ] Monitoring and alerting configured
- [ ] Incident response plan created
- [ ] Compliance review completed (GDPR, etc.)
- [ ] Load testing performed
- [ ] Documentation complete
- [ ] Team training completed

---

**This architecture provides a robust, scalable, and secure identity and credential management system for blockchain-based authentication!**
