import Web3 from 'web3';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export const Web3Service = {
    web3: null,

    async initWeb3() {
        if (typeof window.ethereum !== 'undefined') {
            this.web3 = new Web3(window.ethereum);
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                return accounts[0];
            } catch (error) {
                throw new Error('User denied account access');
            }
        } else {
            throw new Error('MetaMask not detected');
        }
    },

    async getAccounts() {
        const accounts = await this.web3.eth.getAccounts();
        return accounts;
    },

    async signMessage(message, account) {
        const signature = await this.web3.eth.personal.sign(message, account, '');
        return signature;
    },

    async getBalance(account) {
        const balance = await this.web3.eth.getBalance(account);
        return this.web3.utils.fromWei(balance, 'ether');
    },

    async getNetworkId() {
        return await this.web3.eth.net.getId();
    }
};

export const APIService = {
    async registerSchema(schema, fromAddress) {
        const response = await axios.post(`${API_URL}/did/register-schema`, {
            schema,
            fromAddress
        });
        return response.data;
    },

    async registerDID(didString, publicKey, schemaHash, fromAddress) {
        const response = await axios.post(`${API_URL}/did/register`, {
            didString,
            publicKey,
            schemaHash,
            fromAddress
        });
        return response.data;
    },

    async getDID(didHash) {
        const response = await axios.get(`${API_URL}/did/${didHash}`);
        return response.data;
    },

    async issueCredential(issuerDID, subjectDID, credentialType, credentialHash, expiryDays, fromAddress) {
        const response = await axios.post(`${API_URL}/credential/issue`, {
            issuerDID,
            subjectDID,
            credentialType,
            credentialHash,
            expiryDays,
            fromAddress
        });
        return response.data;
    },

    async verifyCredential(credentialId, fromAddress) {
        const response = await axios.post(`${API_URL}/credential/verify`, {
            credentialId,
            fromAddress
        });
        return response.data;
    },

    async getCredential(credentialId) {
        const response = await axios.get(`${API_URL}/credential/${credentialId}`);
        return response.data;
    },

    async getDIDAuditTrail(didHash) {
        const response = await axios.get(`${API_URL}/audit/did/${didHash}`);
        return response.data;
    },

    async getRecentAuditRecords(limit) {
        const response = await axios.get(`${API_URL}/audit/recent/${limit}`);
        return response.data;
    },

    async getHealth() {
        const response = await axios.get(`${API_URL}/health`);
        return response.data;
    }
};

const services = { Web3Service, APIService };

export default services;
