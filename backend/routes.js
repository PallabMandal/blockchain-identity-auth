const express = require('express');
const { ethers } = require('ethers');
const config = require('./config');
const { DIDRegistryABI, CredentialRegistryABI, AuditLogABI } = require('./contractABIs');

const router = express.Router();

// Initialize Web3 contract instances
let didRegistry, credentialRegistry, auditLog;

function writeOperationDisabled(res, operation) {
    return res.status(410).json({
        success: false,
        error: `${operation} must be submitted by the client wallet via MetaMask. Backend write signing is disabled.`
    });
}

function isBytes32(value) {
    return typeof value === 'string' && ethers.isHexString(value, 32);
}

const AUDIT_ACTION_LABELS = [
    'DID_CREATED',
    'DID_UPDATED',
    'DID_REVOKED',
    'CREDENTIAL_ISSUED',
    'CREDENTIAL_VERIFIED',
    'CREDENTIAL_REVOKED',
    'PRESENTATION_CREATED',
    'PRESENTATION_VERIFIED',
    'ACCESS_GRANTED',
    'ACCESS_DENIED'
];

async function enrichAuditRecord(record) {
    let didString = '';
    const subjectDID = record.subjectDID;

    if (didRegistry && subjectDID && subjectDID !== ethers.ZeroHash) {
        try {
            const didDoc = await didRegistry.getDID(subjectDID);
            if (didDoc?.owner && didDoc.owner !== ethers.ZeroAddress) {
                didString = didDoc.didString || '';
            }
        } catch (_) {
            // Keep didString empty if DID lookup fails.
        }
    }

    const action = Number(record.action);

    return {
        recordId: Number(record.recordId),
        action,
        actionLabel: AUDIT_ACTION_LABELS[action] || `UNKNOWN_ACTION_${action}`,
        actor: record.actor,
        subjectDID: record.subjectDID,
        relatedEntity: record.relatedEntity,
        timestamp: Number(record.timestamp),
        details: record.details,
        ipfsHash: record.ipfsHash,
        didString
    };
}

// Middleware to initialize contracts
router.use((req, res, next) => {
    if (!didRegistry && config.didRegistryAddress) {
        didRegistry = new ethers.Contract(
            config.didRegistryAddress,
            DIDRegistryABI,
            config.provider
        );
    }
    if (!credentialRegistry && config.credentialRegistryAddress) {
        credentialRegistry = new ethers.Contract(
            config.credentialRegistryAddress,
            CredentialRegistryABI,
            config.provider
        );
    }
    if (!auditLog && config.auditLogAddress) {
        auditLog = new ethers.Contract(
            config.auditLogAddress,
            AuditLogABI,
            config.provider
        );
    }
    next();
});

// PHASE 1: Registration & Issuance Routes

/**
 * Register a schema
 * POST /api/v1/did/register-schema
 */
router.post('/did/register-schema', async (req, res) => {
    try {
        return writeOperationDisabled(res, 'Schema registration');
    } catch (error) {
        console.error('Error registering schema:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Register a new DID
 * POST /api/v1/did/register
 */
router.post('/did/register', async (req, res) => {
    try {
        return writeOperationDisabled(res, 'DID registration');
    } catch (error) {
        console.error('Error registering DID:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get DID information
 * GET /api/v1/did/:didHash
 */
router.get('/did/:didHash', async (req, res) => {
    try {
        const { didHash } = req.params;

        if (!didRegistry) {
            return res.status(500).json({ error: 'DIDRegistry contract not initialized' });
        }

        const didDoc = await didRegistry.getDID(didHash);

        if (!didDoc || !didDoc.owner || didDoc.owner === '0x0000000000000000000000000000000000000000') {
            return res.status(404).json({ error: 'DID not found' });
        }

        res.json({
            success: true,
            did: {
                owner: didDoc.owner,
                didString: didDoc.didString,
                publicKey: didDoc.publicKey,
                created: parseInt(didDoc.created),
                updated: parseInt(didDoc.updated),
                active: didDoc.active,
                schemaHash: didDoc.schemaHash
            }
        });
    } catch (error) {
        console.error('Error fetching DID:', error);
        res.status(500).json({ error: error.message });
    }
});

// PHASE 2: Authentication & Verification Routes

/**
 * Issue a verifiable credential
 * POST /api/v1/credential/issue
 */
router.post('/credential/issue', async (req, res) => {
    try {
        return writeOperationDisabled(res, 'Credential issuance');
    } catch (error) {
        console.error('Error issuing credential:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Verify a credential
 * POST /api/v1/credential/verify
 */
router.post('/credential/verify', async (req, res) => {
    try {
        return writeOperationDisabled(res, 'Credential verification');
    } catch (error) {
        console.error('Error verifying credential:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get credential details
 * GET /api/v1/credential/:credentialId
 */
router.get('/credential/:credentialId', async (req, res) => {
    try {
        const { credentialId } = req.params;

        if (!credentialRegistry) {
            return res.status(500).json({ error: 'CredentialRegistry contract not initialized' });
        }

        if (!isBytes32(credentialId)) {
            return res.status(400).json({
                error: 'Invalid credentialId. Expected a 32-byte hex hash (0x + 64 hex chars), not a contract address.'
            });
        }

        const credential = await credentialRegistry.getCredential(credentialId);

        if (!credential || !credential.credentialId || credential.credentialId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
            return res.status(404).json({ error: 'Credential not found' });
        }

        res.json({
            success: true,
            credential: {
                credentialId: credential.credentialId,
                issuerDID: credential.issuerDID,
                subjectDID: credential.subjectDID,
                credentialType: credential.credentialType,
                credentialHash: credential.credentialHash,
                issuedAt: parseInt(credential.issuedAt),
                expiresAt: parseInt(credential.expiresAt),
                revoked: credential.revoked,
                verified: credential.verified
            }
        });
    } catch (error) {
        console.error('Error fetching credential:', error);
        res.status(500).json({ error: error.message });
    }
});

// PHASE 3: Access & Audit Routes

/**
 * Get audit trail record IDs for a DID (minimal latency path)
 * GET /api/v1/audit/did/:didHash/ids
 */
router.get('/audit/did/:didHash/ids', async (req, res) => {
    try {
        const { didHash } = req.params;

        if (!auditLog) {
            return res.status(500).json({ error: 'AuditLog contract not initialized' });
        }

        const auditTrail = await auditLog.getDIDAuditTrail(didHash);

        res.json({
            success: true,
            didHash,
            auditRecords: auditTrail.map((id) => parseInt(id))
        });
    } catch (error) {
        console.error('Error fetching DID audit IDs:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get full audit trail records for a DID (enriched path)
 * GET /api/v1/audit/did/:didHash
 */
router.get('/audit/did/:didHash', async (req, res) => {
    try {
        const { didHash } = req.params;

        if (!auditLog) {
            return res.status(500).json({ error: 'AuditLog contract not initialized' });
        }

        const auditTrail = await auditLog.getDIDAuditTrail(didHash);
        const recordIds = auditTrail.map((id) => parseInt(id));
        const records = await Promise.all(
            recordIds.map(async (recordId) => enrichAuditRecord(
                await auditLog.getAuditRecord(recordId)
            ))
        );

        res.json({
            success: true,
            didHash: didHash,
            auditRecords: recordIds,
            records
        });
    } catch (error) {
        console.error('Error fetching audit trail:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get full audit trail records for a credential
 * GET /api/v1/audit/credential/:credentialId
 */
router.get('/audit/credential/:credentialId', async (req, res) => {
    try {
        const { credentialId } = req.params;

        if (!auditLog) {
            return res.status(500).json({ error: 'AuditLog contract not initialized' });
        }

        if (!isBytes32(credentialId)) {
            return res.status(400).json({
                error: 'Invalid credentialId. Expected a 32-byte hex hash (0x + 64 hex chars).'
            });
        }

        const recordIds = await auditLog.getCredentialAuditTrail(credentialId);

        const records = await Promise.all(
            recordIds.map(async (id) => enrichAuditRecord(
                await auditLog.getAuditRecord(id)
            ))
        );

        res.json({
            success: true,
            credentialId,
            records
        });
    } catch (error) {
        console.error('Error fetching credential audit trail:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get recent audit records
 * GET /api/v1/audit/recent/:limit
 */
router.get('/audit/recent/:limit', async (req, res) => {
    try {
        const { limit } = req.params;

        if (!auditLog) {
            return res.status(500).json({ error: 'AuditLog contract not initialized' });
        }

        const records = await auditLog.getRecentAuditRecords(limit);

        const enrichedRecords = await Promise.all(records.map(enrichAuditRecord));

        res.json({
            success: true,
            records: enrichedRecords
        });
    } catch (error) {
        console.error('Error fetching audit records:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Health check
 * GET /api/v1/health
 */
router.get('/health', async (req, res) => {
    try {
        const blockNumber = await config.provider.getBlockNumber();
        const feeData = await config.provider.getFeeData();
        const gasPrice = feeData.gasPrice ? `${ethers.formatUnits(feeData.gasPrice, 'gwei')} Gwei` : 'unavailable';

        res.json({
            success: true,
            status: 'running',
            blockchain: {
                connected: true,
                blockNumber: blockNumber,
                gasPrice: gasPrice
            },
            contracts: {
                didRegistry: config.didRegistryAddress || 'not deployed',
                credentialRegistry: config.credentialRegistryAddress || 'not deployed',
                auditLog: config.auditLogAddress || 'not deployed'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'error',
            error: error.message
        });
    }
});

module.exports = router;
