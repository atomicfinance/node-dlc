import { expect } from 'chai';

import { DlcClose, DlcCloseV0 } from '../../lib/messages/DlcClose';
import { FundingInput } from '../../lib/messages/FundingInput';
import { FundingSignatures } from '../../lib/messages/FundingSignatures';
import { DlcCloseV0Pre163 } from '../../lib/messages/pre-163/DlcClose';
import { FundingInputV0Pre163 } from '../../lib/messages/pre-163/FundingInput';
import { FundingSignaturesV0Pre163 } from '../../lib/messages/pre-163/FundingSignatures';
import { MessageType } from '../../lib/MessageType';

describe('DlcClose', () => {
  let instance: DlcCloseV0;

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

  const fundingInputsLen = Buffer.from('01', 'hex');
  const fundingInput = Buffer.from(
    '000000000000dae8' + // input_serial_id
      '29' + // prevtx_len
      '02000000000100c2eb0b000000001600149ea3bf2d6eb9c2ffa35e36f41e117403ed7fafe900000000' + // prevtx
      '00000000' + // prevtx_vout
      'ffffffff' + // sequence
      '006b' + // max_witness_len
      '0000', // redeem_script_len
    'hex',
  );

  const fundingSignatures = Buffer.from(
    '01' + // num_witnesses
      '02' + // stack_len
      '47' + // stack_element_len
      '304402203812d7d194d44ec68f244cc3fd68507c563ec8c729fdfa3f4a79395b98abe84f0220704ab3f3ffd9c50c2488e59f90a90465fccc2d924d67a1e98a133676bf52f37201' + // stack_element
      '21' + // stack_element_len
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
    fundingInput,
    fundingSignatures,
  ]);

  beforeEach(() => {
    instance = new DlcCloseV0();
    instance.contractId = contractId;
    instance.closeSignature = closeSignature;
    instance.offerPayoutSatoshis = BigInt(100000000);
    instance.acceptPayoutSatoshis = BigInt(100000000);
    instance.fundInputSerialId = BigInt(123456789);
    instance.fundingInputs = [FundingInput.deserialize(fundingInput)];
    instance.fundingSignatures = FundingSignatures.deserialize(
      fundingSignatures,
    );
  });

  describe('deserialize', () => {
    it('should throw if incorrect type', () => {
      instance.type = 0x123;
      expect(function () {
        DlcClose.deserialize(instance.serialize());
      }).to.throw(Error);
    });

    it('has correct type', () => {
      expect(DlcClose.deserialize(instance.serialize()).type).to.equal(
        instance.type,
      );
    });
  });

  describe('DlcCloseV0', () => {
    describe('serialize', () => {
      it('serializes', () => {
        expect(instance.serialize().toString('hex')).to.equal(
          dlcCloseHex.toString('hex'),
        );
      });
    });

    describe('deserialize', () => {
      it('deserializes', () => {
        const instance = DlcCloseV0.deserialize(dlcCloseHex);
        expect(instance.contractId).to.deep.equal(contractId);
        expect(instance.closeSignature).to.deep.equal(closeSignature);
        expect(Number(instance.offerPayoutSatoshis)).to.equal(100000000);
        expect(Number(instance.acceptPayoutSatoshis)).to.equal(100000000);
        expect(Number(instance.fundInputSerialId)).to.equal(123456789);
        expect(instance.fundingInputs[0].serialize().toString('hex')).to.equal(
          fundingInput.toString('hex'),
        );
        expect(instance.fundingSignatures.serialize().toString('hex')).to.equal(
          fundingSignatures.toString('hex'),
        );
      });

      it('has correct type', () => {
        expect(DlcCloseV0.deserialize(dlcCloseHex).type).to.equal(
          MessageType.DlcCloseV0,
        );
      });
    });

    describe('toJSON', () => {
      it('convert to JSON', async () => {
        const json = instance.toJSON();
        expect(json.message.contractId).to.equal(contractId.toString('hex'));
        expect(json.message.closeSignature).to.equal(
          closeSignature.toString('hex'),
        );
        expect(json.message.fundInputSerialId).to.equal(
          Number(fundInputSerialId.readBigInt64BE()),
        );
        expect(json.message.fundingInputs[0].prevTx).to.equal(
          instance.fundingInputs[0].prevTx.serialize().toString('hex'),
        );
      });
    });

    describe('validate', () => {
      it('should throw if inputSerialIds arent unique', () => {
        instance.fundingInputs = [
          FundingInput.deserialize(fundingInput),
          FundingInput.deserialize(fundingInput),
        ];
        expect(function () {
          instance.validate();
        }).to.throw(Error);
      });
      it('should ensure funding inputs are segwit', () => {
        instance.fundingInputs = [FundingInput.deserialize(fundingInput)];
        expect(function () {
          instance.validate();
        }).to.throw(Error);
      });
    });

    describe('toPre163', () => {
      it('returns pre-163 instance', () => {
        const pre163 = DlcCloseV0.toPre163(instance);
        expect(pre163).to.be.instanceof(DlcCloseV0Pre163);
        expect(pre163.contractId).to.equal(instance.contractId);
        expect(pre163.closeSignature).to.equal(instance.closeSignature);
        expect(pre163.offerPayoutSatoshis).to.equal(
          instance.offerPayoutSatoshis,
        );
        expect(pre163.acceptPayoutSatoshis).to.equal(
          instance.acceptPayoutSatoshis,
        );
        expect(pre163.fundInputSerialId).to.equal(instance.fundInputSerialId);
        expect(pre163.fundingInputs.length).to.equal(
          instance.fundingInputs.length,
        );
        for (let i = 0; i < pre163.fundingInputs.length; i++) {
          expect(pre163.fundingInputs[i].inputSerialId).to.equal(
            instance.fundingInputs[i].inputSerialId,
          );
          expect(pre163.fundingInputs[i].prevTx).to.equal(
            instance.fundingInputs[i].prevTx,
          );
          expect(pre163.fundingInputs[i].prevTxVout).to.equal(
            instance.fundingInputs[i].prevTxVout,
          );
          expect(pre163.fundingInputs[i].sequence).to.equal(
            instance.fundingInputs[i].sequence,
          );
          expect(pre163.fundingInputs[i].maxWitnessLen).to.equal(
            instance.fundingInputs[i].maxWitnessLen,
          );
          expect(pre163.fundingInputs[i].redeemScript).to.equal(
            instance.fundingInputs[i].redeemScript,
          );
        }
        expect(pre163.fundingSignatures.witnessElements.length).to.equal(
          instance.fundingSignatures.witnessElements.length,
        );
        for (
          let i = 0;
          i < pre163.fundingSignatures.witnessElements.length;
          i++
        ) {
          expect(pre163.fundingSignatures.witnessElements[i]).to.deep.equal(
            instance.fundingSignatures.witnessElements[i],
          );
        }
      });
    });

    describe('fromPre163', () => {
      const fundingInputV0Pre163 = FundingInputV0Pre163.deserialize(
        Buffer.from(
          'fda714' + // type
            '3f' + // length
            '000000000000dae8' + // inputSerialID
            '0029' + // prevTxLen
            '02000000000100c2eb0b000000001600149ea3bf2d6eb9c2ffa35e36f41e117403ed7fafe900000000' + // prevTx
            '00000000' + // prevTxVout
            'ffffffff' + // sequence
            '006b' + // maxWitnessLen
            '0000', // redeemScriptLen
          'hex',
        ),
      );
      const fundingSignaturesV0Pre163 = FundingSignaturesV0Pre163.deserialize(
        Buffer.from(
          'fda718' + // type funding_signatures_v0
            '70' + // length
            '0001' + // num_witnesses
            '0002' + // stack_len
            '0047' + // stack_element_len
            '304402203812d7d194d44ec68f244cc3fd68507c563ec8c729fdfa3f4a79395b98abe84f0220704ab3f3ffd9c50c2488e59f90a90465fccc2d924d67a1e98a133676bf52f37201' + // stack_element
            '0021' + // stack_element_len
            '02dde41aa1f21671a2e28ad92155d2d66e0b5428de15d18db4cbcf216bf00de919', // stack_element
          'hex',
        ),
      );
      const pre163 = new DlcCloseV0Pre163();

      before(() => {
        pre163.contractId = contractId;
        pre163.closeSignature = closeSignature;
        pre163.offerPayoutSatoshis = BigInt(100000000);
        pre163.acceptPayoutSatoshis = BigInt(100000000);
        pre163.fundInputSerialId = BigInt(123456789);
        pre163.fundingInputs = [fundingInputV0Pre163];
        pre163.fundingSignatures = fundingSignaturesV0Pre163;
      });

      it('returns post-163 instance', () => {
        const post163 = DlcCloseV0.fromPre163(pre163);
        expect(post163).to.be.instanceof(DlcCloseV0);
        expect(post163.contractId).to.equal(pre163.contractId);
        expect(post163.closeSignature).to.equal(pre163.closeSignature);
        expect(post163.offerPayoutSatoshis).to.equal(
          pre163.offerPayoutSatoshis,
        );
        expect(post163.acceptPayoutSatoshis).to.equal(
          pre163.acceptPayoutSatoshis,
        );
        expect(post163.fundInputSerialId).to.equal(pre163.fundInputSerialId);
        expect(post163.fundingInputs.length).to.equal(
          pre163.fundingInputs.length,
        );
        for (let i = 0; i < post163.fundingInputs.length; i++) {
          expect(post163.fundingInputs[i].inputSerialId).to.equal(
            pre163.fundingInputs[i].inputSerialId,
          );
          expect(post163.fundingInputs[i].prevTx).to.equal(
            pre163.fundingInputs[i].prevTx,
          );
          expect(post163.fundingInputs[i].prevTxVout).to.equal(
            pre163.fundingInputs[i].prevTxVout,
          );
          expect(post163.fundingInputs[i].sequence).to.equal(
            pre163.fundingInputs[i].sequence,
          );
          expect(post163.fundingInputs[i].maxWitnessLen).to.equal(
            pre163.fundingInputs[i].maxWitnessLen,
          );
          expect(post163.fundingInputs[i].redeemScript).to.equal(
            pre163.fundingInputs[i].redeemScript,
          );
        }
        expect(post163.fundingSignatures.witnessElements.length).to.equal(
          pre163.fundingSignatures.witnessElements.length,
        );
        for (
          let i = 0;
          i < post163.fundingSignatures.witnessElements.length;
          i++
        ) {
          expect(post163.fundingSignatures.witnessElements[i]).to.deep.equal(
            pre163.fundingSignatures.witnessElements[i],
          );
        }
      });
    });
  });
});
