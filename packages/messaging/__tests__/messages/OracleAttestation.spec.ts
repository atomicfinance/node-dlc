import { expect } from 'chai';

import { OracleAttestationV0Pre167 } from '../../lib/messages/pre-167/OracleAttestation';

describe('OracleAttestation', () => {
  const attestationSig = Buffer.from(
    '424c11a44c2e522f90bbe4abab6ec1bc8ab44c9b29316ce6e1d0d7d08385a474' +
      'de6b75f1da183a2a4f9ad144b48bf1026cee9687221df58f04128db79ca17e2a',
    'hex',
  );

  const oraclePubkey = Buffer.from(
    '1d5dcdba2e64cb116cc0c375a0856298f0058b778f46bfe625ac6576204889e4',
    'hex',
  );

  const invalidOraclePubkey = Buffer.from(
    '5d1bcfab252c6dd9edd7aea4c5eeeef138f7ff7346061ea40143a9f5ae80baa9',
    'hex',
  );

  describe('serialize', () => {
    it('serializes', () => {
      const instance = new OracleAttestationV0Pre167();

      instance.length = BigInt(127);
      instance.eventId = 'BTC-USD-OVER-50K-COINBASE';
      instance.oraclePubkey = oraclePubkey;
      instance.signatures.push(attestationSig);
      instance.outcomes.push('NO');

      expect(instance.serialize().toString("hex")).to.equal(
        'fdd868' + // type oracle_attestation_v0
        '7f' + // length
        '19' + // event_id_len
        '4254432d5553442d4f5645522d35304b2d434f494e42415345' + // event_id
        '1d5dcdba2e64cb116cc0c375a0856298f0058b778f46bfe625ac6576204889e4' + // pubkey
        '0001' + // nb_signatures
        '424c11a44c2e522f90bbe4abab6ec1bc8ab44c9b29316ce6e1d0d7d08385a474' + // signature_r
        'de6b75f1da183a2a4f9ad144b48bf1026cee9687221df58f04128db79ca17e2a' + // signature_s
        '02' + // outcome_len
        '4e4f' // outcome
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const buf = Buffer.from(
        'fdd868' + // type oracle_attestation_v0
        '7f' + // length
        '19' + // event_id_len
        '4254432d5553442d4f5645522d35304b2d434f494e42415345' + // event_id
        '1d5dcdba2e64cb116cc0c375a0856298f0058b778f46bfe625ac6576204889e4' + // pubkey
        '0001' + // nb_signatures
        '424c11a44c2e522f90bbe4abab6ec1bc8ab44c9b29316ce6e1d0d7d08385a474' + // signature_r
        'de6b75f1da183a2a4f9ad144b48bf1026cee9687221df58f04128db79ca17e2a' + // signature_s
        '02' + // outcome_len
        '4e4f' // outcome
        , "hex"
      ); // prettier-ignore

      const instance = OracleAttestationV0Pre167.deserialize(buf);

      expect(instance.length).to.equal(BigInt(127));
      expect(instance.eventId).to.equal('BTC-USD-OVER-50K-COINBASE');
      expect(instance.oraclePubkey).to.deep.equal(oraclePubkey);
      expect(instance.signatures[0]).to.deep.equal(attestationSig);
      expect(instance.outcomes[0]).to.equal('NO');
    });
  });

  describe('validate', () => {
    it('should validate when correct outcome signatures', () => {
      const instance = new OracleAttestationV0Pre167();

      instance.length = BigInt(127);
      instance.eventId = 'BTC-USD-OVER-50K-COINBASE';
      instance.oraclePubkey = oraclePubkey;
      instance.signatures.push(attestationSig);
      instance.outcomes.push('NO');

      expect(function () {
        instance.validate();
      }).to.not.throw(Error);
    });

    it('should invalidate when incorrect outcome signatures', () => {
      const instance = new OracleAttestationV0Pre167();

      instance.length = BigInt(127);
      instance.eventId = 'BTC-USD-OVER-50K-COINBASE';
      instance.oraclePubkey = invalidOraclePubkey;
      instance.signatures.push(attestationSig);
      instance.outcomes.push('NO');

      expect(function () {
        instance.validate();
      }).to.throw(Error);
    });
  });
});
