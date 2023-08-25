import { expect } from 'chai';

import {
  DisjointNegotiationFields,
  NegotiationFields,
  SingleNegotiationFields,
} from '../../lib/messages/NegotiationFields';
import {
  NegotiationFieldsV1Pre163,
  NegotiationFieldsV2Pre163,
} from '../../lib/messages/pre-163/NegotiationFields';
import { RoundingIntervalsV0Pre163 } from '../../lib/messages/pre-163/RoundingIntervals';
import { RoundingIntervals } from '../../lib/messages/RoundingIntervals';

describe('NegotiationFields', () => {
  describe('SingleNegotiationFields', () => {
    const instance = new SingleNegotiationFields();

    beforeEach(() => {
      instance.roundingIntervals = RoundingIntervals.deserialize(
        Buffer.from(
          '01' + // num_rounding_intervals
            '0000000000001388' + // begin_interval
            '0000000000002710', // rounding_mod
          'hex',
        ),
      );
    });

    describe('serialize', () => {
      it('serializes', () => {
        expect(instance.serialize().toString('hex')).to.equal(
          '00' + // type single_negotiation_fields
            '01' + // num_rounding_intervals
            '0000000000001388' + // begin_interval
            '0000000000002710', // rounding_mod
        );
      });
    });

    describe('deserialize', () => {
      it('deserializes', () => {
        const buf = Buffer.from(
          "00" + // type single_negotiation_fields
          "01" + // num_rounding_intervals
          "0000000000001388" + // begin_interval
          "0000000000002710" // rounding_mod
          , "hex"
        ); // prettier-ignore
        const unknownInstance = NegotiationFields.deserialize(buf);

        expect(unknownInstance).to.be.instanceof(SingleNegotiationFields);
        expect(
          (unknownInstance as SingleNegotiationFields).roundingIntervals
            .serialize()
            .toString('hex'),
        ).to.equal(
          '01' + // num_rounding_intervals
            '0000000000001388' + // begin_interval
            '0000000000002710', // rounding_mod
        );
      });
    });

    describe('toPre163', () => {
      it('returns pre-163 instance', () => {
        const pre163 = NegotiationFields.toPre163(instance);
        expect(pre163).to.be.instanceof(NegotiationFieldsV1Pre163);
        expect(
          (pre163 as NegotiationFieldsV1Pre163).roundingIntervals,
        ).to.be.instanceof(RoundingIntervalsV0Pre163);
        expect(
          (pre163 as NegotiationFieldsV1Pre163).roundingIntervals.intervals,
        ).to.deep.equal(instance.roundingIntervals.intervals);
      });
    });

    describe('fromPre163', () => {
      const intervals = [
        { beginInterval: 1n, roundingMod: 2n },
        { beginInterval: 3n, roundingMod: 4n },
      ];
      const roundingIntervalsPre163 = new RoundingIntervalsV0Pre163();
      const pre163 = new NegotiationFieldsV1Pre163();

      before(() => {
        roundingIntervalsPre163.intervals = intervals;
        pre163.roundingIntervals = roundingIntervalsPre163;
      });

      it('returns post-163 instance', () => {
        const post163 = NegotiationFields.fromPre163(pre163);
        expect(post163).to.be.instanceof(SingleNegotiationFields);
        expect(
          (post163 as SingleNegotiationFields).roundingIntervals,
        ).to.be.instanceof(RoundingIntervals);
        expect(
          (post163 as SingleNegotiationFields).roundingIntervals.intervals,
        ).to.deep.equal(pre163.roundingIntervals.intervals);
      });
    });
  });

  describe('DisjointNegotiationFields', () => {
    const instance = new DisjointNegotiationFields();

    beforeEach(() => {
      instance.negotiationFieldsList = [
        NegotiationFields.deserialize(
          Buffer.from(
            '00' + // type single_negotiation_fields
              '01' + // num_rounding_intervals
              '0000000000001388' + // begin_interval
              '0000000000002710', // rounding_mod
            'hex',
          ),
        ),
      ];
    });
    describe('serialize', () => {
      it('serializes', () => {
        expect(instance.serialize().toString('hex')).to.equal(
          '01' + // type disjoint_negotiation_fields
            '01' + // num_disjoint_events
            '00' + // type single_negotiation_fields
            '01' + // num_rounding_intervals
            '0000000000001388' + // begin_interval
            '0000000000002710', // rounding_mod
        );
      });
    });

    describe('deserialize', () => {
      it('deserializes', () => {
        const buf = Buffer.from(
          "01" + // type disjoint_negotiation_fields
          "01" + // num_disjoint_events
          "00" + // type single_negotiation_fields
          "01" + // num_rounding_intervals
          "0000000000001388" + // begin_interval
          "0000000000002710" // rounding_mod
          , "hex"
        ); // prettier-ignore
        const unknownInstance = NegotiationFields.deserialize(buf);

        expect(unknownInstance).to.be.instanceof(DisjointNegotiationFields);
        expect(
          instance.negotiationFieldsList[0].serialize().toString('hex'),
        ).to.equal(
          '00' + // type single_negotiation_fields
            '01' + // num_rounding_intervals
            '0000000000001388' + // begin_interval
            '0000000000002710', // rounding_mod
        );
      });
    });

    describe('toPre163', () => {
      it('returns pre-163 instance', () => {
        const pre163 = NegotiationFields.toPre163(instance);
        expect(pre163).to.be.instanceof(NegotiationFieldsV2Pre163);
        expect(
          (pre163 as NegotiationFieldsV2Pre163).negotiationFieldsList.length,
        ).to.equal(instance.negotiationFieldsList.length);
        for (
          let i = 0;
          i <
          (pre163 as NegotiationFieldsV2Pre163).negotiationFieldsList.length;
          i++
        ) {
          expect(
            (pre163 as NegotiationFieldsV2Pre163).negotiationFieldsList[i],
          ).to.be.instanceof(NegotiationFieldsV1Pre163);
          expect(
            ((pre163 as NegotiationFieldsV2Pre163).negotiationFieldsList[
              i
            ] as NegotiationFieldsV1Pre163).roundingIntervals,
          ).to.be.instanceof(RoundingIntervalsV0Pre163);
          expect(
            ((pre163 as NegotiationFieldsV2Pre163).negotiationFieldsList[
              i
            ] as NegotiationFieldsV1Pre163).roundingIntervals.intervals,
          ).to.deep.equal(
            (instance.negotiationFieldsList[i] as SingleNegotiationFields)
              .roundingIntervals.intervals,
          );
        }
      });
    });

    describe('fromPre163', () => {
      const intervals = [
        { beginInterval: 1n, roundingMod: 2n },
        { beginInterval: 3n, roundingMod: 4n },
      ];
      const roundingIntervalsPre163 = new RoundingIntervalsV0Pre163();
      const negociationFieldV1Pre163 = new NegotiationFieldsV1Pre163();
      const pre163 = new NegotiationFieldsV2Pre163();

      before(() => {
        roundingIntervalsPre163.intervals = intervals;
        negociationFieldV1Pre163.roundingIntervals = roundingIntervalsPre163;
        pre163.negotiationFieldsList = [];
        pre163.negotiationFieldsList.push(negociationFieldV1Pre163);
      });

      it('returns post-163 instance', () => {
        const post163 = NegotiationFields.fromPre163(pre163);
        expect(post163).to.be.instanceof(DisjointNegotiationFields);
        expect(
          (post163 as DisjointNegotiationFields).negotiationFieldsList.length,
        ).to.equal(pre163.negotiationFieldsList.length);
        for (
          let i = 0;
          i <
          (post163 as DisjointNegotiationFields).negotiationFieldsList.length;
          i++
        ) {
          expect(
            (post163 as DisjointNegotiationFields).negotiationFieldsList[i],
          ).to.be.instanceof(SingleNegotiationFields);
          expect(
            ((post163 as DisjointNegotiationFields).negotiationFieldsList[
              i
            ] as SingleNegotiationFields).roundingIntervals,
          ).to.be.instanceof(RoundingIntervals);
          expect(
            ((post163 as DisjointNegotiationFields).negotiationFieldsList[
              i
            ] as SingleNegotiationFields).roundingIntervals.intervals,
          ).to.deep.equal(
            (pre163.negotiationFieldsList[i] as NegotiationFieldsV1Pre163)
              .roundingIntervals.intervals,
          );
        }
      });
    });
  });
});
