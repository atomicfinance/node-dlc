import { expect } from 'chai';

import { RoundingIntervalsV0Pre163 } from '../../../lib/messages/pre-163/RoundingIntervals';

describe('RoundingIntervalsV0Pre163', () => {
  describe('serialize', () => {
    it('serializes', () => {
      const instance = new RoundingIntervalsV0Pre163();

      const intervals = [
        { beginInterval: 1n, roundingMod: 2n },
        { beginInterval: 3n, roundingMod: 4n },
      ];
      instance.intervals = intervals;

      expect(instance.serialize().toString("hex")).to.equal(
        'fda724' + // type
        '06' + // length
        '0002' + // array_length
        '01' + // begin_interval
        '02' + // rounding_mod
        '03' + // begin_interval
        '04'   // rounding_mod
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const buf =  Buffer.from(
        'fda724' + // type
        '06' + // length
        '0002' + // array_length
        '01' + // begin_interval
        '02' + // rounding_mod
        '03' + // begin_interval
        '04'   // rounding_mod
        , 'hex'); // prettier-ignore

      const instance = RoundingIntervalsV0Pre163.deserialize(buf);

      expect(instance.length).to.eq(6n);
      expect(instance.intervals[0].beginInterval).to.eq(1n);
      expect(instance.intervals[0].roundingMod).to.eq(2n);
      expect(instance.intervals[1].beginInterval).to.eq(3n);
      expect(instance.intervals[1].roundingMod).to.eq(4n);
    });
  });

  describe('validate', () => {
    const instance = new RoundingIntervalsV0Pre163();

    beforeEach(() => {
      const intervals = [
        { beginInterval: 1n, roundingMod: 2n },
        { beginInterval: 3n, roundingMod: 4n },
      ];
      instance.intervals = intervals;
    });

    it('should not throw error', () => {
      expect(() => instance.validate()).to.not.throw();
    });

    it('should throw error if negative intervals', () => {
      instance.intervals[0].beginInterval = -1n;
      expect(() => instance.validate()).to.throw(
        'beginInterval must be non-negative',
      );
    });

    it('should throw error if non-increasing intervals', () => {
      instance.intervals[1].beginInterval = 0n;
      expect(() => instance.validate()).to.throw(
        'Intervals must be strictly increasing',
      );
    });
  });
});
