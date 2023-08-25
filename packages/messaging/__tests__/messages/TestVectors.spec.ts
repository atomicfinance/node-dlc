import { expect } from 'chai';

import { DlcAcceptV0, DlcOfferV0, DlcSignV0 } from '../../lib';
import enum3of3 from './TestVectors/enum_3_of_3_test.json';
import enum3of5 from './TestVectors/enum_3_of_5_test.json';
import enumAndNumerical3of5 from './TestVectors/enum_and_numerical_3_of_5_test.json';
import enumAndNumerical5of5 from './TestVectors/enum_and_numerical_5_of_5_test.json';
import enumAndNumericalWithDiff3of5 from './TestVectors/enum_and_numerical_with_diff_3_of_5_test.json';
import enumAndNumericalWithDiff5of5 from './TestVectors/enum_and_numerical_with_diff_5_of_5_test.json';
import enumSingleOracle from './TestVectors/enum_single_oracle_test.json';
import singleOracleNumericalHyperbola from './TestVectors/single_oracle_numerical_hyperbola_test.json';
import singleOracleNumerical from './TestVectors/single_oracle_numerical_test.json';
import threeOfFiveOracleNumericalWithDiff from './TestVectors/three_of_five_oracle_numerical_with_diff_test.json';
import threeOfThreeOracleNumerical from './TestVectors/three_of_three_oracle_numerical_test.json';
import threeOfThreeOracleNumericalWithDiff from './TestVectors/three_of_three_oracle_numerical_with_diff_test.json';
import twoOfFiveOracleNumerical from './TestVectors/two_of_five_oracle_numerical_test.json';
import twoOfFiveOracleNumericalWithDiff from './TestVectors/two_of_five_oracle_numerical_with_diff_test.json';

const testVectors = {
  enum3of3,
  enum3of5,
  enumAndNumerical3of5,
  enumAndNumerical5of5,
  enumAndNumericalWithDiff3of5,
  enumAndNumericalWithDiff5of5,
  enumSingleOracle,
  singleOracleNumericalHyperbola,
  singleOracleNumerical,
  threeOfFiveOracleNumericalWithDiff,
  threeOfThreeOracleNumerical,
  threeOfThreeOracleNumericalWithDiff,
  twoOfFiveOracleNumerical,
  twoOfFiveOracleNumericalWithDiff,
};

describe('Test Vectors', () => {
  describe('DlcOffer', () => {
    for (const [testName, testVector] of Object.entries(testVectors)) {
      it(`should deserialize ${camelToUnderscore(testName)}`, () => {
        const dlcOffer = DlcOfferV0.deserialize(
          Buffer.from(testVector.offer_message.serialized, 'hex'),
        );
        const serializedDlcOffer = dlcOffer.serialize();
        expect(serializedDlcOffer.toString('hex')).to.equal(
          testVector.offer_message.serialized,
        );
        expect(JSON.stringify(dlcOffer.toJSON())).to.equal(
          JSON.stringify(testVector.offer_message),
        );
      });
    }
  });

  describe('DlcAccept', () => {
    for (const [testName, testVector] of Object.entries(testVectors)) {
      it(`should deserialize ${camelToUnderscore(testName)}`, () => {
        const dlcAccept = DlcAcceptV0.deserialize(
          Buffer.from(testVector.accept_message.serialized, 'hex'),
        );
        const serializedDlcAccept = dlcAccept.serialize();
        expect(serializedDlcAccept.toString('hex')).to.equal(
          testVector.accept_message.serialized,
        );
        expect(JSON.stringify(dlcAccept.toJSON())).to.equal(
          JSON.stringify(testVector.accept_message),
        );
      });
    }
  });

  describe('DlcSign', () => {
    for (const [testName, testVector] of Object.entries(testVectors)) {
      it(`should deserialize ${camelToUnderscore(testName)}`, () => {
        const dlcSign = DlcSignV0.deserialize(
          Buffer.from(testVector.sign_message.serialized, 'hex'),
        );
        const serializedDlcSign = dlcSign.serialize();
        expect(serializedDlcSign.toString('hex')).to.equal(
          testVector.sign_message.serialized,
        );
        expect(JSON.stringify(dlcSign.toJSON())).to.equal(
          JSON.stringify(testVector.sign_message),
        );
      });
    }
  });
});

function camelToUnderscore(key) {
  const result = key.replace(/([A-Z0-9])/g, ' $1').replace(/(of)/g, ' $1');
  return result.split(' ').join('_').toLowerCase();
}
