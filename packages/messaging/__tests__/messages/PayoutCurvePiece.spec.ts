import BigNumber from 'bignumber.js';
import { expect } from 'chai';

import {
  HyperbolaPayoutCurvePiece,
  PolynomialPayoutCurvePiece,
} from '../../lib/messages/PayoutCurvePiece';
import {
  HyperbolaPayoutCurvePiecePre163,
  PolynomialPayoutCurvePiecePre163,
} from '../../lib/messages/pre-163/PayoutCurvePiece';

describe('PayoutCurvePiece', () => {
  describe('PolynomialPayoutCurvePiece', () => {
    it('serializes', () => {
      const instance = new PolynomialPayoutCurvePiece();

      instance.points = [
        {
          eventOutcome: BigInt(0),
          outcomePayout: BigInt(0),
          extraPrecision: 0,
        },
        {
          eventOutcome: BigInt(1),
          outcomePayout: BigInt(1),
          extraPrecision: 0,
        },
      ];

      expect(instance.serialize().toString("hex")).to.equal(
        '00' + // type
        '02' + // num_points
        '0000000000000000' + // event_outcome[0]
        '0000000000000000' + // outcome_payout[0]
        '0000' + // extra_precision[0]
        '0000000000000001' + // event_outcome[1]
        '0000000000000001' + // outcome_payout[1]
        '0000'// extra_precision[1]
      ); // prettier-ignore
    });

    it('deserializes', () => {
      const buf =  Buffer.from(
        '00' + // type
        '02' + // num_points
        '0000000000000000' + // event_outcome[0]
        '0000000000000000' + // outcome_payout[0]
        '0000' + // extra_precision[0]
        '0000000000000001' + // event_outcome[1]
        '0000000000000001' + // outcome_payout[1]
        '0000'// extra_precision[1]
      , 'hex'); // prettier-ignore

      const instance = PolynomialPayoutCurvePiece.deserialize(buf);

      expect(instance.points[0].eventOutcome).to.equal(BigInt(0));
      expect(instance.points[0].outcomePayout).to.equal(BigInt(0));
      expect(instance.points[0].extraPrecision).to.equal(0);

      expect(instance.points[1].eventOutcome).to.equal(BigInt(1));
      expect(instance.points[1].outcomePayout).to.equal(BigInt(1));
      expect(instance.points[1].extraPrecision).to.equal(0);
    });

    describe('toPre163', () => {
      const instance = new PolynomialPayoutCurvePiece();

      before(() => {
        instance.points = [
          {
            eventOutcome: BigInt(0),
            outcomePayout: BigInt(0),
            extraPrecision: 0,
          },
          {
            eventOutcome: BigInt(1),
            outcomePayout: BigInt(1),
            extraPrecision: 0,
          },
        ];
      });

      it('returns pre-163 instance', () => {
        const pre163 = PolynomialPayoutCurvePiece.toPre163(instance);
        expect(pre163).to.be.instanceof(PolynomialPayoutCurvePiecePre163);
        expect(pre163.points.length).to.equal(instance.points.length);
        for (let i = 0; i < pre163.points.length; i++) {
          expect(pre163.points[i]).to.deep.equal(instance.points[i]);
        }
      });
    });

    describe('fromPre163', () => {
      const pre163 = new PolynomialPayoutCurvePiecePre163();

      before(() => {
        pre163.points = [
          {
            eventOutcome: BigInt(0),
            outcomePayout: BigInt(0),
            extraPrecision: 0,
          },
          {
            eventOutcome: BigInt(1),
            outcomePayout: BigInt(1),
            extraPrecision: 0,
          },
        ];
      });

      it('returns post-163 instance', () => {
        const post163 = PolynomialPayoutCurvePiece.fromPre163(pre163);
        expect(post163).to.be.instanceof(PolynomialPayoutCurvePiece);
        expect(post163.points.length).to.equal(pre163.points.length);
        for (let i = 0; i < post163.points.length; i++) {
          expect(post163.points[i]).to.deep.equal(pre163.points[i]);
        }
      });
    });
  });

  describe('HyperbolaPayoutCurvePiece', () => {
    const piece =
      '0101010000000000000000000001000000000000000000000100000000000000010000010000000000000001000001000000000000000100000100000000000000010000';

    it('serializes', () => {
      const instance = new HyperbolaPayoutCurvePiece();

      instance.usePositivePiece = true;
      instance.translateOutcome = new BigNumber(0);
      instance.translatePayout = new BigNumber(0);
      instance.a = new BigNumber(1);
      instance.b = new BigNumber(1);
      instance.c = new BigNumber(1);
      instance.d = new BigNumber(1);

      expect(instance.serialize().toString('hex')).to.equal(piece);
    });

    it('deserializes', () => {
      const buf = Buffer.from(piece, 'hex');
      const instance = HyperbolaPayoutCurvePiece.deserialize(buf);

      expect(instance.usePositivePiece).to.equal(true);
      expect(instance.translateOutcome.toNumber()).to.equal(0);
      expect(instance.translatePayout.toNumber()).to.equal(0);
      expect(instance.a.toNumber()).to.equal(1);
      expect(instance.b.toNumber()).to.equal(1);
      expect(instance.c.toNumber()).to.equal(1);
      expect(instance.d.toNumber()).to.equal(1);
    });

    describe('toPre163', () => {
      const instance = new HyperbolaPayoutCurvePiece();

      before(() => {
        instance.usePositivePiece = true;
        instance.translateOutcome = new BigNumber(0);
        instance.translatePayout = new BigNumber(0);
        instance.a = new BigNumber(1);
        instance.b = new BigNumber(1);
        instance.c = new BigNumber(1);
        instance.d = new BigNumber(1);
      });

      it('returns pre-163 instance', () => {
        const pre163 = HyperbolaPayoutCurvePiece.toPre163(instance);
        expect(pre163).to.be.instanceof(HyperbolaPayoutCurvePiecePre163);
        expect(pre163.usePositivePiece).to.equal(true);
        expect(pre163.translateOutcomeSign).to.equal(true);
        expect(Number(pre163.translateOutcome)).to.equal(0);
        expect(Number(pre163.translateOutcomeExtraPrecision)).to.equal(0);
        expect(pre163.translatePayoutSign).to.equal(true);
        expect(Number(pre163.translatePayout)).to.equal(0);
        expect(Number(pre163.translatePayoutExtraPrecision)).to.equal(0);
        expect(pre163.aSign).to.equal(true);
        expect(Number(pre163.a)).to.equal(1);
        expect(Number(pre163.aExtraPrecision)).to.equal(0);
        expect(pre163.bSign).to.equal(true);
        expect(Number(pre163.b)).to.equal(1);
        expect(Number(pre163.bExtraPrecision)).to.equal(0);
        expect(pre163.cSign).to.equal(true);
        expect(Number(pre163.c)).to.equal(1);
        expect(Number(pre163.cExtraPrecision)).to.equal(0);
        expect(pre163.dSign).to.equal(true);
        expect(Number(pre163.d)).to.equal(1);
        expect(Number(pre163.dExtraPrecision)).to.equal(0);
      });
    });

    describe('fromPre163', () => {
      const pre163 = new HyperbolaPayoutCurvePiecePre163();

      before(() => {
        pre163.usePositivePiece = true;
        pre163.translateOutcomeSign = true;
        pre163.translateOutcome = BigInt(0);
        pre163.translateOutcomeExtraPrecision = 0;
        pre163.translatePayoutSign = true;
        pre163.translatePayout = BigInt(0);
        pre163.translatePayoutExtraPrecision = 0;
        pre163.aSign = true;
        pre163.a = BigInt(1);
        pre163.aExtraPrecision = 0;
        pre163.bSign = true;
        pre163.b = BigInt(1);
        pre163.bExtraPrecision = 0;
        pre163.cSign = true;
        pre163.c = BigInt(1);
        pre163.cExtraPrecision = 0;
        pre163.dSign = true;
        pre163.d = BigInt(1);
        pre163.dExtraPrecision = 0;
      });

      it('returns post-163 instance', () => {
        const post163 = HyperbolaPayoutCurvePiece.fromPre163(pre163);
        expect(post163).to.be.instanceof(HyperbolaPayoutCurvePiece);
        expect(post163.usePositivePiece).to.equal(true);
        expect(post163.translateOutcome.toNumber()).to.equal(0);
        expect(post163.translatePayout.toNumber()).to.equal(0);
        expect(post163.a.toNumber()).to.equal(1);
        expect(post163.b.toNumber()).to.equal(1);
        expect(post163.c.toNumber()).to.equal(1);
        expect(post163.d.toNumber()).to.equal(1);
      });
    });
  });
});
