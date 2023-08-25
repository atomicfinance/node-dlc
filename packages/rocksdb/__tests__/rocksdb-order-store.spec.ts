import { OrderAcceptV0, OrderOfferV0 } from '@node-dlc/messaging';
import { sha256 } from '@node-lightning/crypto';
import { expect } from 'chai';

import { RocksdbOrderStore } from '../lib/rocksdb-order-store';
import * as util from './rocksdb';

describe('RocksdbOrderStore', () => {
  let sut: RocksdbOrderStore;

  // Outcomes in utf-8 notation
  // outcome_1 = 'c5a7affd51901bc7a51829b320d588dc7af0ad1f3d56f20a1d3c60c9ba7c6722';
  const outcome_1_utf8 =
    '63356137616666643531393031626337613531383239623332306435383864633761663061643166336435366632306131643363363063396261376336373232';
  const outcome_1_utf8_len = '40';
  // outcome_2 = 'adf1c23fbeed6611efa5caa0e9ed4c440c450a18bc010a6c867e05873ac08ead';
  const outcome_2_utf8 =
    '61646631633233666265656436363131656661356361613065396564346334343063343530613138626330313061366338363765303538373361633038656164';
  const outcome_2_utf8_len = '40';
  // outcome_3 = '6922250552ad6bb10ab3ddd6981b530aa9a6fd05725bf85b59e3e51163905288';
  const outcome_3_utf8 =
    '36393232323530353532616436626231306162336464643639383162353330616139613666643035373235626638356235396533653531313633393035323838';
  const outcome_3_utf8_len = '40';

  const orderOfferHex = Buffer.from(
    'f532' + // type
      '00000001' + // protocol version
      '00' + // contract flags
      '06226e46111a0b59caaf126043eb5bbf28c34f3a5e332a1fc7b2b73cf188910f' + // chain_hash
      '00' + // type contract_info
      '000000000bebc200' + // total_collateral
      '00' + // type contract_descriptor
      '03' + // num_outcomes
      outcome_1_utf8_len + // outcome_1_len
      outcome_1_utf8 + // outcome_1 (utf-8 encoded)
      '0000000000000000' + // payout_1
      outcome_2_utf8_len + // outcome_2_len
      outcome_2_utf8 + // outcome_2 (utf-8 encoded)
      '00000000092363a3' + // payout_2
      outcome_3_utf8_len + // outcome_3_len
      outcome_3_utf8 + // outcome_3 (utf-8 encoded)
      '000000000bebc200' + // payout_3
      '00' + // type oracle_info
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
  );

  const orderOffer = OrderOfferV0.deserialize(orderOfferHex);

  const orderOfferHex2 = Buffer.from(
    'f532' + // type
      '00000001' + // protocol version
      '00' + // contract flags
      '06226e46111a0b59caaf126043eb5bbf28c34f3a5e332a1fc7b2b73cf188910f' + // chain_hash
      '00' + // type contract_info
      '000000000bebc200' + // total_collateral
      '00' + // type contract_descriptor
      '03' + // num_outcomes
      outcome_1_utf8_len + // outcome_1_len
      outcome_1_utf8 + // outcome_1 (utf-8 encoded)
      '0000000000000000' + // payout_1
      outcome_2_utf8_len + // outcome_2_len
      outcome_2_utf8 + // outcome_2 (utf-8 encoded)
      '00000000092363a3' + // payout_2
      outcome_3_utf8_len + // outcome_3_len
      outcome_3_utf8 + // outcome_3 (utf-8 encoded)
      '000000000bebc200' + // payout_3
      '00' + // type oracle_info
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
      '000000c9', // refund_locktime
    'hex',
  );

  const orderOffer2 = OrderOfferV0.deserialize(orderOfferHex2);

  const orderOfferWithMetadataHex = Buffer.from(
    'f532' + // type
      '00000001' + // protocol version
      '00' + // contract flags
      '06226e46111a0b59caaf126043eb5bbf28c34f3a5e332a1fc7b2b73cf188910f' + // chain_hash
      '00' + // type contract_info
      '000000000bebc200' + // total_collateral
      '00' + // type contract_descriptor
      '03' + // num_outcomes
      outcome_1_utf8_len + // outcome_1_len
      outcome_1_utf8 + // outcome_1 (utf-8 encoded)
      '0000000000000000' + // payout_1
      outcome_2_utf8_len + // outcome_2_len
      outcome_2_utf8 + // outcome_2 (utf-8 encoded)
      '00000000092363a3' + // payout_2
      outcome_3_utf8_len + // outcome_3_len
      outcome_3_utf8 + // outcome_3 (utf-8 encoded)
      '000000000bebc200' + // payout_3
      '00' + // type oracle_info
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
      '000000c8' + // refund_locktime
      'fdf5360c0b73747261746567792d3838', // order_metadata_v0 tlv
    'hex',
  );

  const orderOfferWithMetadata = OrderOfferV0.deserialize(
    orderOfferWithMetadataHex,
  );

  const tempOrderWithMetadataId = sha256(orderOfferWithMetadataHex);
  const orderMetadataId = sha256(orderOfferWithMetadata.metadata.serialize());
  const tempOrderId =
    '4a74dfc6da77550e2971eba10a9a1eef9253b000c00d96f5c6589ebef1c84b7b'; // Arbitrary order Id
  const tempOrderId2 =
    'a860dfb8d9eb5412d98c2c12936150ed606fb078edacd256aa4eef94cefc6c7d'; // Arbitrary order Id

  const orderAcceptHex = Buffer.from(
    'f534' + // type order_accept_v0
      '00000001' + // protocol_version
      tempOrderId + // temp_order_id
      '00', // has_negotiation_fields
    'hex',
  );

  const orderAccept = OrderAcceptV0.deserialize(orderAcceptHex);

  const orderAcceptHex2 = Buffer.from(
    'f534' + // type order_accept_v0
      '00000001' + // protocol_version
      tempOrderId2 + // temp_order_id
      '00', // has_negotiation_fields
    'hex',
  );

  const orderAccept2 = OrderAcceptV0.deserialize(orderAcceptHex2);

  const nick = 'A033vb7L82Z4EBMq';

  before(async () => {
    util.rmdir('.testdb');
    sut = new RocksdbOrderStore('./.testdb/nested/dir');
    await sut.open();
  });

  after(async () => {
    await sut.close();
    util.rmdir('.testdb');
  });

  describe('save order_offer', () => {
    it('should save order_offer', async () => {
      await sut.saveOrderOffer(orderOffer);
    });
  });

  describe('find order_offer by tempOrderId', () => {
    it('should return the order_offer object', async () => {
      const tempOrderId = sha256(orderOfferHex);
      const actual = await sut.findOrderOffer(tempOrderId);
      expect(actual.serialize()).to.deep.equal(orderOffer.serialize());
    });
  });

  describe('delete order_offer', () => {
    it('should delete order_offer', async () => {
      const tempOrderId = sha256(orderOfferHex);

      await sut.deleteOrderOffer(tempOrderId);

      const actual = await sut.findOrderOffer(tempOrderId);
      expect(actual).to.be.undefined;
    });
  });

  describe('save order_offer by nick', () => {
    it('should save order_offer', async () => {
      await sut.saveOrderOfferByNick(orderOffer, nick);
      await sut.saveOrderOfferByNick(orderOffer2, nick);
    });
  });

  describe('find order_offers by nick', () => {
    it('should return the order_offer object', async () => {
      const actual = await sut.findOrderOffersByNick(nick);

      await sut.deleteOrderOffer(Buffer.from(tempOrderId, 'hex'));
      await sut.deleteOrderOffer(Buffer.from(tempOrderId2, 'hex'));

      expect(actual.length).to.equal(2);
      expect(actual[1].serialize()).to.deep.equal(orderOffer.serialize());
      expect(actual[0].serialize()).to.deep.equal(orderOffer2.serialize());
    });
  });

  describe('save order_offer by metadata and nick', () => {
    it('should return order_offer object', async () => {
      await sut.saveOrderOfferByMetadataAndNick(orderOfferWithMetadata, nick);
    });
  });

  describe('find order_offers by metadata and nick', async () => {
    const actual = await sut.findOrderOffersByNickAndMetadata(
      nick,
      orderMetadataId,
    );

    await sut.deleteOrderOffer(tempOrderWithMetadataId);

    expect(actual.length).to.equal(1);
    expect(actual[0].serialize()).to.deep.equal(
      orderOfferWithMetadata.serialize(),
    );
  });

  describe('find order_offer by metadata and nick', async () => {
    const actual = await sut.findOrderOfferByNickAndMetadata(
      nick,
      orderMetadataId,
    );

    await sut.deleteOrderOffer(tempOrderWithMetadataId);

    expect(actual.serialize()).to.deep.equal(
      orderOfferWithMetadata.serialize(),
    );
  });

  describe('save order_accept', () => {
    it('should save order_accept', async () => {
      await sut.saveOrderOffer(orderOffer);
      await sut.saveOrderAccept(orderAccept);
    });
  });

  describe('find order_accept by tempOrderId', () => {
    it('should return the order_accept object', async () => {
      const actual = await sut.findOrderAccept(Buffer.from(tempOrderId, 'hex'));
      expect(actual.serialize()).to.deep.equal(orderAccept.serialize());
    });
  });

  describe('delete order_accept', () => {
    it('should delete order_accept', async () => {
      await sut.deleteOrderAccept(Buffer.from(tempOrderId, 'hex'));

      const actual = await sut.findOrderAccept(Buffer.from(tempOrderId, 'hex'));
      expect(actual).to.be.undefined;
    });
  });

  describe('save order_accept by nick', () => {
    it('should save order_accept', async () => {
      await sut.saveOrderAcceptByNick(orderAccept, nick);
      await sut.saveOrderAcceptByNick(orderAccept2, nick);
    });
  });

  describe('find order_accept by nick', () => {
    it('should return the order_accept object', async () => {
      const actual = await sut.findOrderAcceptsByNick(nick);

      await sut.deleteOrderAccept(Buffer.from(tempOrderId, 'hex'));
      await sut.deleteOrderAccept(Buffer.from(tempOrderId2, 'hex'));

      expect(actual.length).to.equal(2);
      expect(actual[0].serialize()).to.deep.equal(orderAccept.serialize());
      expect(actual[1].serialize()).to.deep.equal(orderAccept2.serialize());
    });
  });
});
