import React, { useState, useEffect } from 'react';
import { Web3Service, APIService } from './services/web3Service';
import './App.css';

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
                <h1>🔐 Blockchain-Based Secure Identity Authentication</h1>
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
                        setMessage={setMessage}
                        loading={loading}
                        setLoading={setLoading}
                        getErrorMessage={getErrorMessage}
                    />
                )}

                {activePhase === 2 && (
                    <Phase2Component
                        account={account}
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
                    <p>✅ Connected to Blockchain | Block: {health.blockchain?.blockNumber} | Gas: {health.blockchain?.gasPrice}</p>
                </footer>
            )}
        </div>
    );
};

// Phase 1: Registration & Issuance Component
const Phase1Component = ({ account, setMessage, loading, setLoading, getErrorMessage }) => {
    const [didString, setDidString] = useState('');
    const [publicKey, setPublicKey] = useState('');

    const handleRegisterDID = async () => {
        if (!didString || !publicKey) {
            setMessage('Error: Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            const schema = JSON.stringify({
                type: 'VerifiableCredential',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string' }
                }
            });

            const schemaHash = Web3Service.web3.utils.keccak256(schema);

            await APIService.registerSchema(
                schema,
                account,
                process.env.REACT_APP_PRIVATE_KEY || ''
            );

            const result = await APIService.registerDID(
                didString,
                publicKey,
                schemaHash,
                account,
                process.env.REACT_APP_PRIVATE_KEY || ''
            );

            setMessage(`Success: DID registered! Hash: ${result.didHash}`);
            setDidString('');
            setPublicKey('');
        } catch (error) {
            setMessage('Error: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="phase-content">
            <h2>📋 Phase 1: Registration & Issuance</h2>
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

                <div className="form-group">
                    <label>Public Key</label>
                    <textarea
                        value={publicKey}
                        onChange={(e) => setPublicKey(e.target.value)}
                        placeholder="Enter your public key"
                        disabled={loading}
                    />
                </div>

                <button
                    onClick={handleRegisterDID}
                    disabled={loading}
                    className="btn-primary"
                >
                    {loading ? 'Processing...' : '✅ Register DID'}
                </button>
            </div>
        </div>
    );
};

// Phase 2: Authentication & Verification Component
const Phase2Component = ({ account, setMessage, loading, setLoading, getErrorMessage }) => {
    const [credentialId, setCredentialId] = useState('');
    const [credentialDetails, setCredentialDetails] = useState(null);
    const [credentialType, setCredentialType] = useState('GovernmentID');
    const [expiryDays, setExpiryDays] = useState(365);

    const handleIssueCredential = async () => {
        if (!account) {
            setMessage('Error: Wallet not connected. Please connect MetaMask first.');
            return;
        }

        if (!Web3Service.web3) {
            setMessage('Error: Web3 not initialized. Refresh and reconnect MetaMask.');
            return;
        }

        setLoading(true);
        try {
            const nonce = `${Date.now()}-${Math.random()}`;
            const issuerDID = Web3Service.web3.utils.keccak256(`issuer:${account}`);
            const subjectDID = Web3Service.web3.utils.keccak256(`subject:${account}:${nonce}`);
            const credentialHash = Web3Service.web3.utils.keccak256(
                JSON.stringify({ account, credentialType, ts: Date.now(), nonce })
            );

            const result = await APIService.issueCredential(
                issuerDID,
                subjectDID,
                credentialType,
                credentialHash,
                Number(expiryDays),
                account,
                process.env.REACT_APP_PRIVATE_KEY || ''
            );

            setCredentialId(result.credentialId);
            setMessage(`Success: Credential issued! ID: ${result.credentialId?.substring(0, 14)}...`);
        } catch (error) {
            setMessage('Error: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCredential = async () => {
        if (!credentialId) {
            setMessage('Error: Please enter credential ID');
            return;
        }

        setLoading(true);
        try {
            await APIService.verifyCredential(
                credentialId,
                account,
                process.env.REACT_APP_PRIVATE_KEY || ''
            );

            setMessage('Success: Credential verified!');
        } catch (error) {
            setMessage('Error: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleGetCredential = async () => {
        if (!credentialId) {
            setMessage('Error: Please enter credential ID');
            return;
        }

        setLoading(true);
        try {
            const result = await APIService.getCredential(credentialId);
            setCredentialDetails(result.credential);
            setMessage('Success: Credential details retrieved!');
        } catch (error) {
            setMessage('Error: ' + getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="phase-content">
            <h2>🔐 Phase 2: Authentication & Verification</h2>
            <p>Present and verify your verifiable credentials using zero-knowledge proofs</p>

            <div className="form">
                <div className="form-group">
                    <label>Credential Type</label>
                    <input
                        type="text"
                        value={credentialType}
                        onChange={(e) => setCredentialType(e.target.value)}
                        placeholder="e.g., GovernmentID"
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label>Expiry (Days)</label>
                    <input
                        type="number"
                        min="1"
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <button
                    onClick={handleIssueCredential}
                    disabled={loading}
                    className="btn-primary"
                >
                    {loading ? 'Issuing...' : '🧾 Issue Test Credential'}
                </button>

                <div className="form-group">
                    <label>Credential ID</label>
                    <input
                        type="text"
                        value={credentialId}
                        onChange={(e) => setCredentialId(e.target.value)}
                        placeholder="Enter credential ID"
                        disabled={loading}
                    />
                </div>

                <div className="button-group">
                    <button
                        onClick={handleGetCredential}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Loading...' : '📄 Get Details'}
                    </button>

                    <button
                        onClick={handleVerifyCredential}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Verifying...' : '✅ Verify'}
                    </button>
                </div>
            </div>

            {credentialDetails && (
                <div className="details-panel">
                    <h3>Credential Details</h3>
                    <pre>{JSON.stringify(credentialDetails, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

// Phase 3: Access & Audit Component
const Phase3Component = ({ account, setMessage, loading, setLoading, getErrorMessage }) => {
    const [didHash, setDidHash] = useState('');
    const [auditTrail, setAuditTrail] = useState(null);
    const [recentRecords, setRecentRecords] = useState(null);

    const handleGetAuditTrail = async () => {
        if (!didHash) {
            setMessage('Error: Please enter DID hash');
            return;
        }

        setLoading(true);
        try {
            const result = await APIService.getDIDAuditTrail(didHash);
            setAuditTrail(result);
            setMessage('Success: Audit trail retrieved!');
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
            <h2>📊 Phase 3: Access & Audit</h2>
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
                        onClick={handleGetAuditTrail}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Loading...' : '🔍 Get Audit Trail'}
                    </button>

                    <button
                        onClick={handleGetRecentRecords}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Loading...' : '📋 Recent Records'}
                    </button>
                </div>
            </div>

            {auditTrail && (
                <div className="details-panel">
                    <h3>DID Audit Trail</h3>
                    <pre>{JSON.stringify(auditTrail, null, 2)}</pre>
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
                                    <th>Actor</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentRecords.map((record) => (
                                    <tr key={record.recordId}>
                                        <td>{record.recordId}</td>
                                        <td>{record.action}</td>
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
