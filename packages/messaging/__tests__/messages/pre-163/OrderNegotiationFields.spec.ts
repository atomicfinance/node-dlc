import { expect } from 'chai';

import {
  OrderNegotiationFieldsPre163,
  OrderNegotiationFieldsV0Pre163,
  OrderNegotiationFieldsV1Pre163,
} from '../../../lib/messages/pre-163/OrderNegotiationFields';
import { OrderOfferV0Pre163 } from '../../../lib/messages/pre-163/OrderOffer';
import { MessageType } from '../../../lib/MessageType';

describe('OrderNegotiationFieldsPre163', () => {
  describe('OrderNegotiationFieldsV0Pre163', () => {
    describe('serialize', () => {
      it('serializes', () => {
        const instance = new OrderNegotiationFieldsV0Pre163();

        instance.length = BigInt(0);

        expect(instance.serialize().toString('hex')).to.equal(
          'fdff36' + // type order_negotiation_fields_v0
            '00', // length
        );
      });
    });

    describe('deserialize', () => {
      it('deserializes', () => {
        const buf = Buffer.from(
          "fdff36" + // type order_negotiation_fields_v0
          "00" // length
          , "hex"
        ); // prettier-ignore

        const unknownInstance = OrderNegotiationFieldsPre163.deserialize(buf);

        if (unknownInstance.type === MessageType.OrderNegotiationFieldsV0) {
          const instance = unknownInstance as OrderNegotiationFieldsV0Pre163;

          expect(Number(instance.length)).to.equal(0);
        }
      });
    });
  });

  describe('OrderNegotiationFieldsV1Pre163', () => {
    describe('serialize', () => {
      it('serializes', () => {
        const instance = new OrderNegotiationFieldsV1Pre163();

        instance.length = BigInt(12);
        instance.orderOffer = OrderOfferV0Pre163.deserialize(
          Buffer.from(
            'f532' + // type
              '06226e46111a0b59caaf126043eb5bbf28c34f3a5e332a1fc7b2b73cf188910f' + // chain_hash
              'fdd82e' + // type contract_info
              'fd0131' + // length
              '000000000bebc200' + // total_collateral
              'fda710' + // type contract_descriptor
              '79' + // length
              '03' + // num_outcomes
              'c5a7affd51901bc7a51829b320d588dc7af0ad1f3d56f20a1d3c60c9ba7c6722' + // outcome_1
              '0000000000000000' + // payout_1
              'adf1c23fbeed6611efa5caa0e9ed4c440c450a18bc010a6c867e05873ac08ead' + // outcome_2
              '00000000092363a3' + // payout_2
              '6922250552ad6bb10ab3ddd6981b530aa9a6fd05725bf85b59e3e51163905288' + // outcome_3
              '000000000bebc200' + // payout_3
              'fda712' + // type oracle_info
              'a8' + // length
              'fdd824' + // type oracle_announcement
              'a4' + // length
              'fab22628f6e2602e1671c286a2f63a9246794008627a1749639217f4214cb4a9' + // announcement_signature_r
              '494c93d1a852221080f44f697adb4355df59eb339f6ba0f9b01ba661a8b108d4' + // announcement_signature_s
              'da078bbb1d34e7729e38e2ae34236e776da121af442626fa31e31ae55a279a0b' + // oracle_public_key
              'fdd822' + // type oracle_event
              '40' + // length
              '0001' + // nb_nonces
              '3cfba011378411b20a5ab773cb95daab93e9bcd1e4cce44986a7dda84e01841b' + // oracle_nonces
              '00000000' + // event_maturity_epoch
              'fdd806' + // type enum_event_descriptor
              '10' + // length
              '0002' + // num_outcomes
              '06' + // outcome_1_len
              '64756d6d7931' + // outcome_1
              '06' + // outcome_2_len
              '64756d6d7932' + // outcome_2
              '05' + // event_id_length
              '64756d6d79' + // event_id
              '0000000005f5e100' + // total_collateral_satoshis
              '0000000000000001' + // fee_rate_per_vb
              '00000064' + // cet_locktime
              '000000c8', // refund_locktime
            'hex',
          ),
        );

        expect(instance.serialize().toString('hex')).to.equal(
          'fdff38' + // type order_negotiation_fields_v1
            'fd0171' + // length
            'f532' + // type
            '06226e46111a0b59caaf126043eb5bbf28c34f3a5e332a1fc7b2b73cf188910f' + // chain_hash
            'fdd82e' + // type contract_info
            'fd0131' + // length
            '000000000bebc200' + // total_collateral
            'fda710' + // type contract_descriptor
            '79' + // length
            '03' + // num_outcomes
            'c5a7affd51901bc7a51829b320d588dc7af0ad1f3d56f20a1d3c60c9ba7c6722' + // outcome_1
            '0000000000000000' + // payout_1
            'adf1c23fbeed6611efa5caa0e9ed4c440c450a18bc010a6c867e05873ac08ead' + // outcome_2
            '00000000092363a3' + // payout_2
            '6922250552ad6bb10ab3ddd6981b530aa9a6fd05725bf85b59e3e51163905288' + // outcome_3
            '000000000bebc200' + // payout_3
            'fda712' + // type oracle_info
            'a8' + // length
            'fdd824' + // type oracle_announcement
            'a4' + // length
            'fab22628f6e2602e1671c286a2f63a9246794008627a1749639217f4214cb4a9' + // announcement_signature_r
            '494c93d1a852221080f44f697adb4355df59eb339f6ba0f9b01ba661a8b108d4' + // announcement_signature_s
            'da078bbb1d34e7729e38e2ae34236e776da121af442626fa31e31ae55a279a0b' + // oracle_public_key
            'fdd822' + // type oracle_event
            '40' + // length
            '0001' + // nb_nonces
            '3cfba011378411b20a5ab773cb95daab93e9bcd1e4cce44986a7dda84e01841b' + // oracle_nonces
            '00000000' + // event_maturity_epoch
            'fdd806' + // type enum_event_descriptor
            '10' + // length
            '0002' + // num_outcomes
            '06' + // outcome_1_len
            '64756d6d7931' + // outcome_1
            '06' + // outcome_2_len
            '64756d6d7932' + // outcome_2
            '05' + // event_id_length
            '64756d6d79' + // event_id
            '0000000005f5e100' + // total_collateral_satoshis
            '0000000000000001' + // fee_rate_per_vb
            '00000064' + // cet_locktime
            '000000c8', // refund_locktime
        );
      });
    });

    describe('deserialize', () => {
      it('deserializes', () => {
        const buf = Buffer.from(
          'fdff38' + // type order_negotiation_fields_v1
          'fd0171' + // length
          'f532' + // type
          '06226e46111a0b59caaf126043eb5bbf28c34f3a5e332a1fc7b2b73cf188910f' + // chain_hash
          'fdd82e' + // type contract_info
          'fd0131' + // length
          '000000000bebc200' + // total_collateral
          'fda710' + // type contract_descriptor
          '79' + // length
          '03' + // num_outcomes
          'c5a7affd51901bc7a51829b320d588dc7af0ad1f3d56f20a1d3c60c9ba7c6722' + // outcome_1
          '0000000000000000' + // payout_1
          'adf1c23fbeed6611efa5caa0e9ed4c440c450a18bc010a6c867e05873ac08ead' + // outcome_2
          '00000000092363a3' + // payout_2
          '6922250552ad6bb10ab3ddd6981b530aa9a6fd05725bf85b59e3e51163905288' + // outcome_3
          '000000000bebc200' + // payout_3
          'fda712' + // type oracle_info
          'a8' + // length
          'fdd824' + // type oracle_announcement
          'a4' + // length
          'fab22628f6e2602e1671c286a2f63a9246794008627a1749639217f4214cb4a9' + // announcement_signature_r
          '494c93d1a852221080f44f697adb4355df59eb339f6ba0f9b01ba661a8b108d4' + // announcement_signature_s
          'da078bbb1d34e7729e38e2ae34236e776da121af442626fa31e31ae55a279a0b' + // oracle_public_key
          'fdd822' + // type oracle_event
          '40' + // length
          '0001' + // nb_nonces
          '3cfba011378411b20a5ab773cb95daab93e9bcd1e4cce44986a7dda84e01841b' + // oracle_nonces
          '00000000' + // event_maturity_epoch
          'fdd806' + // type enum_event_descriptor
          '10' + // length
          '0002' + // num_outcomes
          '06' + // outcome_1_len
          '64756d6d7931' + // outcome_1
          '06' + // outcome_2_len
          '64756d6d7932' + // outcome_2
          '05' + // event_id_length
          '64756d6d79' + // event_id
          '0000000005f5e100' + // total_collateral_satoshis
          '0000000000000001' + // fee_rate_per_vb
          '00000064' + // cet_locktime
          '000000c8', // refund_locktime
          "hex"
        ); // prettier-ignore

        const unknownInstance = OrderNegotiationFieldsPre163.deserialize(buf);

        if (unknownInstance.type === MessageType.OrderNegotiationFieldsV1) {
          const instance = unknownInstance as OrderNegotiationFieldsV1Pre163;

          expect(Number(instance.length)).to.equal(369);
          expect(instance.orderOffer.serialize().toString('hex')).to.equal(
            'f532' + // type
              '06226e46111a0b59caaf126043eb5bbf28c34f3a5e332a1fc7b2b73cf188910f' + // chain_hash
              'fdd82e' + // type contract_info
              'fd0131' + // length
              '000000000bebc200' + // total_collateral
              'fda710' + // type contract_descriptor
              '79' + // length
              '03' + // num_outcomes
              'c5a7affd51901bc7a51829b320d588dc7af0ad1f3d56f20a1d3c60c9ba7c6722' + // outcome_1
              '0000000000000000' + // payout_1
              'adf1c23fbeed6611efa5caa0e9ed4c440c450a18bc010a6c867e05873ac08ead' + // outcome_2
              '00000000092363a3' + // payout_2
              '6922250552ad6bb10ab3ddd6981b530aa9a6fd05725bf85b59e3e51163905288' + // outcome_3
              '000000000bebc200' + // payout_3
              'fda712' + // type oracle_info
              'a8' + // length
              'fdd824' + // type oracle_announcement
              'a4' + // length
              'fab22628f6e2602e1671c286a2f63a9246794008627a1749639217f4214cb4a9' + // announcement_signature_r
              '494c93d1a852221080f44f697adb4355df59eb339f6ba0f9b01ba661a8b108d4' + // announcement_signature_s
              'da078bbb1d34e7729e38e2ae34236e776da121af442626fa31e31ae55a279a0b' + // oracle_public_key
              'fdd822' + // type oracle_event
              '40' + // length
              '0001' + // nb_nonces
              '3cfba011378411b20a5ab773cb95daab93e9bcd1e4cce44986a7dda84e01841b' + // oracle_nonces
              '00000000' + // event_maturity_epoch
              'fdd806' + // type enum_event_descriptor
              '10' + // length
              '0002' + // num_outcomes
              '06' + // outcome_1_len
              '64756d6d7931' + // outcome_1
              '06' + // outcome_2_len
              '64756d6d7932' + // outcome_2
              '05' + // event_id_length
              '64756d6d79' + // event_id
              '0000000005f5e100' + // total_collateral_satoshis
              '0000000000000001' + // fee_rate_per_vb
              '00000064' + // cet_locktime
              '000000c8', // refund_locktime
          );
        }
      });
    });
  });
});
