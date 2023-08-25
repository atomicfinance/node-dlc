import { expect } from 'chai';

import { OrderAcceptV0 } from '../../lib/messages/OrderAccept';
import { OrderNegotiationFields } from '../../lib/messages/OrderNegotiationFields';
import { OrderAcceptV0Pre163 } from '../../lib/messages/pre-163/OrderAccept';
import { OrderNegotiationFieldsV0Pre163 } from '../../lib/messages/pre-163/OrderNegotiationFields';

describe('OrderAccept', () => {
  const tempOrderId = Buffer.from(
    '960fb5f7960382ac7e76f3e24eb6b00059b1e68632a946843c22e1f65fdf216a',
    'hex',
  );

  describe('serialize', () => {
    it('serializes', () => {
      const instance = new OrderAcceptV0();

      instance.protocolVersion = 1;
      instance.tempOrderId = tempOrderId;
      instance.negotiationFields = null;

      expect(instance.serialize().toString("hex")).to.equal(
        "f534" + // type order_accept_v0
        "00000001" + // protocol_version
        "960fb5f7960382ac7e76f3e24eb6b00059b1e68632a946843c22e1f65fdf216a" + // temp_order_id
        "00" // has_negotiation_fields
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const buf = Buffer.from(
        "f534" + // type order_accept_v0
        "00000001" + // protocol_version
        "960fb5f7960382ac7e76f3e24eb6b00059b1e68632a946843c22e1f65fdf216a" + // temp_order_id
        "00" // has_negotiation_fields
        , "hex"
      ); // prettier-ignore

      const instance = OrderAcceptV0.deserialize(buf);

      expect(instance.protocolVersion).to.equal(1);
      expect(instance.tempOrderId).to.deep.equal(tempOrderId);
      expect(instance.negotiationFields).to.equal(null);
    });
  });

  describe('toPre163', () => {
    const instance = new OrderAcceptV0();

    before(() => {
      instance.protocolVersion = 1;
      instance.tempOrderId = tempOrderId;
      instance.negotiationFields = null;
    });

    it('returns pre-163 instance', () => {
      const pre163 = OrderAcceptV0.toPre163(instance, '');
      expect(pre163).to.be.instanceof(OrderAcceptV0Pre163);
      expect(pre163.tempOrderId).to.equal(instance.tempOrderId);
      expect(pre163.negotiationFields).to.be.instanceof(
        OrderNegotiationFieldsV0Pre163,
      );
    });
  });

  describe('fromPre163', () => {
    const pre163 = new OrderAcceptV0Pre163();

    before(() => {
      pre163.tempOrderId = tempOrderId;
      pre163.negotiationFields = null;
    });

    it('returns post-163 instance', () => {
      const post163 = OrderAcceptV0.fromPre163(pre163);
      expect(post163).to.be.instanceof(OrderAcceptV0);
      expect(post163.tempOrderId).to.equal(pre163.tempOrderId);
      expect(post163.negotiationFields).to.be.instanceof(
        OrderNegotiationFields,
      );
    });
  });
});
