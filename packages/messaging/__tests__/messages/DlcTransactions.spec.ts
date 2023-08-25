import { Tx } from '@node-lightning/bitcoin';
import { StreamReader } from '@node-lightning/bufio';
import { expect } from 'chai';

import {
  DlcTransactions,
  DlcTransactionsV0,
} from '../../lib/messages/DlcTransactions';
import { DlcTransactionsV0Pre163 } from '../../lib/messages/pre-163/DlcTransactions';
import { MessageType } from '../../lib/MessageType';

describe('DlcTransactions', () => {
  const contractId = Buffer.from(
    '6010a7e779c5079493ad06abbcaca06b8a04d501890cd724104d1df6e20968e8',
    'hex',
  );

  const fundTx = Tx.decode(
    StreamReader.fromBuffer(
      Buffer.from(
        '02000000022f76d0509ca3ad7559e0f45489aa2efea70f8657e3cdfce6b8194019012370a10100000000ffffffffd295f485f2d181eb06ae6d5e62007db4bfe52ad31e6e1a5c576e2f396bbda9470100000000ffffffff03aed10e000000000022002034e21059bdd0c5d1d3f2d03075b33ec89c9a018a855158a6c605d921e41db8fd88f6dc0b00000000160014ccd5d5d8249b94c4381c478907c2ad81f0c35227f2b1eb0b000000001600149212ec2ed940f3cd93bfbd16c5f817ee079243bb00000000',
        'hex',
      ),
    ),
  );

  const fundTxVout = 0;

  const refundTx = Tx.decode(
    StreamReader.fromBuffer(
      Buffer.from(
        '02000000017f19d63285e628c1b0702cd1a11df6fe4d2acc75595dc52fb8d2842b13aa56220000000000feffffff023ac30e000000000016001442795b177d2bd1d538d379af766a979e4056d43cd007000000000000160014f9e38ab4d13bc36fd4df0381e355d9f7b50d69808c106460',
        'hex',
      ),
    ),
  );

  const cet0 = Tx.decode(
    StreamReader.fromBuffer(
      Buffer.from(
        '02000000017f19d63285e628c1b0702cd1a11df6fe4d2acc75595dc52fb8d2842b13aa56220000000000ffffffff010acb0e000000000016001442795b177d2bd1d538d379af766a979e4056d43c00000000',
        'hex',
      ),
    ),
  );

  const cet1 = Tx.decode(
    StreamReader.fromBuffer(
      Buffer.from(
        '02000000017f19d63285e628c1b0702cd1a11df6fe4d2acc75595dc52fb8d2842b13aa56220000000000ffffffff010acb0e000000000016001442795b177d2bd1d538d379af766a979e4056d43c00000000',
        'hex',
      ),
    ),
  );

  describe('serialize', () => {
    it('serializes', () => {
      const instance = new DlcTransactionsV0();

      instance.contractId = contractId;
      instance.fundTx = fundTx;
      instance.fundTxVout = fundTxVout;
      instance.refundTx = refundTx;
      instance.cets.push(cet0);
      instance.cets.push(cet1);

      expect(instance.serialize().toString("hex")).to.equal(
        "ef2e" + // type
        "6010a7e779c5079493ad06abbcaca06b8a04d501890cd724104d1df6e20968e8" + // contract_id
        "c5" + // fund_tx_len
        "02000000022f76d0509ca3ad7559e0f45489aa2efea70f8657e3cdfce6b8194019012370a10100000000ffffffffd295f485f2d181eb06ae6d5e62007db4bfe52ad31e6e1a5c576e2f396bbda9470100000000ffffffff03aed10e000000000022002034e21059bdd0c5d1d3f2d03075b33ec89c9a018a855158a6c605d921e41db8fd88f6dc0b00000000160014ccd5d5d8249b94c4381c478907c2ad81f0c35227f2b1eb0b000000001600149212ec2ed940f3cd93bfbd16c5f817ee079243bb00000000" +
        "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "71" + // refund_tx_len
        "02000000017f19d63285e628c1b0702cd1a11df6fe4d2acc75595dc52fb8d2842b13aa56220000000000feffffff023ac30e000000000016001442795b177d2bd1d538d379af766a979e4056d43cd007000000000000160014f9e38ab4d13bc36fd4df0381e355d9f7b50d69808c106460" +
        "02" + // num_cets
        "52" + // cet_0_len
        "02000000017f19d63285e628c1b0702cd1a11df6fe4d2acc75595dc52fb8d2842b13aa56220000000000ffffffff010acb0e000000000016001442795b177d2bd1d538d379af766a979e4056d43c00000000" +
        "52" + // cet_1_len
        "02000000017f19d63285e628c1b0702cd1a11df6fe4d2acc75595dc52fb8d2842b13aa56220000000000ffffffff010acb0e000000000016001442795b177d2bd1d538d379af766a979e4056d43c00000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    const buf = Buffer.from(
      "ef2e" + // type
      "6010a7e779c5079493ad06abbcaca06b8a04d501890cd724104d1df6e20968e8" + // contract_id
      "c5" + // fund_tx_len
      "02000000022f76d0509ca3ad7559e0f45489aa2efea70f8657e3cdfce6b8194019012370a10100000000ffffffffd295f485f2d181eb06ae6d5e62007db4bfe52ad31e6e1a5c576e2f396bbda9470100000000ffffffff03aed10e000000000022002034e21059bdd0c5d1d3f2d03075b33ec89c9a018a855158a6c605d921e41db8fd88f6dc0b00000000160014ccd5d5d8249b94c4381c478907c2ad81f0c35227f2b1eb0b000000001600149212ec2ed940f3cd93bfbd16c5f817ee079243bb00000000" +
      "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
      "71" + // refund_tx_len
      "02000000017f19d63285e628c1b0702cd1a11df6fe4d2acc75595dc52fb8d2842b13aa56220000000000feffffff023ac30e000000000016001442795b177d2bd1d538d379af766a979e4056d43cd007000000000000160014f9e38ab4d13bc36fd4df0381e355d9f7b50d69808c106460" +
      "02" + // num_cets
      "52" + // cet_0_len
      "02000000017f19d63285e628c1b0702cd1a11df6fe4d2acc75595dc52fb8d2842b13aa56220000000000ffffffff010acb0e000000000016001442795b177d2bd1d538d379af766a979e4056d43c00000000" +
      "52" + // cet_1_len
      "02000000017f19d63285e628c1b0702cd1a11df6fe4d2acc75595dc52fb8d2842b13aa56220000000000ffffffff010acb0e000000000016001442795b177d2bd1d538d379af766a979e4056d43c00000000" +
      "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      , "hex"
    ); // prettier-ignore

    it('deserializes', () => {
      const unknownInstance = DlcTransactions.deserialize(buf);

      if (unknownInstance.type === MessageType.DlcTransactionsV0) {
        const instance = unknownInstance as DlcTransactionsV0;

        expect(instance.fundTx.serialize()).to.deep.equal(fundTx.serialize());
        expect(Number(instance.fundTxVout)).to.deep.equal(Number(fundTxVout));
        expect(instance.refundTx.serialize()).to.deep.equal(
          refundTx.serialize(),
        );
        expect(instance.cets[0].serialize()).to.deep.equal(cet0.serialize());
        expect(instance.cets[1].serialize()).to.deep.equal(cet1.serialize());
      } else {
        throw Error('DlcTransactions Incorrect type');
      }
    });

    it('deserializes without cets', () => {
      // Set parseCets to false
      const unknownInstance = DlcTransactions.deserialize(buf, false);

      if (unknownInstance.type === MessageType.DlcTransactionsV0) {
        const instance = unknownInstance as DlcTransactionsV0;

        expect(instance.fundTx.serialize()).to.deep.equal(fundTx.serialize());
        expect(Number(instance.fundTxVout)).to.deep.equal(Number(fundTxVout));
        expect(instance.refundTx.serialize()).to.deep.equal(
          refundTx.serialize(),
        );
        expect(instance.cets.length).to.equal(1);
      } else {
        throw Error('DlcTransactions Incorrect type');
      }
    });
  });

  describe('toJSON', () => {
    it('convert to JSON', async () => {
      const instance = new DlcTransactionsV0();

      instance.contractId = contractId;
      instance.fundTx = fundTx;
      instance.fundTxVout = fundTxVout;
      instance.refundTx = refundTx;
      instance.cets.push(cet0);
      instance.cets.push(cet1);

      const jsonInstance = instance.toJSON();

      expect(jsonInstance.contractId).to.equal(contractId.toString('hex'));
      expect(jsonInstance.fundTx).to.equal(fundTx.serialize().toString('hex'));
      expect(jsonInstance.refundTx).to.equal(
        refundTx.serialize().toString('hex'),
      );
      expect(jsonInstance.cets[0]).to.equal(cet0.serialize().toString('hex'));
    });
  });

  describe('toPre163', () => {
    const instance = new DlcTransactionsV0();

    before(() => {
      instance.contractId = contractId;
      instance.fundTx = fundTx;
      instance.fundTxVout = fundTxVout;
      instance.refundTx = refundTx;
      instance.cets.push(cet0);
      instance.cets.push(cet1);
    });

    it('returns pre-163 instance', () => {
      const pre163 = DlcTransactionsV0.toPre163(instance);
      expect(pre163).to.be.instanceof(DlcTransactionsV0Pre163);
      expect(pre163.contractId).to.equal(instance.contractId);
      expect(pre163.fundTx).to.deep.equal(instance.fundTx);
      expect(pre163.fundTxVout).to.equal(instance.fundTxVout);
      expect(pre163.fundEpoch).to.deep.equal(instance.fundEpoch);
      expect(pre163.fundBroadcastHeight).to.deep.equal(
        instance.fundBroadcastHeight,
      );
      expect(pre163.refundTx).to.deep.equal(instance.refundTx);
      expect(pre163.cets.length).to.equal(instance.cets.length);
      for (let i = 0; i < pre163.cets.length; i++) {
        expect(pre163.cets[i]).to.deep.equal(instance.cets[i]);
      }
      expect(pre163.closeEpoch).to.deep.equal(instance.closeEpoch);
      expect(pre163.closeTxHash).to.deep.equal(instance.closeTxHash);
      expect(pre163.closeType).to.deep.equal(instance.closeType);
      expect(pre163.closeBroadcastHeight).to.deep.equal(
        instance.closeBroadcastHeight,
      );
    });
  });

  describe('fromPre163', () => {
    const pre163 = new DlcTransactionsV0Pre163();

    before(() => {
      pre163.contractId = contractId;
      pre163.fundTx = fundTx;
      pre163.fundTxVout = fundTxVout;
      pre163.refundTx = refundTx;
      pre163.cets.push(cet0);
      pre163.cets.push(cet1);
    });

    it('returns post-163 instance', () => {
      const post163 = DlcTransactionsV0.fromPre163(pre163);
      expect(post163).to.be.instanceof(DlcTransactionsV0);
      expect(post163.contractId).to.equal(pre163.contractId);
      expect(post163.fundTx).to.deep.equal(pre163.fundTx);
      expect(post163.fundTxVout).to.equal(pre163.fundTxVout);
      expect(post163.fundEpoch).to.deep.equal(pre163.fundEpoch);
      expect(post163.fundBroadcastHeight).to.deep.equal(
        pre163.fundBroadcastHeight,
      );
      expect(post163.refundTx).to.deep.equal(pre163.refundTx);
      expect(post163.cets.length).to.equal(pre163.cets.length);
      for (let i = 0; i < post163.cets.length; i++) {
        expect(post163.cets[i]).to.deep.equal(pre163.cets[i]);
      }
      expect(post163.closeEpoch).to.deep.equal(pre163.closeEpoch);
      expect(post163.closeTxHash).to.deep.equal(pre163.closeTxHash);
      expect(post163.closeType).to.deep.equal(pre163.closeType);
      expect(post163.closeBroadcastHeight).to.deep.equal(
        pre163.closeBroadcastHeight,
      );
    });
  });
});
