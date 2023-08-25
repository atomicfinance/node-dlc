import { expect } from 'chai';

import {
  ContractDescriptor,
  ContractDescriptorType,
  EnumeratedContractDescriptor,
} from '../../lib/messages/ContractDescriptor';
import { ContractDescriptorV0Pre163 } from '../../lib/messages/pre-163/ContractDescriptor';

describe('EnumeratedContractDescriptor', () => {
  const outcomeOne = '1';

  const payoutOne = BigInt(0);

  const outcomeTwo = '2';

  const payoutTwo = BigInt(153314211);

  const outcomeThree = '3';

  const payoutThree = BigInt(200000000);

  describe('serialize', () => {
    it('serializes', () => {
      const instance = new EnumeratedContractDescriptor();

      instance.outcomes = [
        { outcome: outcomeOne, localPayout: payoutOne },
        { outcome: outcomeTwo, localPayout: payoutTwo },
        { outcome: outcomeThree, localPayout: payoutThree },
      ];

      expect(instance.serialize().toString("hex")).to.equal(
        "00" + // type enumerated_contract_descriptor
        "03" + // num_outcomes
        "01" + // outcome_1_len
        "31" + // outcome_1 (utf-8 encoded)
        "0000000000000000" + // payout_1
        "01" + // outcome_2_len
        "32" + // outcome_2 (utf-8 encoded)
        "00000000092363a3" + // payout_2
        "01" + // outcome_3_len
        "33" + // outcome_3 (utf-8 encoded)
        "000000000bebc200" // payout_3
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const buf = Buffer.from(
        "00" + // type
        "03" + // num_outcomes
        "01" + // outcome_1_len
        "31" + // outcome_1 (utf-8 encoded)
        "0000000000000000" + // payout_1
        "01" + // outcome_2_len
        "32" + // outcome_2 (utf-8 encoded)
        "00000000092363a3" + // payout_2
        "01" + // outcome_3_len
        "33" + // outcome_3 (utf-8 encoded)
        "000000000bebc200" // payout_3
        , "hex"
      ); // prettier-ignore

      const unknownInstance = ContractDescriptor.deserialize(buf);

      if (unknownInstance.type === ContractDescriptorType.Enumerated) {
        const instance = unknownInstance as EnumeratedContractDescriptor;

        expect(instance.outcomes.length).to.equal(3);
        expect(instance.outcomes[0].outcome).to.deep.equal(outcomeOne);
        expect(instance.outcomes[0].localPayout).to.equal(payoutOne);
        expect(instance.outcomes[1].outcome).to.deep.equal(outcomeTwo);
        expect(instance.outcomes[1].localPayout).to.equal(payoutTwo);
        expect(instance.outcomes[2].outcome).to.deep.equal(outcomeThree);
        expect(instance.outcomes[2].localPayout).to.equal(payoutThree);
      }
    });
  });

  describe('toPre163', () => {
    const post163 = new EnumeratedContractDescriptor();

    before(() => {
      post163.outcomes = [
        { outcome: outcomeOne, localPayout: payoutOne },
        { outcome: outcomeTwo, localPayout: payoutTwo },
        { outcome: outcomeThree, localPayout: payoutThree },
      ];
    });

    it('returns pre-163 instance', () => {
      const pre163 = ContractDescriptor.toPre163(post163);
      expect(pre163).to.be.instanceof(ContractDescriptorV0Pre163);
      for (
        let i = 0;
        i < (pre163 as ContractDescriptorV0Pre163).outcomes.length;
        i++
      ) {
        expect(
          (pre163 as ContractDescriptorV0Pre163).outcomes[i].outcome.toString(
            'utf-8',
          ),
        ).to.equal(post163.outcomes[i].outcome);
        expect(
          (pre163 as ContractDescriptorV0Pre163).outcomes[i].localPayout,
        ).to.equal(post163.outcomes[i].localPayout);
      }
    });
  });

  describe('fromPre163', () => {
    const pre163 = new ContractDescriptorV0Pre163();

    before(() => {
      pre163.outcomes = [
        { outcome: Buffer.from(outcomeOne, 'utf-8'), localPayout: payoutOne },
        { outcome: Buffer.from(outcomeTwo, 'utf-8'), localPayout: payoutTwo },
        {
          outcome: Buffer.from(outcomeThree, 'utf-8'),
          localPayout: payoutThree,
        },
      ];
    });

    it('returns post-163 instance', () => {
      const post163 = ContractDescriptor.fromPre163(pre163);
      expect(post163).to.be.instanceof(EnumeratedContractDescriptor);
      for (
        let i = 0;
        i < (post163 as EnumeratedContractDescriptor).outcomes.length;
        i++
      ) {
        expect(
          (post163 as EnumeratedContractDescriptor).outcomes[i].outcome,
        ).to.equal(pre163.outcomes[i].outcome.toString('utf-8'));
        expect(
          (post163 as EnumeratedContractDescriptor).outcomes[i].localPayout,
        ).to.equal(pre163.outcomes[i].localPayout);
      }
    });
  });
});
