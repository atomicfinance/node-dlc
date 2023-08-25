import { OrderAcceptV0, OrderOfferV0 } from '@node-dlc/messaging';
import { ECPair } from 'bitcoinjs-lib';
import chai from 'chai';
import sinonChai from 'sinon-chai';

import { ChannelType } from '../../lib/irc/ChannelType';
import { IrcOrderManager } from '../../lib/irc/IrcOrderManager';
import { IrcServers } from '../../lib/irc/Servers';
import { sleep } from '../util';
import { createFakeLogger } from './helpers';

chai.should();
chai.use(sinonChai);
const expect = chai.expect;

describe('IrcOrderManager', () => {
  let sut: IrcOrderManager;
  let bob: IrcOrderManager;

  const orderOffer = OrderOfferV0.deserialize(
    Buffer.from(
      'f532' + // type
        '00000001' + // protocol version
        '00' + // contract flags
        '06226e46111a0b59caaf126043eb5bbf28c34f3a5e332a1fc7b2b73cf188910f' + // chain_hash
        '00' + // type contract_info
        '000000000bebc200' + // total_collateral
        '00' + // type contract_descriptor
        '03' + // num_outcomes
        '40' + // outcome_1_len
        '63356137616666643531393031626337613531383239623332306435383864633761663061643166336435366632306131643363363063396261376336373232' + // outcome_1 (utf-8 encoded)
        '0000000000000000' + // payout_1
        '40' + // outcome_2_len
        '61646631633233666265656436363131656661356361613065396564346334343063343530613138626330313061366338363765303538373361633038656164' + // outcome_2 (utf-8 encoded)
        '00000000092363a3' + // payout_2
        '40' + // outcome_3_len
        '36393232323530353532616436626231306162336464643639383162353330616139613666643035373235626638356235396533653531313633393035323838' + // outcome_3 (utf-8 encoded)
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
    ),
  );

  const orderAccept = OrderAcceptV0.deserialize(
    Buffer.from(
      'f534' + // type order_accept_v0
        '00000001' + // protocol_version
        '4a74dfc6da77550e2971eba10a9a1eef9253b000c00d96f5c6589ebef1c84b7b' + // arbitrary temp_order_id
        '00', // has_negotiation_fields
      'hex',
    ),
  );

  beforeEach(async () => {
    const keyPair1 = ECPair.makeRandom();
    const keyPair2 = ECPair.makeRandom();

    sut = new IrcOrderManager(
      createFakeLogger(),
      keyPair1.privateKey,
      [IrcServers.primary_server.host],
      false,
      ChannelType.TestMarketPit,
    );
    bob = new IrcOrderManager(
      createFakeLogger(),
      keyPair2.privateKey,
      [IrcServers.primary_server.host],
      false,
      ChannelType.TestMarketPit,
    );

    sut.start();
    bob.start();

    while (!sut.started) {
      await sleep(50);
    }
  });

  afterEach(() => {
    sut.stop();
    bob.stop();
  });

  describe('send orders', () => {
    it('should default to trading pit channel for order offer', (done) => {
      bob.on('orderoffermessage', (from, to, msg) => {
        const actualMsg = Buffer.from(msg, 'hex');
        const actualOrderOffer = OrderOfferV0.deserialize(actualMsg);
        expect(actualOrderOffer.serialize()).to.deep.equal(
          orderOffer.serialize(),
        );
        expect(from).to.equal(sut.nick);
        expect(to).to.equal(ChannelType.TestMarketPit);

        bob.removeAllListeners();

        done();
      });

      sut.send(orderOffer);
    });

    it('should correctly send msgs privately', (done) => {
      sut.on('orderoffermessage', (from, to, msg) => {
        const actualMsg = Buffer.from(msg, 'hex');
        const actualOrderOffer = OrderOfferV0.deserialize(actualMsg);
        expect(actualOrderOffer.serialize()).to.deep.equal(
          orderOffer.serialize(),
        );
        expect(from).to.equal(bob.nick);
        expect(to).to.equal(ChannelType.TestMarketPit);

        sut.removeAllListeners();
        sut.say(orderAccept.serialize(), bob.nick);
      });

      bob.on('orderacceptmessage', (from, to, msg) => {
        const actualMsg = Buffer.from(msg, 'hex');
        const actualOrderAccept = OrderAcceptV0.deserialize(actualMsg);
        expect(actualOrderAccept.serialize()).to.deep.equal(
          orderAccept.serialize(),
        );
        expect(from).to.equal(sut.nick);
        expect(to).to.equal(bob.nick);

        bob.removeAllListeners();

        done();
      });

      bob.send(orderOffer);
    });
  });
});
