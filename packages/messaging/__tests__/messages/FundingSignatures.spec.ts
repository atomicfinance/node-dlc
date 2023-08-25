import { expect } from 'chai';

import { FundingSignatures } from '../../lib/messages/FundingSignatures';
import { FundingSignaturesV0Pre163 } from '../../lib/messages/pre-163/FundingSignatures';
import { ScriptWitnessV0Pre163 } from '../../lib/messages/pre-163/ScriptWitness';
import { ScriptWitness } from '../../lib/messages/ScriptWitness';

describe('FundingSignatures', () => {
  let instance: FundingSignatures;

  const firstWitness =
    '304402203812d7d194d44ec68f244cc3fd68507c563ec8c729fdfa3f4a79395b98abe84f0220704ab3f3ffd9c50c2488e59f90a90465fccc2d924d67a1e98a133676bf52f37201';
  const firstWitnessElement =
    '47' + // witness_element_len
    firstWitness;
  const secondWitness =
    '02dde41aa1f21671a2e28ad92155d2d66e0b5428de15d18db4cbcf216bf00de919';
  const secondWitnessElement =
    '21' + // witness_element_len
    secondWitness;
  const fundingSignaturesHex = Buffer.from(
    '01' + // num_witnesses
      '02' + // num_witness_elements
      firstWitnessElement +
      secondWitnessElement,
    'hex',
  );

  beforeEach(() => {
    instance = new FundingSignatures();

    instance.witnessElements = [
      [
        ScriptWitness.deserialize(Buffer.from(firstWitnessElement, 'hex')),
        ScriptWitness.deserialize(Buffer.from(secondWitnessElement, 'hex')),
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
      const instance = FundingSignatures.deserialize(fundingSignaturesHex);
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

  describe('toPre163', () => {
    it('returns pre-163 instance', () => {
      const pre163 = FundingSignatures.toPre163(instance);
      expect(pre163).to.be.instanceof(FundingSignaturesV0Pre163);
      expect(pre163.witnessElements.length).to.equal(
        instance.witnessElements.length,
      );
      for (let i = 0; i < pre163.witnessElements.length; i++) {
        expect(pre163.witnessElements[i].length).to.equal(
          instance.witnessElements[i].length,
        );
        for (let j = 0; j < pre163.witnessElements[i].length; j++) {
          expect(pre163.witnessElements[i][j]).to.be.instanceof(
            ScriptWitnessV0Pre163,
          );
          expect(pre163.witnessElements[i][j]).to.deep.equal(
            instance.witnessElements[i][j],
          );
        }
      }
    });
  });

  describe('fromPre163', () => {
    const firstWitnessElementPre163 =
      '0047' + // witness_element_len
      firstWitness;

    const secondWitnessElementPre163 =
      '0021' + // witness_element_len
      secondWitness;
    const pre163 = new FundingSignaturesV0Pre163();

    before(() => {
      pre163.witnessElements = [
        [
          ScriptWitnessV0Pre163.deserialize(
            Buffer.from(firstWitnessElementPre163, 'hex'),
          ),
          ScriptWitnessV0Pre163.deserialize(
            Buffer.from(secondWitnessElementPre163, 'hex'),
          ),
        ],
      ];
    });

    it('returns post-163 instance', () => {
      const post163 = FundingSignatures.fromPre163(pre163);
      expect(post163).to.be.instanceof(FundingSignatures);
      expect(post163.witnessElements.length).to.equal(
        pre163.witnessElements.length,
      );
      for (let i = 0; i < post163.witnessElements.length; i++) {
        expect(post163.witnessElements[i].length).to.equal(
          pre163.witnessElements[i].length,
        );
        for (let j = 0; j < post163.witnessElements[i].length; j++) {
          expect(post163.witnessElements[i][j]).to.be.instanceof(ScriptWitness);
          expect(post163.witnessElements[i][j]).to.deep.equal(
            pre163.witnessElements[i][j],
          );
        }
      }
    });
  });
});
