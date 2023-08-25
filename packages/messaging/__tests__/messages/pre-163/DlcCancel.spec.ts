import { expect } from 'chai';

import { DlcCancelV0Pre163 } from '../../../lib/messages/pre-163/DlcCancel';

describe('DlcCancelV0Pre163', () => {
  const contractId = Buffer.from(
    'c1c79e1e9e2fa2840b2514902ea244f39eb3001a4037a52ea43c797d4f841269',
    'hex',
  );

  describe('serialize', () => {
    it('serializes', () => {
      const instance = new DlcCancelV0Pre163();

      instance.contractId = contractId;

      instance.cancelType = 0;

      expect(instance.serialize().toString("hex")).to.equal(
        "cbcc" +
        "c1c79e1e9e2fa2840b2514902ea244f39eb3001a4037a52ea43c797d4f841269" +
        "00" // cancel type
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const buf = Buffer.from(
        "cbcc" +
        "c1c79e1e9e2fa2840b2514902ea244f39eb3001a4037a52ea43c797d4f841269" +
        "00" // cancel type
        , "hex"
      ); // prettier-ignore

      const instance = DlcCancelV0Pre163.deserialize(buf);

      expect(instance.contractId).to.deep.equal(contractId);
      expect(instance.cancelType).to.equal(0);
    });
  });
});
