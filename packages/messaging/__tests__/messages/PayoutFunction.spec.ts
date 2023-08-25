import { Value } from '@node-dlc/bitcoin';
import { expect } from 'chai';

import { HyperbolaPayoutCurvePiece } from '../../lib/messages/PayoutCurvePiece';
import { PayoutFunction } from '../../lib/messages/PayoutFunction';
import { HyperbolaPayoutCurvePiecePre163 } from '../../lib/messages/pre-163/PayoutCurvePiece';
import { PayoutFunctionV0Pre163 } from '../../lib/messages/pre-163/PayoutFunction';

describe('PayoutFunction', () => {
  describe('serialize', () => {
    it('serializes', () => {
      const instance = new PayoutFunction();

      const payoutCurvePiece = HyperbolaPayoutCurvePiece.deserialize(
        Buffer.from(
          '01010100000000000000000000000000000000001388000001000000000000000100000100000000000000000000010000000000000000000001000000012a05f2000000',
          'hex',
        ),
      );

      instance.pieces = [
        {
          payoutCurvePiece,
          endPoint: {
            eventOutcome: BigInt(50000),
            outcomePayout: Value.fromSats(100000),
            extraPrecision: 0,
          },
        },
      ];

      instance.lastEndpoint.eventOutcome = BigInt(999999);
      instance.lastEndpoint.outcomePayout = Value.fromSats(0);
      instance.lastEndpoint.extraPrecision = 0;

      expect(instance.serialize().toString("hex")).to.equal(
        '01' + // num_pieces
        '000000000000c350' + // endpoint_0
        '00000000000186a0' + // endpoint_payout_0
        '0000' + // extra_precision
        '01010100000000000000000000000000000000001388000001000000000000000100000100000000000000000000010000000000000000000001000000012a05f2000000' + // payout_curve_piece
        '00000000000f423f' + // endpoint_1
        '0000000000000000' + // endpoint_payout_1
        '0000' // extra_precision_1
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const buf =  Buffer.from(
        '01' + // num_pieces
        '000000000000c350' + // endpoint_0
        '00000000000186a0' + // endpoint_payout_0
        '0000' + // extra_precision
        '01010100000000000000000000000000000000001388000001000000000000000100000100000000000000000000010000000000000000000001000000012a05f2000000' + // payout_curve_piece
        '00000000000f423f' + // endpoint_1
        '0000000000000000' + // endpoint_payout_1
        '0000' // extra_precision_1
      , 'hex'); // prettier-ignore

      const instance = PayoutFunction.deserialize(buf);

      expect(instance.pieces.length).to.equal(1);
      expect(
        instance.pieces[0].payoutCurvePiece.serialize().toString('hex'),
      ).to.equal(
        '01010100000000000000000000000000000000001388000001000000000000000100000100000000000000000000010000000000000000000001000000012a05f2000000',
      );
      expect(instance.pieces[0].endPoint.eventOutcome).to.equal(BigInt(50000));
      expect(instance.pieces[0].endPoint.outcomePayout.sats).to.equal(
        BigInt(100000),
      );
      expect(instance.pieces[0].endPoint.extraPrecision).to.equal(0);
      expect(instance.lastEndpoint.eventOutcome).to.equal(BigInt(999999));
      expect(instance.lastEndpoint.outcomePayout.sats).to.equal(BigInt(0));
      expect(instance.lastEndpoint.extraPrecision).to.equal(0);
    });
  });

  describe('toPre163', () => {
    const instance = new PayoutFunction();
    const payoutCurvePiece = HyperbolaPayoutCurvePiece.deserialize(
      Buffer.from(
        '01010100000000000000000000000000000000001388000001000000000000000100000100000000000000000000010000000000000000000001000000012a05f2000000',
        'hex',
      ),
    );

    before(() => {
      instance.pieces = [
        {
          payoutCurvePiece,
          endPoint: {
            eventOutcome: BigInt(50000),
            outcomePayout: Value.fromSats(100000),
            extraPrecision: 0,
          },
        },
      ];
      instance.lastEndpoint.eventOutcome = BigInt(999999);
      instance.lastEndpoint.outcomePayout = Value.fromSats(0);
      instance.lastEndpoint.extraPrecision = 0;
    });

    it('returns pre-163 instance', () => {
      const pre163 = PayoutFunction.toPre163(instance);
      expect(pre163).to.be.instanceof(PayoutFunctionV0Pre163);
      expect(pre163.endpoint0).to.equal(BigInt(50000));
      expect(pre163.endpointPayout0).to.equal(BigInt(100000));
      expect(pre163.extraPrecision0).to.equal(0);
      expect(pre163.pieces.length).to.equal(1);
      expect(pre163.pieces[0].payoutCurvePiece).to.be.instanceof(
        HyperbolaPayoutCurvePiecePre163,
      );
      expect(
        pre163.pieces[0].payoutCurvePiece.serialize().toString('hex'),
      ).to.equal(
        'fda72a23010100000000fd1388000001010000010000000100000001ff000000012a05f2000000',
      );
      expect(pre163.pieces[0].endpoint).to.equal(BigInt(999999));
      expect(pre163.pieces[0].endpointPayout).to.equal(BigInt(0));
      expect(pre163.pieces[0].extraPrecision).to.equal(0);
    });
  });

  describe('fromPre163', () => {
    const payoutCurvePiece = HyperbolaPayoutCurvePiecePre163.deserialize(
      Buffer.from(
        'fda72a23010100000000fd1388000001010000010000000100000001ff000000012a05f2000000',
        'hex',
      ),
    );
    const piece = {
      payoutCurvePiece,
      endpoint: BigInt(999999),
      endpointPayout: BigInt(0),
      extraPrecision: 0,
    };
    const pre163 = new PayoutFunctionV0Pre163();

    before(() => {
      pre163.endpoint0 = BigInt(50000);
      pre163.endpointPayout0 = BigInt(100000);
      pre163.extraPrecision0 = 0;
      pre163.pieces = [piece];
    });

    it('returns post-163 instance', () => {
      const post163 = PayoutFunction.fromPre163(pre163);
      expect(post163).to.be.instanceof(PayoutFunction);
      expect(post163.pieces.length).to.equal(1);
      expect(
        post163.pieces[0].payoutCurvePiece.serialize().toString('hex'),
      ).to.equal(
        '01010100000000000000000000000000000000001388000001000000000000000100000100000000000000000000010000000000000000000001000000012a05f2000000',
      );
      expect(post163.pieces[0].endPoint.eventOutcome).to.equal(BigInt(50000));
      expect(post163.pieces[0].endPoint.outcomePayout.sats).to.equal(
        BigInt(100000),
      );
      expect(post163.pieces[0].endPoint.extraPrecision).to.equal(0);
      expect(post163.lastEndpoint.eventOutcome).to.equal(BigInt(999999));
      expect(post163.lastEndpoint.outcomePayout.sats).to.equal(BigInt(0));
      expect(post163.lastEndpoint.extraPrecision).to.equal(0);
    });
  });
});
