const express = require('express');
const { ethers } = require('ethers');
const config = require('./config');
const { DIDRegistryABI, CredentialRegistryABI, AuditLogABI } = require('./contractABIs');

const router = express.Router();

// Initialize Web3 contract instances
let didRegistry, credentialRegistry, auditLog;

async function getWallet(privateKey, fromAddress) {
    if (privateKey) {
        const wallet = new ethers.Wallet(privateKey, config.provider);

        if (fromAddress && wallet.address.toLowerCase() !== fromAddress.toLowerCase()) {
            throw new Error('privateKey does not match fromAddress');
        }

        return wallet;
    }

    if (!fromAddress) {
        throw new Error('Missing fromAddress');
    }

    return await config.provider.getSigner(fromAddress);
}

function isBytes32(value) {
    return typeof value === 'string' && ethers.isHexString(value, 32);
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
        const { schema, fromAddress, privateKey } = req.body;

        if (!schema || !fromAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!didRegistry) {
            return res.status(500).json({ error: 'DIDRegistry contract not initialized' });
        }

        const wallet = await getWallet(privateKey, fromAddress);
        const schemaHash = ethers.keccak256(ethers.toUtf8Bytes(schema));

        const tx = await didRegistry.connect(wallet).registerSchema(schema);
        const receipt = await tx.wait();

        res.json({
            success: true,
            schemaHash: schemaHash,
            transactionHash: receipt.hash,
            message: 'Schema registered successfully'
        });
    } catch (error) {
        console.error('Error registering schema:', error);

        const revertMessage = error?.info?.error?.message || '';
        if (revertMessage.includes('Schema already registered')) {
            const { schema } = req.body;
            const schemaHash = ethers.keccak256(ethers.toUtf8Bytes(schema));

            return res.json({
                success: true,
                schemaHash,
                message: 'Schema already registered'
            });
        }

        res.status(500).json({ error: error.message });
    }
});

/**
 * Register a new DID
 * POST /api/v1/did/register
 */
router.post('/did/register', async (req, res) => {
    try {
        const { didString, publicKey, schemaHash, fromAddress, privateKey } = req.body;

        if (!didString || !publicKey || !schemaHash || !fromAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!didRegistry) {
            return res.status(500).json({ error: 'DIDRegistry contract not initialized' });
        }

        const wallet = await getWallet(privateKey, fromAddress);
        const didHash = ethers.keccak256(ethers.toUtf8Bytes(didString));

        const tx = await didRegistry.connect(wallet).registerDID(didString, publicKey, schemaHash);
        const receipt = await tx.wait();

        res.json({
            success: true,
            didHash: didHash,
            didString: didString,
            transactionHash: receipt.hash,
            message: 'DID registered successfully'
        });
    } catch (error) {
        console.error('Error registering DID:', error);

        const revertMessage = error?.info?.error?.message || '';
        if (revertMessage.includes('DID already exists')) {
            return res.status(409).json({
                error: 'DID already exists. Use a unique DID string (for example: did:blockchain:myuser123-2).'
            });
        }

        if (revertMessage.includes('Schema not registered')) {
            return res.status(400).json({
                error: 'Schema is not registered yet. Register schema first, then register DID.'
            });
        }

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
        const {
            issuerDID,
            subjectDID,
            credentialType,
            credentialHash,
            expiryDays,
            fromAddress,
            privateKey
        } = req.body;

        if (!issuerDID || !subjectDID || !credentialType || !credentialHash || !expiryDays || !fromAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!credentialRegistry) {
            return res.status(500).json({ error: 'CredentialRegistry contract not initialized' });
        }

        const wallet = await getWallet(privateKey, fromAddress);

        const tx = await credentialRegistry.connect(wallet).issueCredential(
            issuerDID,
            subjectDID,
            credentialType,
            credentialHash,
            expiryDays
        );

        const receipt = await tx.wait();
        const issuedTopic = ethers.id('CredentialIssued(bytes32,bytes32,bytes32,uint256)');
        const issuedLog = receipt.logs.find((log) =>
            log.address?.toLowerCase() === config.credentialRegistryAddress?.toLowerCase() &&
            log.topics?.[0] === issuedTopic
        );

        if (!issuedLog) {
            return res.status(500).json({
                error: 'Credential issued transaction succeeded, but credentialId event was not found in receipt logs.'
            });
        }

        const parsedIssued = credentialRegistry.interface.parseLog(issuedLog);
        const credentialId = parsedIssued?.args?.credentialId || parsedIssued?.args?.[0];

        if (!credentialId || credentialId === ethers.ZeroHash) {
            return res.status(500).json({
                error: 'Credential issuance returned an invalid credentialId. Please issue again.'
            });
        }

        res.json({
            success: true,
            credentialId: credentialId,
            transactionHash: receipt.hash,
            message: 'Credential issued successfully'
        });
    } catch (error) {
        console.error('Error issuing credential:', error);

        const revertMessage = error?.info?.error?.message || '';
        if (revertMessage.includes('Credential exists')) {
            return res.status(409).json({
                error: 'Credential collision detected. Please issue again (a unique credential ID will be generated).'
            });
        }

        res.status(500).json({ error: error.message });
    }
});

/**
 * Verify a credential
 * POST /api/v1/credential/verify
 */
router.post('/credential/verify', async (req, res) => {
    try {
        const { credentialId, fromAddress, privateKey } = req.body;

        if (!credentialId || !fromAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!credentialRegistry) {
            return res.status(500).json({ error: 'CredentialRegistry contract not initialized' });
        }

        if (!isBytes32(credentialId)) {
            return res.status(400).json({
                error: 'Invalid credentialId. Expected a 32-byte hex hash (0x + 64 hex chars), not a contract address.'
            });
        }

        const existingCredential = await credentialRegistry.getCredential(credentialId);
        if (!existingCredential || !existingCredential.credentialId || existingCredential.credentialId === ethers.ZeroHash) {
            return res.status(404).json({ error: 'Credential not found' });
        }

        const wallet = await getWallet(privateKey, fromAddress);

        const tx = await credentialRegistry.connect(wallet).verifyCredential(credentialId);
        const receipt = await tx.wait();

        res.json({
            success: true,
            credentialId: credentialId,
            verified: true,
            transactionHash: receipt.hash,
            message: 'Credential verified successfully'
        });
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
 * Get audit trail for a DID
 * GET /api/v1/audit/did/:didHash
 */
router.get('/audit/did/:didHash', async (req, res) => {
    try {
        const { didHash } = req.params;

        if (!auditLog) {
            return res.status(500).json({ error: 'AuditLog contract not initialized' });
        }

        const auditTrail = await auditLog.getDIDAuditTrail(didHash);

        res.json({
            success: true,
            didHash: didHash,
            auditRecords: auditTrail.map(id => parseInt(id))
        });
    } catch (error) {
        console.error('Error fetching audit trail:', error);
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

        res.json({
            success: true,
            records: records.map(record => ({
                recordId: parseInt(record.recordId),
                action: parseInt(record.action),
                actor: record.actor,
                subjectDID: record.subjectDID,
                timestamp: parseInt(record.timestamp),
                details: record.details
            }))
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
