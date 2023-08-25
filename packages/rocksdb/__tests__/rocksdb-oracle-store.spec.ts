// tslint:disable: no-unused-expression

import {
  DlcIdsV0,
  OracleEventContainerV0Pre167,
  OracleIdentifierV0,
} from '@node-dlc/messaging';
import { sha256 } from '@node-lightning/crypto';
import { expect } from 'chai';

import { RocksdbOracleStore } from '../lib/rocksdb-oracle-store';
import * as util from './rocksdb';

describe('RocksdbOracleStore', () => {
  let sut: RocksdbOracleStore;

  const oracleEventContainerHex = Buffer.from(
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

  const oracleEventContainer = OracleEventContainerV0Pre167.deserialize(
    oracleEventContainerHex,
  );

  const nonces = [
    Buffer.from(
      '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
      'hex',
    ),
    Buffer.from(
      'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
      'hex',
    ),
    Buffer.from(
      '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
      'hex',
    ),
    Buffer.from(
      '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      'hex',
    ),
    Buffer.from(
      'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
      'hex',
    ),
    Buffer.from(
      'e7f6c011776e8db7cd330b54174fd76f7d0216b612387a5ffcfb81e6f0919683',
      'hex',
    ),
    Buffer.from(
      '7902699be42c8a8e46fbbb4501726517e86b22c56a189f7625a6da49081b2451',
      'hex',
    ),
    Buffer.from(
      '2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3',
      'hex',
    ),
    Buffer.from(
      '19581e27de7ced00ff1ce50b2047e7a567c76b1cbaebabe5ef03f7c3017bb5b7',
      'hex',
    ),
    Buffer.from(
      'c555eab45d08845ae9f10d452a99bfcb06f74a50b988fe7e48dd323789b88ee3',
      'hex',
    ),
    Buffer.from(
      '4a64a107f0cb32536e5bce6c98c393db21cca7f4ea187ba8c4dca8b51d4ea80a',
      'hex',
    ),
    Buffer.from(
      'f299791cddd3d6664f6670842812ef6053eb6501bd6282a476bbbf3ee91e750c',
      'hex',
    ),
    Buffer.from(
      'ab897fbdedfa502b2d839b6a56100887dccdc507555c282e59589e06300a62e2',
      'hex',
    ),
    Buffer.from(
      '83891d7fe85c33e52c8b4e5814c92fb6a3b9467299200538a6babaa8b452d879',
      'hex',
    ),
    Buffer.from(
      '2f0fd1e89b8de1d57292742ec380ea47066e307ad645f5bc3adad8a06ff58608',
      'hex',
    ),
    Buffer.from(
      '7cb7c4547cf2653590d7a9ace60cc623d25148adfbc88a89aeb0ef88da7839ba',
      'hex',
    ),
    Buffer.from(
      '8f11b05da785e43e713d03774c6bd3405d99cd3024af334ffd68db663aa37034',
      'hex',
    ),
    Buffer.from(
      '452ba1ddef80246c48be7690193c76c1d61185906be9401014fe14f1be64b74f',
      'hex',
    ),
    Buffer.from(
      '68aa2e2ee5dff96e3355e6c7ee373e3d6a4e17f75f9518d843709c0c9bc3e3d4',
      'hex',
    ),
    Buffer.from(
      '36a9e7f1c95b82ffb99743e0c5c4ce95d83c9a430aac59f84ef3cbfab6145068',
      'hex',
    ),
  ];

  const oracleNonces = new DlcIdsV0();
  oracleNonces.ids = nonces;

  const announcementId = Buffer.from(
    '00b42522474be83e9863fc6fe287d3e9598260aef0f8b8c65b30a93cfd5f2602',
    'hex',
  );

  const oraclePubkey = Buffer.from(
    '5d1bcfab252c6dd9edd7aea4c5eeeef138f7ff7346061ea40143a9f5ae80baa9',
    'hex',
  );

  const oracleName = 'atomic';

  const oracleIdentifier = new OracleIdentifierV0();
  oracleIdentifier.oracleName = oracleName;
  oracleIdentifier.oraclePubkey = oraclePubkey;

  before(async () => {
    util.rmdir('.testdb');
    sut = new RocksdbOracleStore('./.testdb/nested/dir');
    await sut.open();
  });

  after(async () => {
    await sut.close();
    util.rmdir('.testdb');
  });

  describe('save oracle_event_container', () => {
    it('should save order_offer', async () => {
      await sut.saveOracleEventContainer(oracleEventContainer);
    });
  });

  describe('find oracle_event_container', () => {
    it('should return the order_offer object', async () => {
      const announcementId = sha256(
        oracleEventContainer.announcement.serialize(),
      );
      const actual = await sut.findOracleEventContainer(announcementId);

      expect(actual.serialize()).to.deep.equal(
        oracleEventContainer.serialize(),
      );
    });
  });

  describe('delete oracle_event_container', () => {
    it('should delete order_offer', async () => {
      const announcementId = sha256(
        oracleEventContainer.announcement.serialize(),
      );

      await sut.deleteOracleEventContainer(announcementId);

      const actual = await sut.findOracleEventContainer(announcementId);
      expect(actual).to.be.undefined;
    });
  });

  describe('save nonces', () => {
    it('should save nonces', async () => {
      await sut.saveNonces(oracleNonces, announcementId);
    });
  });

  describe('find nonces', () => {
    it('should return the nonces object', async () => {
      const actual = await sut.findNonces(announcementId);

      expect(actual.serialize()).to.deep.equal(oracleNonces.serialize());
    });
  });

  describe('delete nonces', () => {
    it('should delete nonces', async () => {
      await sut.deleteNonces(announcementId);

      const actual = await sut.findNonces(announcementId);
      expect(actual).to.be.undefined;
    });
  });

  describe('save oracle identifier', () => {
    it('should save oracle identifier', async () => {
      await sut.saveOracleIdentifier(oracleIdentifier);
    });
  });

  describe('find oracle identifier', () => {
    it('should return the oracle identifier object', async () => {
      const actual = await sut.findOracleIdentifier(oraclePubkey);

      expect(actual.serialize()).to.deep.equal(oracleIdentifier.serialize());
    });
  });

  describe('delete oracle identifier', () => {
    it('should delete oracle identifier', async () => {
      await sut.deleteOracleIdentifier(oraclePubkey);

      const actual = await sut.findOracleIdentifier(oraclePubkey);
      expect(actual).to.be.undefined;
    });
  });
});
