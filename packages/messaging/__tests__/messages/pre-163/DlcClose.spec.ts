import { expect } from 'chai';

import {
  DlcClosePre163,
  DlcCloseV0Pre163,
} from '../../../lib/messages/pre-163/DlcClose';
import { FundingInputV0Pre163 } from '../../../lib/messages/pre-163/FundingInput';
import { FundingSignaturesV0Pre163 } from '../../../lib/messages/pre-163/FundingSignatures';
import { MessageType } from '../../../lib/MessageType';

describe('DlcCloseV0Pre163', () => {
  let instance: DlcCloseV0Pre163;

  const type = Buffer.from('cbca', 'hex');

  const contractId = Buffer.from(
    'c1c79e1e9e2fa2840b2514902ea244f39eb3001a4037a52ea43c797d4f841269',
    'hex',
  );

  const closeSignature = Buffer.from(
    '7c8ad6de287b62a1ed1d74ed9116a5158abc7f97376d201caa88e0f9daad68fcda4c271cc003512e768f403a57e5242bd1f6aa1750d7f3597598094a43b1c7bb',
    'hex',
  );

  const offerPayoutSatoshis = Buffer.from('0000000005f5e100', 'hex');
  const acceptPayoutSatoshis = Buffer.from('0000000005f5e100', 'hex');
  const fundInputSerialId = Buffer.from('00000000075bcd15', 'hex');

  const fundingInputsLen = Buffer.from('0001', 'hex');
  const fundingInputV0 = Buffer.from(
    'fda714' + // type funding_input_v0
      '3f' + // length
      '000000000000dae8' + // input_serial_id
      '0029' + // prevtx_len
      '02000000000100c2eb0b000000001600149ea3bf2d6eb9c2ffa35e36f41e117403ed7fafe900000000' + // prevtx
      '00000000' + // prevtx_vout
      'ffffffff' + // sequence
      '006b' + // max_witness_len
      '0000', // redeem_script_len
    'hex',
  );

  const fundingSignaturesV0 = Buffer.from(
    'fda718' + // type funding_signatures_v0
      '70' + // length
      '0001' + // num_witnesses
      '0002' + // stack_len
      '0047' + // stack_element_len
      '304402203812d7d194d44ec68f244cc3fd68507c563ec8c729fdfa3f4a79395b98abe84f0220704ab3f3ffd9c50c2488e59f90a90465fccc2d924d67a1e98a133676bf52f37201' + // stack_element
      '0021' + // stack_element_len
      '02dde41aa1f21671a2e28ad92155d2d66e0b5428de15d18db4cbcf216bf00de919', // stack_element
    'hex',
  );

  const dlcCloseHex = Buffer.concat([
    type,
    contractId,
    closeSignature,
    offerPayoutSatoshis,
    acceptPayoutSatoshis,
    fundInputSerialId,
    fundingInputsLen,
    fundingInputV0,
    fundingSignaturesV0,
  ]);

  beforeEach(() => {
    instance = new DlcCloseV0Pre163();
    instance.contractId = contractId;
    instance.closeSignature = closeSignature;
    instance.offerPayoutSatoshis = BigInt(100000000);
    instance.acceptPayoutSatoshis = BigInt(100000000);
    instance.fundInputSerialId = BigInt(123456789);
    instance.fundingInputs = [FundingInputV0Pre163.deserialize(fundingInputV0)];
    instance.fundingSignatures = FundingSignaturesV0Pre163.deserialize(
      fundingSignaturesV0,
    );
  });

  describe('deserialize', () => {
    it('should throw if incorrect type', () => {
      instance.type = 0x123;
      expect(function () {
        DlcClosePre163.deserialize(instance.serialize());
      }).to.throw(Error);
    });

    it('has correct type', () => {
      expect(DlcClosePre163.deserialize(instance.serialize()).type).to.equal(
        instance.type,
      );
    });
  });

  describe('DlcCloseV0Pre163', () => {
    describe('serialize', () => {
      it('serializes', () => {
        expect(instance.serialize().toString('hex')).to.equal(
          dlcCloseHex.toString('hex'),
        );
      });
    });

    describe('deserialize', () => {
      it('deserializes', () => {
        const instance = DlcCloseV0Pre163.deserialize(dlcCloseHex);
        expect(instance.contractId).to.deep.equal(contractId);
        expect(instance.closeSignature).to.deep.equal(closeSignature);
        expect(Number(instance.offerPayoutSatoshis)).to.equal(100000000);
        expect(Number(instance.acceptPayoutSatoshis)).to.equal(100000000);
        expect(Number(instance.fundInputSerialId)).to.equal(123456789);
        expect(instance.fundingInputs[0].serialize().toString('hex')).to.equal(
          fundingInputV0.toString('hex'),
        );
        expect(instance.fundingSignatures.serialize().toString('hex')).to.equal(
          fundingSignaturesV0.toString('hex'),
        );
      });

      it('has correct type', () => {
        expect(DlcCloseV0Pre163.deserialize(dlcCloseHex).type).to.equal(
          MessageType.DlcCloseV0,
        );
      });
    });

    describe('toJSON', () => {
      it('convert to JSON', async () => {
        const json = instance.toJSON();
        expect(json.contractId).to.equal(contractId.toString('hex'));
        expect(json.closeSignature).to.equal(closeSignature.toString('hex'));
        expect(json.fundInputSerialId).to.equal(
          Number(fundInputSerialId.readBigInt64BE()),
        );
        expect(json.fundingInputs[0].prevTx).to.equal(
          instance.fundingInputs[0].prevTx.serialize().toString('hex'),
        );
      });
    });

    describe('validate', () => {
      it('should throw if inputSerialIds arent unique', () => {
        instance.fundingInputs = [
          FundingInputV0Pre163.deserialize(fundingInputV0),
          FundingInputV0Pre163.deserialize(fundingInputV0),
        ];
        expect(function () {
          instance.validate();
        }).to.throw(Error);
      });
      it('should ensure funding inputs are segwit', () => {
        instance.fundingInputs = [
          FundingInputV0Pre163.deserialize(fundingInputV0),
        ];
        expect(function () {
          instance.validate();
        }).to.throw(Error);
      });
    });
  });
});
