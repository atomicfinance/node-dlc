import { expect } from 'chai';

import { HyperbolaPayoutCurvePiecePre163 } from '../../../lib/messages/pre-163/PayoutCurvePiece';
import { PayoutFunctionV0Pre163 } from '../../../lib/messages/pre-163/PayoutFunction';

describe('PayoutFunctionV0Pre163', () => {
  describe('serialize', () => {
    it('serializes', () => {
      const instance = new PayoutFunctionV0Pre163();

      instance.endpoint0 = BigInt(50000);
      instance.endpointPayout0 = BigInt(100000);
      instance.extraPrecision0 = 0;

      const payoutCurvePiece = HyperbolaPayoutCurvePiecePre163.deserialize(
        Buffer.from(
          'fda72c23010100000000fd1388000001010000010000000100000001ff000000012a05f2000000',
          'hex',
        ),
      );

      instance.pieces = [
        {
          payoutCurvePiece,
          endpoint: BigInt(999999),
          endpointPayout: BigInt(0),
          extraPrecision: 0,
        },
      ];

      expect(instance.serialize().toString("hex")).to.equal(
        'fda726' + // type
        '3b' + // length
        '0001' + // num_pieces
        'fdc350' + // endpoint_0
        'fe000186a0' + // endpoint_payout_0
        '0000' + // extra_precision
        'fda72a23010100000000fd1388000001010000010000000100000001ff000000012a05f2000000' + // payout_curve_piece
        'fe000f423f' + // endpoint_1
        '00' + // endpoint_payout_1
        '0000' // extra_precision_1
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const buf =  Buffer.from(
        'fda726' + // type
        '3b' + // length
        '0001' + // num_pieces
        'fdc350' + // endpoint_0
        'fe000186a0' + // endpoint_payout_0
        '0000' + // extra_precision
        'fda72c23010100000000fd1388000001010000010000000100000001ff000000012a05f2000000' + // payout_curve_piece
        'fe000f423f' + // endpoint_1
        '00' + // endpoint_payout_1
        '0000' // extra_precision_1
        , 'hex'); // prettier-ignore

      const instance = PayoutFunctionV0Pre163.deserialize(buf);

      expect(instance.endpoint0).to.equal(BigInt(50000));
      expect(instance.endpointPayout0).to.equal(BigInt(100000));
      expect(instance.extraPrecision0).to.equal(0);

      expect(instance.pieces.length).to.equal(1);
      expect(
        instance.pieces[0].payoutCurvePiece.serialize().toString('hex'),
      ).to.equal(
        'fda72a23010100000000fd1388000001010000010000000100000001ff000000012a05f2000000',
      );
      expect(instance.pieces[0].endpoint).to.equal(BigInt(999999));
      expect(instance.pieces[0].endpointPayout).to.equal(BigInt(0));
      expect(instance.pieces[0].extraPrecision).to.equal(0);
    });
  });
});
