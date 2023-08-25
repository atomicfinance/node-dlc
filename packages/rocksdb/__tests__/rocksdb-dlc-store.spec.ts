import { DlcTxBuilder } from '@node-dlc/core';
import {
  DlcAcceptV0,
  DlcCancelV0,
  DlcCloseV0,
  DlcOfferV0,
  DlcSignV0,
  DlcTransactionsV0,
  FundingInput,
} from '@node-dlc/messaging';
import { OutPoint } from '@node-lightning/bitcoin';
import { sha256, xor } from '@node-lightning/crypto';
import { expect } from 'chai';

import { RocksdbDlcStore } from '../lib/rocksdb-dlc-store';
import * as util from './rocksdb';

describe('RocksdbDlcStore', () => {
  let sut: RocksdbDlcStore;

  const protocolVersion = Buffer.from('00000001', 'hex');
  const contractFlags = Buffer.from('00', 'hex');
  const chainHash = Buffer.from(
    '06226e46111a0b59caaf126043eb5bbf28c34f3a5e332a1fc7b2b73cf188910f',
    'hex',
  );
  const temporaryContractId = Buffer.from(
    '2005f76575d3f0ff0fc32a7b8da3a4833d380f32eae5658704dd7ed945b6281a',
    'hex',
  );
  const contractInfo = Buffer.from(
    '00' + // type single_contract_info
      '000000000bebc200' + // total_collateral
      '00' + // type enumerated_contract_descriptor
      '03' + // num_outcomes
      '01' + // outcome_1_len
      '31' + // outcome_1
      '0000000000000000' + // payout_1
      '01' + // outcome_2_len
      '32' + // outcome_2
      '00000000092363a3' + // payout_2
      '01' + // outcome_3_len
      '33' + // outcome_3
      '000000000bebc200' + // payout_3
      '00' + // type single_oracle_info
      'fdd824' + // type oracle_announcement
      'a4' + // length
      'fab22628f6e2602e1671c286a2f63a9246794008627a1749639217f4214cb4a9' + // announcement_signature_r
      '494c93d1a852221080f44f697adb4355df59eb339f6ba0f9b01ba661a8b108d4' + // announcement_signature_s
      'da078bbb1d34e7729e38e2ae34236e776da121af442626fa31e31ae55a279a0b' + // oracle_public_key
      'fdd822' + // type oracle_event
      '40' + // length
      '0001' + // nb_nonces
      '3cfba011378411b20a5ab773cb95daab93e9bcd1e4cce44986a7dda84e01841b' + // oracle_nonces
      '00000000' + // event_maturity_epoch
      'fdd806' + // type enum_event_descriptor
      '10' + // length
      '0002' + // num_outcomes
      '06' + // outcome_1_len
      '64756d6d7931' + // outcome_1
      '06' + // outcome_2_len
      '64756d6d7932' + // outcome_2
      '05' + // event_id_length
      '64756d6d79', // event_id
    'hex',
  );

  const fundingPubKey = Buffer.from(
    '0327efea09ff4dfb13230e887cbab8821d5cc249c7ff28668c6633ff9f4b4c08e3',
    'hex',
  );

  const payoutSPKLen = Buffer.from('0016', 'hex');
  const payoutSPK = Buffer.from(
    '00142bbdec425007dc360523b0294d2c64d2213af498',
    'hex',
  );

  const payoutSerialID = Buffer.from('0000000000b051dc', 'hex');
  const offerCollateralSatoshis = Buffer.from('0000000005f5e0FF', 'hex'); // 99999999
  const fundingInputsLen = Buffer.from('01', 'hex');

  const fundingInput = Buffer.from(
    '000000000000fa51' + // input_serial_id
      '29' + // prevtx_len
      '02000000000100c2eb0b00000000160014369d63a82ed846f4d47ad55045e594ab95539d6000000000' + // prevtx
      '00000000' + // prevtx_vout
      'ffffffff' + // sequence
      '006b' + // max_witness_len
      '0000', // redeemscript_len
    'hex',
  );

  const changeSPKLen = Buffer.from('0016', 'hex');
  const changeSPK = Buffer.from(
    '0014afa16f949f3055f38bd3a73312bed00b61558884',
    'hex',
  );

  const changeSerialID = Buffer.from('00000000001ea3ed', 'hex');
  const fundOutputSerialID = Buffer.from('000000000052947a', 'hex');
  const feeRatePerVb = Buffer.from('0000000000000001', 'hex');
  const cetLocktime = Buffer.from('00000064', 'hex');
  const refundLocktime = Buffer.from('000000c8', 'hex');

  const dlcOfferHex = Buffer.concat([
    Buffer.from('a71a', 'hex'), // DlcOfferV0 type
    protocolVersion,
    contractFlags,
    chainHash,
    temporaryContractId,
    contractInfo,
    fundingPubKey,
    payoutSPKLen,
    payoutSPK,
    payoutSerialID,
    offerCollateralSatoshis,
    fundingInputsLen,
    fundingInput,
    changeSPKLen,
    changeSPK,
    changeSerialID,
    fundOutputSerialID,
    feeRatePerVb,
    cetLocktime,
    refundLocktime,
  ]);

  const dlcOffer = DlcOfferV0.deserialize(dlcOfferHex);

  const acceptCollateral = Buffer.from('0000000005f5e100', 'hex');

  const cetAdaptorSignatures = Buffer.from(
    '03' + // nb_signatures
      '016292f1b5c67b675aea69c95ec81e8462ab5bb9b7a01f810f6d1a7d1d886893b3605fe7fcb75a14b1b1de917917d37e9efac6437d7a080da53fb6dbbcfbfbe7a8' + // ecdsa_adaptor_signature_1
      '01efbecb2bce89556e1fb4d31622628830e02a6d04c487f67aca20e9f60fb127f985293541cd14e2bf04e4777d50953531e169dd37c65eb3cc17d6b5e4dbe58487f9fae1f68f603fe014a699a346b14a63048c26c9b31236d83a7e369a2b29a292' + // dleq_proof_1
      '00e52fe05d832bcce4538d9c27f3537a0f2086b265b6498f30cf667f77ff2fa87606574bc9a915ef57f7546ebb6852a490ad0547bdc52b19791d2d0f0cc0acabab' + // ecdsa_adaptor_signature_2
      '01f32459001a28850fa8ee4278111deb0494a8175f02e31a1c18b39bd82ec64026a6f341bcd5ba169d67b855030e36bdc65feecc0397a07d3bc514da69811ec5485f5553aebda782bc5ac9b47e8e11d701a38ef2c2b7d8af3906dd8dfc759754ce' + // dleq_proof_2
      '006f769592c744141a5ddface6e98f756a9df1bb75ad41508ea013bdfee133b396d85be51f870bf2e0ae836bfa984109dab96cc6f4ab2a7f118bc6b0b25a4c70d4' + // ecdsa_adaptor_signature_3
      '01c768c1d677c6ff0b7ea69fdf29aff1000794227db368dff16e838d1f44c4afe9e952ee63d603f7b14de13c1d73b363cc2b1740d0b688e73d8e71cddf40f8e7e912df413903779c4e5d6644c504c8609baec8fdcb90d6d341cf316748f5d7945f', // dleq_proof_3
    'hex',
  );

  const refundSignature = Buffer.from(
    '7c8ad6de287b62a1ed1d74ed9116a5158abc7f97376d201caa88e0f9daad68fcda4c271cc003512e768f403a57e5242bd1f6aa1750d7f3597598094a43b1c7bb',
    'hex',
  );

  const negotiationFields = Buffer.from('00', 'hex');

  const dlcAcceptHex = Buffer.concat([
    Buffer.from('a71c', 'hex'), // DlcAcceptV0 type
    protocolVersion,
    temporaryContractId,
    acceptCollateral,
    fundingPubKey,
    payoutSPKLen,
    payoutSPK,
    payoutSerialID,
    fundingInputsLen,
    fundingInput,
    changeSPKLen,
    changeSPK,
    changeSerialID,
    cetAdaptorSignatures,
    refundSignature,
    negotiationFields,
  ]);

  const dlcAccept = DlcAcceptV0.deserialize(dlcAcceptHex);

  const fundingSignatures = Buffer.from(
    '01' + // num_witnesses
      '02' + // stack_len
      '47' + // stack_element_len
      '304402203812d7d194d44ec68f244cc3fd68507c563ec8c729fdfa3f4a79395b98abe84f0220704ab3f3ffd9c50c2488e59f90a90465fccc2d924d67a1e98a133676bf52f37201' + // stack_element
      '21' + // stack_element_len
      '02dde41aa1f21671a2e28ad92155d2d66e0b5428de15d18db4cbcf216bf00de919', // stack_element
    'hex',
  );

  const txBuilder = new DlcTxBuilder(dlcOffer, dlcAccept.withoutSigs());
  const tx = txBuilder.buildFundingTransaction();
  const fundingTxid = tx.txId.serialize();
  const contractId = xor(fundingTxid, temporaryContractId);

  const dlcSignHex = Buffer.concat([
    Buffer.from('a71e', 'hex'), // DlcSignV0 type
    protocolVersion,
    contractId,
    cetAdaptorSignatures,
    refundSignature,
    fundingSignatures,
  ]);

  const dlcSign = DlcSignV0.deserialize(dlcSignHex);

  const dlcTxsHex = Buffer.from(
    'ef2e' + // type
      '5beedf007afc0528fadd297df3ad2568ab23b777cc1f1cbc36ee42aad5fdc83b' + // contract_id
      // '00' +
      'c5' + // fund_tx_len
      '02000000027d271264eaa899ce808a151b67a05a5e138bc59bff4a81acc606bbcc2054c33a0000000000ffffffff49956aee0f04ebeed5935729a2d6d5dc6abb5342acaa0248090c78b049e4d4e30000000000ffffffff0355a8980400000000220020543ff4768635379e2d3101d97f5a2a5e15d2acba04a6bd1322970241de8c593ce11f530700000000160014dddb7840134737de920ac4337cfd700a94d40ee6f2b1eb0b000000001600141b77056446c159cd6228632173c6117d67ed7df200000000' + // fund_tx
      '00000000' + // fund_tx_vout
      '5293da71b1c64a177c6d9cef747ba44c7e05b476663ba1c2af423ee15077287a' + // fund_hash
      '00000b46' + // fund_height
      '00000000' + // fund_broadcast_height
      // '00' +
      '71' + // refund_tx_len
      '0200000001b2beedb20c5df1ab779b521a3a8fdb217784b76c76de505db3686b3b788f9d080000000000feffffff02e1999804000000001600144b71dd93c0727574dfd8403ed5f375922c6e3813d007000000000000160014cc6f10246659b11e40bc8c7d346f43aae79cf2d78c106460' + // refund_tx
      '01' + // num_cets
      // '00' +
      '71' + // cet_len
      '0200000001b2beedb20c5df1ab779b521a3a8fdb217784b76c76de505db3686b3b788f9d080000000000ffffffff02e0739804000000001600144b71dd93c0727574dfd8403ed5f375922c6e3813d12d000000000000160014cc6f10246659b11e40bc8c7d346f43aae79cf2d700000000' + // cet
      '0000000000000000000000000000000000000000000000000000000000000000' + // close_hash
      '00000000' + // close_height
      '0000000000000000000000000000000000000000000000000000000000000000' + // close_tx_hash
      '00' + // close_type
      '00000000', // close_broadcast_height
    'hex',
  );

  const dlcTxs = DlcTransactionsV0.deserialize(dlcTxsHex);

  const dlcCancelHex = Buffer.from(
    'cbcc' + // DlcCancelV0 type
      'c1c79e1e9e2fa2840b2514902ea244f39eb3001a4037a52ea43c797d4f841269' +
      '00',
    'hex',
  );

  const dlcCancel = DlcCancelV0.deserialize(dlcCancelHex);

  const closeSignature = Buffer.from(
    '7c8ad6de287b62a1ed1d74ed9116a5158abc7f97376d201caa88e0f9daad68fcda4c271cc003512e768f403a57e5242bd1f6aa1750d7f3597598094a43b1c7bb',
    'hex',
  );

  const offerPayoutSatoshis = Buffer.from('0000000005f5e100', 'hex');
  const acceptPayoutSatoshis = Buffer.from('0000000005f5e100', 'hex');
  const fundInputSerialId = Buffer.from('00000000075bcd15', 'hex');

  const dlcCloseHex = Buffer.concat([
    Buffer.from('cbca', 'hex'), // DlcCloseV0 type
    contractId,
    closeSignature,
    offerPayoutSatoshis,
    acceptPayoutSatoshis,
    fundInputSerialId,
    fundingInputsLen,
    fundingInput,
    fundingSignatures,
  ]);

  const dlcClose = DlcCloseV0.deserialize(dlcCloseHex);

  before(async () => {
    util.rmdir('.testdb');
    sut = new RocksdbDlcStore('./.testdb/nested/dir');
    await sut.open();
  });

  after(async () => {
    await sut.close();
    util.rmdir('.testdb');
  });

  describe('save dlc_offer', () => {
    it('should save dlc_offer', async () => {
      await sut.saveDlcOffer(dlcOffer);
    });
  });

  describe('find dlc_offer by temporaryContractId', () => {
    it('should return the dlc_offer object', async () => {
      // const temporaryContractId = sha256(dlcOfferHex);
      // const actual = await sut.findDlcOffer(temporaryContractId);
      const actual = await sut.findDlcOffer(temporaryContractId);

      const actualFundingInputs = actual.fundingInputs as FundingInput[];
      const expectedFundingInputs = dlcOffer.fundingInputs as FundingInput[];

      expect(
        actualFundingInputs[0].prevTx.serialize().toString('hex'),
      ).to.equal(expectedFundingInputs[0].prevTx.serialize().toString('hex'));
      expect(actual.contractInfo).to.deep.equal(dlcOffer.contractInfo);
    });
  });

  describe('find dlc_offer by eventId', () => {
    it('should return the dlc_offer object', async () => {
      const response = await sut.findDlcOffersByEventId('dummy');

      const actual = response[0];

      const actualFundingInputs = actual.fundingInputs as FundingInput[];
      const expectedFundingInputs = dlcOffer.fundingInputs as FundingInput[];

      expect(
        actualFundingInputs[0].prevTx.serialize().toString('hex'),
      ).to.equal(expectedFundingInputs[0].prevTx.serialize().toString('hex'));
      expect(actual.contractInfo).to.deep.equal(dlcOffer.contractInfo);
    });
  });

  describe('find num_dlc_offer', () => {
    it('should return the num_dlc_offer', async () => {
      const numDlcOffers = await sut.findNumDlcOffers();
      expect(numDlcOffers).to.equal(1);
    });
  });

  describe('delete dlc_offer', () => {
    it('should delete dlc_offer', async () => {
      const temporaryContractId = sha256(dlcOfferHex);

      await sut.deleteDlcOffer(temporaryContractId);

      const actual = await sut.findDlcOffer(temporaryContractId);
      expect(actual).to.be.undefined;
    });
  });

  describe('save dlc_accept', () => {
    it('should save dlc_accept', async () => {
      await sut.saveDlcOffer(dlcOffer);
      await sut.saveDlcAccept(dlcAccept);
    });
  });

  describe('find dlc_accept by contractId', () => {
    it('should return the dlc_accept object', async () => {
      const actual = await sut.findDlcAccept(contractId);

      expect(
        actual.fundingInputs[0].prevTx.serialize().toString('hex'),
      ).to.equal(dlcAccept.fundingInputs[0].prevTx.serialize().toString('hex'));
      expect(actual.cetSignatures).to.deep.equal(dlcAccept.cetSignatures);
    });
  });

  describe('find dlc_accept by outpoint', () => {
    it('should return dlc accept object', async () => {
      const outpointStr = `${dlcAccept.fundingInputs[0].prevTx.txId.toString()}:${
        dlcAccept.fundingInputs[0].prevTxVout
      }`;
      const outpoint = OutPoint.fromString(outpointStr);
      const actual = await sut.findDlcAcceptByOutpoint(outpoint);

      expect(
        actual.fundingInputs[0].prevTx.serialize().toString('hex'),
      ).to.equal(dlcAccept.fundingInputs[0].prevTx.serialize().toString('hex'));
      expect(actual.cetSignatures).to.deep.equal(dlcAccept.cetSignatures);
    });
  });

  describe('find dlc_accept by temp_contract_id', () => {
    it('should return dlc accept object', async () => {
      const actualContractId = await sut.findContractIdFromTemp(
        dlcAccept.temporaryContractId,
      );
      const actual = await sut.findDlcAccept(actualContractId);

      expect(
        actual.fundingInputs[0].prevTx.serialize().toString('hex'),
      ).to.equal(dlcAccept.fundingInputs[0].prevTx.serialize().toString('hex'));
      expect(actual.cetSignatures).to.deep.equal(dlcAccept.cetSignatures);
    });
  });

  describe('find dlc_offer by contract_id', () => {
    it('should return dlc offer object', async () => {
      const tempContractIdsMapping = await sut.findTempContractIds([
        contractId,
      ]);
      const dlcOffers = await sut.findDlcOffersByTempContractIds(
        tempContractIdsMapping.map(
          (tempContractIdsMapping) => tempContractIdsMapping[1],
        ),
      );

      const actual = dlcOffers[0];

      const actualFundingInputs = actual.fundingInputs as FundingInput[];
      const expectedFundingInputs = dlcOffer.fundingInputs as FundingInput[];

      expect(
        actualFundingInputs[0].prevTx.serialize().toString('hex'),
      ).to.equal(expectedFundingInputs[0].prevTx.serialize().toString('hex'));
      expect(actual.contractInfo).to.deep.equal(dlcOffer.contractInfo);
    });
  });

  describe('find first dlc_accept', () => {
    it('should return dlc accept object', async () => {
      const actual = await sut.findFirstDlcAccept();

      expect(
        actual.fundingInputs[0].prevTx.serialize().toString('hex'),
      ).to.equal(dlcAccept.fundingInputs[0].prevTx.serialize().toString('hex'));
      expect(actual.cetSignatures).to.deep.equal(dlcAccept.cetSignatures);
    });
  });

  describe('find num_dlc_accept', () => {
    it('should return the num_dlc_accept', async () => {
      const numDlcAccepts = await sut.findNumDlcAccepts();
      expect(numDlcAccepts).to.equal(1);
    });
  });

  describe('delete dlc_offer', () => {
    it('should delete dlc_offer', async () => {
      await sut.deleteDlcOffer(contractId);

      const actual = await sut.findDlcOffer(contractId);
      expect(actual).to.be.undefined;
    });
  });

  describe('save dlc_sign', () => {
    it('should save dlc_sign', async () => {
      await sut.saveDlcSign(dlcSign);
    });
  });

  describe('find dlc_sign by contractId', () => {
    it('should return the dlc_sign object', async () => {
      const actual = await sut.findDlcSign(dlcSign.contractId);
      expect(actual).to.deep.equal(dlcSign);
    });
  });

  describe('find num_dlc_sign', () => {
    it('should return the num_dlc_sign', async () => {
      const numDlcSigns = await sut.findNumDlcSigns();
      expect(numDlcSigns).to.equal(1);
    });
  });

  describe('delete dlc_sign', () => {
    it('should delete dlc_sign', async () => {
      await sut.deleteDlcSign(dlcSign.contractId);

      const actual = await sut.findDlcSign(dlcSign.contractId);
      expect(actual).to.be.undefined;
    });
  });

  describe('save dlc_cancel', () => {
    it('should save dlc_cancel', async () => {
      await sut.saveDlcCancel(dlcCancel);
    });
  });

  describe('find dlc_cancel by contractId', () => {
    it('should return the dlc_cancel object', async () => {
      const actual = await sut.findDlcCancel(dlcCancel.contractId);
      expect(actual).to.deep.equal(dlcCancel);
    });
  });

  describe('delete dlc_cancel', () => {
    it('should delete dlc_cancel', async () => {
      await sut.deleteDlcCancel(dlcCancel.contractId);

      const actual = await sut.findDlcSign(dlcCancel.contractId);
      expect(actual).to.be.undefined;
    });
  });

  describe('save dlc_close', () => {
    it('should save dlc_close', async () => {
      await sut.saveDlcClose(dlcClose);
    });
  });

  describe('find dlc_close by contractId', () => {
    it('should return the dlc_close object', async () => {
      const actual = await sut.findDlcClose(dlcClose.contractId);
      expect(actual).to.deep.equal(dlcClose);
    });
  });

  describe('delete dlc_close', () => {
    it('should delete dlc_close', async () => {
      await sut.deleteDlcClose(dlcClose.contractId);
      const actual = await sut.findDlcSign(dlcClose.contractId);
      expect(actual).to.be.undefined;
    });
  });

  describe('save dlc_transactions', () => {
    it('should save dlc_transactions', async () => {
      await sut.saveDlcTransactions(dlcTxs);
    });
  });

  describe('find dlc_transactions by contractId', () => {
    it('should return the dlc_txs object', async () => {
      const actual = await sut.findDlcTransactions(dlcTxs.contractId);
      expect(actual.fundTx.serialize()).to.deep.equal(
        dlcTxs.fundTx.serialize(),
      );
    });
  });

  describe('find dlc_transactions by outpoint', () => {
    it('should return dlc_txs object', async () => {
      const outpoint = OutPoint.fromString(
        `${dlcTxs.fundTx.txId.toString()}:${dlcTxs.fundTxVout}`,
      );

      const actual = await sut.findDlcTransactionsByOutpoint(outpoint);
      expect(actual.fundTx.serialize()).to.deep.equal(
        dlcTxs.fundTx.serialize(),
      );
    });
  });

  describe('find dlc_transactions by scriptpubkey', () => {
    it('should return dlc_txs object', async () => {
      const scriptPubKey =
        dlcTxs.fundTx.outputs[dlcTxs.fundTxVout].scriptPubKey;

      const actual = await sut.findDlcTransactionsByScriptPubKey(scriptPubKey);
      expect(actual.fundTx.serialize()).to.deep.equal(
        dlcTxs.fundTx.serialize(),
      );
    });
  });

  describe('find num_dlc_transactions', () => {
    it('should return the num_dlc_transactions', async () => {
      const numDlcTxs = await sut.findNumDlcTransactionsList();
      expect(numDlcTxs).to.equal(1);
    });
  });

  describe('delete dlc_transactions', () => {
    it('should', async () => {
      await sut.deleteDlcTransactions(dlcTxs.contractId);

      const actual = await sut.findDlcTransactions(dlcTxs.contractId);
      expect(actual).to.be.undefined;
    });
  });
});
