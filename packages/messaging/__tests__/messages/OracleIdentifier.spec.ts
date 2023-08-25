import { expect } from 'chai';

import { OracleIdentifierV0 } from '../../lib/messages/OracleIdentifier';
import { OracleIdentifierV0Pre163 } from '../../lib/messages/pre-163/OracleIdentifier';

describe('OracleIdentifier', () => {
  const oraclePubkey = Buffer.from(
    '5d1bcfab252c6dd9edd7aea4c5eeeef138f7ff7346061ea40143a9f5ae80baa9',
    'hex',
  );

  const oracleName = 'atomic';

  describe('serialize', () => {
    it('serializes', () => {
      const instance = new OracleIdentifierV0();

      instance.oracleName = oracleName;
      instance.oraclePubkey = oraclePubkey;

      expect(instance.serialize().toString("hex")).to.equal(
        "fdf020" + // type oracle_identifier
        "06" + // oracle_name length
        "61746f6d6963" + // oracle_name
        "5d1bcfab252c6dd9edd7aea4c5eeeef138f7ff7346061ea40143a9f5ae80baa9" // oracle_pubkey
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const buf = Buffer.from(
        "fdf020" + // type oracle_identifier
        "06" + // oracle_name length
        "61746f6d6963" + // oracle_name
        "5d1bcfab252c6dd9edd7aea4c5eeeef138f7ff7346061ea40143a9f5ae80baa9" // oracle_pubkey
        , "hex"
      ); // prettier-ignore

      const instance = OracleIdentifierV0.deserialize(buf);

      expect(instance.oracleName).to.equal(oracleName);
      expect(instance.oraclePubkey).to.deep.equal(oraclePubkey);
    });
  });

  describe('toPre163', () => {
    const instance = new OracleIdentifierV0();

    before(() => {
      instance.oracleName = oracleName;
      instance.oraclePubkey = oraclePubkey;
    });

    it('returns pre-163 instance', () => {
      const pre163 = OracleIdentifierV0.toPre163(instance);
      expect(pre163).to.be.instanceof(OracleIdentifierV0Pre163);
      expect(pre163.oracleName).to.equal(instance.oracleName);
      expect(pre163.oraclePubkey).to.equal(instance.oraclePubkey);
    });
  });

  describe('fromPre163', () => {
    const pre163 = new OracleIdentifierV0Pre163();

    before(() => {
      pre163.oracleName = oracleName;
      pre163.oraclePubkey = oraclePubkey;
    });

    it('returns post-163 instance', () => {
      const post163 = OracleIdentifierV0.fromPre163(pre163);
      expect(post163).to.be.instanceof(OracleIdentifierV0);
      expect(post163.oracleName).to.equal(pre163.oracleName);
      expect(post163.oraclePubkey).to.equal(pre163.oraclePubkey);
    });
  });
});
