// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AuditLog
 * @dev Maintains immutable audit trail for all identity operations
 * Implements PHASE 3: Access & Audit
 */
contract AuditLog {
    
    enum ActionType {
        DID_CREATED,
        DID_UPDATED,
        DID_REVOKED,
        CREDENTIAL_ISSUED,
        CREDENTIAL_VERIFIED,
        CREDENTIAL_REVOKED,
        PRESENTATION_CREATED,
        PRESENTATION_VERIFIED,
        ACCESS_GRANTED,
        ACCESS_DENIED
    }
    
    struct AuditRecord {
        uint256 recordId;
        ActionType action;
        address actor;
        bytes32 subjectDID;
        bytes32 relatedEntity;  // credentialId, didHash, etc.
        string details;
        uint256 timestamp;
        string ipfsHash;  // Optional: off-chain data reference
    }
    
    mapping(uint256 => AuditRecord) public auditRecords;
    mapping(bytes32 => uint256[]) public didAuditTrail;
    mapping(bytes32 => uint256[]) public credentialAuditTrail;
    
    uint256 public recordCount = 0;
    
    event AuditLogged(
        uint256 indexed recordId,
        ActionType indexed action,
        address indexed actor,
        bytes32 subjectDID,
        uint256 timestamp
    );
    
    /**
     * @dev Log an action to the audit trail
     * @param _action Type of action performed
     * @param _subjectDID DID of the subject
     * @param _relatedEntity Related entity ID (credentialId, etc.)
     * @param _details Description of the action
     * @param _ipfsHash Optional IPFS hash for off-chain data
     */
    function logAction(
        ActionType _action,
        bytes32 _subjectDID,
        bytes32 _relatedEntity,
        string memory _details,
        string memory _ipfsHash
    ) external {
        recordCount++;
        
        AuditRecord memory record = AuditRecord({
            recordId: recordCount,
            action: _action,
            actor: msg.sender,
            subjectDID: _subjectDID,
            relatedEntity: _relatedEntity,
            details: _details,
            timestamp: block.timestamp,
            ipfsHash: _ipfsHash
        });
        
        auditRecords[recordCount] = record;
        
        if (_subjectDID != bytes32(0)) {
            didAuditTrail[_subjectDID].push(recordCount);
        }
        
        if (_relatedEntity != bytes32(0)) {
            credentialAuditTrail[_relatedEntity].push(recordCount);
        }
        
        emit AuditLogged(recordCount, _action, msg.sender, _subjectDID, block.timestamp);
    }
    
    /**
     * @dev Get audit record
     * @param _recordId ID of the audit record
     */
    function getAuditRecord(uint256 _recordId) 
        external 
        view 
        returns (AuditRecord memory) 
    {
        require(_recordId > 0 && _recordId <= recordCount, "Invalid record ID");
        return auditRecords[_recordId];
    }
    
    /**
     * @dev Get DID's audit trail
     * @param _didHash Hash of the DID
     */
    function getDIDAuditTrail(bytes32 _didHash) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return didAuditTrail[_didHash];
    }
    
    /**
     * @dev Get credential's audit trail
     * @param _credentialId Hash of the credential
     */
    function getCredentialAuditTrail(bytes32 _credentialId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return credentialAuditTrail[_credentialId];
    }
    
    /**
     * @dev Get recent audit records
     * @param _limit Number of recent records to retrieve
     */
    function getRecentAuditRecords(uint256 _limit) 
        external 
        view 
        returns (AuditRecord[] memory) 
    {
        uint256 start = recordCount > _limit ? recordCount - _limit : 1;
        uint256 length = recordCount >= start ? recordCount - start + 1 : 0;
        
        AuditRecord[] memory result = new AuditRecord[](length);
        
        for (uint256 i = 0; i < length; i++) {
            result[i] = auditRecords[start + i];
        }
        
        return result;
    }
    
    /**
     * @dev Get total audit record count
     */
    function getAuditRecordCount() external view returns (uint256) {
        return recordCount;
    }
}
