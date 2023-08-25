import { Sequence, Tx } from '@node-lightning/bitcoin';
import { StreamReader } from '@node-lightning/bufio';
import { expect } from 'chai';

import { FundingInput } from '../../lib/messages/FundingInput';
import { FundingInputV0Pre163 } from '../../lib/messages/pre-163/FundingInput';

describe('FundingInput', () => {
  let instance: FundingInput;

  const inputSerialID = Buffer.from('000000000000dae8', 'hex');
  const prevTxLen = Buffer.from('29', 'hex');
  const prevTx = Buffer.from(
    '02000000000100c2eb0b00000000160014e70dcc9ffa7ff84c889c9e79b218708bae3bc95800000000',
    'hex',
  );
  const prevTxVout = Buffer.from('00000000', 'hex');
  const sequence = Buffer.from('ffffffff', 'hex');
  const maxWitnessLen = Buffer.from('006b', 'hex');
  const redeemScriptLen = Buffer.from('0000', 'hex');

  const fundingInputHex = Buffer.concat([
    inputSerialID,
    prevTxLen,
    prevTx,
    prevTxVout,
    sequence,
    maxWitnessLen,
    redeemScriptLen,
  ]);

  beforeEach(() => {
    instance = new FundingInput();

    instance.inputSerialId = BigInt(56040);
    instance.prevTx = Tx.decode(StreamReader.fromBuffer(prevTx));
    instance.prevTxVout = 0;
    instance.sequence = Sequence.default();
    instance.maxWitnessLen = 107;
    instance.redeemScript = Buffer.from('', 'hex');
  });

  describe('serialize', () => {
    it('serializes', () => {
      expect(instance.serialize().toString('hex')).to.equal(
        fundingInputHex.toString('hex'),
      );
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const instance = FundingInput.deserialize(fundingInputHex);

      expect(Number(instance.inputSerialId)).to.equal(56040);
      expect(instance.prevTx.serialize()).to.deep.equal(prevTx);
      expect(instance.prevTxVout).to.equal(0);
      expect(instance.sequence.value).to.equal(4294967295);
      expect(instance.maxWitnessLen).to.equal(107);
      expect(instance.redeemScript).to.deep.equal(Buffer.from('', 'hex'));
    });
  });

  describe('validate', () => {
    it('should ensure inputs are segwit', () => {
      instance.prevTx = Tx.decode(
        StreamReader.fromBuffer(
          Buffer.from(
            '02000000000100c2eb0b00000000160014e70dcc9ffa7ff84c889c9e79b218708bae3bc95800000000', // has no inputs
            'hex',
          ),
        ),
      );
      expect(function () {
        instance.validate();
      }).to.throw(Error);
    });
  });

  describe('toPre163', () => {
    it('returns pre-163 instance', () => {
      const pre163 = FundingInput.toPre163(instance);
      expect(pre163).to.be.instanceof(FundingInputV0Pre163);
      expect(Number(pre163.inputSerialId)).to.equal(
        Number(instance.inputSerialId),
      );
      expect(pre163.prevTx).to.deep.equal(instance.prevTx);
      expect(pre163.prevTxVout).to.equal(instance.prevTxVout);
      expect(pre163.sequence).to.deep.equal(instance.sequence);
      expect(pre163.maxWitnessLen).to.equal(instance.maxWitnessLen);
      expect(pre163.redeemScript).to.deep.equal(instance.redeemScript);
    });
  });

  describe('fromPre163', () => {
    const pre163 = new FundingInputV0Pre163();

    before(() => {
      pre163.inputSerialId = BigInt(56040);
      pre163.prevTx = Tx.decode(StreamReader.fromBuffer(prevTx));
      pre163.prevTxVout = 0;
      pre163.sequence = Sequence.default();
      pre163.maxWitnessLen = 107;
      pre163.redeemScript = Buffer.from('', 'hex');
    });

    it('returns post-163 instance', () => {
      const post163 = FundingInput.fromPre163(pre163);
      expect(post163).to.be.instanceof(FundingInput);
      expect(Number(post163.inputSerialId)).to.equal(
        Number(pre163.inputSerialId),
      );
      expect(post163.prevTx).to.deep.equal(pre163.prevTx);
      expect(post163.prevTxVout).to.equal(pre163.prevTxVout);
      expect(post163.sequence).to.deep.equal(pre163.sequence);
      expect(post163.maxWitnessLen).to.equal(pre163.maxWitnessLen);
      expect(post163.redeemScript).to.deep.equal(pre163.redeemScript);
    });
  });
});
