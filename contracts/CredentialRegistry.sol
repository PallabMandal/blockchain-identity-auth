// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AuditLog.sol";

/**
 * @title CredentialRegistry
 * @dev Manages Verifiable Credentials (VCs) and Verifiable Presentations (VPs)
 * Implements PHASE 2: Authentication & Verification
 */
contract CredentialRegistry {
    
    struct VerifiableCredential {
        bytes32 credentialId;
        bytes32 issuerDID;
        bytes32 subjectDID;
        string credentialType;
        bytes32 credentialHash;  // Hash of encrypted credential data
        uint256 issuedAt;
        uint256 expiresAt;
        bool revoked;
        bool verified;
    }
    
    struct VerifiablePresentation {
        bytes32 presentationId;
        bytes32 subjectDID;
        bytes32[] credentialIds;
        string proofHash;
        uint256 presentedAt;
        bool verified;
    }
    
    mapping(bytes32 => VerifiableCredential) public credentials;
    mapping(bytes32 => VerifiablePresentation) public presentations;
    mapping(bytes32 => bool) public revokedCredentials;
    mapping(bytes32 => address) public issuerRegistry;
    mapping(address => bool) public isIssuer;
    address public owner;
    AuditLog public auditLog;

    modifier onlyIssuer() {
        require(isIssuer[msg.sender], "Not authorized issuer");
        _;
    }

    constructor(address _auditLog) {
        auditLog = AuditLog(_auditLog);
        owner = msg.sender;
        isIssuer[msg.sender] = true;
    }

    function addIssuer(address _issuer) public {
        require(msg.sender == owner, "Only owner");
        isIssuer[_issuer] = true;
    }
    
    event CredentialIssued(
        bytes32 indexed credentialId,
        bytes32 indexed issuerDID,
        bytes32 indexed subjectDID,
        uint256 expiresAt
    );
    event CredentialVerified(bytes32 indexed credentialId);
    event CredentialRevoked(bytes32 indexed credentialId);
    event PresentationVerified(bytes32 indexed presentationId, bool verified);
    
    /**
     * @dev Issue a verifiable credential
     * @param _issuerDID Hash of issuer's DID
     * @param _subjectDID Hash of subject's DID
     * @param _credentialType Type of credential (e.g., "GovernmentID")
     * @param _credentialHash Encrypted credential data hash
     * @param _expiryDays Credential validity period in days
     */
    function issueCredential(
        bytes32 _issuerDID,
        bytes32 _subjectDID,
        string memory _credentialType,
        bytes32 _credentialHash,
        uint256 _expiryDays
    ) external onlyIssuer {
        require(_expiryDays > 0, "Expiry must be positive");
        
        bytes32 credentialId = keccak256(
            abi.encodePacked(_issuerDID, _subjectDID, block.timestamp)
        );
        
        require(credentials[credentialId].credentialId == 0, "Credential exists");
        
        uint256 expiresAt = block.timestamp + (_expiryDays * 1 days);
        
        credentials[credentialId] = VerifiableCredential({
            credentialId: credentialId,
            issuerDID: _issuerDID,
            subjectDID: _subjectDID,
            credentialType: _credentialType,
            credentialHash: _credentialHash,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            revoked: false,
            verified: false
        });
        
        issuerRegistry[_issuerDID] = msg.sender;
        
        emit CredentialIssued(credentialId, _issuerDID, _subjectDID, expiresAt);
        auditLog.logAction(
            AuditLog.ActionType.CREDENTIAL_ISSUED,
            _subjectDID,
            credentialId,
            "Credential issued",
            ""
        );
    }
    
    /**
     * @dev Verify a credential (used by verifiers)
     * @param _credentialId Hash of the credential
     * @param _submittedHash Hash of the submitted certificate payload for integrity verification
     */
    function verifyCredential(bytes32 _credentialId, bytes32 _submittedHash) external {
        VerifiableCredential storage cred = credentials[_credentialId];
        
        require(cred.credentialId != 0, "Credential not found");
        require(cred.credentialHash == _submittedHash, "Credential data mismatch: payload does not match stored commitment");
        require(!cred.revoked, "Credential is revoked");
        require(block.timestamp <= cred.expiresAt, "Credential expired");
        
        cred.verified = true;
        emit CredentialVerified(_credentialId);
        auditLog.logAction(
            AuditLog.ActionType.CREDENTIAL_VERIFIED,
            cred.subjectDID,
            _credentialId,
            "Credential verified and integrity confirmed",
            ""
        );
    }
    
    /**
     * @dev Revoke a credential
     * @param _credentialId Hash of the credential
     */
    function revokeCredential(bytes32 _credentialId) external {
        VerifiableCredential storage cred = credentials[_credentialId];
        
        require(cred.credentialId != 0, "Credential not found");
        require(issuerRegistry[cred.issuerDID] == msg.sender, "Not issuer");
        
        cred.revoked = true;
        revokedCredentials[_credentialId] = true;
        
        emit CredentialRevoked(_credentialId);
        auditLog.logAction(
            AuditLog.ActionType.CREDENTIAL_REVOKED,
            cred.subjectDID,
            _credentialId,
            "Credential revoked",
            ""
        );
    }
    
    /**
     * @dev Create a verifiable presentation
     * @param _subjectDID Hash of subject's DID
     * @param _credentialIds Array of credential IDs to present
     * @param _proofHash Hash of presentation proof payload
     */
    function createPresentation(
        bytes32 _subjectDID,
        bytes32[] memory _credentialIds,
        string memory _proofHash
    ) external {
        require(_credentialIds.length > 0, "At least one credential required");
        
        bytes32 presentationId = keccak256(
            abi.encodePacked(_subjectDID, block.timestamp)
        );
        
        // Verify all credentials belong to subject
        for (uint256 i = 0; i < _credentialIds.length; i++) {
            require(
                credentials[_credentialIds[i]].subjectDID == _subjectDID,
                "Credential not for this subject"
            );
            require(
                !credentials[_credentialIds[i]].revoked,
                "Revoked credential in presentation"
            );
            require(
                block.timestamp <= credentials[_credentialIds[i]].expiresAt,
                "Expired credential in presentation"
            );
        }
        
        presentations[presentationId] = VerifiablePresentation({
            presentationId: presentationId,
            subjectDID: _subjectDID,
            credentialIds: _credentialIds,
            proofHash: _proofHash,
            presentedAt: block.timestamp,
            verified: false
        });

        auditLog.logAction(
            AuditLog.ActionType.PRESENTATION_CREATED,
            _subjectDID,
            presentationId,
            "Presentation created",
            _proofHash
        );
    }
    
    /**
     * @dev Verify a presentation (by verifier/service provider)
     * @param _presentationId Hash of the presentation
     */
    function verifyPresentation(bytes32 _presentationId) external {
        VerifiablePresentation storage pres = presentations[_presentationId];
        
        require(pres.presentationId != 0, "Presentation not found");
        
        // Verify all credentials in presentation
        for (uint256 i = 0; i < pres.credentialIds.length; i++) {
            bytes32 credId = pres.credentialIds[i];
            require(credentials[credId].verified, "Credential not verified");
        }
        
        pres.verified = true;
        emit PresentationVerified(_presentationId, true);
        auditLog.logAction(
            AuditLog.ActionType.PRESENTATION_VERIFIED,
            pres.subjectDID,
            _presentationId,
            "Presentation verified",
            pres.proofHash
        );
    }
    
    /**
     * @dev Get credential details (includes credentialHash for integrity verification)
     * @param _credentialId Hash of the credential
     */
    function getCredential(bytes32 _credentialId) 
        external 
        view 
        returns (VerifiableCredential memory) 
    {
        return credentials[_credentialId];
    }
    
    /**
     * @dev Verify credential integrity by comparing payload hash
     * @param _credentialId Hash of the credential
     * @param _payloadHash Hash of the certificate payload to verify
     */
    function verifyCredentialIntegrity(bytes32 _credentialId, bytes32 _payloadHash)
        external
        view
        returns (bool)
    {
        VerifiableCredential memory cred = credentials[_credentialId];
        return cred.credentialId != 0 && cred.credentialHash == _payloadHash;
    }
    
    /**
     * @dev Get presentation details
     * @param _presentationId Hash of the presentation
     */
    function getPresentation(bytes32 _presentationId) 
        external 
        view 
        returns (VerifiablePresentation memory) 
    {
        return presentations[_presentationId];
    }
    
    /**
     * @dev Check if credential is valid and verified
     * @param _credentialId Hash of the credential
     */
    function isCredentialValid(bytes32 _credentialId) 
        external 
        view 
        returns (bool) 
    {
        VerifiableCredential memory cred = credentials[_credentialId];
        return cred.verified && !cred.revoked && block.timestamp <= cred.expiresAt;
    }
}
