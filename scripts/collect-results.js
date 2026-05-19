const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');
const { ethers, keccak256, toUtf8Bytes } = require('ethers');

const RUNS = Number(process.env.RESULT_RUNS || 10);
const RESULTS_DIR = path.resolve(__dirname, '../results');
const REPORT_PATH = path.join(RESULTS_DIR, 'REPORT_RESULTS.md');

const DID_REGISTRY_ABI = [
    'function registerSchema(string _schema) external',
    'function registerDID(string _didString, string _publicKey, bytes32 _schemaHash) external',
    'function schemaRegistry(bytes32) view returns (bool)',
    'function getDIDFromAddress(address _address) view returns (bytes32)',
    'function getDID(bytes32 _didHash) view returns (tuple(address owner, string didString, string publicKey, uint256 created, uint256 updated, bool active, bytes32 schemaHash))'
];

const CREDENTIAL_REGISTRY_ABI = [
    'function issueCredential(bytes32 _issuerDID, bytes32 _subjectDID, string _credentialType, bytes32 _credentialHash, uint256 _expiryDays) external',
    'function verifyCredential(bytes32 _credentialId, bytes32 _submittedHash) external',
    'function getCredential(bytes32 _credentialId) view returns (tuple(bytes32 credentialId, bytes32 issuerDID, bytes32 subjectDID, string credentialType, bytes32 credentialHash, uint256 issuedAt, uint256 expiresAt, bool revoked, bool verified))',
    'event CredentialIssued(bytes32 indexed credentialId, bytes32 indexed issuerDID, bytes32 indexed subjectDID, uint256 expiresAt)'
];

const ZERO_BYTES32 = `0x${'0'.repeat(64)}`;

function readEnvFile(envPath) {
    if (!fs.existsSync(envPath)) {
        return {};
    }

    const content = fs.readFileSync(envPath, 'utf8');
    return content.split(/\r?\n/).reduce((acc, line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            return acc;
        }
        const [key, ...rest] = trimmed.split('=');
        acc[key] = rest.join('=').trim();
        return acc;
    }, {});
}

function mean(values) {
    if (!values.length) {
        return 0;
    }
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stats(values) {
    if (!values.length) {
        return { min: 0, max: 0, avg: 0 };
    }
    return {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: mean(values)
    };
}

function formatMs(value) {
    return `${value.toFixed(2)} ms`;
}

function formatGas(value) {
    return value ? Math.round(value).toString() : '0';
}

function httpRequestJson(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const lib = urlObj.protocol === 'https:' ? https : http;
        const start = performance.now();

        const req = lib.request(urlObj, { method: 'GET' }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const duration = performance.now() - start;
                try {
                    const json = JSON.parse(data);
                    resolve({ json, duration, status: res.statusCode });
                } catch (error) {
                    reject(new Error(`Invalid JSON response (${res.statusCode}): ${error.message}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function measureTx(label, sendTx) {
    const start = performance.now();
    const tx = await sendTx();
    const receipt = await tx.wait();
    const duration = performance.now() - start;

    return {
        label,
        duration,
        gasUsed: receipt?.gasUsed ? Number(receipt.gasUsed) : 0,
        receipt
    };
}

async function ensureSchema(didRegistry) {
    const schema = JSON.stringify({
        type: 'VerifiableCredential',
        properties: {
            name: { type: 'string' },
            email: { type: 'string' }
        }
    });
    const schemaHash = keccak256(toUtf8Bytes(schema));
    const exists = await didRegistry.schemaRegistry(schemaHash);
    if (!exists) {
        const tx = await didRegistry.registerSchema(schema);
        await tx.wait();
    }
    return schemaHash;
}

async function ensureDidForAddress(didRegistry, signer, schemaHash, didString) {
    const address = await signer.getAddress();
    const current = await didRegistry.getDIDFromAddress(address);
    if (current && current !== ZERO_BYTES32) {
        return { didHash: current, didString: null };
    }

    const tx = await didRegistry.connect(signer).registerDID(didString, '', schemaHash);
    await tx.wait();
    return { didHash: keccak256(toUtf8Bytes(didString)), didString };
}

function createMarkdownReport(context, writeMetrics, readMetrics, sampleData, errors) {
    const writeRows = writeMetrics.map((metric) => {
        const latency = stats(metric.latencies);
        const gas = stats(metric.gasUsed);
        return `| ${metric.label} | ${metric.latencies.length} | ${formatMs(latency.avg)} | ${formatMs(latency.min)} | ${formatMs(latency.max)} | ${formatGas(gas.avg)} | ${metric.notes || ''} |`;
    }).join('\n');

    const readRows = readMetrics.map((metric) => {
        const latency = stats(metric.latencies);
        return `| ${metric.label} | ${metric.latencies.length} | ${formatMs(latency.avg)} | ${formatMs(latency.min)} | ${formatMs(latency.max)} | ${metric.errors} |`;
    }).join('\n');

    const errorBlock = errors.length
        ? errors.map((err) => `- ${err}`).join('\n')
        : '- None';

    return `# Results Dump (Generated)

## Run Context

- Date: ${context.timestamp}
- Runs per metric: ${context.runs}
- Ganache RPC: ${context.ganacheRpcUrl}
- Backend API: ${context.backendApiUrl}
- Chain ID: ${context.chainId}

## Sample Identifiers

- Issuer DID: ${sampleData.issuerDid || 'N/A'}
- Subject DID: ${sampleData.subjectDid || 'N/A'}
- Last Credential ID: ${sampleData.credentialId || 'N/A'}

## Write Transaction Metrics

| Metric | Runs | Avg Latency | Min Latency | Max Latency | Avg Gas | Notes |
| --- | --- | --- | --- | --- | --- | --- |
${writeRows || '| (none) | 0 | 0 ms | 0 ms | 0 ms | 0 | - |'}

## Backend Read Latency Metrics

| Endpoint | Runs | Avg Latency | Min Latency | Max Latency | Errors |
| --- | --- | --- | --- | --- | --- |
${readRows || '| (none) | 0 | 0 ms | 0 ms | 0 ms | 0 |'}

## Errors / Notes

${errorBlock}
`;
}

async function main() {
    const backendEnv = readEnvFile(path.resolve(__dirname, '../backend/.env'));

    const ganacheRpcUrl = process.env.GANACHE_RPC_URL || backendEnv.GANACHE_RPC_URL || 'http://127.0.0.1:7545';
    const chainId = Number(process.env.GANACHE_NETWORK_ID || backendEnv.GANACHE_NETWORK_ID || 1337);
    const backendApiUrl = process.env.BACKEND_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

    const didRegistryAddress = process.env.DID_REGISTRY_ADDRESS || backendEnv.DID_REGISTRY_ADDRESS;
    const credentialRegistryAddress = process.env.CREDENTIAL_REGISTRY_ADDRESS || backendEnv.CREDENTIAL_REGISTRY_ADDRESS;

    if (!didRegistryAddress || !credentialRegistryAddress) {
        throw new Error('Missing contract addresses. Ensure backend/.env contains DID_REGISTRY_ADDRESS and CREDENTIAL_REGISTRY_ADDRESS.');
    }

    const provider = new ethers.JsonRpcProvider(ganacheRpcUrl, chainId);

    let issuerSigner;
    let subjectSigner;

    if (process.env.GANACHE_PRIVATE_KEY) {
        issuerSigner = new ethers.Wallet(process.env.GANACHE_PRIVATE_KEY, provider);
        subjectSigner = issuerSigner;
    } else {
        issuerSigner = await provider.getSigner(0);
        subjectSigner = await provider.getSigner(1);
    }

    const didRegistry = new ethers.Contract(didRegistryAddress, DID_REGISTRY_ABI, issuerSigner);
    const credentialRegistry = new ethers.Contract(credentialRegistryAddress, CREDENTIAL_REGISTRY_ABI, issuerSigner);

    const schemaHash = await ensureSchema(didRegistry);

    const issuerDidInfo = await ensureDidForAddress(
        didRegistry,
        issuerSigner,
        schemaHash,
        `did:blockchain:issuer-${Date.now()}`
    );

    const writeMetrics = [
        { label: 'DID register', latencies: [], gasUsed: [], notes: 'registerDID' },
        { label: 'Credential issue', latencies: [], gasUsed: [], notes: 'issueCredential' },
        { label: 'Credential verify', latencies: [], gasUsed: [], notes: 'verifyCredential' }
    ];

    let lastCredentialId = null;
    let lastSubjectDid = null;

    for (let i = 0; i < RUNS; i += 1) {
        const subjectDidString = `did:blockchain:student-${Date.now()}-${i}`;
        const didRegistryForSubject = didRegistry.connect(subjectSigner);

        const registerResult = await measureTx('DID register', () =>
            didRegistryForSubject.registerDID(subjectDidString, '', schemaHash)
        );
        writeMetrics[0].latencies.push(registerResult.duration);
        writeMetrics[0].gasUsed.push(registerResult.gasUsed);

        const subjectAddress = await subjectSigner.getAddress();
        const subjectDid = await didRegistry.getDIDFromAddress(subjectAddress);
        lastSubjectDid = subjectDid;

        const issuerAddress = await issuerSigner.getAddress();
        const issuerDid = issuerDidInfo.didHash || (await didRegistry.getDIDFromAddress(issuerAddress));

        const payload = {
            studentName: `Student ${i + 1}`,
            collegeName: 'Demo University',
            courseName: 'B.Tech',
            grade: 'A',
            passingYear: '2026',
            studentAddress: subjectAddress,
            issuerAddress: issuerAddress,
            issuedAt: new Date().toISOString()
        };

        const payloadHash = keccak256(toUtf8Bytes(JSON.stringify(payload)));

        const issueResult = await measureTx('Credential issue', () =>
            credentialRegistry.issueCredential(
                issuerDid,
                subjectDid,
                'ACADEMIC_CERTIFICATE',
                payloadHash,
                3650
            )
        );

        writeMetrics[1].latencies.push(issueResult.duration);
        writeMetrics[1].gasUsed.push(issueResult.gasUsed);

        const receipt = issueResult.receipt;
        if (receipt) {
            for (const log of receipt.logs) {
                try {
                    const parsed = credentialRegistry.interface.parseLog(log);
                    if (parsed && parsed.name === 'CredentialIssued') {
                        lastCredentialId = parsed.args.credentialId;
                        break;
                    }
                } catch (_) {
                    // Ignore non-matching logs.
                }
            }
        }

        if (!lastCredentialId) {
            throw new Error('Unable to parse CredentialIssued event to get credential ID.');
        }

        const verifyResult = await measureTx('Credential verify', () =>
            credentialRegistry.verifyCredential(lastCredentialId, payloadHash)
        );

        writeMetrics[2].latencies.push(verifyResult.duration);
        writeMetrics[2].gasUsed.push(verifyResult.gasUsed);
    }

    const readMetrics = [
        { label: 'GET /health', latencies: [], errors: 0 },
        { label: 'GET /did/:didHash', latencies: [], errors: 0 },
        { label: 'GET /credential/:credentialId', latencies: [], errors: 0 },
        { label: 'GET /audit/did/:didHash/ids', latencies: [], errors: 0 },
        { label: 'GET /audit/did/:didHash', latencies: [], errors: 0 },
        { label: 'GET /audit/credential/:credentialId', latencies: [], errors: 0 },
        { label: 'GET /audit/recent/:limit', latencies: [], errors: 0 }
    ];

    const errors = [];

    try {
        for (let i = 0; i < RUNS; i += 1) {
            const healthResponse = await httpRequestJson(`${backendApiUrl}/health`);
            readMetrics[0].latencies.push(healthResponse.duration);
        }
    } catch (error) {
        errors.push(`Backend health check failed: ${error.message}`);
        readMetrics[0].errors += RUNS;
    }

    if (readMetrics[0].latencies.length === RUNS && lastCredentialId && lastSubjectDid) {
        const endpoints = [
            { metric: readMetrics[1], url: `${backendApiUrl}/did/${lastSubjectDid}` },
            { metric: readMetrics[2], url: `${backendApiUrl}/credential/${lastCredentialId}` },
            { metric: readMetrics[3], url: `${backendApiUrl}/audit/did/${lastSubjectDid}/ids` },
            { metric: readMetrics[4], url: `${backendApiUrl}/audit/did/${lastSubjectDid}` },
            { metric: readMetrics[5], url: `${backendApiUrl}/audit/credential/${lastCredentialId}` },
            { metric: readMetrics[6], url: `${backendApiUrl}/audit/recent/10` }
        ];

        for (const endpoint of endpoints) {
            for (let i = 0; i < RUNS; i += 1) {
                try {
                    const response = await httpRequestJson(endpoint.url);
                    if (response.status >= 200 && response.status < 300) {
                        endpoint.metric.latencies.push(response.duration);
                    } else {
                        endpoint.metric.errors += 1;
                    }
                } catch (error) {
                    endpoint.metric.errors += 1;
                    errors.push(`${endpoint.url} failed: ${error.message}`);
                }
            }
        }
    } else if (readMetrics[0].latencies.length !== RUNS) {
        errors.push('Backend read tests skipped because /health did not respond successfully.');
    }

    if (!fs.existsSync(RESULTS_DIR)) {
        fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }

    const report = createMarkdownReport(
        {
            timestamp: new Date().toISOString(),
            runs: RUNS,
            ganacheRpcUrl,
            backendApiUrl,
            chainId
        },
        writeMetrics,
        readMetrics,
        {
            issuerDid: issuerDidInfo.didHash || 'N/A',
            subjectDid: lastSubjectDid || 'N/A',
            credentialId: lastCredentialId || 'N/A'
        },
        errors
    );

    fs.writeFileSync(REPORT_PATH, report, 'utf8');
    console.log(`Results written to ${REPORT_PATH}`);
}

main().catch((error) => {
    console.error('Result collection failed:', error);
    process.exit(1);
});
