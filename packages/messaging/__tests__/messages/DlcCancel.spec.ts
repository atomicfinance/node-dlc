import { expect } from 'chai';

import { DlcCancelV0 } from '../../lib/messages/DlcCancel';
import { DlcCancelV0Pre163 } from '../../lib/messages/pre-163/DlcCancel';

describe('DlcCancel', () => {
  const contractId = Buffer.from(
    'c1c79e1e9e2fa2840b2514902ea244f39eb3001a4037a52ea43c797d4f841269',
    'hex',
  );

  describe('serialize', () => {
    it('serializes', () => {
      const instance = new DlcCancelV0();

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

      const instance = DlcCancelV0.deserialize(buf);

      expect(instance.contractId).to.deep.equal(contractId);
      expect(instance.cancelType).to.equal(0);
    });
  });

  describe('toPre163', () => {
    const post163 = new DlcCancelV0();

    before(() => {
      post163.contractId = contractId;
      post163.cancelType = 0;
    });

    it('returns pre-163 instance', () => {
      const pre163 = DlcCancelV0.toPre163(post163);
      expect(pre163).to.be.instanceof(DlcCancelV0Pre163);
      expect(pre163.contractId).to.deep.equal(post163.contractId);
      expect(pre163.cancelType).to.equal(post163.cancelType);
    });
  });

  describe('fromPre163', () => {
    const pre163 = new DlcCancelV0Pre163();

    before(() => {
      pre163.contractId = contractId;
      pre163.cancelType = 0;
    });

    it('returns post-163 instance', () => {
      const post163 = DlcCancelV0.fromPre163(pre163);
      expect(post163).to.be.instanceof(DlcCancelV0);
      expect(post163.contractId).to.deep.equal(pre163.contractId);
      expect(post163.cancelType).to.equal(pre163.cancelType);
    });
  });
});
