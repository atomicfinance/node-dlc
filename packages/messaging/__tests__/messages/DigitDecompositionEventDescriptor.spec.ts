import { expect } from 'chai';

import { DigitDecompositionEventDescriptorV0Pre167 } from '../../lib/messages/pre-167/EventDescriptor';

describe('DigitDecompositionEventDescriptorV0Pre167', () => {
  describe('serialize', () => {
    it('serializes', () => {
      const instance = new DigitDecompositionEventDescriptorV0Pre167();

      instance.length = BigInt(17);
      /**
       * NOTE: BASE IS INCORRECT FORMAT FOR DLC SPEC (SHOULD BE BIGSIZE)
       * Will be fixed in oracle_announcement_v1
       * https://github.com/discreetlogcontracts/dlcspecs/blob/master/Oracle.md#version-0-digit_decomposition_event_descriptor
       */
      instance.base = 2;
      instance.isSigned = false;
      instance.unit = 'btc/usd';
      instance.precision = 0;
      instance.nbDigits = 17;

      expect(instance.serialize().toString("hex")).to.equal(
        'fdd80a' + // type
        '11' + // length
        '0002' + // base (Switch to '02' with oracle_announcement_v1)
        '00' + // isSigned
        '07' + // unit_Len
        '6274632f757364' + // btc/usd (unit)
        '00000000' + // precision
        '0011' // nb_digits
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const buf = Buffer.from(
        'fdd80a' + // type
        '11' + // length
        '0002' + // base (Switch to '02' with oracle_announcement_v1)
        '00' + // isSigned
        '07' + // unit_Len
        '6274632f757364' + // btc/usd (unit)
        '00000000' + // precision
        '0011' // nb_digits
        , "hex"
      ); // prettier-ignore

      const instance = DigitDecompositionEventDescriptorV0Pre167.deserialize(
        buf,
      );

      expect(Number(instance.length)).to.equal(17);
      expect(instance.base).to.equal(2); // (Switch to Number(instance.base) with oracle_announcement_v1)
      expect(instance.isSigned).to.equal(false);
      expect(instance.unit).to.equal('btc/usd');
      expect(instance.precision).to.equal(0);
      expect(instance.nbDigits).to.equal(17);
    });
  });
});
