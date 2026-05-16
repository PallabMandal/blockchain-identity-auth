const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const config = require('./config');
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Blockchain-Based Secure Identity Authentication System',
        version: '1.0.0',
        endpoints: {
            health: '/api/v1/health',
            phase1: {
                registerSchema: 'POST /api/v1/did/register-schema',
                registerDID: 'POST /api/v1/did/register',
                getDID: 'GET /api/v1/did/:didHash'
            },
            phase2: {
                issueCredential: 'POST /api/v1/credential/issue',
                verifyCredential: 'POST /api/v1/credential/verify',
                getCredential: 'GET /api/v1/credential/:credentialId'
            },
            phase3: {
                getDIDAuditTrail: 'GET /api/v1/audit/did/:didHash',
                getRecentAuditRecords: 'GET /api/v1/audit/recent/:limit'
            }
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: err.message
    });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`\nBlockchain Identity Authentication Backend`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Connected to Ganache at ${config.ganacheRpcUrl}`);
    console.log(`Network ID: ${config.networkId}`);
    console.log(`\nAPI Documentation: http://localhost:${PORT}`);
});

module.exports = app;
