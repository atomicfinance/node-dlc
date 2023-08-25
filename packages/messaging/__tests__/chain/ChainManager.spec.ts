import { expect } from 'chai';
import sinon from 'sinon';

import { ChainManager } from '../../lib/chain/ChainManager';
import { ChainMemoryStore } from '../../lib/chain/ChainMemoryStore';
import { IChainFilterChainClient } from '../../lib/chain/IChainFilterChainClient';
import {
  CloseType,
  DlcTransactionsV0,
} from '../../lib/messages/DlcTransactions';
import { createFakeLogger } from '../_test-utils';

const fundBlock = {
  hash: '61a8eb0296d80f9f173d397b551ceb14aaaacfb91570c0ec6ee96593a5f92847',
  height: 2885,
  buf: Buffer.from(
    '000000200e09e38f56938091e2a85912eb110135d00dc73a9de71ed9d0140eb69cf8876db28a05584986effa2fb6757e00fc6ec14a51655138001b964c9f99adb1af7933a0d58960ffff7f200000000002020000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff0502450b0101ffffffff02182f00000000000017a9140026e31816a85a8b2cddd4bf4c9248d5257ce5b4870000000000000000266a24aa21a9edb7dbaa40b737b2d733fd1fb05d79f43915bbd52e7c774a8932918797c3cb1d4c0120000000000000000000000000000000000000000000000000000000000000000000000000020000000001027d271264eaa899ce808a151b67a05a5e138bc59bff4a81acc606bbcc2054c33a0000000000ffffffff49956aee0f04ebeed5935729a2d6d5dc6abb5342acaa0248090c78b049e4d4e30000000000ffffffff0355a8980400000000220020543ff4768635379e2d3101d97f5a2a5e15d2acba04a6bd1322970241de8c593ce11f530700000000160014dddb7840134737de920ac4337cfd700a94d40ee6f2b1eb0b000000001600141b77056446c159cd6228632173c6117d67ed7df2024730440220733860701aa74b928ff6a2aa6e1f46074b1fe159d0bf98e5b669185cab6f86c9022013ca0c79abffecedeb683be50654f6d757763aea76b1fb70ac08f275c08da9a801210328917c56d06fc4045b0d4e6a0d917e4aea5f950294f95b870ac6c5d8c251e4af0247304402207da0a975df0e98f1d98ced003c2507e6848bbd05323f308f7e38cd1ecc1d12c902202140ec16d368ac52a514d0a84963f550a10e14d68dc2cb36fdaa39d3db2086e10121029f97f9c53bb8664b64346e9ce6340070a0e85396b4f185abef0d7ca23a71753d00000000',
    'hex',
  ),
};

const fundTxid =
  '089d8f783b6b68b35d50de766cb7847721db8f3a1a529b77abf15d0cb2edbeb2';

const closeBlock = {
  hash: '5293da71b1c64a177c6d9cef747ba44c7e05b476663ba1c2af423ee15077287a',
  height: 2886,
  buf: Buffer.from(
    '000000204728f9a59365e96eecc07015b9cfaaaa14eb1c557b393d179f0fd89602eba8616876e849e696d62f8ac71296f826b8b59b6cca46a9f97f220fe8c9037e3ae119a0d58960ffff7f200100000002020000000001010000000000000000000000000000000000000000000000000000000000000000ffffffff0502460b0101ffffffff02e42b00000000000017a9140026e31816a85a8b2cddd4bf4c9248d5257ce5b4870000000000000000266a24aa21a9edbbb084f6f98a556b730069c62876e38d8a8f85d7ba6ce47da3010c8a66013663012000000000000000000000000000000000000000000000000000000000000000000000000002000000000101b2beedb20c5df1ab779b521a3a8fdb217784b76c76de505db3686b3b788f9d080000000000ffffffff02e0739804000000001600144b71dd93c0727574dfd8403ed5f375922c6e3813d12d000000000000160014cc6f10246659b11e40bc8c7d346f43aae79cf2d7040047304402200eeb1c563649678dd57d5a028904673fcd8b262ecd7e59d713b39a12b4165c4802200e6c059dad137fcbf874b232bbc2b231f70d920ec0f3b306ea48bdcd13e6905001483045022100cf6359e4667e413da700a1ffe753dbe298c5cc67814286dd97444758dddda8220220786eb172c61eb20a7d4e8c3117cac23e9f8dd00a3330e9990e60af8d6a3247c501475221031a609094877c033c4e265879cac8dbd86678e30123a113c62f9c5a9d5452a381210367e32f0675eb51b233cb015ee98218b95d70de19390c30bafd7e82c5babafcb452ae00000000',
    'hex',
  ),
};

const closeTxid =
  'dfbc85071da98db1b4e82d5fe0623092eeebf45d1d1a36f963c5299dc4ff2b5a';

function createFakeChainClient() {
  return {
    getBlockchainInfo: sinon.stub().returns({
      blocks: closeBlock.height,
      bestblockhash: closeBlock.hash,
    }),
    getBlockHash: sinon.stub().returns(closeBlock.hash),
    getBlock: sinon.stub().returns({
      hash: closeBlock.hash,
      height: closeBlock.height,
    }),
    getRawBlock: sinon.stub().returns(closeBlock.buf),
    getTransaction: sinon.stub(),
    getUtxo: sinon.stub(),
    waitForSync: sinon.stub(),
  };
}

function createFakeChainClientNoCloseTx() {
  return {
    getBlockchainInfo: sinon.stub().returns({
      blocks: fundBlock.height,
      bestblockhash: fundBlock.hash,
    }),
    getBlockHash: sinon.stub().returns(fundBlock.hash),
    getBlock: sinon.stub().returns({
      hash: fundBlock.hash,
      height: fundBlock.height,
    }),
    getRawBlock: sinon.stub().returns(fundBlock.buf),
    getTransaction: sinon.stub().returns({
      txid: fundTxid,
      blockhash: fundBlock.hash,
    }),
    getUtxo: sinon.stub().returns({
      confirmations: '1',
    }),
    waitForSync: sinon.stub(),
  };
}

describe('ChainManager', () => {
  let sut: ChainManager;
  let dlcStore: ChainMemoryStore;
  let chainClient: IChainFilterChainClient;
  beforeEach(() => {
    dlcStore = new ChainMemoryStore();
    chainClient = createFakeChainClient();
    sut = new ChainManager(createFakeLogger(), chainClient, dlcStore);
  });

  describe('.start()', () => {
    describe('no history', () => {
      it('should restore block height to 0', async () => {
        await sut.start();
        expect(sut.blockHeight).to.equal(0);
      });
    });

    describe('with history', () => {
      beforeEach(async () => {
        const dlcTxs = DlcTransactionsV0.deserialize(
          Buffer.from(
            'ef2e5beedf007afc0528fadd297df3ad2568ab23b777cc1f1cbc36ee42aad5fdc83bc502000000027d271264eaa899ce808a151b67a05a5e138bc59bff4a81acc606bbcc2054c33a0000000000ffffffff49956aee0f04ebeed5935729a2d6d5dc6abb5342acaa0248090c78b049e4d4e30000000000ffffffff0355a8980400000000220020543ff4768635379e2d3101d97f5a2a5e15d2acba04a6bd1322970241de8c593ce11f530700000000160014dddb7840134737de920ac4337cfd700a94d40ee6f2b1eb0b000000001600141b77056446c159cd6228632173c6117d67ed7df2000000000000000061a8eb0296d80f9f173d397b551ceb14aaaacfb91570c0ec6ee96593a5f9284700000b4500000000710200000001b2beedb20c5df1ab779b521a3a8fdb217784b76c76de505db3686b3b788f9d080000000000feffffff02e1999804000000001600144b71dd93c0727574dfd8403ed5f375922c6e3813d007000000000000160014cc6f10246659b11e40bc8c7d346f43aae79cf2d78c10646001710200000001b2beedb20c5df1ab779b521a3a8fdb217784b76c76de505db3686b3b788f9d080000000000ffffffff02e0739804000000001600144b71dd93c0727574dfd8403ed5f375922c6e3813d12d000000000000160014cc6f10246659b11e40bc8c7d346f43aae79cf2d70000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
            'hex',
          ),
        );

        await dlcStore.saveDlcTransactions(dlcTxs);
      });

      it("should restore to highest dlc's block", async () => {
        await sut.start();
        expect(sut.blockHeight).to.equal(2886);
      });

      it('should include close epoch', async () => {
        await sut.start();
        const results = await dlcStore.findDlcTransactionsList();
        expect(results.length).to.equal(1);
        expect(results[0].closeEpoch.hash.toString('hex')).to.equal(
          closeBlock.hash,
        );
        expect(results[0].closeEpoch.height).to.equal(closeBlock.height);
        expect(results[0].closeType).to.equal(CloseType.ExecuteClose);
        expect(results[0].closeBroadcastHeight).to.equal(closeBlock.height - 1);
        expect(results[0].closeTxHash).to.deep.equal(
          Buffer.from(closeTxid, 'hex'),
        );
      });
    });

    describe('with sync requird', () => {
      it('waits for chain sync', async () => {
        // delay sync for 100 s
        chainClient.waitForSync = () =>
          new Promise((resolve) => setTimeout(resolve, 100));

        sut = new ChainManager(createFakeLogger(), chainClient, dlcStore);

        const start = Date.now();
        await sut.start();
        const end = Date.now();

        // start should be delayed by 100ms
        expect(end - start).to.be.gte(100);
      });
    });

    describe('with history but no close tx', () => {
      beforeEach(async () => {
        sut = new ChainManager(
          createFakeLogger(),
          createFakeChainClientNoCloseTx(),
          dlcStore,
        );

        const dlcTxs = DlcTransactionsV0.deserialize(
          Buffer.from(
            'ef2e5beedf007afc0528fadd297df3ad2568ab23b777cc1f1cbc36ee42aad5fdc83bc502000000027d271264eaa899ce808a151b67a05a5e138bc59bff4a81acc606bbcc2054c33a0000000000ffffffff49956aee0f04ebeed5935729a2d6d5dc6abb5342acaa0248090c78b049e4d4e30000000000ffffffff0355a8980400000000220020543ff4768635379e2d3101d97f5a2a5e15d2acba04a6bd1322970241de8c593ce11f530700000000160014dddb7840134737de920ac4337cfd700a94d40ee6f2b1eb0b000000001600141b77056446c159cd6228632173c6117d67ed7df2000000000000000061a8eb0296d80f9f173d397b551ceb14aaaacfb91570c0ec6ee96593a5f9284700000b4500000000710200000001b2beedb20c5df1ab779b521a3a8fdb217784b76c76de505db3686b3b788f9d080000000000feffffff02e1999804000000001600144b71dd93c0727574dfd8403ed5f375922c6e3813d007000000000000160014cc6f10246659b11e40bc8c7d346f43aae79cf2d78c10646001710200000001b2beedb20c5df1ab779b521a3a8fdb217784b76c76de505db3686b3b788f9d080000000000ffffffff02e0739804000000001600144b71dd93c0727574dfd8403ed5f375922c6e3813d12d000000000000160014cc6f10246659b11e40bc8c7d346f43aae79cf2d70000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
            'hex',
          ),
        );

        await dlcStore.saveDlcTransactions(dlcTxs);
      });

      it("should restore to highest dlc's block", async () => {
        await sut.start();
        expect(sut.blockHeight).to.equal(fundBlock.height);
      });

      it('should include fund epoch', async () => {
        await sut.start();
        const results = await dlcStore.findDlcTransactionsList();
        expect(results.length).to.equal(1);
        expect(results[0].fundEpoch.hash.toString('hex')).to.equal(
          fundBlock.hash,
        );
        expect(results[0].fundEpoch.height).to.equal(fundBlock.height);
      });
    });
  });
});
