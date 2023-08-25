import { expect } from 'chai';

import { OracleAnnouncementV0Pre167 } from '../../lib/messages/pre-167/OracleAnnouncement';
import { OracleAttestationV0Pre167 } from '../../lib/messages/pre-167/OracleAttestation';
import { OracleEventContainerV0Pre167 } from '../../lib/messages/pre-167/OracleEventContainer';

describe('OracleEventContainer', () => {
  describe('serialize', () => {
    it('serializes', () => {
      const instance = new OracleEventContainerV0Pre167();

      instance.length = BigInt(313);
      instance.oracleName = 'Atomic';
      instance.uri = '';
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
      instance.attestation = OracleAttestationV0Pre167.deserialize(
        Buffer.from(
          'fdd868' + // type oracle_attestation_v0
            '7f' + // length
            '19' + // event_id_len
            '4254432d5553442d4f5645522d35304b2d434f494e42415345' + // event_id
            '1d5dcdba2e64cb116cc0c375a0856298f0058b778f46bfe625ac6576204889e4' + // pubkey
            '0001' + // nb_signatures
            '424c11a44c2e522f90bbe4abab6ec1bc8ab44c9b29316ce6e1d0d7d08385a474' + // signature_r
            'de6b75f1da183a2a4f9ad144b48bf1026cee9687221df58f04128db79ca17e2a' + // signature_s
            '02' + // outcome_len
            '4e4f', // outcome
          'hex',
        ),
      );
      instance.outcome = '45354';

      expect(instance.serialize().toString("hex")).to.equal(
        'fdf0c0' + // type oracle_event_container
        'fd0139' + // length
        '0641746f6d6963' + // oracle_name
        '00' + // uri
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
        'fdd868' + // type oracle_attestation_v0
          '7f' + // length
          '19' + // event_id_len
          '4254432d5553442d4f5645522d35304b2d434f494e42415345' + // event_id
          '1d5dcdba2e64cb116cc0c375a0856298f0058b778f46bfe625ac6576204889e4' + // pubkey
          '0001' + // nb_signatures
          '424c11a44c2e522f90bbe4abab6ec1bc8ab44c9b29316ce6e1d0d7d08385a474' + // signature_r
          'de6b75f1da183a2a4f9ad144b48bf1026cee9687221df58f04128db79ca17e2a' + // signature_s
          '02' + // outcome_len
          '4e4f' + // outcome
        '053435333534', // outcome
        'hex'
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const buf = Buffer.from(
        'fdf0c0' + // type oracle_event_container
        'fd0139' + // length
        '0641746f6d6963' + // oracle_name
        '00' + // uri
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
        'fdd868' + // type oracle_attestation_v0
          '7f' + // length
          '19' + // event_id_len
          '4254432d5553442d4f5645522d35304b2d434f494e42415345' + // event_id
          '1d5dcdba2e64cb116cc0c375a0856298f0058b778f46bfe625ac6576204889e4' + // pubkey
          '0001' + // nb_signatures
          '424c11a44c2e522f90bbe4abab6ec1bc8ab44c9b29316ce6e1d0d7d08385a474' + // signature_r
          'de6b75f1da183a2a4f9ad144b48bf1026cee9687221df58f04128db79ca17e2a' + // signature_s
          '02' + // outcome_len
          '4e4f' + // outcome
        '053435333534', // outcome
        'hex'
      ); // prettier-ignore

      const instance = OracleEventContainerV0Pre167.deserialize(buf);

      expect(instance.length).to.deep.equal(BigInt(313));
      expect(instance.oracleName).to.equal('Atomic');
      expect(instance.uri).to.equal('');
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
      expect(instance.attestation.serialize().toString('hex')).to.equal(
        'fdd868' + // type oracle_attestation_v0
          '7f' + // length
          '19' + // event_id_len
          '4254432d5553442d4f5645522d35304b2d434f494e42415345' + // event_id
          '1d5dcdba2e64cb116cc0c375a0856298f0058b778f46bfe625ac6576204889e4' + // pubkey
          '0001' + // nb_signatures
          '424c11a44c2e522f90bbe4abab6ec1bc8ab44c9b29316ce6e1d0d7d08385a474' + // signature_r
          'de6b75f1da183a2a4f9ad144b48bf1026cee9687221df58f04128db79ca17e2a' + // signature_s
          '02' + // outcome_len
          '4e4f', // outcome
      );
      expect(instance.outcome).to.equal('45354');
    });
  });
});
