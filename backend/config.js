const { ethers } = require('ethers');
require('dotenv').config();

const ganacheRpcUrl = process.env.GANACHE_RPC_URL || 'http://127.0.0.1:7545';
const provider = new ethers.JsonRpcProvider(ganacheRpcUrl);

const config = {
    ethers: ethers,
    provider: provider,
    ganacheRpcUrl: ganacheRpcUrl,
    networkId: Number(process.env.GANACHE_NETWORK_ID || 1337),

    // Smart Contract Addresses
    didRegistryAddress: process.env.DID_REGISTRY_ADDRESS,
    credentialRegistryAddress: process.env.CREDENTIAL_REGISTRY_ADDRESS,
    auditLogAddress: process.env.AUDIT_LOG_ADDRESS,

    // Server Configuration
    port: Number(process.env.PORT || 5000),
    nodeEnv: process.env.NODE_ENV || 'development',

    // API Configuration
    apiVersion: 'v1',
    apiPrefix: '/api/v1'
};

module.exports = config;
