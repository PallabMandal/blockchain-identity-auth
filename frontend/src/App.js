import React, { useState, useEffect } from 'react';
import { ethers, keccak256, toUtf8Bytes } from 'ethers';
import { Web3Service, APIService } from './services/web3Service';
import QRCode from 'react-qr-code';
import './App.css';

const DID_REGISTRY_ABI = [
    'function registerSchema(string _schema) external',
    'function registerDID(string _didString, string _publicKey, bytes32 _schemaHash) external',
    'function schemaRegistry(bytes32) view returns (bool)',
    'function getDIDFromAddress(address _address) view returns (bytes32)'
];

const CREDENTIAL_REGISTRY_ABI = [
    'function issueCredential(bytes32 _issuerDID, bytes32 _subjectDID, string _credentialType, bytes32 _credentialHash, uint256 _expiryDays) external',
    'function verifyCredential(bytes32 _credentialId, bytes32 _submittedHash) external',
    'function verifyCredentialIntegrity(bytes32 _credentialId, bytes32 _payloadHash) view returns (bool)',
    'event CredentialIssued(bytes32 indexed credentialId, bytes32 indexed issuerDID, bytes32 indexed subjectDID, uint256 expiresAt)'
];

const AUDIT_LOG_ABI = [
    'function logAction(uint8 _action, bytes32 _subjectDID, bytes32 _relatedEntity, string _details, string _ipfsHash) external'
];

const ZERO_BYTES32 = `0x${'0'.repeat(64)}`;

const AUDIT_ACTION_LABELS = {
    0: 'DID_CREATED',
    1: 'DID_UPDATED',
    2: 'DID_REVOKED',
    3: 'CREDENTIAL_ISSUED',
    4: 'CREDENTIAL_VERIFIED',
    5: 'CREDENTIAL_REVOKED',
    6: 'PRESENTATION_CREATED',
    7: 'PRESENTATION_VERIFIED',
    8: 'ACCESS_GRANTED',
    9: 'ACCESS_DENIED'
};

const formatAuditAction = (action) => {
    const numericAction = Number(action);
    if (Number.isNaN(numericAction)) {
        return String(action);
    }

    return AUDIT_ACTION_LABELS[numericAction] || `UNKNOWN_ACTION_${numericAction}`;
};

const getSigner = async () => {
    if (!window.ethereum) {
        alert('MetaMask not installed');
        return null;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    return await provider.getSigner();
};

const getContractAddress = (contracts, contractKey, envKey) => {
    const fromHealth = contracts?.[contractKey];
    if (fromHealth && fromHealth !== 'not deployed') {
        return fromHealth;
    }

    return process.env[envKey] || '';
};

const App = () => {
    const [account, setAccount] = useState(null);
    const [balance, setBalance] = useState(null);
    const [networkId, setNetworkId] = useState(null);
    const [activePhase, setActivePhase] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [health, setHealth] = useState(null);

    const getErrorMessage = (error) => {
        return error?.response?.data?.error || error.message || 'Unknown error';
    };

    useEffect(() => {
        initializeWeb3();
        checkHealth();
    }, []);

    const initializeWeb3 = async () => {
        try {
            const acc = await Web3Service.initWeb3();
            setAccount(acc);
            const bal = await Web3Service.getBalance(acc);
            setBalance(bal);
            const netId = await Web3Service.getNetworkId();
            setNetworkId(netId);
        } catch (error) {
            setMessage('Error: ' + error.message);
        }
    };

    const checkHealth = async () => {
        try {
            const healthData = await APIService.getHealth();
            setHealth(healthData);
        } catch (error) {
            console.error('Health check failed:', error);
        }
    };

    return (
        <div className="container">
            <header className="header">
                <h1>Blockchain-Based Secure Identity Authentication</h1>
                <div className="account-info">
                    {account && (
                        <>
                            <div className="info-item">
                                <span className="label">Account:</span>
                                <span className="value">{account.substring(0, 10)}...{account.substring(38)}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Balance:</span>
                                <span className="value">{balance?.substring(0, 5)} ETH</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Network ID:</span>
                                <span className="value">{networkId}</span>
                            </div>
                        </>
                    )}
                </div>
            </header>

            <nav className="phases">
                <button
                    className={`phase-btn ${activePhase === 1 ? 'active' : ''}`}
                    onClick={() => setActivePhase(1)}
                >
                    Phase 1: Registration & Issuance
                </button>
                <button
                    className={`phase-btn ${activePhase === 2 ? 'active' : ''}`}
                    onClick={() => setActivePhase(2)}
                >
                    Phase 2: Authentication & Verification
                </button>
                <button
                    className={`phase-btn ${activePhase === 3 ? 'active' : ''}`}
                    onClick={() => setActivePhase(3)}
                >
                    Phase 3: Access & Audit
                </button>
            </nav>

            <main className="main-content">
                {message && (
                    <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}

                {activePhase === 1 && (
                    <Phase1Component
                        account={account}
                        contractAddresses={health?.contracts}
                        setMessage={setMessage}
                        loading={loading}
                        setLoading={setLoading}
                        getErrorMessage={getErrorMessage}
                    />
                )}

                {activePhase === 2 && (
                    <Phase2Component
                        account={account}
                        contractAddresses={health?.contracts}
                        setMessage={setMessage}
                        loading={loading}
                        setLoading={setLoading}
                        getErrorMessage={getErrorMessage}
                    />
                )}

                {activePhase === 3 && (
                    <Phase3Component
                        account={account}
                        setMessage={setMessage}
                        loading={loading}
                        setLoading={setLoading}
                        getErrorMessage={getErrorMessage}
                    />
                )}
            </main>

            {health && (
                <footer className="footer">
                    <p>Connected to Blockchain | Block: {health.blockchain?.blockNumber} | Gas: {health.blockchain?.gasPrice}</p>
                </footer>
            )}
        </div>
    );
};

// Phase 1: Registration & Issuance Component
const Phase1Component = ({ account, contractAddresses, setMessage, loading, setLoading, getErrorMessage }) => {
    const [didString, setDidString] = useState('');

    const handleRegisterDID = async () => {
        if (!didString) {
            setMessage('Error: Please enter a DID string');
            return;
        }

        setLoading(true);
        try {
            const didRegistryAddress = getContractAddress(
                contractAddresses,
                'didRegistry',
                'REACT_APP_DID_REGISTRY_ADDRESS'
            );

            if (!didRegistryAddress) {
                throw new Error('DIDRegistry address is not configured');
            }

            const signer = await getSigner();
            if (!signer) {
                throw new Error('MetaMask signer not available');
            }

            const didRegistry = new ethers.Contract(didRegistryAddress, DID_REGISTRY_ABI, signer);

            const schema = JSON.stringify({
                type: 'VerifiableCredential',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string' }
                }
            });

            const schemaHash = keccak256(toUtf8Bytes(schema));

            const schemaAlreadyRegistered = await didRegistry.schemaRegistry(schemaHash);
            if (!schemaAlreadyRegistered) {
                const registerSchemaTx = await didRegistry.registerSchema(schema);
                await registerSchemaTx.wait();
            }

            const registerDidTx = await didRegistry.registerDID(didString, '', schemaHash);
            await registerDidTx.wait();
            const didHash = keccak256(toUtf8Bytes(didString));

            const auditLogAddress = getContractAddress(
                contractAddresses,
                'auditLog',
                'REACT_APP_AUDIT_LOG_ADDRESS'
            );

            if (auditLogAddress) {
                const auditLog = new ethers.Contract(auditLogAddress, AUDIT_LOG_ABI, signer);
                const tx = await auditLog.logAction(
                    0,
                    didHash,
                    didHash,
                    'DID created',
                    ''
                );
                await tx.wait();
            }

            setMessage(`Success: DID registered! Hash: ${didHash}`);
            setDidString('');
        } catch (error) {
            setMessage('Error: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="phase-content">
            <h2>Phase 1: Registration & Issuance</h2>
            <p>Register your Decentralized Identifier (DID) and create verifiable credentials</p>

            <div className="form">
                <div className="form-group">
                    <label>DID String (e.g., did:blockchain:123abc)</label>
                    <input
                        type="text"
                        value={didString}
                        onChange={(e) => setDidString(e.target.value)}
                        placeholder="Enter your DID"
                        disabled={loading}
                    />
                </div>

                <button
                    onClick={handleRegisterDID}
                    disabled={loading}
                    className="btn-primary"
                >
                    {loading ? 'Processing...' : 'Register DID'}
                </button>
            </div>
        </div>
    );
};

// Phase 2: Authentication & Verification Component
const Phase2Component = ({ account, contractAddresses, setMessage, loading, setLoading, getErrorMessage }) => {
    const [credentialId, setCredentialId] = useState('');
    const [credentialDetails, setCredentialDetails] = useState(null);
    const [studentAddress, setStudentAddress] = useState('');
    const [studentName, setStudentName] = useState('');
    const [collegeName, setCollegeName] = useState('');
    const [courseName, setCourseName] = useState('');
    const [grade, setGrade] = useState('');
    const [passingYear, setPassingYear] = useState('');

    const [issuedCredentialId, setIssuedCredentialId] = useState('');
    const [qrValue, setQrValue] = useState('');
    const [certificatePayload, setCertificatePayload] = useState(null);
    const [credentialAuditRecords, setCredentialAuditRecords] = useState([]);

    const normalizeCredentialId = (value) => {
        const trimmed = (value || '').trim();
        if (!trimmed) {
            return '';
        }

        // Supports scanned QR URLs like https://host?credentialId=0x...
        if (trimmed.startsWith('http')) {
            try {
                return new URL(trimmed).searchParams.get('credentialId') || '';
            } catch (_) {
                return trimmed;
            }
        }

        return trimmed;
    };

    const handleIssueAcademicCertificate = async () => {
        if (!account) {
            setMessage('Error: Wallet not connected. Please connect MetaMask first.');
            return;
        }

        if (!studentAddress || !studentName || !collegeName || !courseName || !grade || !passingYear) {
            setMessage('Error: Please fill all certificate fields');
            return;
        }

        if (!ethers.isAddress(studentAddress)) {
            setMessage('Error: Student wallet address is invalid');
            return;
        }

        setLoading(true);
        try {
            const credentialRegistryAddress = getContractAddress(
                contractAddresses,
                'credentialRegistry',
                'REACT_APP_CREDENTIAL_REGISTRY_ADDRESS'
            );

            if (!credentialRegistryAddress) {
                throw new Error('CredentialRegistry address is not configured');
            }

            const signer = await getSigner();
            if (!signer) {
                throw new Error('MetaMask signer not available');
            }

            const credentialRegistry = new ethers.Contract(
                credentialRegistryAddress,
                CREDENTIAL_REGISTRY_ABI,
                signer
            );

            const didRegistryAddress = getContractAddress(
                contractAddresses,
                'didRegistry',
                'REACT_APP_DID_REGISTRY_ADDRESS'
            );

            if (!didRegistryAddress) {
                throw new Error('DIDRegistry address is not configured');
            }

            const didRegistry = new ethers.Contract(didRegistryAddress, DID_REGISTRY_ABI, signer);

            const issuerAddress = await signer.getAddress();
            const issuerDID = await didRegistry.getDIDFromAddress(issuerAddress);
            if (!issuerDID || issuerDID === ZERO_BYTES32) {
                throw new Error('No DID found for issuer wallet. Register issuer DID in Phase 1 first.');
            }

            const subjectDID = await didRegistry.getDIDFromAddress(studentAddress);
            if (!subjectDID || subjectDID === ZERO_BYTES32) {
                throw new Error('No DID found for student wallet. Register student DID in Phase 1 first.');
            }

            const payload = {
                studentName,
                collegeName,
                courseName,
                grade,
                passingYear,
                studentAddress,
                issuerAddress,
                issuedAt: new Date().toISOString()
            };

            // Store only hash on-chain; keep full certificate payload off-chain.
            const proofHash = keccak256(toUtf8Bytes(JSON.stringify(payload)));

            const tx = await credentialRegistry.issueCredential(
                issuerDID,
                subjectDID,
                'ACADEMIC_CERTIFICATE',
                proofHash,
                3650
            );
            const receipt = await tx.wait();

            let issuedCredentialId = '';
            for (const log of receipt.logs) {
                try {
                    const parsed = credentialRegistry.interface.parseLog(log);
                    if (parsed && parsed.name === 'CredentialIssued') {
                        issuedCredentialId = parsed.args.credentialId;
                        break;
                    }
                } catch (_) {
                    // Ignore non-matching logs
                }
            }

            if (!issuedCredentialId) {
                throw new Error('Credential was issued but event parsing failed');
            }

            const qrLink = `${window.location.origin}?credentialId=${issuedCredentialId}`;

            setIssuedCredentialId(issuedCredentialId);
            setQrValue(qrLink);
            setCertificatePayload(payload);
            setCredentialAuditRecords([]);
            setCredentialId(issuedCredentialId);
            setMessage(`Success: Credential issued! ID: ${issuedCredentialId.substring(0, 14)}...`);
        } catch (error) {
            setMessage('Error: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCredential = async () => {
        const normalizedId = normalizeCredentialId(credentialId);
        if (!normalizedId) {
            setMessage('Error: Please enter credential ID');
            return;
        }

        setLoading(true);
        try {
            const credentialRegistryAddress = getContractAddress(
                contractAddresses,
                'credentialRegistry',
                'REACT_APP_CREDENTIAL_REGISTRY_ADDRESS'
            );

            if (!credentialRegistryAddress) {
                throw new Error('CredentialRegistry address is not configured');
            }

            const signer = await getSigner();
            if (!signer) {
                throw new Error('MetaMask signer not available');
            }

            const credentialRegistry = new ethers.Contract(
                credentialRegistryAddress,
                CREDENTIAL_REGISTRY_ABI,
                signer
            );

            // Step 1: Get credential details to verify payload integrity
            const credential = await credentialRegistry.getCredential(normalizedId);
            if (!credential || !credential.credentialId || credential.credentialId === ZERO_BYTES32) {
                throw new Error('Credential not found on-chain');
            }

            // Step 2: If we have stored payload, verify its hash
            if (certificatePayload) {
                const payloadHash = keccak256(toUtf8Bytes(JSON.stringify(certificatePayload)));
                if (payloadHash !== credential.credentialHash) {
                    throw new Error('Credential data mismatch: submitted payload does not match on-chain commitment. Possible tampering detected.');
                }
            } else {
                setMessage('Warning: Verifying credential without payload check. For full integrity verification, re-issue or retrieve the certificate payload.');
            }

            // Step 3: Perform on-chain verification with hash
            const payloadHashToSubmit = certificatePayload
                ? keccak256(toUtf8Bytes(JSON.stringify(certificatePayload)))
                : credential.credentialHash;

            const tx = await credentialRegistry.verifyCredential(normalizedId, payloadHashToSubmit);
            await tx.wait();

            setCredentialId(normalizedId);
            setMessage('Success: Credential verified and integrity confirmed!');
        } catch (error) {
            setMessage('Error: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleGetCredential = async () => {
        const normalizedId = normalizeCredentialId(credentialId);
        if (!normalizedId) {
            setMessage('Error: Please enter credential ID');
            return;
        }

        setLoading(true);
        try {
            const result = await APIService.getCredential(normalizedId);
            setCredentialDetails(result.credential);
            setCredentialId(normalizedId);

            const auditResult = await APIService.getCredentialAuditTrail(normalizedId);
            setCredentialAuditRecords(Array.isArray(auditResult.records) ? auditResult.records : []);
            setMessage('Success: Credential details retrieved!');
        } catch (error) {
            setCredentialAuditRecords([]);
            setMessage('Error: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="phase-content">
            <h2>Phase 2: Authentication & Verification</h2>
            <p>Issue, verify, and audit academic certificates using on-chain credential hashes</p>

            <div className="form">
                <div className="form-group">
                    <label>Student Wallet Address</label>
                    <input
                        type="text"
                        value={studentAddress}
                        onChange={(e) => setStudentAddress(e.target.value)}
                        placeholder="0x..."
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>Student Name</label>
                    <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Enter student name"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>College Name</label>
                    <input
                        type="text"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        placeholder="Enter college name"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>Course</label>
                    <input
                        type="text"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        placeholder="Enter course name"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>Grade</label>
                    <input
                        type="text"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        placeholder="Enter grade"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>Passing Year</label>
                    <input
                        type="text"
                        value={passingYear}
                        onChange={(e) => setPassingYear(e.target.value)}
                        placeholder="e.g., 2026"
                        disabled={loading}
                    />
                </div>

                <button
                    onClick={handleIssueAcademicCertificate}
                    disabled={loading}
                    className="btn-primary"
                >
                    {loading ? 'Issuing...' : 'Issue Academic Certificate'}
                </button>

                {issuedCredentialId && (
                    <div className="details-panel">
                        <h3>Issued Certificate</h3>
                        <p><strong>Credential ID:</strong> {issuedCredentialId}</p>
                        <div className="qr-wrapper">
                            <QRCode value={qrValue} size={180} />
                        </div>
                        <pre>{JSON.stringify(certificatePayload, null, 2)}</pre>
                        <button
                            onClick={handleVerifyCredential}
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? 'Verifying...' : 'Verify & Check Integrity'}
                        </button>
                    </div>
                )}

                <div className="form-group">
                    <label>Credential ID or QR URL</label>
                    <input
                        type="text"
                        value={credentialId}
                        onChange={(e) => setCredentialId(e.target.value)}
                        placeholder="Paste credential ID or scanned QR URL"
                        disabled={loading}
                    />
                </div>

                <div className="button-group">
                    <button
                        onClick={handleGetCredential}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Loading...' : 'Get Details'}
                    </button>

                    <button
                        onClick={handleVerifyCredential}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Verifying...' : 'Verify & Check Integrity'}
                    </button>
                </div>
            </div>

            {credentialDetails && (
                <div className="details-panel">
                    <h3>Credential Details</h3>
                    <pre>{JSON.stringify(credentialDetails, null, 2)}</pre>
                </div>
            )}

            {credentialAuditRecords.length > 0 && (
                <div className="details-panel">
                    <h3>Credential Audit Trail</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Record ID</th>
                                    <th>Action</th>
                                    <th>Actor</th>
                                    <th>Timestamp</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {credentialAuditRecords.map((record) => (
                                    <tr key={record.recordId}>
                                        <td>{record.recordId}</td>
                                        <td>{formatAuditAction(record.action)}</td>
                                        <td>{record.actor}</td>
                                        <td>{new Date(record.timestamp * 1000).toLocaleString()}</td>
                                        <td>{record.details || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// Phase 3: Access & Audit Component
const Phase3Component = ({ account, setMessage, loading, setLoading, getErrorMessage }) => {
    const [didHash, setDidHash] = useState('');
    const [didAuditIds, setDidAuditIds] = useState(null);
    const [didAuditRecords, setDidAuditRecords] = useState(null);
    const [recentRecords, setRecentRecords] = useState(null);

    const handleGetDIDAuditIds = async () => {
        if (!didHash) {
            setMessage('Error: Please enter DID hash');
            return;
        }

        setLoading(true);
        try {
            const result = await APIService.getDIDAuditTrailIds(didHash);
            setDidAuditIds(result);
            setMessage('Success: DID audit IDs retrieved!');
        } catch (error) {
            setMessage('Error: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleGetDIDAuditRecords = async () => {
        if (!didHash) {
            setMessage('Error: Please enter DID hash');
            return;
        }

        setLoading(true);
        try {
            const result = await APIService.getDIDAuditTrailRecords(didHash);
            setDidAuditRecords(result);
            setMessage('Success: DID audit records retrieved!');
        } catch (error) {
            setMessage('Error: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleGetRecentRecords = async () => {
        setLoading(true);
        try {
            const result = await APIService.getRecentAuditRecords(10);
            setRecentRecords(result.records);
            setMessage('Success: Recent audit records retrieved!');
        } catch (error) {
            setMessage('Error: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="phase-content">
            <h2>Phase 3: Access & Audit</h2>
            <p>Grant/Deny access and maintain immutable audit trail of all operations</p>

            <div className="form">
                <div className="form-group">
                    <label>DID Hash</label>
                    <input
                        type="text"
                        value={didHash}
                        onChange={(e) => setDidHash(e.target.value)}
                        placeholder="Enter DID hash"
                        disabled={loading}
                    />
                </div>

                <div className="button-group">
                    <button
                        onClick={handleGetDIDAuditIds}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Loading...' : 'DID Audit IDs'}
                    </button>

                    <button
                        onClick={handleGetDIDAuditRecords}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Loading...' : 'DID Audit Records'}
                    </button>

                    <button
                        onClick={handleGetRecentRecords}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Loading...' : 'Recent Records'}
                    </button>
                </div>
            </div>

            {didAuditIds && (
                <div className="details-panel">
                    <h3>DID Audit IDs (Minimal Path)</h3>
                    <pre>{JSON.stringify(didAuditIds, null, 2)}</pre>
                </div>
            )}

            {didAuditRecords && (
                <div className="details-panel">
                    <h3>DID Audit Records (Enriched Path)</h3>
                    {Array.isArray(didAuditRecords.records) && didAuditRecords.records.length > 0 ? (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Record ID</th>
                                        <th>Action</th>
                                        <th>DID String</th>
                                        <th>Actor</th>
                                        <th>Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {didAuditRecords.records.map((record) => (
                                        <tr key={record.recordId}>
                                            <td>{record.recordId}</td>
                                            <td>{formatAuditAction(record.action)}</td>
                                            <td>{record.didString || 'N/A'}</td>
                                            <td>{record.actor?.substring(0, 10)}...</td>
                                            <td>{new Date(record.timestamp * 1000).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <pre>{JSON.stringify(didAuditRecords, null, 2)}</pre>
                    )}
                </div>
            )}

            {recentRecords && (
                <div className="details-panel">
                    <h3>Recent Audit Records</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Record ID</th>
                                    <th>Action</th>
                                    <th>DID String</th>
                                    <th>Actor</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentRecords.map((record) => (
                                    <tr key={record.recordId}>
                                        <td>{record.recordId}</td>
                                        <td>{formatAuditAction(record.action)}</td>
                                        <td>{record.didString || 'N/A'}</td>
                                        <td>{record.actor?.substring(0, 10)}...</td>
                                        <td>{new Date(record.timestamp * 1000).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
