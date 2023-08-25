import { PayoutFunction } from '@node-dlc/messaging';
import { Value } from '@node-dlc/bitcoin';
import BN from 'bignumber.js';

import { HyperbolaPayoutCurve } from '../HyperbolaPayoutCurve';

const buildCurve = (
  strikePrice: bigint,
  contractSize: bigint,
  totalCollateral: bigint,
  oracleBase: number,
  oracleDigits: number,
): {
  maxOutcome: bigint;
  totalCollateral: bigint;
  payoutCurve: HyperbolaPayoutCurve;
} => {
  const a = new BN(-1);
  const b = new BN(0);
  const c = new BN(0);
  const d = new BN((strikePrice * contractSize).toString());

  const f_1 = new BN(0);
  const f_2 = new BN(Number(contractSize)).plus(Number(totalCollateral));

  const payoutCurve = new HyperbolaPayoutCurve(a, b, c, d, f_1, f_2);

  const maxOutcome = BigInt(
    new BN(oracleBase).pow(oracleDigits).minus(1).toString(10),
  );

  return {
    maxOutcome,
    totalCollateral,
    payoutCurve,
  };
};

const buildPayoutFunction = (
  strikePrice: bigint,
  contractSize: bigint,
  totalCollateral: bigint,
  oracleBase: number,
  oracleDigits: number,
): { payoutFunction: PayoutFunction } => {
  const { maxOutcome, payoutCurve } = buildCurve(
    strikePrice,
    contractSize,
    totalCollateral,
    oracleBase,
    oracleDigits,
  );

  const payoutFunction = new PayoutFunction();

  payoutFunction.pieces.push({
    payoutCurvePiece: payoutCurve.toPayoutCurvePiece(),
    endPoint: {
      eventOutcome: BigInt(0),
      outcomePayout: Value.fromSats(0),
      extraPrecision: 0,
    },
  });

  payoutFunction.lastEndpoint.eventOutcome = maxOutcome;
  payoutFunction.lastEndpoint.outcomePayout = Value.fromSats(totalCollateral);
  payoutFunction.lastEndpoint.extraPrecision = 0;

  return {
    payoutFunction,
  };
};

export const ShortPut = { buildCurve, buildPayoutFunction };
