import { expect } from 'chai';

import {
  NegotiationFieldsPre163,
  NegotiationFieldsV0Pre163,
  NegotiationFieldsV1Pre163,
  NegotiationFieldsV2Pre163,
} from '../../../lib/messages/pre-163/NegotiationFields';
import { RoundingIntervalsV0Pre163 } from '../../../lib/messages/pre-163/RoundingIntervals';
import { MessageType } from '../../../lib/MessageType';

describe('NegotiationFieldsPre163', () => {
  describe('NegotiationFieldsV0Pre163', () => {
    describe('serialize', () => {
      it('serializes', () => {
        const instance = new NegotiationFieldsV0Pre163();

        instance.length = BigInt(0);

        expect(instance.serialize().toString('hex')).to.equal(
          'fdd826' + // type negotiation_fields_v0
            '00', // length
        );
      });
    });

    describe('deserialize', () => {
      it('deserializes', () => {
        const buf = Buffer.from(
          "fdd826" + // type negotiation_fields_v0
          "00" // length
          , "hex"
        ); // prettier-ignore

        const unknownInstance = NegotiationFieldsPre163.deserialize(buf);

        if (unknownInstance.type === MessageType.NegotiationFieldsV0) {
          const instance = unknownInstance as NegotiationFieldsV0Pre163;

          expect(Number(instance.length)).to.equal(0);
        }
      });
    });
  });

  describe('NegotiationFieldsV1Pre163', () => {
    describe('serialize', () => {
      it('serializes', () => {
        const instance = new NegotiationFieldsV1Pre163();

        instance.length = BigInt(12);
        instance.roundingIntervals = RoundingIntervalsV0Pre163.deserialize(
          Buffer.from(
            'fda724' + // type rounding_intervals_v0
              '08' + // length
              '0001' + // num_rounding_intervals
              'fd1388' + // begin_interval
              'fd2710', // rounding_mod
            'hex',
          ),
        );

        expect(instance.serialize().toString('hex')).to.equal(
          'fdd828' + // type negotiation_fields_v1
            '0c' + // length
            'fda724' + // type rounding_intervals_v0
            '08' + // length
            '0001' + // num_rounding_intervals
            'fd1388' + // begin_interval
            'fd2710', // rounding_mod
        );
      });
    });

    describe('deserialize', () => {
      it('deserializes', () => {
        const buf = Buffer.from(
          "fdd828" + // type negotiation_fields_v1
          "0c" + // length
          "fda724" + // type rounding_intervals_v0
          "08" + // length
          "0001" + // num_rounding_intervals
          "fd1388" + // begin_interval
          "fd2710" // rounding_mod
          , "hex"
        ); // prettier-ignore

        const unknownInstance = NegotiationFieldsPre163.deserialize(buf);

        if (unknownInstance.type === MessageType.NegotiationFieldsV1) {
          const instance = unknownInstance as NegotiationFieldsV1Pre163;

          expect(Number(instance.length)).to.equal(12);
          expect(
            instance.roundingIntervals.serialize().toString('hex'),
          ).to.equal(
            'fda724' + // type rounding_intervals_v0
              '08' + // length
              '0001' + // num_rounding_intervals
              'fd1388' + // begin_interval
              'fd2710', // rounding_mod
          );
        }
      });
    });
  });

  describe('NegotiationFieldsV2Pre163', () => {
    describe('serialize', () => {
      it('serializes', () => {
        const instance = new NegotiationFieldsV2Pre163();

        instance.length = BigInt(21);
        instance.negotiationFieldsList = [
          NegotiationFieldsPre163.deserialize(
            Buffer.from(
              'fdd828' + // type negotiation_fields_v1
                '0c' + // length
                'fda724' + // type rounding_intervals_v0
                '08' + // length
                '0001' + // num_rounding_intervals
                'fd1388' + // begin_interval
                'fd2710', // rounding_mod
              'hex',
            ),
          ),
          NegotiationFieldsPre163.deserialize(
            Buffer.from(
              'fdd826' + // type negotiation_fields_v0
                '00', // length
              'hex',
            ),
          ),
        ];

        expect(instance.serialize().toString('hex')).to.equal(
          'fdd832' + // type negotiation_fields_v2
            '15' + // length
            '02' + // num_disjoint_events
            'fdd828' + // type negotiation_fields_v1
            '0c' + // length
            'fda724' + // type rounding_intervals_v0
            '08' + // length
            '0001' + // num_rounding_intervals
            'fd1388' + // begin_interval
            'fd2710' + // rounding_mod
            'fdd826' + // type negotiation_fields_v0
            '00', // length
        );
      });
    });

    describe('deserialize', () => {
      it('deserializes', () => {
        const buf = Buffer.from(
          "fdd832" + // type negotiation_fields_v2
          "15" + // length
          "02" + // num_disjoint_events
          "fdd828" + // type negotiation_fields_v1
          "0c" + // length
          "fda724" + // type rounding_intervals_v0
          "08" + // length
          "0001" + // num_rounding_intervals
          "fd1388" + // begin_interval
          "fd2710" + // rounding_mod
          "fdd826" + // type negotiation_fields_v0
          "00" // length
          , "hex"
        ); // prettier-ignore

        const unknownInstance = NegotiationFieldsPre163.deserialize(buf);

        if (unknownInstance.type === MessageType.NegotiationFieldsV2) {
          const instance = unknownInstance as NegotiationFieldsV2Pre163;

          expect(Number(instance.length)).to.equal(21);
          expect(
            instance.negotiationFieldsList[0].serialize().toString('hex'),
          ).to.equal(
            'fdd828' + // type negotiation_fields_v1
              '0c' + // length
              'fda724' + // type rounding_intervals_v0
              '08' + // length
              '0001' + // num_rounding_intervals
              'fd1388' + // begin_interval
              'fd2710', // rounding_mod
          );
          expect(
            instance.negotiationFieldsList[1].serialize().toString('hex'),
          ).to.equal(
            'fdd826' + // type negotiation_fields_v0
              '00', // length
          );
        }
      });
    });
  });
});
