import { PayoutFunction } from '@node-dlc/messaging';
import { Value } from '@node-dlc/bitcoin';
import BN from 'bignumber.js';

import { toBigInt } from '../../utils/BigIntUtils';
import { HyperbolaPayoutCurve } from '../HyperbolaPayoutCurve';

const buildCurve = (
  strikePrice: bigint,
  contractSize: bigint,
  oracleBase: number,
  oracleDigits: number,
): {
  maxOutcome: bigint;
  totalCollateral: bigint;
  payoutCurve: HyperbolaPayoutCurve;
} => {
  const a = new BN(1);
  const b = new BN(0);
  const c = new BN(0);
  const d = new BN((strikePrice * contractSize).toString());

  const f_1 = new BN(0);
  const _f_2 = new BN(0);

  const _tempHyperbolaPayoutCurve = new HyperbolaPayoutCurve(
    a,
    b,
    c,
    d,
    f_1,
    _f_2,
  );

  const maxOutcome = BigInt(
    new BN(oracleBase).pow(oracleDigits).minus(1).toString(10),
  );
  const maxOutcomePayout = _tempHyperbolaPayoutCurve
    .getPayout(maxOutcome)
    .integerValue();

  return {
    maxOutcome,
    totalCollateral: contractSize - toBigInt(maxOutcomePayout),
    payoutCurve: new HyperbolaPayoutCurve(
      a,
      b,
      c,
      d,
      f_1,
      maxOutcomePayout.negated(),
    ),
  };
};

const buildPayoutFunction = (
  strikePrice: bigint,
  contractSize: bigint,
  oracleBase: number,
  oracleDigits: number,
): { payoutFunction: PayoutFunction; totalCollateral: bigint } => {
  const { maxOutcome, totalCollateral, payoutCurve } = buildCurve(
    strikePrice,
    contractSize,
    oracleBase,
    oracleDigits,
  );

  const payoutFunction = new PayoutFunction();
  payoutFunction.pieces.push({
    payoutCurvePiece: payoutCurve.toPayoutCurvePiece(),
    endPoint: {
      eventOutcome: BigInt(0),
      outcomePayout: Value.fromSats(totalCollateral),
      extraPrecision: 0,
    },
  });

  payoutFunction.lastEndpoint.eventOutcome = maxOutcome;
  payoutFunction.lastEndpoint.outcomePayout = Value.zero();
  payoutFunction.lastEndpoint.extraPrecision = 0;

  return {
    payoutFunction,
    totalCollateral,
  };
};

export const CoveredCall = { buildCurve, buildPayoutFunction };
