import {
  PayoutCurvePieceType,
  PayoutFunction,
  PolynomialPayoutCurvePiece,
  RoundingIntervals
} from "@node-dlc/messaging";
import BigNumber from 'bignumber.js';
import { expect } from 'chai';
import { Value } from '@node-dlc/bitcoin';

import { HyperbolaPayoutCurve } from '../../lib';
import { LinearPayout } from '../../lib/dlc/finance/LinearPayout';
import { PolynomialPayoutCurve } from '../../lib/dlc/PolynomialPayoutCurve';
import { fromPrecision } from '../../lib/utils/Precision';

describe('PolynomialPayoutCurve', () => {
  const points = [
    {
      outcome: new BigNumber(1),
      payout: new BigNumber(1),
    },
    {
      outcome: new BigNumber(2),
      payout: new BigNumber(3),
    },
  ];

  describe('#constructor', () => {
    it('should create a PolynomialPayoutCurve', () => {
      const curve = new PolynomialPayoutCurve(points);
      expect(curve).to.be.instanceOf(PolynomialPayoutCurve);
    });
    it('should fail if not 2 points', () => {
      // 1 point
      expect(
        () =>
          new PolynomialPayoutCurve([
            {
              outcome: new BigNumber(1),
              payout: new BigNumber(1),
            },
          ]),
      ).to.throw('Must have two points');

      // 3 points
      expect(
        () =>
          new PolynomialPayoutCurve([
            {
              outcome: new BigNumber(1),
              payout: new BigNumber(1),
            },
            {
              outcome: new BigNumber(2),
              payout: new BigNumber(2),
            },
            {
              outcome: new BigNumber(3),
              payout: new BigNumber(3),
            },
          ]),
      ).to.throw;
    });
  });

  describe('#getPayout', () => {
    it('should get the payout for an outcome', () => {
      const curve = new PolynomialPayoutCurve(points);
      const payout = curve.getPayout(BigInt(1));
      expect(payout).to.deep.equal(new BigNumber(1));
    });

    it('should get the payout for an outcome', () => {
      const curve = new PolynomialPayoutCurve(points);
      const payout = curve.getPayout(BigInt(2));
      expect(payout).to.deep.equal(new BigNumber(3));
    });
  });

  describe('#getOutcomeForPayout', () => {
    it('should get the outcome for a payout', () => {
      const curve = new PolynomialPayoutCurve(points);
      const outcome = curve.getOutcomeForPayout(new BigNumber(1));
      expect(outcome).to.deep.equal(BigInt(1));
    });

    it('should get the outcome for a payout', () => {
      const curve = new PolynomialPayoutCurve(points);
      const outcome = curve.getOutcomeForPayout(new BigNumber(3));
      expect(outcome).to.deep.equal(BigInt(2));
    });
  });

  describe('#toPayoutCurvePiece', () => {
    it('should serialize to a PolynomialPayoutCurvePiece', () => {
      const curve = new PolynomialPayoutCurve(points);
      const piece = curve.toPayoutCurvePiece();
      expect(piece).to.deep.equal({
        type: PayoutCurvePieceType.PolynomialPayoutCurvePiece,
        points: [
          {
            eventOutcome: BigInt(1),
            outcomePayout: BigInt(1),
            extraPrecision: 0,
          },
          {
            eventOutcome: BigInt(2),
            outcomePayout: BigInt(3),
            extraPrecision: 0,
          },
        ],
      });
    });
  });

  describe('#fromPayoutCurvePiece', () => {
    const points = [
      {
        eventOutcome: BigInt(1),
        outcomePayout: BigInt(1),
        extraPrecision: 0,
      },
      {
        eventOutcome: BigInt(2),
        outcomePayout: BigInt(3),
        extraPrecision: 0,
      },
    ];

    it('should deserialize from a PolynomialPayoutCurvePiece', () => {
      const piece = new PolynomialPayoutCurvePiece();
      piece.points = points;
      const curve = PolynomialPayoutCurve.fromPayoutCurvePiece(piece);
      expect(curve).to.be.instanceOf(PolynomialPayoutCurve);
      expect(curve['points']).to.deep.eq(
        points.map((p) => ({
          outcome: new BigNumber(p.eventOutcome.toString()),
          payout: new BigNumber(p.outcomePayout.toString()).plus(
            fromPrecision(p.extraPrecision),
          ),
        })),
      );
    });
  });

  describe('#equals', () => {
    it('should return true if the curves are equal', () => {
      const curve1 = new PolynomialPayoutCurve(points);
      const curve2 = new PolynomialPayoutCurve(points);
      expect(curve1.equals(curve2)).to.be.true;
    });

    it('should return false if the curves are not equal', () => {
      const curve1 = new PolynomialPayoutCurve(points);
      const curve2 = new PolynomialPayoutCurve([
        {
          outcome: new BigNumber(1),
          payout: new BigNumber(1),
        },
        {
          outcome: new BigNumber(3),
          payout: new BigNumber(3),
        },
      ]);
      expect(curve1.equals(curve2)).to.be.false;
    });
  });

  describe('#computePayouts', () => {
    it('should compute the correct payouts for simple interval', () => {
      const numDigits = 18;
      const oracleBase = 2;
      const minPayout = 40n;
      const maxPayout = 60n;
      const startOutcome = 40n;
      const endOutcome = 60n;

      const { payoutFunction } = LinearPayout.buildPayoutFunction(
        minPayout,
        maxPayout,
        startOutcome,
        endOutcome,
        oracleBase,
        numDigits,
      );

      const intervals = [{ beginInterval: 0n, roundingMod: 1n }];
      const roundingIntervals = new RoundingIntervals();
      roundingIntervals.intervals = intervals;

      const payouts = PolynomialPayoutCurve.computePayouts(
        payoutFunction,
        maxPayout,
        roundingIntervals,
      );

      const n = payouts.length - 1;

      const maxOutcome = BigInt(
        new BigNumber(oracleBase).pow(numDigits).minus(1).toString(10),
      );

      expect(n).to.eq(20);

      // max loss CETS
      expect(payouts[0].indexFrom).to.eq(0n);
      expect(payouts[0].indexTo).to.eq(startOutcome);
      expect(payouts[0].payout).to.eq(minPayout);

      // payout curve CETS
      for (let i = 1; i < n - 1; ++i) {
        expect(payouts[i].indexFrom).to.eq(startOutcome + BigInt(i));
        expect(payouts[i].indexTo).to.eq(startOutcome + BigInt(i));
        expect(payouts[i].payout).to.eq(minPayout + BigInt(i));
      }

      // max gain CETS
      expect(payouts[n].indexFrom).to.eq(endOutcome);
      expect(payouts[n].indexTo).to.eq(maxOutcome);
      expect(payouts[n].payout).to.eq(maxPayout);
    });

    it('should compute the correct payouts for advanced interval', () => {
      const numDigits = 18;
      const oracleBase = 2;
      const minPayout = 40n;
      const maxPayout = 60n;
      const startOutcome = 40n;
      const endOutcome = 60n;

      const { payoutFunction } = LinearPayout.buildPayoutFunction(
        minPayout,
        maxPayout,
        startOutcome,
        endOutcome,
        oracleBase,
        numDigits,
      );

      const intervals = [{ beginInterval: 0n, roundingMod: 2n }];
      const roundingIntervals = new RoundingIntervals();
      roundingIntervals.intervals = intervals;

      const payouts = PolynomialPayoutCurve.computePayouts(
        payoutFunction,
        maxPayout,
        roundingIntervals,
      );

      const n = payouts.length - 1;

      const maxOutcome = BigInt(
        new BigNumber(oracleBase).pow(numDigits).minus(1).toString(10),
      );

      expect(n).to.eq(10);

      // max loss CETS
      expect(payouts[0].indexFrom).to.eq(0n);
      expect(payouts[0].indexTo).to.eq(startOutcome);
      expect(payouts[0].payout).to.eq(minPayout);

      // payout curve CETS
      for (let i = 1; i < n; ++i) {
        expect(payouts[i].indexFrom).to.eq(
          startOutcome + 2n * BigInt(i - 1) + 1n,
        );
        expect(payouts[i].indexTo).to.eq(startOutcome + 2n * BigInt(i));
        expect(payouts[i].payout).to.eq(minPayout + 2n * BigInt(i));
      }

      // max gain CETS
      expect(payouts[n].indexFrom).to.eq(endOutcome - 1n);
      expect(payouts[n].indexTo).to.eq(maxOutcome);
      expect(payouts[n].payout).to.eq(maxPayout);
    });

    it('should fail if < 1 payout function pieces', () => {
      const maxPayout = 60n;

      const payoutFunction = new PayoutFunction();
      payoutFunction.pieces = [];
      payoutFunction.lastEndpoint.eventOutcome = 0n;
      payoutFunction.lastEndpoint.outcomePayout = Value.fromSats(0n);

      const intervals = [{ beginInterval: 0n, roundingMod: 1n }];
      const roundingIntervals = new RoundingIntervals();
      roundingIntervals.intervals = intervals;

      expect(() => {
        PolynomialPayoutCurve.computePayouts(
          payoutFunction,
          maxPayout,
          roundingIntervals,
        );
      }).to.throw('Must have at least one piece');
    });

    it('should fail if there is a non-polynomial payout curve piece', () => {
      const maxPayout = 60n;

      const hyperbola = new HyperbolaPayoutCurve(
        new BigNumber(1),
        new BigNumber(0),
        new BigNumber(0),
        new BigNumber(500000),
        new BigNumber(0),
        new BigNumber(0),
        true,
      ).toPayoutCurvePiece();

      const pieces = [
        {
          payoutCurvePiece: hyperbola,
          endPoint: {
            eventOutcome: 0n,
            outcomePayout: Value.fromSats(0n),
            extraPrecision: 0,
          },
        },
      ];
      const payoutFunction = new PayoutFunction();
      payoutFunction.pieces = pieces;
      payoutFunction.lastEndpoint.eventOutcome = 2n;
      payoutFunction.lastEndpoint.outcomePayout = Value.fromSats(2n);
      payoutFunction.lastEndpoint.extraPrecision = 0;

      const intervals = [{ beginInterval: 0n, roundingMod: 1n }];
      const roundingIntervals = new RoundingIntervals();
      roundingIntervals.intervals = intervals;

      expect(() => {
        PolynomialPayoutCurve.computePayouts(
          payoutFunction,
          maxPayout,
          roundingIntervals,
        );
      }).to.throw('Payout curve piece must be a polynomial');
    });
  });
});
