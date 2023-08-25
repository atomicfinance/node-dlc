import { Value } from '@node-dlc/bitcoin';
import {
  NumericContractDescriptor,
  ContractDescriptorType,
  ContractInfo,
  ContractInfoType,
  SingleContractInfo,
  SingleOracleInfo,
  DigitDecompositionEventDescriptorV0Pre167,
  MessageType,
  OrderCsoInfo,
  OrderCsoInfoV0,
  PayoutFunction,
  PolynomialPayoutCurvePiece,
  PayoutCurvePieceType,
} from '@node-dlc/messaging';
import assert from 'assert';

import { DlcParty, roundToNearestMultiplier, UNIT_MULTIPLIER } from './Builder';
import { HasContractInfo, HasOfferCollateral, HasType } from './OptionInfo';

export interface CsoInfo {
  maxLoss: Value;
  maxGain: Value;
  minPayout: bigint;
  maxPayout: bigint;
  contractSize: Value;
  offerCollateral: Value;
  expiry: Date;
}

const ONE_BTC_CONTRACT = Value.fromBitcoin(1);

export type MaybeHasCsoInfo = {
  csoInfo?: OrderCsoInfo;
};

/**
 * Get CsoInfo from Contract Info and validate

 * @param {ContractInfo} _contractInfo
 * @returns {CsoInfo}
 */
export const getCsoInfoFromContractInfo = (
  _contractInfo: ContractInfo,
  shiftForFees: DlcParty = 'neither',
  fees: Value = Value.fromSats(0),
): CsoInfo => {
  if (_contractInfo.type !== ContractInfoType.Single)
    throw Error('Only Single ContractInfo currently supported');

  const contractInfo = _contractInfo as SingleContractInfo;
  if (contractInfo.contractDescriptor.type !== ContractDescriptorType.Numeric)
    throw Error('Only Numeric ContractDescriptor currently supported');

  const oracleInfo = contractInfo.oracleInfo as SingleOracleInfo;

  const { eventMaturityEpoch } = oracleInfo.announcement.oracleEvent;

  const eventDescriptor = oracleInfo.announcement.oracleEvent
    .eventDescriptor as DigitDecompositionEventDescriptorV0Pre167;

  if (
    oracleInfo.announcement.oracleEvent.eventDescriptor.type !==
    MessageType.DigitDecompositionEventDescriptorV0
  )
    throw Error('Only DigitDecompositionEventDescriptorV0 currently supported');

  const contractDescriptor = contractInfo.contractDescriptor as NumericContractDescriptor;
  if (contractDescriptor.payoutFunction.type !== MessageType.PayoutFunctionV0)
    throw Error('Only PayoutFunctionV0 currently supported');

  const payoutFunction = contractDescriptor.payoutFunction as PayoutFunction;

  validateCsoPayoutFunction(payoutFunction);

  const midPiece = payoutFunction.pieces[1];
  const finalPiece = payoutFunction.pieces[2];

  const minPayout = midPiece.endPoint.outcomePayout.sats;
  const maxPayout = finalPiece.endPoint.outcomePayout.sats;

  const startOutcome = midPiece.endPoint.eventOutcome;
  const endOutcome = finalPiece.endPoint.eventOutcome;

  const unit = eventDescriptor.unit;

  const startOutcomeValue = Value.fromSats(
    startOutcome * UNIT_MULTIPLIER[unit.toLowerCase()],
  );
  const endOutcomeValue = Value.fromSats(
    endOutcome * UNIT_MULTIPLIER[unit.toLowerCase()],
  );

  const contractSize = Value.fromSats(contractInfo.totalCollateral);
  const defaultContractSize = Value.fromBitcoin(1);

  const shiftValue =
    contractSize.sats > 0
      ? Value.fromSats(
          roundToNearestMultiplier(
            (fees.sats * defaultContractSize.sats) / contractSize.sats,
            UNIT_MULTIPLIER[unit.toLowerCase()],
          ),
        )
      : Value.zero();

  if (shiftForFees === 'offeror') {
    startOutcomeValue.sub(shiftValue);
    endOutcomeValue.sub(shiftValue);
  } else if (shiftForFees === 'acceptor') {
    startOutcomeValue.add(shiftValue);
    endOutcomeValue.add(shiftValue);
  }

  const maxGain = endOutcomeValue.clone();
  maxGain.sub(ONE_BTC_CONTRACT);

  const maxLoss = ONE_BTC_CONTRACT.clone();
  maxLoss.sub(startOutcomeValue);

  const offerCollateral = contractSize.clone();
  offerCollateral.sub(
    Value.fromSats((maxGain.sats * contractSize.sats) / BigInt(1e8)),
  );

  const expiry = new Date(eventMaturityEpoch * 1000);

  return {
    maxGain,
    maxLoss,
    minPayout,
    maxPayout,
    contractSize,
    offerCollateral,
    expiry,
  };
};

/**
 * Get CsoInfo from OrderOffer or DlcOffer and validate
 *
 * @param {HasContractInfo & HasType} offer
 * @returns {CsoInfo}
 */
export const getCsoInfoFromOffer = (
  offer: HasContractInfo & HasType & HasOfferCollateral & MaybeHasCsoInfo,
): CsoInfo => {
  if (
    offer.type !== MessageType.DlcOfferV0 &&
    offer.type !== MessageType.OrderOfferV0
  )
    throw Error('Only DlcOfferV0 and OrderOfferV0 currently supported');

  let shiftForFees: DlcParty = 'neither';
  const fees = Value.zero();

  if (offer.csoInfo) {
    shiftForFees = (offer.csoInfo as OrderCsoInfoV0).shiftForFees;
    fees.add(Value.fromSats((offer.csoInfo as OrderCsoInfoV0).fees));
  }

  const csoInfo = getCsoInfoFromContractInfo(
    offer.contractInfo,
    shiftForFees,
    fees,
  );

  if (csoInfo.offerCollateral.sats !== offer.offerCollateral)
    throw Error('Offer was not generated with CSO ContractInfo');

  return csoInfo;
};

/**
 * Validate Payout Function for proper CSO format
 *
 * It should have 3 PayoutCurvePieces which consist of a flat line (maxLoss),
 * ascending line (maxLoss to maxGain) and finally another flat line (maxGain)
 *
 * All PayoutCurvePieces should be type PolynomialPayoutCurvePieces
 *
 * @param {PayoutFunction} payoutFunction
 */
export const validateCsoPayoutFunction = (
  payoutFunction: PayoutFunction,
): void => {
  assert(
    payoutFunction.pieces.length === 3,
    'CSO Payout Function must have 3 PayoutCurvePieces',
  );
  for (const [i, piece] of payoutFunction.pieces.entries()) {
    assert(
      piece.payoutCurvePiece.type ===
        PayoutCurvePieceType.PolynomialPayoutCurvePiece,
      'CSO Payout Function PayoutCurvePieces must be PolynomialCurvePieces',
    );

    const payoutCurvePiece = piece.payoutCurvePiece as PolynomialPayoutCurvePiece;
    const points = payoutCurvePiece.points;

    // eventOutcome should always be ascending
    assert(
      points[0].eventOutcome < points[1].eventOutcome,
      'CSO Payout Function PayoutCurvePiece point payout should be an ascending line',
    );

    // endpoints should always be ascending
    let nextPiece, nextPoints;
    if (i < payoutFunction.pieces.length - 1) {
      nextPiece = payoutFunction.pieces[i + 1];
      nextPoints = nextPiece.payoutCurvePiece.points;
      assert(
        piece.endPoint.eventOutcome < nextPiece.endPoint.eventOutcome,
        'CSO Payout Function point endpoints should be an ascending line',
      );
      assert(
        points[1].outcomePayout === nextPoints[0].outcomePayout,
        'CSO Payout Function point outcome payout should be continuous without gaps',
      );
    }

    switch (i) {
      case 0:
        // maxLoss should be a flat line
        assert.equal(
          points[0].outcomePayout,
          points[1].outcomePayout,
          'CSO Payout Function maxLoss PayoutCurvePiece point should be a flat line',
        );
        break;
      case 1:
        // maxLoss to maxGain should be an ascending line
        assert(
          piece.endPoint.outcomePayout.sats <
            nextPiece.endPoint.outcomePayout.sats,
        );
        assert(
          points[0].outcomePayout < points[1].outcomePayout,
          'CSO Payout Function maxLoss to maxGain PayoutCurvePiece point should be an ascending line',
        );
        break;
      case 2:
        // maxGain should be a flat line
        assert.equal(
          piece.endPoint.outcomePayout.sats,
          payoutFunction.lastEndpoint.outcomePayout.sats,
        );
        assert.equal(
          points[0].outcomePayout,
          points[1].outcomePayout,
          'CSO Payout Function maxGain PayoutCurvePiece point should be a flat line',
        );
        // endpoints should always be ascending
        assert(
          piece.endPoint.eventOutcome <
            payoutFunction.lastEndpoint.eventOutcome,
        );
        break;
    }
  }
};
