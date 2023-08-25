import { expect } from 'chai';

import {
  HyperbolaPayoutCurvePiecePre163,
  PolynomialPayoutCurvePiecePre163,
} from '../../../lib/messages/pre-163/PayoutCurvePiece';

describe('PayoutCurvePiecePre163', () => {
  describe('PolynomialPayoutCurvePiecePre163', () => {
    it('serializes', () => {
      const instance = new PolynomialPayoutCurvePiecePre163();

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
        'fda728' + // type
        '0a' + // length
        '0002' + // num_points
        '00' + // event_outcome[0]
        '00' + // outcome_payout[0]
        '0000' + // extra_precision[0]
        '01' + // event_outcome[1]
        '01' + // outcome_payout[1]
        '0000'// extra_precision[1]
      ); // prettier-ignore
    });

    it('deserializes', () => {
      const buf =  Buffer.from(
        'fda728' + // type
        '0a' + // length
        '0002' + // num_points
        '00' + // event_outcome[0]
        '00' + // outcome_payout[0]
        '0000' + // extra_precision[0]
        '01' + // event_outcome[1]
        '01' + // outcome_payout[1]
        '0000'// extra_precision[1]
        , 'hex'); // prettier-ignore

      const instance = PolynomialPayoutCurvePiecePre163.deserialize(buf);

      expect(instance.points[0].eventOutcome).to.equal(BigInt(0));
      expect(instance.points[0].outcomePayout).to.equal(BigInt(0));
      expect(instance.points[0].extraPrecision).to.equal(0);

      expect(instance.points[1].eventOutcome).to.equal(BigInt(1));
      expect(instance.points[1].outcomePayout).to.equal(BigInt(1));
      expect(instance.points[1].extraPrecision).to.equal(0);
    });
  });
  describe('HyperbolaPayoutCurvePiecePre163', () => {
    const piece = 'fda72a1901010000000100000000010000000100000001000000010000';

    it('serializes', () => {
      const instance = new HyperbolaPayoutCurvePiecePre163();

      instance.usePositivePiece = true;
      instance.translateOutcomeSign = true;
      instance.translateOutcome = BigInt(0);
      instance.translateOutcomeExtraPrecision = 0;
      instance.translatePayoutSign = true;
      instance.translatePayout = BigInt(0);
      instance.translatePayoutExtraPrecision = 0;
      instance.a = BigInt(1);
      instance.aExtraPrecision = 0;
      instance.aSign = false;
      instance.b = BigInt(1);
      instance.bExtraPrecision = 0;
      instance.bSign = false;
      instance.c = BigInt(1);
      instance.cExtraPrecision = 0;
      instance.cSign = false;
      instance.d = BigInt(1);
      instance.dExtraPrecision = 0;
      instance.dSign = false;

      expect(instance.serialize().toString('hex')).to.equal(piece);
    });

    it('deserializes', () => {
      const buf = Buffer.from(piece, 'hex');
      const instance = HyperbolaPayoutCurvePiecePre163.deserialize(buf);

      expect(instance.usePositivePiece).to.equal(true);
      expect(instance.translateOutcomeSign).to.equal(true);
      expect(instance.translateOutcome).to.equal(BigInt(0));
      expect(instance.translateOutcomeExtraPrecision).to.equal(0);
      expect(instance.translatePayoutSign).to.equal(true);
      expect(instance.translatePayout).to.equal(BigInt(0));
      expect(instance.translatePayoutExtraPrecision).to.equal(0);
      expect(instance.a).to.equal(BigInt(1));
      expect(instance.aExtraPrecision).to.equal(0);
      expect(instance.aSign).to.equal(false);
      expect(instance.b).to.equal(BigInt(1));
      expect(instance.bExtraPrecision).to.equal(0);
      expect(instance.bSign).to.equal(false);
      expect(instance.c).to.equal(BigInt(1));
      expect(instance.cExtraPrecision).to.equal(0);
      expect(instance.cSign).to.equal(false);
      expect(instance.d).to.equal(BigInt(1));
      expect(instance.dExtraPrecision).to.equal(0);
      expect(instance.dSign).to.equal(false);
    });
  });
});
