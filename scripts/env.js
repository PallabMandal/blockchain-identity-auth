const fs = require('fs');

const CONTRACT_ADDRESS_KEYS = [
    'DID_REGISTRY_ADDRESS',
    'CREDENTIAL_REGISTRY_ADDRESS',
    'AUDIT_LOG_ADDRESS'
];

function writeContractAddresses(envPath, addresses) {
    const existingContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const preservedLines = existingContent
        .split(/\r?\n/)
        .filter((line) => {
            const trimmed = line.trim();
            if (trimmed === '# Smart Contract Addresses') {
                return false;
            }

            return !CONTRACT_ADDRESS_KEYS.some((key) => trimmed.startsWith(`${key}=`));
        });

    while (preservedLines.length > 0 && preservedLines[preservedLines.length - 1] === '') {
        preservedLines.pop();
    }

    const contractAddressLines = [
        '# Smart Contract Addresses',
        `DID_REGISTRY_ADDRESS=${addresses.didRegistryAddress}`,
        `CREDENTIAL_REGISTRY_ADDRESS=${addresses.credentialRegistryAddress}`,
        `AUDIT_LOG_ADDRESS=${addresses.auditLogAddress}`
    ];

    const nextContent = [...preservedLines, '', ...contractAddressLines, ''].join('\n');
    fs.writeFileSync(envPath, nextContent);
}

module.exports = {
    writeContractAddresses
};
