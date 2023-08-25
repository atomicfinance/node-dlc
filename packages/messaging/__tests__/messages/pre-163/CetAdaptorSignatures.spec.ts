import { expect } from 'chai';

import { CetAdaptorSignaturesV0Pre163 } from '../../../lib/messages/pre-163/CetAdaptorSignatures';

describe('CetAdaptorSignaturesV0Pre163', () => {
  let instance: CetAdaptorSignaturesV0Pre163;

  const type = Buffer.from('fda716', 'hex'); // MessageType.CetAdaptorSignaturesV0 = 42774,
  const length = Buffer.from('fd01e7', 'hex'); // 487 bytes
  const nb = Buffer.from('03', 'hex');

  const encryptedSigOne = Buffer.from(
    '005030c6b47800881605e2664820fe34507b5c27de3f21055494dadc6fc16ad26ef4009d6214467cd9bc75461b5bc401fb4f88f3ef6999788bb7c15abd2a6e6d0e',
    'hex',
  );

  const dleqProofOne = Buffer.from(
    '00a8df0ec2fd10fa25fd1b3c783744526d9159563ac8050046c871e0517974c234d8b3804d87f952363d23a38d037a2350eeb854bca721ffeced60bd2f4d3c322a28e679a28c0e25c98d52ab0dedbbc103639edf32f922c9d60bb0a399a10fec2a',
    'hex',
  );

  const encryptedSigTwo = Buffer.from(
    '00c1c9af6bac6f2e25ee91d918f82215a64452233362732d4b003204d3d4656f1b480d3274963308e7fe9b6d7bce87ceb92f1270bf954242d4a7b44c218093a741',
    'hex',
  );

  const dleqProofTwo = Buffer.from(
    '018d917c2e18d30840f8c0892192174459819699924c2f67b169b8a7ff44221760e0e69a6f3ee9bf531869fdec716b2863d48325d4aa41302eaed3b86b261d9380d77ae7cc5e1a9950b0b962d0f218802221b087f90e584a4d9b384fafa7a016c5',
    'hex',
  );

  const encryptedSigThree = Buffer.from(
    '0025b86e63b3bf4edfba24bfdc019832ea1be085700aa8358ff5b5e510414915f5a204ad05b8866c9d83ba396b91c8ff5461c80c6f091d576afdbe98971d885ca7',
    'hex',
  );

  const dleqProofThree = Buffer.from(
    '00437301b19548a3ed227301acb3a8ec791c2ff52035007077caa3ca9d012860d5329024c06aa12b1154be4298a659a294a45b257f0d3c282d9d7adbe0db7972cd5e141e5bdb3b6db5460b583cbc38a805a63cb1352b489000d2ec4cc43dc40e77',
    'hex',
  );

  const cetAdaptorSignaturesHex = Buffer.concat([
    type,
    length,
    nb,
    encryptedSigOne,
    dleqProofOne,
    encryptedSigTwo,
    dleqProofTwo,
    encryptedSigThree,
    dleqProofThree,
  ]);

  beforeEach(() => {
    instance = new CetAdaptorSignaturesV0Pre163();
    instance.sigs = [
      { encryptedSig: encryptedSigOne, dleqProof: dleqProofOne },
      { encryptedSig: encryptedSigTwo, dleqProof: dleqProofTwo },
      { encryptedSig: encryptedSigThree, dleqProof: dleqProofThree },
    ];
  });

  describe('serialize', () => {
    it('serializes', () => {
      expect(instance.serialize().toString('hex')).to.equal(
        cetAdaptorSignaturesHex.toString('hex'),
      );
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const instance = CetAdaptorSignaturesV0Pre163.deserialize(
        cetAdaptorSignaturesHex,
      );
      expect(instance.sigs[0].encryptedSig).to.deep.equal(encryptedSigOne);
      expect(instance.sigs[0].dleqProof).to.deep.equal(dleqProofOne);
      expect(instance.sigs[1].encryptedSig).to.deep.equal(encryptedSigTwo);
      expect(instance.sigs[1].dleqProof).to.deep.equal(dleqProofTwo);
      expect(instance.sigs[2].encryptedSig).to.deep.equal(encryptedSigThree);
      expect(instance.sigs[2].dleqProof).to.deep.equal(dleqProofThree);
    });
  });
});
