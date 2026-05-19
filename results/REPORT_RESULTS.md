# Results Dump (Generated)

## Run Context

- Date: 2026-05-19T08:07:07.026Z
- Runs per metric: 10
- Ganache RPC: http://127.0.0.1:7545
- Backend API: http://localhost:5000/api/v1
- Chain ID: 1337

## Sample Identifiers

- Issuer DID: 0xc239916c2bee95638939246cf7021ad808d6c517dcccafbddf1a7fe657b4d5a0
- Subject DID: 0x49d3a12150b0143743f5003ceefb1ce5961f6f8139d394e9913ae91f561d40cc
- Last Credential ID: 0xf2bfcc5324cd0f890c35efe3a071c7443d3c283c7c890e3bc3623459fe940b05

## Write Transaction Metrics

| Metric | Runs | Avg Latency | Min Latency | Max Latency | Avg Gas | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| DID register | 10 | 268.84 ms | 237.07 ms | 320.01 ms | 216891 | registerDID |
| Credential issue | 10 | 420.02 ms | 390.57 ms | 449.62 ms | 432400 | issueCredential |
| Credential verify | 10 | 380.38 ms | 341.83 ms | 437.66 ms | 304101 | verifyCredential |

## Backend Read Latency Metrics

| Endpoint | Runs | Avg Latency | Min Latency | Max Latency | Errors |
| --- | --- | --- | --- | --- | --- |
| GET /health | 10 | 48.05 ms | 19.39 ms | 188.42 ms | 0 |
| GET /did/:didHash | 10 | 48.74 ms | 37.10 ms | 57.43 ms | 0 |
| GET /credential/:credentialId | 10 | 44.81 ms | 33.66 ms | 49.62 ms | 0 |
| GET /audit/did/:didHash/ids | 10 | 35.54 ms | 29.10 ms | 49.89 ms | 0 |
| GET /audit/did/:didHash | 10 | 151.48 ms | 142.20 ms | 168.23 ms | 0 |
| GET /audit/credential/:credentialId | 10 | 147.86 ms | 122.21 ms | 187.14 ms | 0 |
| GET /audit/recent/:limit | 10 | 384.10 ms | 348.27 ms | 445.38 ms | 0 |

## Errors / Notes

- None
