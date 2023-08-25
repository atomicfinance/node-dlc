import { sha256 } from '@node-lightning/crypto';
import { expect } from 'chai';

import { DlcAcceptV0, DlcOfferV0, DlcSignV0 } from '../../../lib';
import { DlcAcceptV0Pre163 } from '../../../lib/messages/pre-163/DlcAccept';
import { DlcOfferV0Pre163 } from '../../../lib/messages/pre-163/DlcOffer';
import { DlcSignV0Pre163 } from '../../../lib/messages/pre-163/DlcSign';
import pre163 from './TestVectorsPre163/pre163.json';

const testVectors = {
  pre163,
};

describe('Test Vectors pre 163', () => {
  describe('DlcOfferV0Pre163', () => {
    for (const [testName, testVector] of Object.entries(testVectors)) {
      it(`should deserialize ${camelToUnderscore(testName)}`, () => {
        const dlcOfferPre163 = DlcOfferV0Pre163.deserialize(
          Buffer.from(testVector.pre_163.offer_message.serialized, 'hex'),
        );

        const temporaryContractId = sha256(dlcOfferPre163.serialize());
        const dlcOffer = DlcOfferV0.fromPre163(
          dlcOfferPre163,
          temporaryContractId,
        );
        const serializedDlcOffer = dlcOffer.serialize();
        expect(serializedDlcOffer.toString('hex')).to.equal(
          testVector.post_163.offer_message.serialized,
        );
      });
    }
  });

  describe('DlcAcceptV0Pre163', () => {
    for (const [testName, testVector] of Object.entries(testVectors)) {
      it(`should deserialize ${camelToUnderscore(testName)}`, () => {
        const dlcAcceptPre163 = DlcAcceptV0Pre163.deserialize(
          Buffer.from(testVector.pre_163.accept_message.serialized, 'hex'),
        );

        const dlcAccept = DlcAcceptV0.fromPre163(dlcAcceptPre163);
        const serializedDlcAccept = dlcAccept.serialize();
        const reserializedDlcAccept = DlcAcceptV0.deserialize(
          serializedDlcAccept,
        ).serialize();

        expect(serializedDlcAccept.toString('hex')).to.equal(
          reserializedDlcAccept.toString('hex'),
        );

        expect(serializedDlcAccept.toString('hex')).to.equal(
          testVector.post_163.accept_message.serialized,
        );
      });
    }
  });

  describe('DlcSignV0Pre163', () => {
    for (const [testName, testVector] of Object.entries(testVectors)) {
      it(`should deserialize ${camelToUnderscore(testName)}`, () => {
        const dlcSignPre163 = DlcSignV0Pre163.deserialize(
          Buffer.from(testVector.pre_163.sign_message.serialized, 'hex'),
        );

        const dlcSign = DlcSignV0.fromPre163(dlcSignPre163);
        const serializedDlcSign = dlcSign.serialize();
        expect(serializedDlcSign.toString('hex')).to.equal(
          testVector.post_163.sign_message.serialized,
        );
      });
    }
  });
});

function camelToUnderscore(key) {
  const result = key.replace(/([A-Z0-9])/g, ' $1').replace(/(of)/g, ' $1');
  return result.split(' ').join('_').toLowerCase();
}
