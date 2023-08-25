import { Value } from '@node-dlc/bitcoin';
import {
  NumericContractDescriptor,
  SingleContractInfo,
  DigitDecompositionEventDescriptorV0Pre167,
  DlcOfferV0,
  OracleAnnouncementV0Pre167,
  OracleEventV0Pre167,
  SingleOracleInfo,
  PayoutFunction,
  PolynomialPayoutCurvePiece,
} from '@node-dlc/messaging';
import { BitcoinNetworks } from 'bitcoin-networks';
import { expect } from 'chai';

import {
  buildCustomStrategyOrderOffer,
  buildRoundingIntervalsFromIntervals,
  DlcParty,
  LinearPayout,
} from '../../../lib';
import {
  getCsoInfoFromContractInfo,
  getCsoInfoFromOffer,
  validateCsoPayoutFunction,
} from '../../../lib/dlc/finance/CsoInfo';

const buildCsoDlcOfferFixture = (
  oracleDigits: number,
  expiry: Date,
  payoutFunction: PayoutFunction,
  totalCollateral: bigint,
  offerCollateral: bigint,
): DlcOfferV0 => {
  const eventDescriptor = new DigitDecompositionEventDescriptorV0Pre167();
  eventDescriptor.base = 2;
  eventDescriptor.isSigned = false;
  eventDescriptor.unit = 'bits';
  eventDescriptor.precision = 0;
  eventDescriptor.nbDigits = oracleDigits;

  const oracleEvent = new OracleEventV0Pre167();
  oracleEvent.eventMaturityEpoch = Math.floor(expiry.getTime() / 1000);
  oracleEvent.eventDescriptor = eventDescriptor;

  const oracleAnnouncement = new OracleAnnouncementV0Pre167();
  oracleAnnouncement.oracleEvent = oracleEvent;

  const oracleInfo = new SingleOracleInfo();
  oracleInfo.announcement = oracleAnnouncement;

  const contractDescriptor = new NumericContractDescriptor();
  contractDescriptor.numDigits = oracleDigits;
  contractDescriptor.payoutFunction = payoutFunction;

  const contractInfo = new SingleContractInfo();
  contractInfo.totalCollateral = totalCollateral;
  contractInfo.contractDescriptor = contractDescriptor;
  contractInfo.oracleInfo = oracleInfo;

  const dlcOffer = new DlcOfferV0();
  dlcOffer.contractInfo = contractInfo;
  dlcOffer.offerCollateral = offerCollateral;

  return dlcOffer;
};

describe('CsoInfo', () => {
  const minPayout = 60000000n;
  const maxPayout = 100000000n;
  const startOutcome = 800000n;
  const endOutcome = 1200000n;
  const offerCollateralValue = 80000000n;

  const oracleBase = 2;
  const oracleDigits = 21;

  const expiry = new Date(1620014750000);

  const maxGain = Value.fromBitcoin(0.2);
  const maxLoss = Value.fromBitcoin(0.2);

  const contractSize = Value.fromBitcoin(1);
  const offerCollateral = Value.fromBitcoin(0.8);

  describe('CsoInfo from linear curve message', () => {
    const { payoutFunction } = LinearPayout.buildPayoutFunction(
      minPayout,
      maxPayout,
      startOutcome,
      endOutcome,
      oracleBase,
      oracleDigits,
    );

    const dlcOffer = buildCsoDlcOfferFixture(
      oracleDigits,
      expiry,
      payoutFunction,
      maxPayout,
      offerCollateralValue,
    );

    const contractInfo = dlcOffer.contractInfo;

    it('should get correct CsoInfo from ContractInfo', () => {
      const csoInfo = getCsoInfoFromContractInfo(contractInfo);

      expect(csoInfo).to.deep.equal({
        maxGain,
        maxLoss,
        minPayout,
        maxPayout,
        contractSize,
        offerCollateral,
        expiry,
      });
    });

    it('should get correct CsoInfo from ContractInfo', () => {
      const csoInfo = getCsoInfoFromOffer(dlcOffer);

      expect(csoInfo).to.deep.equal({
        maxGain,
        maxLoss,
        minPayout,
        maxPayout,
        contractSize,
        offerCollateral,
        expiry,
      });
    });

    it('should throw if offerCollateral does not match calculated offerCollateral', () => {
      const { payoutFunction } = LinearPayout.buildPayoutFunction(
        minPayout,
        maxPayout,
        startOutcome,
        endOutcome,
        oracleBase,
        oracleDigits,
      );

      const dlcOffer = buildCsoDlcOfferFixture(
        oracleDigits,
        expiry,
        payoutFunction,
        maxPayout,
        offerCollateralValue,
      );

      dlcOffer.offerCollateral -= BigInt(10000);

      expect(() => getCsoInfoFromOffer(dlcOffer)).to.throw(Error);
    });

    it('should get correct CsoInfo from ContractInfo with fees shifted', () => {
      const eventDescriptor = new DigitDecompositionEventDescriptorV0Pre167();
      eventDescriptor.base = 2;
      eventDescriptor.isSigned = false;
      eventDescriptor.unit = 'bits';
      eventDescriptor.precision = 0;
      eventDescriptor.nbDigits = oracleDigits;

      const oracleEvent = new OracleEventV0Pre167();
      oracleEvent.eventMaturityEpoch = Math.floor(expiry.getTime() / 1000);
      oracleEvent.eventDescriptor = eventDescriptor;

      const oracleAnnouncement = new OracleAnnouncementV0Pre167();
      oracleAnnouncement.oracleEvent = oracleEvent;

      const contractSize = Value.fromBitcoin(1);

      const maxLoss = Value.fromBitcoin(0.2);
      const maxGain = Value.fromBitcoin(0.04);

      const feeRate = 10n;

      const highestPrecisionRounding = Value.fromSats(10000);
      const highPrecisionRounding = Value.fromSats(25000);
      const mediumPrecisionRounding = Value.fromSats(100000);
      const lowPrecisionRounding = Value.fromSats(200000);

      const roundingIntervals = buildRoundingIntervalsFromIntervals(
        contractSize,
        [
          { beginInterval: 0n, rounding: lowPrecisionRounding },
          { beginInterval: 750000n, rounding: mediumPrecisionRounding },
          { beginInterval: 850000n, rounding: highPrecisionRounding },
          { beginInterval: 950000n, rounding: highestPrecisionRounding },
        ],
      );

      const network = BitcoinNetworks.bitcoin;

      const shiftForFees: DlcParty = 'offeror';
      const fees = Value.fromSats(10000);

      const csoOrderOffer = buildCustomStrategyOrderOffer(
        oracleAnnouncement,
        contractSize,
        maxLoss,
        maxGain,
        feeRate,
        roundingIntervals,
        network,
        shiftForFees,
        fees,
      );

      const csoInfoFromContractInfo = getCsoInfoFromContractInfo(
        csoOrderOffer.contractInfo,
        shiftForFees,
        fees,
      );
      const csoInfoFromOffer = getCsoInfoFromOffer(csoOrderOffer);

      expect(csoInfoFromContractInfo.maxGain.sats).to.equal(maxGain.sats);
      expect(csoInfoFromContractInfo.maxLoss.sats).to.equal(maxLoss.sats);

      expect(csoInfoFromOffer.maxGain.sats).to.equal(maxGain.sats);
      expect(csoInfoFromOffer.maxLoss.sats).to.equal(maxLoss.sats);
    });

    it('should get correct CsoInfo from ContractInfo with fees shifted contract size 0.01', () => {
      const eventDescriptor = new DigitDecompositionEventDescriptorV0Pre167();
      eventDescriptor.base = 2;
      eventDescriptor.isSigned = false;
      eventDescriptor.unit = 'bits';
      eventDescriptor.precision = 0;
      eventDescriptor.nbDigits = oracleDigits;

      const oracleEvent = new OracleEventV0Pre167();
      oracleEvent.eventMaturityEpoch = Math.floor(expiry.getTime() / 1000);
      oracleEvent.eventDescriptor = eventDescriptor;

      const oracleAnnouncement = new OracleAnnouncementV0Pre167();
      oracleAnnouncement.oracleEvent = oracleEvent;

      const contractSize = Value.fromBitcoin(0.01);

      const maxLoss = Value.fromBitcoin(0.2);
      const maxGain = Value.fromBitcoin(0.04);

      const feeRate = 10n;

      const highestPrecisionRounding = Value.fromSats(10000);
      const highPrecisionRounding = Value.fromSats(25000);
      const mediumPrecisionRounding = Value.fromSats(100000);
      const lowPrecisionRounding = Value.fromSats(200000);

      const roundingIntervals = buildRoundingIntervalsFromIntervals(
        contractSize,
        [
          { beginInterval: 0n, rounding: lowPrecisionRounding },
          { beginInterval: 750000n, rounding: mediumPrecisionRounding },
          { beginInterval: 850000n, rounding: highPrecisionRounding },
          { beginInterval: 950000n, rounding: highestPrecisionRounding },
        ],
      );

      const network = BitcoinNetworks.bitcoin;

      const shiftForFees: DlcParty = 'offeror';
      const fees = Value.fromSats(10000);

      const csoOrderOffer = buildCustomStrategyOrderOffer(
        oracleAnnouncement,
        contractSize,
        maxLoss,
        maxGain,
        feeRate,
        roundingIntervals,
        network,
        shiftForFees,
        fees,
      );

      const csoInfoFromContractInfo = getCsoInfoFromContractInfo(
        csoOrderOffer.contractInfo,
        shiftForFees,
        fees,
      );
      const csoInfoFromOffer = getCsoInfoFromOffer(csoOrderOffer);

      expect(csoInfoFromContractInfo.maxGain.sats).to.equal(maxGain.sats);
      expect(csoInfoFromContractInfo.maxLoss.sats).to.equal(maxLoss.sats);

      expect(csoInfoFromOffer.maxGain.sats).to.equal(maxGain.sats);
      expect(csoInfoFromOffer.maxLoss.sats).to.equal(maxLoss.sats);
    });

    const fees = [0, 1116, 29384, 34, 245, 11293, 2223, 10410];
    const contractSizes = [0.01, 0.1, 0.5, 1, 2, 5, 10, 50];

    contractSizes.forEach((contractSizeNum) => {
      fees.forEach((fee) => {
        it(`should get correct CsoInfo from ContractInfo with fees shifted contract size ${contractSizeNum} and fee ${fee}`, () => {
          const contractSize = Value.fromBitcoin(contractSizeNum);

          const eventDescriptor = new DigitDecompositionEventDescriptorV0Pre167();
          eventDescriptor.base = 2;
          eventDescriptor.isSigned = false;
          eventDescriptor.unit = 'bits';
          eventDescriptor.precision = 0;
          eventDescriptor.nbDigits = oracleDigits;

          const oracleEvent = new OracleEventV0Pre167();
          oracleEvent.eventMaturityEpoch = Math.floor(expiry.getTime() / 1000);
          oracleEvent.eventDescriptor = eventDescriptor;

          const oracleAnnouncement = new OracleAnnouncementV0Pre167();
          oracleAnnouncement.oracleEvent = oracleEvent;

          const maxLoss = Value.fromBitcoin(0.2);
          const maxGain = Value.fromBitcoin(0.04);

          const feeRate = 4n;

          const highestPrecisionRounding = Value.fromSats(10000);
          const highPrecisionRounding = Value.fromSats(25000);
          const mediumPrecisionRounding = Value.fromSats(100000);
          const lowPrecisionRounding = Value.fromSats(200000);

          const roundingIntervals = buildRoundingIntervalsFromIntervals(
            contractSize,
            [
              { beginInterval: 0n, rounding: lowPrecisionRounding },
              { beginInterval: 750000n, rounding: mediumPrecisionRounding },
              { beginInterval: 850000n, rounding: highPrecisionRounding },
              { beginInterval: 950000n, rounding: highestPrecisionRounding },
            ],
          );

          const network = BitcoinNetworks.bitcoin;

          const shiftForFees: DlcParty = 'acceptor';
          const fees = Value.fromSats(fee);

          const csoOrderOffer = buildCustomStrategyOrderOffer(
            oracleAnnouncement,
            contractSize,
            maxLoss,
            maxGain,
            feeRate,
            roundingIntervals,
            network,
            shiftForFees,
            fees,
          );

          const csoInfo = getCsoInfoFromOffer(csoOrderOffer);

          expect(csoInfo.maxGain.sats).to.equal(maxGain.sats);
          expect(csoInfo.maxLoss.sats).to.equal(maxLoss.sats);
        });
      });
    });
  });

  describe('validateCsoPayoutFunction', () => {
    it('should throw if event outcome is not an ascending line', () => {
      const startOutcome = 900000n;
      const endOutcome = 900000n;

      const { payoutFunction } = LinearPayout.buildPayoutFunction(
        minPayout,
        maxPayout,
        startOutcome,
        endOutcome,
        oracleBase,
        oracleDigits,
      );

      expect(() => validateCsoPayoutFunction(payoutFunction)).to.throw(Error);
    });
  });

  it('should throw if maxLoss to maxGain is not an ascending line', () => {
    const minPayout = 100000000n;
    const maxPayout = 100000000n;

    const { payoutFunction } = LinearPayout.buildPayoutFunction(
      minPayout,
      maxPayout,
      startOutcome,
      endOutcome,
      oracleBase,
      oracleDigits,
    );

    expect(() => validateCsoPayoutFunction(payoutFunction)).to.throw(Error);
  });

  it('should throw if Payout Function point outcome payout not continuous', () => {
    const { payoutFunction } = LinearPayout.buildPayoutFunction(
      minPayout,
      maxPayout,
      startOutcome,
      endOutcome,
      oracleBase,
      oracleDigits,
    );

    // Subtract 1 from outcomePayout to create gap in point outcome payout
    (payoutFunction.pieces[0]
      .payoutCurvePiece as PolynomialPayoutCurvePiece).points[1].outcomePayout -= BigInt(
      1,
    );

    expect(() => validateCsoPayoutFunction(payoutFunction)).to.throw(Error);
  });
});
