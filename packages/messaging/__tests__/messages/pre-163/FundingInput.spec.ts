import { Sequence, Tx } from '@node-lightning/bitcoin';
import { StreamReader } from '@node-lightning/bufio';
import { expect } from 'chai';

import { FundingInputV0Pre163 } from '../../../lib/messages/pre-163/FundingInput';

describe('FundingInputV0Pre163', () => {
  let instance: FundingInputV0Pre163;

  const type = Buffer.from('fda714', 'hex');
  const length = Buffer.from('3f', 'hex');
  const inputSerialID = Buffer.from('000000000000dae8', 'hex');
  const prevTxLen = Buffer.from('0029', 'hex');
  const prevTx = Buffer.from(
    '02000000000100c2eb0b00000000160014e70dcc9ffa7ff84c889c9e79b218708bae3bc95800000000',
    'hex',
  );
  const prevTxVout = Buffer.from('00000000', 'hex');
  const sequence = Buffer.from('ffffffff', 'hex');
  const maxWitnessLen = Buffer.from('006b', 'hex');
  const redeemScriptLen = Buffer.from('0000', 'hex');

  const fundingInputHex = Buffer.concat([
    type,
    length,
    inputSerialID,
    prevTxLen,
    prevTx,
    prevTxVout,
    sequence,
    maxWitnessLen,
    redeemScriptLen,
  ]);

  beforeEach(() => {
    instance = new FundingInputV0Pre163();

    instance.length = BigInt(63);
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
      const instance = FundingInputV0Pre163.deserialize(fundingInputHex);

      expect(Number(instance.length)).to.equal(63);
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
});
