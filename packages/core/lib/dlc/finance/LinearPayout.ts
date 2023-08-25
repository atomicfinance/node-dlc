import { PayoutFunction } from '@node-dlc/messaging';
import { Value } from '@node-dlc/bitcoin';
import BN from 'bignumber.js';

import { PolynomialPayoutCurve } from '../PolynomialPayoutCurve';

const buildPayoutFunction = (
  minPayout: bigint,
  maxPayout: bigint,
  startOutcome: bigint,
  endOutcome: bigint,
  oracleBase: number,
  oracleDigits: number,
): { payoutFunction: PayoutFunction } => {
  // Max outcome limited by the oracle
  const maxOutcome = BigInt(
    new BN(oracleBase).pow(oracleDigits).minus(1).toString(10),
  );

  // max loss line
  const payoutCurveMaxLoss = new PolynomialPayoutCurve([
    { outcome: new BN(0), payout: new BN(Number(minPayout)) },
    {
      outcome: new BN(Number(startOutcome)),
      payout: new BN(Number(minPayout)),
    },
  ]);

  // payout line
  const payoutCurve = new PolynomialPayoutCurve([
    {
      outcome: new BN(Number(startOutcome)),
      payout: new BN(Number(minPayout)),
    },
    {
      outcome: new BN(Number(endOutcome)),
      payout: new BN(Number(maxPayout)),
    },
  ]);

  // max gain line
  const payoutCurveMaxGain = new PolynomialPayoutCurve([
    { outcome: new BN(Number(endOutcome)), payout: new BN(Number(maxPayout)) },
    {
      outcome: new BN(Number(maxOutcome)),
      payout: new BN(Number(maxPayout)),
    },
  ]);

  const payoutFunction = new PayoutFunction();
  payoutFunction.pieces.push({
    payoutCurvePiece: payoutCurveMaxLoss.toPayoutCurvePiece(),
    endPoint: {
      eventOutcome: BigInt(0),
      outcomePayout: Value.fromSats(minPayout),
      extraPrecision: 0,
    },
  });

  payoutFunction.pieces.push({
    payoutCurvePiece: payoutCurve.toPayoutCurvePiece(),
    endPoint: {
      eventOutcome: startOutcome,
      outcomePayout: Value.fromSats(minPayout),
      extraPrecision: 0,
    },
  });

  payoutFunction.pieces.push({
    payoutCurvePiece: payoutCurveMaxGain.toPayoutCurvePiece(),
    endPoint: {
      eventOutcome: endOutcome,
      outcomePayout: Value.fromSats(maxPayout),
      extraPrecision: 0,
    },
  });

  payoutFunction.lastEndpoint.eventOutcome = maxOutcome;
  payoutFunction.lastEndpoint.outcomePayout = Value.fromSats(maxPayout);
  payoutFunction.lastEndpoint.extraPrecision = 0;

  return {
    payoutFunction,
  };
};

export const LinearPayout = { buildPayoutFunction };
