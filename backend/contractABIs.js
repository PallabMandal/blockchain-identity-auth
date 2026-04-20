/**
 * DID Registry Contract ABI
 * Deployed on Ganache for local testing
 */

const DIDRegistryABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_didString",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_publicKey",
                "type": "string"
            },
            {
                "internalType": "bytes32",
                "name": "_schemaHash",
                "type": "bytes32"
            }
        ],
        "name": "registerDID",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_schema",
                "type": "string"
            }
        ],
        "name": "registerSchema",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_didHash",
                "type": "bytes32"
            },
            {
                "internalType": "string",
                "name": "_newPublicKey",
                "type": "string"
            }
        ],
        "name": "updateDID",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_didHash",
                "type": "bytes32"
            }
        ],
        "name": "revokeDID",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_didHash",
                "type": "bytes32"
            }
        ],
        "name": "getDID",
        "outputs": [
            {
                "components": [
                    { "internalType": "address", "name": "owner", "type": "address" },
                    { "internalType": "string", "name": "didString", "type": "string" },
                    { "internalType": "string", "name": "publicKey", "type": "string" },
                    { "internalType": "uint256", "name": "created", "type": "uint256" },
                    { "internalType": "uint256", "name": "updated", "type": "uint256" },
                    { "internalType": "bool", "name": "active", "type": "bool" },
                    { "internalType": "bytes32", "name": "schemaHash", "type": "bytes32" }
                ],
                "internalType": "struct DIDRegistry.DIDDocument",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_address",
                "type": "address"
            }
        ],
        "name": "getDIDFromAddress",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_didHash",
                "type": "bytes32"
            }
        ],
        "name": "isDIDActive",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "didHash",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "didString",
                "type": "string"
            }
        ],
        "name": "DIDCreated",
        "type": "event"
    }
];

const CredentialRegistryABI = [
    {
        "inputs": [
            { "internalType": "bytes32", "name": "_issuerDID", "type": "bytes32" },
            { "internalType": "bytes32", "name": "_subjectDID", "type": "bytes32" },
            { "internalType": "string", "name": "_credentialType", "type": "string" },
            { "internalType": "bytes32", "name": "_credentialHash", "type": "bytes32" },
            { "internalType": "uint256", "name": "_expiryDays", "type": "uint256" }
        ],
        "name": "issueCredential",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "_credentialId", "type": "bytes32" }
        ],
        "name": "verifyCredential",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "_credentialId", "type": "bytes32" }
        ],
        "name": "revokeCredential",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "_subjectDID", "type": "bytes32" },
            { "internalType": "bytes32[]", "name": "_credentialIds", "type": "bytes32[]" },
            { "internalType": "string", "name": "_proofHash", "type": "string" }
        ],
        "name": "createPresentation",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "_presentationId", "type": "bytes32" }
        ],
        "name": "verifyPresentation",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "_credentialId", "type": "bytes32" }
        ],
        "name": "getCredential",
        "outputs": [
            {
                "components": [
                    { "internalType": "bytes32", "name": "credentialId", "type": "bytes32" },
                    { "internalType": "bytes32", "name": "issuerDID", "type": "bytes32" },
                    { "internalType": "bytes32", "name": "subjectDID", "type": "bytes32" },
                    { "internalType": "string", "name": "credentialType", "type": "string" },
                    { "internalType": "bytes32", "name": "credentialHash", "type": "bytes32" },
                    { "internalType": "uint256", "name": "issuedAt", "type": "uint256" },
                    { "internalType": "uint256", "name": "expiresAt", "type": "uint256" },
                    { "internalType": "bool", "name": "revoked", "type": "bool" },
                    { "internalType": "bool", "name": "verified", "type": "bool" }
                ],
                "internalType": "struct CredentialRegistry.VerifiableCredential",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "bytes32", "name": "credentialId", "type": "bytes32" },
            { "indexed": true, "internalType": "bytes32", "name": "issuerDID", "type": "bytes32" },
            { "indexed": true, "internalType": "bytes32", "name": "subjectDID", "type": "bytes32" },
            { "indexed": false, "internalType": "uint256", "name": "expiresAt", "type": "uint256" }
        ],
        "name": "CredentialIssued",
        "type": "event"
    }
];

const AuditLogABI = [
    {
        "inputs": [
            { "internalType": "enum AuditLog.ActionType", "name": "_action", "type": "uint8" },
            { "internalType": "bytes32", "name": "_subjectDID", "type": "bytes32" },
            { "internalType": "bytes32", "name": "_relatedEntity", "type": "bytes32" },
            { "internalType": "string", "name": "_details", "type": "string" },
            { "internalType": "string", "name": "_ipfsHash", "type": "string" }
        ],
        "name": "logAction",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "_didHash", "type": "bytes32" }
        ],
        "name": "getDIDAuditTrail",
        "outputs": [
            { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "_limit", "type": "uint256" }
        ],
        "name": "getRecentAuditRecords",
        "outputs": [
            {
                "components": [
                    { "internalType": "uint256", "name": "recordId", "type": "uint256" },
                    { "internalType": "enum AuditLog.ActionType", "name": "action", "type": "uint8" },
                    { "internalType": "address", "name": "actor", "type": "address" },
                    { "internalType": "bytes32", "name": "subjectDID", "type": "bytes32" },
                    { "internalType": "bytes32", "name": "relatedEntity", "type": "bytes32" },
                    { "internalType": "string", "name": "details", "type": "string" },
                    { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
                    { "internalType": "string", "name": "ipfsHash", "type": "string" }
                ],
                "internalType": "struct AuditLog.AuditRecord[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

module.exports = {
    DIDRegistryABI,
    CredentialRegistryABI,
    AuditLogABI
};
