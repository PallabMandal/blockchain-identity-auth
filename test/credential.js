const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('CredentialRegistry', function () {
    it('should issue a credential', async function () {
        const [owner] = await ethers.getSigners();

        const AuditLog = await ethers.getContractFactory('AuditLog');
        const auditLog = await AuditLog.deploy();
        await auditLog.waitForDeployment();

        const Contract = await ethers.getContractFactory('CredentialRegistry');
        const contract = await Contract.deploy(await auditLog.getAddress());
        await contract.waitForDeployment();

        await contract.addIssuer(owner.address);

        const issuerDID = ethers.keccak256(ethers.toUtf8Bytes(`issuer:${owner.address}`));
        const subjectDID = ethers.keccak256(ethers.toUtf8Bytes(`subject:${owner.address}`));
        const proofHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({ type: 'schema', n: 1 })));

        const tx = await contract.issueCredential(issuerDID, subjectDID, 'schema', proofHash, 30);
        const receipt = await tx.wait();

        const event = receipt.logs
            .map((log) => {
                try {
                    return contract.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find((parsed) => parsed && parsed.name === 'CredentialIssued');

        expect(event).to.not.equal(undefined);
        const credentialId = event.args.credentialId;

        const cred = await contract.getCredential(credentialId);
        expect(cred.subjectDID).to.equal(subjectDID);
        expect(cred.credentialType).to.equal('schema');
    });
});
