import { Value } from '@node-dlc/bitcoin';
import {
  NumericContractDescriptor,
  SingleContractInfo,
  OracleAnnouncementV0Pre167,
  PayoutFunction,
  DigitDecompositionEventDescriptorV0Pre167,
} from '@node-dlc/messaging';
import { BitcoinNetworks } from 'bitcoin-networks';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  buildCoveredCallOrderOffer,
  buildCustomStrategyOrderOffer,
  buildRoundingIntervalsFromIntervals,
  buildShortPutOrderOffer,
  computeRoundingModulus,
  UNIT_MULTIPLIER,
} from '../../../lib';
import BN from 'bignumber.js';

describe('OrderOffer Builder', () => {
  describe('buildCoveredCallOrderOffer', () => {
    const strikePrice = 50000;
    const contractSize = 100000000;
    const premium = 25000;
    const totalCollateral = contractSize;
    const oracleAnnouncementBuf = Buffer.from(
      'fdd824fd02ab1efe41fa42ea1dcd103a0251929dd2b192d2daece8a4ce4d81f68a183b750d92d6f02d796965dc79adf4e7786e08f861a1ecc897afbba2dab9cff6eb0a81937eb8b005b07acf849ad2cec22107331dedbf5a607654fad4eafe39c278e27dde68fdd822fd02450011f9313f1edd903fab297d5350006b669506eb0ffda0bb58319b4df89ac24e14fd15f9791dc78d1596b06f4969bdb37d9e394dc9fedaa18d694027fa32b5ea2a5e60080c58e13727367c3a4ce1ad65dfb3c7e3ca1ea912b0299f6e383bab2875058aa96a1c74633130af6fbd008788de6ac9db76da4ecc7303383cc1a49f525316413850f7e3ac385019d560e84c5b3a3e9ae6c83f59fe4286ddfd23ea46d7ae04610a175cd28a9bf5f574e245c3dfe230dc4b0adf4daaea96780e594f6464f676505f4b74cfe3ffc33415a23de795bf939ce64c0c02033bbfc6c9ff26fb478943a1ece775f38f5db067ca4b2a9168b40792398def9164bfe5c46838472dc3c162af16c811b7a116e9417d5bccb9e5b8a5d7d26095aba993696188c3f85a02f7ab8d12ada171c352785eb63417228c7e248909fc2d673e1bb453140bf8bf429375819afb5e9556663b76ff09c2a7ba9779855ffddc6d360cb459cf8c42a2b949d0de19fe96163d336fd66a4ce2f1791110e679572a20036ffae50204ef520c01058ff4bef28218d1c0e362ee3694ad8b2ae83a51c86c4bc1630ed6202a158810096726f809fc828fafdcf053496affdf887ae8c54b6ca4323ccecf6a51121c4f0c60e790536dab41b221db1c6b35065dc19a9d31cf75901aa35eefecbb6fefd07296cda13cb34ce3b58eba20a0eb8f9614994ec7fee3cc290e30e6b1e3211ae1f3a85b6de6abdbb77d6d9ed33a1cee3bd5cd93a71f12c9c45e385d744ad0e7286660305100fdd80a11000200076274632f75736400000000001109425443205072696365',
      'hex',
    );

    const oracleAnnouncement = OracleAnnouncementV0Pre167.deserialize(
      oracleAnnouncementBuf,
    );

    it('should build a covered call OrderOffer correctly', () => {
      sinon.stub(Date.prototype, 'getTime').returns(Date.UTC(2021, 1, 5));

      const orderOffer = buildCoveredCallOrderOffer(
        oracleAnnouncement,
        contractSize,
        strikePrice,
        premium,
        12,
        10000,
        'bitcoin',
      );

      expect(() => orderOffer.validate()).to.not.throw(Error);
    });

    it('should build a short put OrderOffer correctly', () => {
      const orderOffer = buildShortPutOrderOffer(
        oracleAnnouncement,
        contractSize,
        strikePrice,
        totalCollateral,
        premium,
        12,
        10000,
        'bitcoin',
      );

      expect(() => orderOffer.validate()).to.not.throw(Error);
    });

    it('should fail to build an OrderOffer with an invalid oracleAnnouncement', () => {
      oracleAnnouncement.announcementSig = Buffer.from('deadbeef', 'hex');

      const orderOffer = buildShortPutOrderOffer(
        oracleAnnouncement,
        contractSize,
        strikePrice,
        totalCollateral,
        premium,
        12,
        10000,
        'bitcoin',
      );

      expect(() => orderOffer.validate()).to.throw(Error);
    });
  });

  describe('buildCustomStrategyOrderOffer', () => {
    const contractSizes: Value[] = [
      Value.fromBitcoin(1),
      Value.fromBitcoin(0.1),
      Value.fromBitcoin(0.5),
      Value.fromBitcoin(1.5),
      Value.fromBitcoin(2),
    ];

    const defaultContractSize = Value.fromBitcoin(1);

    const maxLoss = Value.fromBitcoin(0.2);
    const maxGain = Value.fromBitcoin(0.04);
    const feeRate = 2n;

    const highestPrecisionRounding = Value.fromSats(10000);
    const highPrecisionRounding = Value.fromSats(25000);
    const mediumPrecisionRounding = Value.fromSats(100000);
    const lowPrecisionRounding = Value.fromSats(200000);

    const network = BitcoinNetworks.bitcoin;

    const oracleAnnouncementBuf = Buffer.from(
      'fdd824fd032e4a2b121973a7d2be4784fb6fb0c7b97405b757fb078b58bb729756a7372bf1bdc05c373472fc57fde0a07dcdad027f48f313fa1e349ab8bb936472735fce5221ff9c4885aa0c5987046ada7e729dac33591777a37af8bf14dedb95997d0c7d4bfdd822fd02c800154a2b121973a7d2be4784fb6fb0c7b97405b757fb078b58bb729756a7372bf1bdd7cb55eee59faac9a590e7d3bab782276daa0744786aaff3f69a1e51de99012339492f00198932d8057eb6742bd5245e37fd22b44e0bfaa68577ce5654b478786eb7dc091559699292dc060ee82864cffd863eb8fa876682099af34a8f3eab9174773231e6950b077df212df3fc91c199c34200cd8ce00f1c8a050ad471bfc1478e90d06bd77f11fc3804435556ed5dc1eb19b95a978f595ba127ea225c4662e22ea614cab60054d9b21da904cd9eac5b514a6a011de635ad08e0c72766a7bbc9144df24fe6bf3e0d631a61a1da27e93c6f4ea6829795f4c63628747415a41ffe199129639d7a6c430184aa925b9ab224c9180b64c86959bd7abc9ffa08fe4421952114839d5120f4ea9c9437364b4956b25a141aeefbc30d3e6cc811f9424d266671dc330b7f3d00f1f7a521e14697a0259499e6cc8fa0da13a095279f827cfe2cf11508c6d8d1405f6cb337d68fbe29fde5acbb094ff397c14c24f084ac6ef466b1d85d5160de41ed8ed435ab52f948788dc45406e07f02683c9822431d91d95a04e11e4fdb521485aa8737bdd8c67cfefd0d103f86005491181e704adafc7f49cc9700ce8cffda9c9b265bc64ed19b42d4b5e4449f6b0da81342923c45f37b1381b3a29b9acce9818f4ec6af0ecbddc063e64868f350281054d13599e6e35d503532b6fa9c0db85db703dde1de21142b351ecce626128f98ddb5dab11f669c16de45d3dd054786aa5e3fb6369114b97bee6c26d21be0f71258dfa3e8ec8b8890719eef8e817b69072f74325088781a50b4cd5fe74493828dfe9cb21b698901e48f9f4d7b70a636794feae500aac237add2630bad1257b0cac1b71a8fcd5dbd7540a84ccac5d48b76afae2b3dfe3ea8eb8cd6e67febb6a1433504329948e426064108cfdd80a0e00020004626974730000000000150f73747261746567794f7574636f6d65',
      'hex',
    );

    const oracleAnnouncement = OracleAnnouncementV0Pre167.deserialize(
      oracleAnnouncementBuf,
    );

    const unit = 'bits';

    for (const contractSize of contractSizes) {
      it(`should build a CSO OrderOffer with contract size ${contractSize.bitcoin} BTC correctly`, () => {
        const roundingIntervals = buildRoundingIntervalsFromIntervals(
          contractSize,
          [
            { beginInterval: 0n, rounding: lowPrecisionRounding },
            { beginInterval: 750000n, rounding: mediumPrecisionRounding },
            { beginInterval: 850000n, rounding: highPrecisionRounding },
            { beginInterval: 950000n, rounding: highestPrecisionRounding },
          ],
        );

        const orderOffer = buildCustomStrategyOrderOffer(
          oracleAnnouncement,
          contractSize,
          maxLoss,
          maxGain,
          feeRate,
          roundingIntervals,
          network,
        );

        const payoutCurvePieces = (((orderOffer.contractInfo as SingleContractInfo)
          .contractDescriptor as NumericContractDescriptor)
          .payoutFunction as PayoutFunction).pieces;

        expect(() => orderOffer.validate()).to.not.throw(Error);
        expect(orderOffer.contractInfo.totalCollateral).to.equal(
          contractSize.sats,
        );
        expect(orderOffer.offerCollateral).to.equal(
          contractSize.sats - (contractSize.sats * maxGain.sats) / BigInt(1e8),
        );
        // Expect first piece endpoint outcome to equal minOutcome
        expect(payoutCurvePieces[0].endPoint.eventOutcome).to.equal(BigInt(0));
        // Expect second piece endpoint outcome to equal startOutcome
        expect(payoutCurvePieces[1].endPoint.eventOutcome).to.equal(
          (defaultContractSize.sats - maxLoss.sats) /
            BigInt(UNIT_MULTIPLIER[unit]),
        );
        // Expect third piece endpoint outcome to equal endOutcome
        expect(payoutCurvePieces[2].endPoint.eventOutcome).to.equal(
          (defaultContractSize.sats + maxGain.sats) /
            BigInt(UNIT_MULTIPLIER[unit]),
        );
        // Max outcome limited by the oracle
        const maxOutcome = BigInt(
          new BN(
            (oracleAnnouncement.oracleEvent
              .eventDescriptor as DigitDecompositionEventDescriptorV0Pre167).base,
          )
            .pow(
              (oracleAnnouncement.oracleEvent
                .eventDescriptor as DigitDecompositionEventDescriptorV0Pre167)
                .nbDigits,
            )
            .minus(1)
            .toString(10),
        );
        // Expect payout function endpoint outcome to equal maxOutcome
        expect(
          (((orderOffer.contractInfo as SingleContractInfo)
            .contractDescriptor as NumericContractDescriptor)
            .payoutFunction as PayoutFunction).lastEndpoint.eventOutcome,
        ).to.equal(maxOutcome);
        // Expect first piece endpoint payout to equal min payout
        expect(payoutCurvePieces[0].endPoint.outcomePayout.sats).to.equal(
          contractSize.sats -
            (maxLoss.sats * contractSize.sats) / BigInt(1e8) -
            (maxGain.sats * contractSize.sats) / BigInt(1e8),
        );
        // Expect second piece endpoint payout to equal min payout
        expect(payoutCurvePieces[1].endPoint.outcomePayout.sats).to.equal(
          contractSize.sats -
            (maxLoss.sats * contractSize.sats) / BigInt(1e8) -
            (maxGain.sats * contractSize.sats) / BigInt(1e8),
        );
        // Expect second piece endpoint payout to equal max payout
        expect(payoutCurvePieces[2].endPoint.outcomePayout.sats).to.equal(
          contractSize.sats,
        );
      });
    }

    it('should build a CSO OrderOffer and shift the payout curve correctly for offeror fees', () => {
      const contractSize = contractSizes[0];

      const roundingIntervals = buildRoundingIntervalsFromIntervals(
        contractSize,
        [
          { beginInterval: 0n, rounding: lowPrecisionRounding },
          { beginInterval: 750000n, rounding: mediumPrecisionRounding },
          { beginInterval: 850000n, rounding: highPrecisionRounding },
          { beginInterval: 950000n, rounding: highestPrecisionRounding },
        ],
      );

      const offerFees = Value.fromSats(10000);

      const orderOffer = buildCustomStrategyOrderOffer(
        oracleAnnouncement,
        contractSize,
        maxLoss,
        maxGain,
        feeRate,
        roundingIntervals,
        network,
        'offeror',
        offerFees,
      );

      const payoutCurvePieces = (((orderOffer.contractInfo as SingleContractInfo)
        .contractDescriptor as NumericContractDescriptor)
        .payoutFunction as PayoutFunction).pieces;

      expect(() => orderOffer.validate()).to.not.throw(Error);
      expect(orderOffer.contractInfo.totalCollateral).to.equal(
        contractSize.sats,
      );
      expect(orderOffer.offerCollateral).to.equal(
        contractSize.sats - (contractSize.sats * maxGain.sats) / BigInt(1e8),
      );
      // Expect first piece endpoint outcome to equal minOutcome
      expect(payoutCurvePieces[0].endPoint.eventOutcome).to.equal(BigInt(0));
      // Expect second piece endpoint outcome to equal startOutcome plus offeror fees
      expect(payoutCurvePieces[1].endPoint.eventOutcome).to.equal(
        (defaultContractSize.sats - maxLoss.sats + offerFees.sats) /
          BigInt(UNIT_MULTIPLIER[unit]),
      );
      // Expect third piece endpoint outcome to equal endOutcome plus offeror fees
      expect(payoutCurvePieces[2].endPoint.eventOutcome).to.equal(
        (defaultContractSize.sats + maxGain.sats + offerFees.sats) /
          BigInt(UNIT_MULTIPLIER[unit]),
      );
      // Max outcome limited by the oracle
      const maxOutcome = BigInt(
        new BN(
          (oracleAnnouncement.oracleEvent
            .eventDescriptor as DigitDecompositionEventDescriptorV0Pre167).base,
        )
          .pow(
            (oracleAnnouncement.oracleEvent
              .eventDescriptor as DigitDecompositionEventDescriptorV0Pre167)
              .nbDigits,
          )
          .minus(1)
          .toString(10),
      );
      // Expect payout function endpoint outcome to equal maxOutcome
      expect(
        (((orderOffer.contractInfo as SingleContractInfo)
          .contractDescriptor as NumericContractDescriptor)
          .payoutFunction as PayoutFunction).lastEndpoint.eventOutcome,
      ).to.equal(maxOutcome);
      // Expect first piece endpoint payout to equal min payout
      expect(payoutCurvePieces[0].endPoint.outcomePayout.sats).to.equal(
        contractSize.sats -
          (maxLoss.sats * contractSize.sats) / BigInt(1e8) -
          (maxGain.sats * contractSize.sats) / BigInt(1e8),
      );
      // Expect second piece endpoint payout to equal min payout
      expect(payoutCurvePieces[1].endPoint.outcomePayout.sats).to.equal(
        contractSize.sats -
          (maxLoss.sats * contractSize.sats) / BigInt(1e8) -
          (maxGain.sats * contractSize.sats) / BigInt(1e8),
      );
      // Expect second piece endpoint payout to equal max payout
      expect(payoutCurvePieces[2].endPoint.outcomePayout.sats).to.equal(
        contractSize.sats,
      );
    });

    it('should build a CSO OrderOffer and shift the payout curve correctly for acceptor fees', () => {
      const acceptFees = Value.fromSats(10000);

      const contractSize = contractSizes[0];

      const roundingIntervals = buildRoundingIntervalsFromIntervals(
        contractSize,
        [
          { beginInterval: 0n, rounding: lowPrecisionRounding },
          { beginInterval: 750000n, rounding: mediumPrecisionRounding },
          { beginInterval: 850000n, rounding: highPrecisionRounding },
          { beginInterval: 950000n, rounding: highestPrecisionRounding },
        ],
      );

      const orderOffer = buildCustomStrategyOrderOffer(
        oracleAnnouncement,
        contractSize,
        maxLoss,
        maxGain,
        feeRate,
        roundingIntervals,
        network,
        'acceptor',
        acceptFees,
      );

      const payoutCurvePieces = (((orderOffer.contractInfo as SingleContractInfo)
        .contractDescriptor as NumericContractDescriptor)
        .payoutFunction as PayoutFunction).pieces;

      expect(() => orderOffer.validate()).to.not.throw(Error);
      expect(orderOffer.contractInfo.totalCollateral).to.equal(
        contractSize.sats,
      );
      expect(orderOffer.offerCollateral).to.equal(
        contractSize.sats - (contractSize.sats * maxGain.sats) / BigInt(1e8),
      );
      // Expect first piece endpoint outcome to equal minOutcome
      expect(payoutCurvePieces[0].endPoint.eventOutcome).to.equal(BigInt(0));
      // Expect second piece endpoint outcome to equal startOutcome minus acceptFees
      expect(payoutCurvePieces[1].endPoint.eventOutcome).to.equal(
        (defaultContractSize.sats - maxLoss.sats - acceptFees.sats) /
          BigInt(UNIT_MULTIPLIER[unit]),
      );
      // Expect third piece endpoint outcome to equal endOutcome minus acceptFees
      expect(payoutCurvePieces[2].endPoint.eventOutcome).to.equal(
        (defaultContractSize.sats + maxGain.sats - acceptFees.sats) /
          BigInt(UNIT_MULTIPLIER[unit]),
      );
      // Max outcome limited by the oracle
      const maxOutcome = BigInt(
        new BN(
          (oracleAnnouncement.oracleEvent
            .eventDescriptor as DigitDecompositionEventDescriptorV0Pre167).base,
        )
          .pow(
            (oracleAnnouncement.oracleEvent
              .eventDescriptor as DigitDecompositionEventDescriptorV0Pre167)
              .nbDigits,
          )
          .minus(1)
          .toString(10),
      );
      // Expect payout function endpoint outcome to equal maxOutcome
      expect(
        (((orderOffer.contractInfo as SingleContractInfo)
          .contractDescriptor as NumericContractDescriptor)
          .payoutFunction as PayoutFunction).lastEndpoint.eventOutcome,
      ).to.equal(maxOutcome);
      // Expect first piece endpoint payout to equal min payout
      expect(payoutCurvePieces[0].endPoint.outcomePayout.sats).to.equal(
        contractSize.sats -
          (maxLoss.sats * contractSize.sats) / BigInt(1e8) -
          (maxGain.sats * contractSize.sats) / BigInt(1e8),
      );
      // Expect second piece endpoint payout to equal min payout
      expect(payoutCurvePieces[1].endPoint.outcomePayout.sats).to.equal(
        contractSize.sats -
          (maxLoss.sats * contractSize.sats) / BigInt(1e8) -
          (maxGain.sats * contractSize.sats) / BigInt(1e8),
      );
      // Expect second piece endpoint payout to equal max payout
      expect(payoutCurvePieces[2].endPoint.outcomePayout.sats).to.equal(
        contractSize.sats,
      );
    });

    it('should build a CSO OrderOffer with contractSize 0', () => {
      const contractSize = Value.zero();

      const roundingIntervals = buildRoundingIntervalsFromIntervals(
        contractSize,
        [
          { beginInterval: 0n, rounding: lowPrecisionRounding },
          { beginInterval: 750000n, rounding: mediumPrecisionRounding },
          { beginInterval: 850000n, rounding: highPrecisionRounding },
          { beginInterval: 950000n, rounding: highestPrecisionRounding },
        ],
      );

      const orderOffer = buildCustomStrategyOrderOffer(
        oracleAnnouncement,
        contractSize,
        maxLoss,
        maxGain,
        feeRate,
        roundingIntervals,
        network,
      );

      expect(orderOffer.contractInfo.totalCollateral).to.equal(
        contractSize.sats,
      );
    });

    it('should fail to build a CSO OrderOffer with an invalid oracleAnnouncement', () => {
      const contractSize = contractSizes[0];

      const roundingIntervals = buildRoundingIntervalsFromIntervals(
        contractSize,
        [
          { beginInterval: 0n, rounding: lowPrecisionRounding },
          { beginInterval: 750000n, rounding: mediumPrecisionRounding },
          { beginInterval: 850000n, rounding: highPrecisionRounding },
          { beginInterval: 950000n, rounding: highestPrecisionRounding },
        ],
      );

      oracleAnnouncement.announcementSig = Buffer.from('deadbeef', 'hex');

      const orderOffer = buildCustomStrategyOrderOffer(
        oracleAnnouncement,
        contractSize,
        maxLoss,
        maxGain,
        feeRate,
        roundingIntervals,
        network,
      );

      expect(() => orderOffer.validate()).to.throw(Error);
    });
  });

  describe('computeRoundingModulus', () => {
    it('should properly compute the rounding modulus for 0.0001 BTC', () => {
      const modulus = computeRoundingModulus(100000, 10000);
      expect(modulus).to.equal(BigInt(10));
    });

    it('should properly compute the rounding modulus for 1 BTC', () => {
      const modulus = computeRoundingModulus(100000, 100000000);
      expect(modulus).to.equal(BigInt(100000));
    });

    it('should properly compute the rounding modulus for 1.25 BTC', () => {
      const modulus = computeRoundingModulus(5000, 125000000);
      expect(modulus).to.equal(BigInt(6250));
    });

    it('should properly compute the rounding modulus for 0.9 BTC', () => {
      const modulus = computeRoundingModulus(100000, 90000000);
      expect(modulus).to.equal(BigInt(90000));
    });
  });
});
