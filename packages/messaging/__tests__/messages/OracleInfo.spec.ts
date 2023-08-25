import { expect } from 'chai';

import { SingleOracleInfo } from '../../lib/messages/OracleInfo';
import { OracleInfoV0Pre163 } from '../../lib/messages/pre-163/OracleInfo';
import { EnumEventDescriptorV0Pre167 } from '../../lib/messages/pre-167/EventDescriptor';
import { OracleAnnouncementV0Pre167 } from '../../lib/messages/pre-167/OracleAnnouncement';
import { OracleEventV0Pre167 } from '../../lib/messages/pre-167/OracleEvent';

describe('OracleInfo', () => {
  const oracleAnnouncementHex =
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
    '64756d6d79'; // event_id

  describe('serialize', () => {
    it('serializes', () => {
      const instance = new SingleOracleInfo();

      instance.announcement = OracleAnnouncementV0Pre167.deserialize(
        Buffer.from(oracleAnnouncementHex, 'hex'),
      );

      expect(instance.serialize().toString('hex')).to.equal(
        '00' + // type oracle_info
          oracleAnnouncementHex,
      );
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const buf = Buffer.from(
        '00' + // type oracle_info
          oracleAnnouncementHex,
        'hex',
      );

      const instance = SingleOracleInfo.deserialize(buf);

      expect(instance.announcement.serialize().toString('hex')).to.equal(
        oracleAnnouncementHex,
      );
    });
  });

  describe('toPre163', () => {
    const instance = new SingleOracleInfo();

    before(() => {
      instance.announcement = OracleAnnouncementV0Pre167.deserialize(
        Buffer.from(oracleAnnouncementHex, 'hex'),
      );
    });

    it('returns pre-163 instance', () => {
      const pre163 = SingleOracleInfo.toPre163(instance);
      expect(pre163).to.be.instanceof(OracleInfoV0Pre163);
      expect(pre163.announcement).to.be.instanceof(OracleAnnouncementV0Pre167);
      expect(pre163.announcement.announcementSig).to.equal(
        instance.announcement.announcementSig,
      );
      expect(pre163.announcement.oraclePubkey).to.equal(
        instance.announcement.oraclePubkey,
      );
      expect(pre163.announcement.oracleEvent).to.be.instanceof(
        OracleEventV0Pre167,
      );
      expect(pre163.announcement.oracleEvent.oracleNonces.length).to.equal(
        instance.announcement.oracleEvent.oracleNonces.length,
      );
      for (
        let i = 0;
        i < pre163.announcement.oracleEvent.oracleNonces.length;
        i++
      ) {
        expect(pre163.announcement.oracleEvent.oracleNonces[i]).to.equal(
          instance.announcement.oracleEvent.oracleNonces[i],
        );
      }
      expect(pre163.announcement.oracleEvent.eventMaturityEpoch).to.equal(
        instance.announcement.oracleEvent.eventMaturityEpoch,
      );
      expect(pre163.announcement.oracleEvent.eventDescriptor).to.be.instanceof(
        EnumEventDescriptorV0Pre167,
      );
      expect(
        (pre163.announcement.oracleEvent
          .eventDescriptor as EnumEventDescriptorV0Pre167).outcomes.length,
      ).to.equal(
        (instance.announcement.oracleEvent
          .eventDescriptor as EnumEventDescriptorV0Pre167).outcomes.length,
      );
      for (
        let i = 0;
        i <
        (pre163.announcement.oracleEvent
          .eventDescriptor as EnumEventDescriptorV0Pre167).outcomes.length;
        i++
      ) {
        expect(
          (pre163.announcement.oracleEvent
            .eventDescriptor as EnumEventDescriptorV0Pre167).outcomes[i],
        ).to.equal(
          (instance.announcement.oracleEvent
            .eventDescriptor as EnumEventDescriptorV0Pre167).outcomes[i],
        );
      }
      expect(pre163.announcement.oracleEvent.eventId).to.equal(
        instance.announcement.oracleEvent.eventId,
      );
    });
  });

  describe('fromPre163', () => {
    const pre163 = new OracleInfoV0Pre163();

    before(() => {
      pre163.announcement = OracleAnnouncementV0Pre167.deserialize(
        Buffer.from(oracleAnnouncementHex, 'hex'),
      );
    });

    it('returns post-163 instance', () => {
      const post163 = SingleOracleInfo.fromPre163(pre163);
      expect(post163).to.be.instanceof(SingleOracleInfo);
      expect(post163.announcement).to.be.instanceof(OracleAnnouncementV0Pre167);
      expect(post163.announcement.announcementSig).to.equal(
        pre163.announcement.announcementSig,
      );
      expect(post163.announcement.oraclePubkey).to.equal(
        pre163.announcement.oraclePubkey,
      );
      expect(post163.announcement.oracleEvent).to.be.instanceof(
        OracleEventV0Pre167,
      );
      expect(post163.announcement.oracleEvent.oracleNonces.length).to.equal(
        pre163.announcement.oracleEvent.oracleNonces.length,
      );
      for (
        let i = 0;
        i < post163.announcement.oracleEvent.oracleNonces.length;
        i++
      ) {
        expect(post163.announcement.oracleEvent.oracleNonces[i]).to.equal(
          pre163.announcement.oracleEvent.oracleNonces[i],
        );
      }
      expect(post163.announcement.oracleEvent.eventMaturityEpoch).to.equal(
        pre163.announcement.oracleEvent.eventMaturityEpoch,
      );
      expect(post163.announcement.oracleEvent.eventDescriptor).to.be.instanceof(
        EnumEventDescriptorV0Pre167,
      );
      expect(
        (post163.announcement.oracleEvent
          .eventDescriptor as EnumEventDescriptorV0Pre167).outcomes.length,
      ).to.equal(
        (pre163.announcement.oracleEvent
          .eventDescriptor as EnumEventDescriptorV0Pre167).outcomes.length,
      );
      for (
        let i = 0;
        i <
        (post163.announcement.oracleEvent
          .eventDescriptor as EnumEventDescriptorV0Pre167).outcomes.length;
        i++
      ) {
        expect(
          (post163.announcement.oracleEvent
            .eventDescriptor as EnumEventDescriptorV0Pre167).outcomes[i],
        ).to.equal(
          (pre163.announcement.oracleEvent
            .eventDescriptor as EnumEventDescriptorV0Pre167).outcomes[i],
        );
      }
      expect(post163.announcement.oracleEvent.eventId).to.equal(
        pre163.announcement.oracleEvent.eventId,
      );
    });
  });
});
