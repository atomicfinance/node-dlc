# Node-DLC

![Build Status](https://github.com/AtomicFinance/node-dlc/actions/workflows/main.yml/badge.svg)
[![Standard Code Style](https://img.shields.io/badge/codestyle-standard-brightgreen.svg)](https://github.com/standard/standard)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

## Description

Node-DLC is a an implementation of Bitcoin DLC Protocol in the Node.js runtime, with CET signature generation achieved with [cfd-dlc](https://github.com/cryptogarageinc/cfd-dlc-js) wrapper (written in C++).

## Modules

- [@node-dlc/cli](https://github.com/atomicfinance/node-dlc/tree/master/packages/cli)
- [@node-dlc/core](https://github.com/atomicfinance/node-dlc/tree/master/packages/core)
- [@node-dlc/logger](https://github.com/atomicfinance/node-dlc/tree/master/packages/logger)
- [@node-dlc/messaging](https://github.com/atomicfinance/node-dlc/tree/master/packages/messaging)
- [@node-dlc/rocksdb](https://github.com/atomicfinance/node-dlc/tree/master/packages/rocksdb)
- [@node-dlc/transport](https://github.com/atomicfinance/node-dlc/tree/master/packages/transport)

## Dependencies

Many elements of the project as well as components are inspired by [Node-Lightning](https://github.com/altangent/node-lightning/), an Node.js implementation of the Bitcoin Lightning Network. The project also uses several packages such as:

- [@node-lightning/bitcoin](https://github.com/altangent/node-lightning/tree/main/packages/bitcoin)
- [@node-lightning/bufio](https://github.com/altangent/node-lightning/tree/main/packages/bufio)
- [@node-lightning/core](https://github.com/altangent/node-lightning/tree/main/packages/core)
- [@node-lightning/crypto](https://github.com/altangent/node-lightning/tree/main/packages/crypto)
- [@node-lightning/gossip-rocksdb](https://github.com/altangent/node-lightning/tree/main/packages/gossip-rocksdb)
- [@node-lightning/logger](https://github.com/altangent/node-lightning/tree/main/packages/logger)
- [@node-lightning/wire](https://github.com/altangent/node-lightning/tree/main/packages/wire)

## DLC Spec Compliance

`@node-dlc/messaging` and `@node-dlc/core` packages implement many aspects of the DLC Specification

Note: These packages contains functionality for message **generation**, **serialization** and **deserialization** and contain no logic for wallet functionality
For DLC wallet functionality, you can check out [Chainify-Finance](https://github.com/atomicfinance/chainify-finance) which uses [Node-DLC](https://github.com/AtomicFinance/node-dlc) messaging functionality and [Liquality Chainify](https://github.com/liquality/chainify) wallet functionality to enable easy creation of wallets with the capability of entering into DLCs.

Implemented features:

- Dlc [Offer](packages/messaging/lib/messages/DlcOffer.ts), [Accept](packages/messaging/lib/messages/DlcAccept.ts), [Sign](packages/messaging/lib/messages/DlcSign.ts) V0 message support
- Oracle [Announcement](packages/messaging/lib/messages/OracleAnnouncementV0.ts) and [Attestation](packages/messaging/lib/messages/OracleAttestationV0.ts) V0 message support
- ContractInfo V0 and V1 [message](packages/messaging/lib/messages/ContractInfo.ts) support (multi oracle message support)
- Enum Event Descriptor and Digit Decomposition Event Descriptor V0 [message](packages/messaging/lib/messages/EventDescriptor.ts) support
- Numeric Outcome [message](packages/messaging/lib/messages/RoundingIntervalsV0.ts) and [payout generation](packages/core/lib/dlc/HyperbolaPayoutCurve.ts) support
- Polynomial (linear) payout [message](packages/messaging/lib/messages/PayoutCurvePiece.ts) and [curve](packages/core/lib/dlc/PolynomialPayoutCurve.ts) support
- Hyperbola (1/x) shaped payout [message](packages/messaging/lib/messages/PayoutCurvePiece.ts) and [curve](packages/core/lib/dlc/HyperbolaPayoutCurve.ts) support
- Dlc [Close](packages/messaging/lib/messages/DlcClose.ts) V0 message support from [mutual close proposal](https://github.com/discreetlogcontracts/dlcspecs/pull/170)

Missing features:

- Backwards compatibility with (messaging and serialization proposal)[https://github.com/discreetlogcontracts/dlcspecs/pull/171]
- [V0 Oracle Changes](https://github.com/discreetlogcontracts/dlcspecs/pull/167) message types proposal

## Development

```bash
yarn install
yarn bootstrap
yarn test
```

## Production

```bash
yarn build
```

## Usage

```javascript
import { OracleAnnouncement } from '@node-dlc/messaging';

const buf = Buffer.from(
  'fdd824fd02ab1efe41fa42ea1dcd103a0251929dd2b192d2daece8a4ce4d81f68a183b750d92d6f02d796965dc79adf4e7786e08f861a1ecc897afbba2dab9cff6eb0a81937eb8b005b07acf849ad2cec22107331dedbf5a607654fad4eafe39c278e27dde68fdd822fd02450011f9313f1edd903fab297d5350006b669506eb0ffda0bb58319b4df89ac24e14fd15f9791dc78d1596b06f4969bdb37d9e394dc9fedaa18d694027fa32b5ea2a5e60080c58e13727367c3a4ce1ad65dfb3c7e3ca1ea912b0299f6e383bab2875058aa96a1c74633130af6fbd008788de6ac9db76da4ecc7303383cc1a49f525316413850f7e3ac385019d560e84c5b3a3e9ae6c83f59fe4286ddfd23ea46d7ae04610a175cd28a9bf5f574e245c3dfe230dc4b0adf4daaea96780e594f6464f676505f4b74cfe3ffc33415a23de795bf939ce64c0c02033bbfc6c9ff26fb478943a1ece775f38f5db067ca4b2a9168b40792398def9164bfe5c46838472dc3c162af16c811b7a116e9417d5bccb9e5b8a5d7d26095aba993696188c3f85a02f7ab8d12ada171c352785eb63417228c7e248909fc2d673e1bb453140bf8bf429375819afb5e9556663b76ff09c2a7ba9779855ffddc6d360cb459cf8c42a2b949d0de19fe96163d336fd66a4ce2f1791110e679572a20036ffae50204ef520c01058ff4bef28218d1c0e362ee3694ad8b2ae83a51c86c4bc1630ed6202a158810096726f809fc828fafdcf053496affdf887ae8c54b6ca4323ccecf6a51121c4f0c60e790536dab41b221db1c6b35065dc19a9d31cf75901aa35eefecbb6fefd07296cda13cb34ce3b58eba20a0eb8f9614994ec7fee3cc290e30e6b1e3211ae1f3a85b6de6abdbb77d6d9ed33a1cee3bd5cd93a71f12c9c45e385d744ad0e7286660305100fdd80a11000200076274632f75736400000000001109425443205072696365',
  'hex',
);

const instance = OracleAnnouncement.deserialize(buf);
```
