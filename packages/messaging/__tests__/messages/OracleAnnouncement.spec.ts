import { expect } from 'chai';

import { DigitDecompositionEventDescriptorV0Pre167 } from '../../lib/messages/pre-167/EventDescriptor';
import { OracleAnnouncementV0Pre167 } from '../../lib/messages/pre-167/OracleAnnouncement';
import { OracleEventV0Pre167 } from '../../lib/messages/pre-167/OracleEvent';

describe('OracleAnnouncement', () => {
  const announcementSig = Buffer.from(
    'fab22628f6e2602e1671c286a2f63a9246794008627a1749639217f4214cb4a9' +
      '494c93d1a852221080f44f697adb4355df59eb339f6ba0f9b01ba661a8b108d4',
    'hex',
  );

  const oraclePubkey = Buffer.from(
    'da078bbb1d34e7729e38e2ae34236e776da121af442626fa31e31ae55a279a0b',
    'hex',
  );

  const invalidOraclePubkey = Buffer.from(
    '5d1bcfab252c6dd9edd7aea4c5eeeef138f7ff7346061ea40143a9f5ae80baa9',
    'hex',
  );

  describe('serialize', () => {
    it('serializes', () => {
      const instance = new OracleAnnouncementV0Pre167();

      instance.length = BigInt(164);
      instance.announcementSig = announcementSig;
      instance.oraclePubkey = oraclePubkey;
      instance.oracleEvent = OracleEventV0Pre167.deserialize(
        Buffer.from(
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
            '64756d6d79', // event_id
          'hex',
        ),
      );

      expect(instance.serialize().toString("hex")).to.equal(
        "fdd824" + // type oracle_announcement
        "a4" + // length
        "fab22628f6e2602e1671c286a2f63a9246794008627a1749639217f4214cb4a9" + // announcement_signature_r
        "494c93d1a852221080f44f697adb4355df59eb339f6ba0f9b01ba661a8b108d4" + // announcement_signature_s
        "da078bbb1d34e7729e38e2ae34236e776da121af442626fa31e31ae55a279a0b" + // oracle_public_key
        "fdd822" + // type oracle_event
        "40" + // length
        "0001" + // nb_nonces
        "3cfba011378411b20a5ab773cb95daab93e9bcd1e4cce44986a7dda84e01841b" + // oracle_nonces
        "00000000" + // event_maturity_epoch
        "fdd806" + // type enum_event_descriptor
        "10" + // length
        "0002" + // num_outcomes
        "06" + // outcome_1_len
        "64756d6d7931" + // outcome_1
        "06" + // outcome_2_len
        "64756d6d7932" + // outcome_2
        "05" + // event_id_length
        "64756d6d79" // event_id
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const buf = Buffer.from(
        "fdd824" + // type oracle_announcement
        "a4" + // length
        "fab22628f6e2602e1671c286a2f63a9246794008627a1749639217f4214cb4a9" + // announcement_signature_r
        "494c93d1a852221080f44f697adb4355df59eb339f6ba0f9b01ba661a8b108d4" + // announcement_signature_s
        "da078bbb1d34e7729e38e2ae34236e776da121af442626fa31e31ae55a279a0b" + // oracle_public_key
        "fdd822" + // type oracle_event
        "40" + // length
        "0001" + // nb_nonces
        "3cfba011378411b20a5ab773cb95daab93e9bcd1e4cce44986a7dda84e01841b" + // oracle_nonces
        "00000000" + // event_maturity_epoch
        "fdd806" + // type enum_event_descriptor
        "10" + // length
        "0002" + // num_outcomes
        "06" + // outcome_1_len
        "64756d6d7931" + // outcome_1
        "06" + // outcome_2_len
        "64756d6d7932" + // outcome_2
        "05" + // event_id_length
        "64756d6d79" // event_id
        , "hex"
      ); // prettier-ignore

      const instance = OracleAnnouncementV0Pre167.deserialize(buf);

      expect(instance.length).to.deep.equal(BigInt(164));
      expect(instance.announcementSig).to.deep.equal(announcementSig);
      expect(instance.oraclePubkey).to.deep.equal(oraclePubkey);
      expect(instance.oracleEvent.serialize().toString('hex')).to.equal(
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
          '64756d6d79', // event_id
      );
    });
  });

  describe('validation', () => {
    it('should validate when correct signature', () => {
      const instance = new OracleAnnouncementV0Pre167();

      instance.length = BigInt(164);
      instance.announcementSig = announcementSig;
      instance.oraclePubkey = oraclePubkey;
      instance.oracleEvent = OracleEventV0Pre167.deserialize(
        Buffer.from(
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
            '64756d6d79', // event_id
          'hex',
        ),
      );

      expect(function () {
        instance.validate();
      }).to.not.throw(Error);
    });

    it('should invalidate when incorrect signature', () => {
      const instance = new OracleAnnouncementV0Pre167();

      instance.length = BigInt(164);
      instance.announcementSig = announcementSig;
      instance.oraclePubkey = invalidOraclePubkey;
      instance.oracleEvent = OracleEventV0Pre167.deserialize(
        Buffer.from(
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
            '64756d6d79', // event_id
          'hex',
        ),
      );

      expect(function () {
        instance.validate();
      }).to.throw(Error);
    });
  });

  /**
   * External Test Vectors
   * i.e. Suredbits Oracle: https://oracle.suredbits.com/event/1985a5e99a8c28a402b58c0c58cbf86bd66a0db850aafc7674f7226d5ce82fde
   * oracle_announcement_v0
   */
  describe('external test vectors', () => {
    const buf = Buffer.from(
      'fdd824fd02ab1efe41fa42ea1dcd103a0251929dd2b192d2daece8a4ce4d81f68a183b750d92d6f02d796965dc79adf4e7786e08f861a1ecc897afbba2dab9cff6eb0a81937eb8b005b07acf849ad2cec22107331dedbf5a607654fad4eafe39c278e27dde68fdd822fd02450011f9313f1edd903fab297d5350006b669506eb0ffda0bb58319b4df89ac24e14fd15f9791dc78d1596b06f4969bdb37d9e394dc9fedaa18d694027fa32b5ea2a5e60080c58e13727367c3a4ce1ad65dfb3c7e3ca1ea912b0299f6e383bab2875058aa96a1c74633130af6fbd008788de6ac9db76da4ecc7303383cc1a49f525316413850f7e3ac385019d560e84c5b3a3e9ae6c83f59fe4286ddfd23ea46d7ae04610a175cd28a9bf5f574e245c3dfe230dc4b0adf4daaea96780e594f6464f676505f4b74cfe3ffc33415a23de795bf939ce64c0c02033bbfc6c9ff26fb478943a1ece775f38f5db067ca4b2a9168b40792398def9164bfe5c46838472dc3c162af16c811b7a116e9417d5bccb9e5b8a5d7d26095aba993696188c3f85a02f7ab8d12ada171c352785eb63417228c7e248909fc2d673e1bb453140bf8bf429375819afb5e9556663b76ff09c2a7ba9779855ffddc6d360cb459cf8c42a2b949d0de19fe96163d336fd66a4ce2f1791110e679572a20036ffae50204ef520c01058ff4bef28218d1c0e362ee3694ad8b2ae83a51c86c4bc1630ed6202a158810096726f809fc828fafdcf053496affdf887ae8c54b6ca4323ccecf6a51121c4f0c60e790536dab41b221db1c6b35065dc19a9d31cf75901aa35eefecbb6fefd07296cda13cb34ce3b58eba20a0eb8f9614994ec7fee3cc290e30e6b1e3211ae1f3a85b6de6abdbb77d6d9ed33a1cee3bd5cd93a71f12c9c45e385d744ad0e7286660305100fdd80a11000200076274632f75736400000000001109425443205072696365',
      'hex',
    );

    const instance = OracleAnnouncementV0Pre167.deserialize(buf);

    it('deserializes', async () => {
      expect(Number(instance.length)).to.equal(683);
      expect(instance.announcementSig).to.deep.equal(
        Buffer.from(
          '1efe41fa42ea1dcd103a0251929dd2b192d2daece8a4ce4d81f68a183b750d92d6f02d796965dc79adf4e7786e08f861a1ecc897afbba2dab9cff6eb0a81937e',
          'hex',
        ),
      );
      expect(instance.oraclePubkey).to.deep.equal(
        Buffer.from(
          'b8b005b07acf849ad2cec22107331dedbf5a607654fad4eafe39c278e27dde68',
          'hex',
        ),
      );
      expect(instance.oracleEvent.oracleNonces[0]).to.deep.equal(
        Buffer.from(
          'f9313f1edd903fab297d5350006b669506eb0ffda0bb58319b4df89ac24e14fd',
          'hex',
        ),
      );
      expect(instance.oracleEvent.eventMaturityEpoch).to.equal(1613779200);
      expect(
        (instance.oracleEvent
          .eventDescriptor as DigitDecompositionEventDescriptorV0Pre167).unit,
      ).to.equal('btc/usd');
    });

    it('should succeed validation', () => {
      expect(function () {
        instance.validate();
      }).to.not.throw(Error);
    });
  });
});
