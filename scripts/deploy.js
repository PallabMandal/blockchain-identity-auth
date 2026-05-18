const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');

async function resolveDeployer() {
    const signers = await ethers.getSigners();
    if (signers.length > 0) {
        return signers[0];
    }

    // Fallback for JSON-RPC networks that expose unlocked accounts (e.g., Ganache).
    const rpcAccounts = await ethers.provider.send('eth_accounts', []);
    if (rpcAccounts.length === 0) {
        throw new Error(
            'No deployer account available. Configure accounts in hardhat.config.js or start Ganache with unlocked accounts.'
        );
    }

    return await ethers.getSigner(rpcAccounts[0]);
}

async function main() {
    console.log('Starting smart contract deployment...\n');

    // Get deployer account
    const deployer = await resolveDeployer();
    console.log(`Deploying contracts using account: ${deployer.address}`);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Account balance: ${ethers.formatEther(balance)} ETH\n`);

    // Deploy DIDRegistry
    console.log('Deploying DIDRegistry...');
    const DIDRegistry = await ethers.getContractFactory('DIDRegistry');
    const didRegistry = await DIDRegistry.deploy();
    await didRegistry.waitForDeployment();
    const didRegistryAddress = await didRegistry.getAddress();
    console.log(`DIDRegistry deployed to: ${didRegistryAddress}\n`);

    // Deploy AuditLog
    console.log('Deploying AuditLog...');
    const AuditLog = await ethers.getContractFactory('AuditLog');
    const auditLog = await AuditLog.deploy();
    await auditLog.waitForDeployment();
    const auditLogAddress = await auditLog.getAddress();
    console.log(`AuditLog deployed to: ${auditLogAddress}\n`);

    // Deploy CredentialRegistry
    console.log('Deploying CredentialRegistry...');
    const CredentialRegistry = await ethers.getContractFactory('CredentialRegistry');
    const credentialRegistry = await CredentialRegistry.deploy(auditLogAddress);
    await credentialRegistry.waitForDeployment();
    const credentialRegistryAddress = await credentialRegistry.getAddress();
    console.log(`CredentialRegistry deployed to: ${credentialRegistryAddress}\n`);

    // Save addresses to backend/.env
    const envPath = path.resolve(__dirname, '../backend/.env');
    const envContent = `
# Smart Contract Addresses
DID_REGISTRY_ADDRESS=${didRegistryAddress}
CREDENTIAL_REGISTRY_ADDRESS=${credentialRegistryAddress}
AUDIT_LOG_ADDRESS=${auditLogAddress}
`;

    fs.appendFileSync(envPath, envContent);
    console.log('Contract addresses saved to backend/.env\n');

    console.log('Deployment complete!');
    console.log('\n===== Contract Addresses =====');
    console.log(`DIDRegistry: ${didRegistryAddress}`);
    console.log(`CredentialRegistry: ${credentialRegistryAddress}`);
    console.log(`AuditLog: ${auditLogAddress}`);
    console.log('==============================\n');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
