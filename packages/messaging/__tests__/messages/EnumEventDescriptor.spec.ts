import { expect } from 'chai';

import { EnumEventDescriptorV0Pre167 } from '../../lib/messages/pre-167/EventDescriptor';

describe('EnumEventDescriptor', () => {
  const outcomeOne = Buffer.from('64756d6d7931', 'hex').toString();

  const outcomeTwo = Buffer.from('64756d6d7932', 'hex').toString();

  describe('serialize', () => {
    it('serializes', () => {
      const instance = new EnumEventDescriptorV0Pre167();

      instance.length = BigInt(16);
      instance.outcomes = [outcomeOne, outcomeTwo];

      expect(instance.serialize().toString("hex")).to.equal(
        "fdd806" + // type
        "10" + // length
        "0002" + // num_outcomes
        "06" + // outcome_1_len
        "64756d6d7931" + // outcome_1
        "06" + // outcome_2_len
        "64756d6d7932" // outcome_2
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const buf = Buffer.from(
        "fdd806" + // type
        "10" + // length
        "0002" + // num_outcomes
        "06" + // outcome_1_len
        "64756d6d7931" + // outcome_1
        "06" + // outcome_2_len
        "64756d6d7932" // outcome_2
        , "hex"
      ); // prettier-ignore

      const instance = EnumEventDescriptorV0Pre167.deserialize(buf);

      expect(Number(instance.outcomes[0].length)).to.equal(outcomeOne.length);
      expect(instance.outcomes[0]).to.deep.equal(outcomeOne);
      expect(Number(instance.outcomes[1].length)).to.equal(outcomeTwo.length);
      expect(instance.outcomes[1]).to.deep.equal(outcomeTwo);
    });
  });
});
