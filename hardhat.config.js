require('@nomicfoundation/hardhat-toolbox');

const ganacheAccounts = process.env.GANACHE_PRIVATE_KEY
    ? [process.env.GANACHE_PRIVATE_KEY]
    : undefined;

module.exports = {
    solidity: {
        version: '0.8.0',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        ganache: {
            url: 'http://127.0.0.1:7545',
            accounts: ganacheAccounts,
        },
        hardhat: {
            chainId: 1337,
        },
    },
    paths: {
        sources: './contracts',
        tests: './test',
        cache: './cache',
        artifacts: './artifacts',
    },
};
