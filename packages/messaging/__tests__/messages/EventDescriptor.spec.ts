import { expect } from 'chai';

import {
  DigitDecompositionEventDescriptorV0Pre167,
  EventDescriptorPre167,
  MessageType,
} from '../../lib';

describe('EventDescriptor', () => {
  const instance = new DigitDecompositionEventDescriptorV0Pre167();
  instance.base = 2;
  instance.isSigned = false;
  instance.unit = 'BTC-USD';
  instance.precision = 0;
  instance.nbDigits = 17;

  describe('serialize', () => {
    it('serializes', () => {
      expect(instance.serialize().toString("hex")).to.equal(
        "fdd80a" + // type event_descriptor
        "11" + // length
        "0002" + // base
        "00" + // isSigned
        "07" + // unitLen
        "4254432d555344" + // unit
        "00000000" + // precision
        "0011" // nbDigits
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const unknownInstance = EventDescriptorPre167.deserialize(
        Buffer.from(
          'fdd80a' + // type contract_descriptor
            '11' + // length
            '0002' + // base
            '00' + // isSigned
            '07' + // unitLen
            '4254432d555344' + // unit
            '00000000' + // precision
            '0011', // nbDigits
          'hex',
        ),
      ); // prettier-ignore

      if (
        unknownInstance.type === MessageType.DigitDecompositionEventDescriptorV0
      ) {
        const instance = unknownInstance as DigitDecompositionEventDescriptorV0Pre167;

        expect(instance.length).to.equal(17n);
        expect(instance.base).to.equal(2);
        expect(instance.isSigned).to.equal(false);
        expect(instance.unit).to.equal('BTC-USD');
        expect(instance.precision).to.equal(0);
        expect(instance.nbDigits).to.equal(17);
      }
    });
  });

  describe('validate', () => {
    const instance = new DigitDecompositionEventDescriptorV0Pre167();

    beforeEach(() => {
      instance.base = 2;
      instance.isSigned = false;
      instance.unit = 'BTC-USD';
      instance.precision = 0;
      instance.nbDigits = 17;
    });

    it('should not throw error', () => {
      expect(() => instance.validate()).to.not.throw();
    });

    it('should throw if base <= 0', () => {
      instance.base = 0;
      expect(() => instance.validate()).to.throw('base must be greater than 0');

      instance.base = -1;
      expect(() => instance.validate()).to.throw('base must be greater than 0');
    });

    it('should throw if isSigned is true', () => {
      instance.isSigned = true;
      expect(() => instance.validate()).to.throw(
        'node-dlc does not support isSigned',
      );
    });
  });
});
