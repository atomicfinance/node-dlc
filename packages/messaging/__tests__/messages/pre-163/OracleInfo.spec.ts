import { expect } from 'chai';

import { OracleInfoV0Pre163 } from '../../../lib/messages/pre-163/OracleInfo';
import { OracleAnnouncementV0Pre167 } from '../../../lib/messages/pre-167/OracleAnnouncement';

describe('OracleInfoV0Pre163', () => {
  describe('serialize', () => {
    it('serializes', () => {
      const instance = new OracleInfoV0Pre163();

      instance.length = BigInt(168);
      instance.announcement = OracleAnnouncementV0Pre167.deserialize(
        Buffer.from(
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
            '64756d6d79', // event_id
          'hex',
        ),
      );

      expect(instance.serialize().toString("hex")).to.equal(
        "fda712" + // type oracle_info
        "a8" + // length
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
        "fda712" + // type oracle_info
        "a8" + // length
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

      const instance = OracleInfoV0Pre163.deserialize(buf);

      expect(instance.length).to.deep.equal(BigInt(168));
      expect(instance.announcement.serialize().toString('hex')).to.equal(
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
          '64756d6d79', // event_id
      );
    });
  });
});
