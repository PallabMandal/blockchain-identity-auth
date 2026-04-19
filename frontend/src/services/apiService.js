import axios from 'axios';

// Fix the missing axios import
export const APIService = {
    async registerSchema(schema, fromAddress, privateKey) {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/did/register-schema`, {
            schema,
            fromAddress,
            privateKey
        });
        return response.data;
    },

    async registerDID(didString, publicKey, schemaHash, fromAddress, privateKey) {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/did/register`, {
            didString,
            publicKey,
            schemaHash,
            fromAddress,
            privateKey
        });
        return response.data;
    },

    async getDID(didHash) {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/did/${didHash}`);
        return response.data;
    },

    async issueCredential(issuerDID, subjectDID, credentialType, credentialHash, expiryDays, fromAddress, privateKey) {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/credential/issue`, {
            issuerDID,
            subjectDID,
            credentialType,
            credentialHash,
            expiryDays,
            fromAddress,
            privateKey
        });
        return response.data;
    },

    async verifyCredential(credentialId, fromAddress, privateKey) {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/credential/verify`, {
            credentialId,
            fromAddress,
            privateKey
        });
        return response.data;
    },

    async getCredential(credentialId) {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/credential/${credentialId}`);
        return response.data;
    },

    async getDIDAuditTrail(didHash) {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/audit/did/${didHash}`);
        return response.data;
    },

    async getRecentAuditRecords(limit) {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/audit/recent/${limit}`);
        return response.data;
    },

    async getHealth() {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/health`);
        return response.data;
    }
};

export default { APIService };
