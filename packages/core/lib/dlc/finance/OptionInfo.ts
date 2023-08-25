import {
  NumericContractDescriptor,
  ContractDescriptorType,
  ContractInfo,
  SingleContractInfo,
  ContractInfoType,
  DigitDecompositionEventDescriptorV0Pre167,
  HyperbolaPayoutCurvePiece,
  PayoutCurvePieceType,
  MessageType,
  PayoutFunction,
  SingleOracleInfo,
} from '@node-dlc/messaging';
import BigNumber from 'bignumber.js';

import { toBigInt } from '../../utils/BigIntUtils';
import { HyperbolaPayoutCurve } from '../HyperbolaPayoutCurve';
import { CoveredCall } from './CoveredCall';
import { ShortPut } from './ShortPut';

export interface OptionInfo {
  contractSize: bigint;
  strikePrice: bigint;
  premium?: bigint;
  type?: OptionType;
  expiry: Date;
}

export type HasOfferCollateral = {
  offerCollateral: bigint;
};

export type HasContractInfo = {
  contractInfo: ContractInfo;
};

export type HasType = {
  type: MessageType;
};

export type OptionType = 'put' | 'call';

export function getOptionInfoFromContractInfo(
  _contractInfo: ContractInfo,
): OptionInfo {
  if (_contractInfo.type !== ContractInfoType.Single)
    throw Error('Only Single ContractInfo currently supported');

  const contractInfo = _contractInfo as SingleContractInfo;
  if (contractInfo.contractDescriptor.type !== ContractDescriptorType.Numeric)
    throw Error('Only Numeric ContractDescriptor currently supported');

  const oracleInfo = contractInfo.oracleInfo as SingleOracleInfo;
  const { eventMaturityEpoch } = oracleInfo.announcement.oracleEvent;

  const eventDescriptor = oracleInfo.announcement.oracleEvent
    .eventDescriptor as DigitDecompositionEventDescriptorV0Pre167;
  const { base: oracleBase, nbDigits: oracleDigits } = eventDescriptor;
  if (
    oracleInfo.announcement.oracleEvent.eventDescriptor.type !==
    MessageType.DigitDecompositionEventDescriptorV0
  )
    throw Error('Only DigitDecompositionEventDescriptorV0 currently supported');

  const contractDescriptor = contractInfo.contractDescriptor as NumericContractDescriptor;
  if (contractDescriptor.payoutFunction.type !== MessageType.PayoutFunctionV0)
    throw Error('Only PayoutFunctionV0 currently supported');

  const payoutFunction = contractDescriptor.payoutFunction as PayoutFunction;
  if (payoutFunction.pieces.length === 0)
    throw Error('PayoutFunction must have at least once PayoutCurvePiece');
  if (payoutFunction.pieces.length > 1)
    throw Error('More than one PayoutCurvePiece not supported');

  const payoutCurvePiece = payoutFunction.pieces[0]
    .payoutCurvePiece as HyperbolaPayoutCurvePiece;
  if (payoutCurvePiece.type !== PayoutCurvePieceType.HyperbolaPayoutCurvePiece)
    throw Error('Must be HyperbolaPayoutCurvePiece');
  if (
    !payoutCurvePiece.b.eq(new BigNumber(0)) ||
    !payoutCurvePiece.c.eq(new BigNumber(0))
  )
    throw Error('b and c HyperbolaPayoutCurvePiece values must be 0');

  const curve = HyperbolaPayoutCurve.fromPayoutCurvePiece(payoutCurvePiece);
  const maxOutcome = BigInt(
    new BigNumber(oracleBase).pow(oracleDigits).minus(1).toString(10),
  );
  const isAscending = curve
    .getPayout(maxOutcome)
    .gt(Number(payoutFunction.pieces[0].endPoint.outcomePayout));

  const expiry = new Date(eventMaturityEpoch * 1000);
  const totalCollateral = contractInfo.totalCollateral;

  // if curve is ascending, assume it is a put.
  const contractSize = isAscending
    ? toBigInt(payoutCurvePiece.translatePayout.abs()) - totalCollateral
    : totalCollateral + toBigInt(payoutCurvePiece.translatePayout.abs());

  const strikePrice = toBigInt(payoutCurvePiece.d) / contractSize;

  // rebuild payout curve from option info and perform a sanity check
  const { payoutCurve: sanityCurve } = isAscending
    ? ShortPut.buildCurve(
        strikePrice,
        contractSize,
        totalCollateral,
        oracleBase,
        oracleDigits,
      )
    : CoveredCall.buildCurve(
        strikePrice,
        contractSize,
        oracleBase,
        oracleDigits,
      );
  const type = isAscending ? 'put' : 'call';

  if (!curve.equals(sanityCurve))
    throw new Error(
      'Payout curve built from extracted OptionInfo does not match original payout curve',
    );

  return { contractSize, strikePrice, expiry, type };
}

export function getOptionInfoFromOffer(
  offer: HasOfferCollateral & HasContractInfo & HasType,
): OptionInfo {
  if (
    offer.type !== MessageType.DlcOfferV0 &&
    offer.type !== MessageType.OrderOfferV0
  )
    throw Error('Only DlcOfferV0 and OrderOfferV0 currently supported');

  const premium =
    offer.contractInfo.totalCollateral - offer.offerCollateral;

  return {
    ...getOptionInfoFromContractInfo(offer.contractInfo),
    premium,
  };
}
