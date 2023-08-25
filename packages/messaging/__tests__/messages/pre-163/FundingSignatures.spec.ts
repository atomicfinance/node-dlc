import { expect } from 'chai';

import { FundingSignaturesV0Pre163 } from '../../../lib/messages/pre-163/FundingSignatures';
import { ScriptWitnessV0Pre163 } from '../../../lib/messages/pre-163/ScriptWitness';

describe('FundingSignaturesV0Pre163', () => {
  let instance: FundingSignaturesV0Pre163;

  const firstWitness =
    '304402203812d7d194d44ec68f244cc3fd68507c563ec8c729fdfa3f4a79395b98abe84f0220704ab3f3ffd9c50c2488e59f90a90465fccc2d924d67a1e98a133676bf52f37201';
  const firstWitnessElement =
    '0047' + // witness_element_len
    firstWitness;

  const secondWitness =
    '02dde41aa1f21671a2e28ad92155d2d66e0b5428de15d18db4cbcf216bf00de919';
  const secondWitnessElement =
    '0021' + // witness_element_len
    secondWitness;
  const fundingSignaturesHex = Buffer.from(
    'fda718' + // type funding_signatures_v0
      '70' + // length
      '0001' + // num_witnesses
      '0002' + // num_witness_elements
      firstWitnessElement +
      secondWitnessElement,
    'hex',
  );

  beforeEach(() => {
    instance = new FundingSignaturesV0Pre163();

    instance.length = BigInt(112);

    instance.witnessElements = [
      [
        ScriptWitnessV0Pre163.deserialize(
          Buffer.from(firstWitnessElement, 'hex'),
        ),
        ScriptWitnessV0Pre163.deserialize(
          Buffer.from(secondWitnessElement, 'hex'),
        ),
      ],
    ];
  });

  describe('serialize', () => {
    it('serializes', () => {
      expect(instance.serialize().toString('hex')).to.equal(
        fundingSignaturesHex.toString('hex'),
      );
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const instance = FundingSignaturesV0Pre163.deserialize(
        fundingSignaturesHex,
      );
      expect(Number(instance.length)).to.equal(112);
      expect(instance.witnessElements.length).to.equal(1);
      expect(instance.witnessElements[0][0].length).to.equal(71);
      expect(instance.witnessElements[0][0].witness.toString('hex')).to.equal(
        firstWitness,
      );
      expect(instance.witnessElements[0][1].length).to.equal(33);
      expect(instance.witnessElements[0][1].witness.toString('hex')).to.equal(
        secondWitness,
      );
    });
  });
});
