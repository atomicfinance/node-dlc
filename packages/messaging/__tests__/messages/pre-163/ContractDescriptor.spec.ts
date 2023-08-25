import { expect } from 'chai';

import {
  ContractDescriptorPre163,
  ContractDescriptorV0Pre163,
} from '../../../lib/messages/pre-163/ContractDescriptor';
import { MessageType } from '../../../lib/MessageType';

describe('ContractDescriptorV0Pre163', () => {
  const outcomeOne = Buffer.from(
    'c5a7affd51901bc7a51829b320d588dc7af0ad1f3d56f20a1d3c60c9ba7c6722',
    'hex',
  );

  const payoutOne = BigInt(0);

  const outcomeTwo = Buffer.from(
    'adf1c23fbeed6611efa5caa0e9ed4c440c450a18bc010a6c867e05873ac08ead',
    'hex',
  );

  const payoutTwo = BigInt(153314211);

  const outcomeThree = Buffer.from(
    '6922250552ad6bb10ab3ddd6981b530aa9a6fd05725bf85b59e3e51163905288',
    'hex',
  );

  const payoutThree = BigInt(200000000);

  describe('serialize', () => {
    it('serializes', () => {
      const instance = new ContractDescriptorV0Pre163();

      instance.length = BigInt(121);
      instance.outcomes = [
        { outcome: outcomeOne, localPayout: payoutOne },
        { outcome: outcomeTwo, localPayout: payoutTwo },
        { outcome: outcomeThree, localPayout: payoutThree },
      ];

      expect(instance.serialize().toString("hex")).to.equal(
        "fda710" + // type contract_descriptor
        "79" + // length
        "03" + // num_outcomes
        "c5a7affd51901bc7a51829b320d588dc7af0ad1f3d56f20a1d3c60c9ba7c6722" + // outcome_1
        "0000000000000000" + // payout_1
        "adf1c23fbeed6611efa5caa0e9ed4c440c450a18bc010a6c867e05873ac08ead" + // outcome_2
        "00000000092363a3" + // payout_2
        "6922250552ad6bb10ab3ddd6981b530aa9a6fd05725bf85b59e3e51163905288" + // outcome_3
        "000000000bebc200" // payout_3
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const buf = Buffer.from(
        "fda710" + // type contract_descriptor
        "79" + // length
        "03" + // num_outcomes
        "c5a7affd51901bc7a51829b320d588dc7af0ad1f3d56f20a1d3c60c9ba7c6722" + // outcome_1
        "0000000000000000" + // payout_1
        "adf1c23fbeed6611efa5caa0e9ed4c440c450a18bc010a6c867e05873ac08ead" + // outcome_2
        "00000000092363a3" + // payout_2
        "6922250552ad6bb10ab3ddd6981b530aa9a6fd05725bf85b59e3e51163905288" + // outcome_3
        "000000000bebc200" // payout_3
        , "hex"
      ); // prettier-ignore

      const unknownInstance = ContractDescriptorPre163.deserialize(buf);

      if (unknownInstance.type === MessageType.ContractDescriptorV0) {
        const instance = unknownInstance as ContractDescriptorV0Pre163;

        expect(Number(instance.length)).to.equal(121);
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
});
