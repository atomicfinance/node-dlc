import { Tx } from '@node-lightning/bitcoin';
import { StreamReader } from '@node-lightning/bufio';
import { expect } from 'chai';

import {
  DlcTransactionsPre163,
  DlcTransactionsV0Pre163,
} from '../../../lib/messages/pre-163/DlcTransactions';
import { MessageType } from '../../../lib/MessageType';

describe('DlcTransactionsV0Pre163', () => {
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
      const instance = new DlcTransactionsV0Pre163();

      instance.contractId = contractId;
      instance.fundTx = fundTx;
      instance.fundTxVout = fundTxVout;
      instance.refundTx = refundTx;
      instance.cets.push(cet0);
      instance.cets.push(cet1);

      expect(instance.serialize().toString("hex")).to.equal(
        "ef2e" + // type
        "6010a7e779c5079493ad06abbcaca06b8a04d501890cd724104d1df6e20968e8" + // contract_id
        "00c5" + // fund_tx_len
        "02000000022f76d0509ca3ad7559e0f45489aa2efea70f8657e3cdfce6b8194019012370a10100000000ffffffffd295f485f2d181eb06ae6d5e62007db4bfe52ad31e6e1a5c576e2f396bbda9470100000000ffffffff03aed10e000000000022002034e21059bdd0c5d1d3f2d03075b33ec89c9a018a855158a6c605d921e41db8fd88f6dc0b00000000160014ccd5d5d8249b94c4381c478907c2ad81f0c35227f2b1eb0b000000001600149212ec2ed940f3cd93bfbd16c5f817ee079243bb00000000" +
        "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "0071" + // refund_tx_len
        "02000000017f19d63285e628c1b0702cd1a11df6fe4d2acc75595dc52fb8d2842b13aa56220000000000feffffff023ac30e000000000016001442795b177d2bd1d538d379af766a979e4056d43cd007000000000000160014f9e38ab4d13bc36fd4df0381e355d9f7b50d69808c106460" +
        "02" + // num_cets
        "0052" + // cet_0_len
        "02000000017f19d63285e628c1b0702cd1a11df6fe4d2acc75595dc52fb8d2842b13aa56220000000000ffffffff010acb0e000000000016001442795b177d2bd1d538d379af766a979e4056d43c00000000" +
        "0052" + // cet_1_len
        "02000000017f19d63285e628c1b0702cd1a11df6fe4d2acc75595dc52fb8d2842b13aa56220000000000ffffffff010acb0e000000000016001442795b177d2bd1d538d379af766a979e4056d43c00000000" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    const buf = Buffer.from(
      "ef2e" + // type
      "6010a7e779c5079493ad06abbcaca06b8a04d501890cd724104d1df6e20968e8" + // contract_id
      "00c5" + // fund_tx_len
      "02000000022f76d0509ca3ad7559e0f45489aa2efea70f8657e3cdfce6b8194019012370a10100000000ffffffffd295f485f2d181eb06ae6d5e62007db4bfe52ad31e6e1a5c576e2f396bbda9470100000000ffffffff03aed10e000000000022002034e21059bdd0c5d1d3f2d03075b33ec89c9a018a855158a6c605d921e41db8fd88f6dc0b00000000160014ccd5d5d8249b94c4381c478907c2ad81f0c35227f2b1eb0b000000001600149212ec2ed940f3cd93bfbd16c5f817ee079243bb00000000" +
      "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
      "0071" + // refund_tx_len
      "02000000017f19d63285e628c1b0702cd1a11df6fe4d2acc75595dc52fb8d2842b13aa56220000000000feffffff023ac30e000000000016001442795b177d2bd1d538d379af766a979e4056d43cd007000000000000160014f9e38ab4d13bc36fd4df0381e355d9f7b50d69808c106460" +
      "02" + // num_cets
      "0052" + // cet_0_len
      "02000000017f19d63285e628c1b0702cd1a11df6fe4d2acc75595dc52fb8d2842b13aa56220000000000ffffffff010acb0e000000000016001442795b177d2bd1d538d379af766a979e4056d43c00000000" +
      "0052" + // cet_1_len
      "02000000017f19d63285e628c1b0702cd1a11df6fe4d2acc75595dc52fb8d2842b13aa56220000000000ffffffff010acb0e000000000016001442795b177d2bd1d538d379af766a979e4056d43c00000000" +
      "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      , "hex"
    ); // prettier-ignore

    it('deserializes', () => {
      const unknownInstance = DlcTransactionsPre163.deserialize(buf);

      if (unknownInstance.type === MessageType.DlcTransactionsV0) {
        const instance = unknownInstance as DlcTransactionsV0Pre163;

        expect(instance.fundTx.serialize()).to.deep.equal(fundTx.serialize());
        expect(Number(instance.fundTxVout)).to.deep.equal(Number(fundTxVout));
        expect(instance.refundTx.serialize()).to.deep.equal(
          refundTx.serialize(),
        );
        expect(instance.cets[0].serialize()).to.deep.equal(cet0.serialize());
        expect(instance.cets[1].serialize()).to.deep.equal(cet1.serialize());
      } else {
        throw Error('DlcTransactionsPre163 Incorrect type');
      }
    });

    it('deserializes without cets', () => {
      // Set parseCets to false
      const unknownInstance = DlcTransactionsPre163.deserialize(buf, false);

      if (unknownInstance.type === MessageType.DlcTransactionsV0) {
        const instance = unknownInstance as DlcTransactionsV0Pre163;

        expect(instance.fundTx.serialize()).to.deep.equal(fundTx.serialize());
        expect(Number(instance.fundTxVout)).to.deep.equal(Number(fundTxVout));
        expect(instance.refundTx.serialize()).to.deep.equal(
          refundTx.serialize(),
        );
        expect(instance.cets.length).to.equal(1);
      } else {
        throw Error('DlcTransactionsPre163 Incorrect type');
      }
    });
  });

  describe('toJSON', () => {
    it('convert to JSON', async () => {
      const instance = new DlcTransactionsV0Pre163();

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
});
