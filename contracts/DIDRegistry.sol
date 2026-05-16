// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DIDRegistry
 * @dev Manages Decentralized Identifiers (DIDs) on the blockchain
 * Implements PHASE 1: Registration & Issuance
 */
contract DIDRegistry {
    
    struct DIDDocument {
        address owner;
        string didString;  // did:example:123abc
        string publicKey;
        uint256 created;
        uint256 updated;
        bool active;
        bytes32 schemaHash;
    }
    
    mapping(bytes32 => DIDDocument) public dids;
    mapping(address => bytes32) public addressToDID;
    mapping(bytes32 => bool) public schemaRegistry;
    
    event DIDCreated(bytes32 indexed didHash, address indexed owner, string didString);
    event DIDUpdated(bytes32 indexed didHash, address indexed owner);
    event DIDRevoked(bytes32 indexed didHash, address indexed owner);
    event SchemaRegistered(bytes32 indexed schemaHash, string schema);
    
    /**
     * @dev Register a new DID
     * @param _didString The DID string (e.g., "did:blockchain:123abc")
     * @param _publicKey Public key for verification
     * @param _schemaHash Hash of the schema
     */
    function registerDID(
        string memory _didString,
        string memory _publicKey,
        bytes32 _schemaHash
    ) external {
        require(bytes(_didString).length > 0, "DID string required");
        require(schemaRegistry[_schemaHash], "Schema not registered");
        
        bytes32 didHash = keccak256(abi.encodePacked(_didString));
        require(dids[didHash].owner == address(0), "DID already exists");
        
        dids[didHash] = DIDDocument({
            owner: msg.sender,
            didString: _didString,
            publicKey: _publicKey,
            created: block.timestamp,
            updated: block.timestamp,
            active: true,
            schemaHash: _schemaHash
        });
        
        addressToDID[msg.sender] = didHash;
        
        emit DIDCreated(didHash, msg.sender, _didString);
    }
    
    /**
     * @dev Register a new schema on the blockchain
     * @param _schema JSON schema for the credential
     */
    function registerSchema(string memory _schema) external {
        bytes32 schemaHash = keccak256(abi.encodePacked(_schema));
        require(!schemaRegistry[schemaHash], "Schema already registered");
        
        schemaRegistry[schemaHash] = true;
        emit SchemaRegistered(schemaHash, _schema);
    }
    
    /**
     * @dev Update a DID document
     * @param _didHash Hash of the DID
     * @param _newPublicKey Updated public key
     */
    function updateDID(
        bytes32 _didHash,
        string memory _newPublicKey
    ) external {
        require(dids[_didHash].owner == msg.sender, "Not DID owner");
        require(dids[_didHash].active, "DID is revoked");
        
        dids[_didHash].publicKey = _newPublicKey;
        dids[_didHash].updated = block.timestamp;
        
        emit DIDUpdated(_didHash, msg.sender);
    }
    
    /**
     * @dev Revoke a DID
     * @param _didHash Hash of the DID
     */
    function revokeDID(bytes32 _didHash) external {
        require(dids[_didHash].owner == msg.sender, "Not DID owner");
        
        dids[_didHash].active = false;
        dids[_didHash].updated = block.timestamp;
        
        emit DIDRevoked(_didHash, msg.sender);
    }
    
    /**
     * @dev Get DID document
     * @param _didHash Hash of the DID
     */
    function getDID(bytes32 _didHash) external view returns (DIDDocument memory) {
        return dids[_didHash];
    }
    
    /**
     * @dev Get DID hash from address
     * @param _address User address
     */
    function getDIDFromAddress(address _address) external view returns (bytes32) {
        return addressToDID[_address];
    }
    
    /**
     * @dev Check if DID is active
     * @param _didHash Hash of the DID
     */
    function isDIDActive(bytes32 _didHash) external view returns (bool) {
        return dids[_didHash].active;
    }
}
