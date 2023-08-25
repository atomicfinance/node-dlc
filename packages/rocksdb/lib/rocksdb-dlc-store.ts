import { DlcTxBuilder } from '@node-dlc/core';
import {
  SingleContractInfo,
  DisjointContractInfo,
  SingleOracleInfo,
  DlcAcceptV0,
  DlcCancelV0,
  DlcCloseV0,
  DlcOfferV0,
  DlcSignV0,
  DlcTransactionsV0,
  FundingInput,
} from '@node-dlc/messaging';
import { OutPoint, Script } from '@node-lightning/bitcoin';
import { xor } from '@node-lightning/crypto';
import { RocksdbBase } from '@node-lightning/gossip-rocksdb';

enum Prefix {
  DlcOfferV0 = 50,
  DlcAcceptV0 = 51,
  DlcSignV0 = 52,
  DlcTransactionsV0 = 53,
  Outpoint = 54,
  ScriptPubKey = 55,
  DlcCancelV0 = 56,
  DlcCloseV0 = 57,
  TempContractId = 58,
}

export class RocksdbDlcStore extends RocksdbBase {
  public async findDlcOffers(): Promise<DlcOfferV0[]> {
    return new Promise((resolve, reject) => {
      const stream = this._db.createReadStream();
      const results: DlcOfferV0[] = [];
      stream.on('data', (data) => {
        if (data.key[0] === Prefix.DlcOfferV0) {
          results.push(DlcOfferV0.deserialize(data.value));
        }
      });
      stream.on('end', () => {
        resolve(results);
      });
      stream.on('error', (err) => reject(err));
    });
  }

  public async findNumDlcOffers(): Promise<number> {
    return new Promise((resolve, reject) => {
      const stream = this._db.createReadStream();
      let num = 0;
      stream.on('data', (data) => {
        if (data.key[0] === Prefix.DlcOfferV0) num++;
      });
      stream.on('end', () => {
        resolve(num);
      });
      stream.on('error', (err) => reject(err));
    });
  }

  public async findDlcOffer(temporaryContractId: Buffer): Promise<DlcOfferV0> {
    const key = Buffer.concat([
      Buffer.from([Prefix.DlcOfferV0]),
      temporaryContractId,
    ]);
    const raw = await this._safeGet<Buffer>(key);
    if (!raw) return;
    return DlcOfferV0.deserialize(raw);
  }

  public async findDlcOffersByTempContractIds(
    tempContractIds: Buffer[],
  ): Promise<DlcOfferV0[]> {
    const dlcOffers = await Promise.all(
      tempContractIds.map((temporaryContractId) =>
        this.findDlcOffer(temporaryContractId),
      ),
    );
    return dlcOffers.filter((dlcOffer) => !!dlcOffer);
  }

  public async findDlcOffersByEventId(eventId: string): Promise<DlcOfferV0[]> {
    return new Promise((resolve, reject) => {
      const stream = this._db.createReadStream();
      const results: DlcOfferV0[] = [];
      stream.on('data', (data) => {
        if (data.key[0] === Prefix.DlcOfferV0) {
          const dlcOffer = DlcOfferV0.deserialize(data.value);
          if (dlcOffer.contractInfo.type === SingleContractInfo.type) {
            if (
              ((dlcOffer.contractInfo as SingleContractInfo)
                .oracleInfo as SingleOracleInfo).announcement.oracleEvent
                .eventId === eventId
            ) {
              results.push(dlcOffer);
            }
          } else if (dlcOffer.contractInfo.type === DisjointContractInfo.type) {
            (dlcOffer.contractInfo as DisjointContractInfo).contractOraclePairs.some(
              (pair) => {
                if (
                  (pair.oracleInfo as SingleOracleInfo).announcement.oracleEvent
                    .eventId === eventId
                ) {
                  results.push(dlcOffer);
                  return true; // Returning true will stop the iteration since we've found a match
                }
                return false; // Returning false will continue the iteration to check other pairs
              },
            );
          }
        }
      });
      stream.on('end', () => {
        resolve(results);
      });
      stream.on('error', (err) => reject(err));
    });
  }

  public async saveDlcOffer(dlcOffer: DlcOfferV0): Promise<void> {
    const value = dlcOffer.serialize();
    const key = Buffer.concat([
      Buffer.from([Prefix.DlcOfferV0]),
      dlcOffer.temporaryContractId,
    ]);
    await this._db.put(key, value);
  }

  public async deleteDlcOffer(temporaryContractId: Buffer): Promise<void> {
    const key = Buffer.concat([
      Buffer.from([Prefix.DlcOfferV0]),
      temporaryContractId,
    ]);
    await this._db.del(key);
  }

  public async findDlcAccepts(): Promise<DlcAcceptV0[]> {
    return new Promise((resolve, reject) => {
      const stream = this._db.createReadStream();
      const results: DlcAcceptV0[] = [];
      stream.on('data', (data) => {
        if (data.key[0] === Prefix.DlcAcceptV0) {
          results.push(DlcAcceptV0.deserialize(data.value));
        }
      });
      stream.on('end', () => {
        resolve(results);
      });
      stream.on('error', (err) => reject(err));
    });
  }

  public async findFirstDlcAccept(): Promise<DlcAcceptV0> {
    return new Promise((resolve, reject) => {
      const stream = this._db.createReadStream();
      let result: DlcAcceptV0;
      stream.on('data', (data) => {
        if (data.key[0] === Prefix.DlcAcceptV0 && !result) {
          result = DlcAcceptV0.deserialize(data.value);
        }
      });
      stream.on('end', () => {
        resolve(result);
      });
      stream.on('error', (err) => reject(err));
    });
  }

  public async findNumDlcAccepts(): Promise<number> {
    return new Promise((resolve, reject) => {
      const stream = this._db.createReadStream();
      let num = 0;
      stream.on('data', (data) => {
        if (data.key[0] === Prefix.DlcAcceptV0) num++;
      });
      stream.on('end', () => {
        resolve(num);
      });
      stream.on('error', (err) => reject(err));
    });
  }

  public async findDlcAccept(
    contractId: Buffer,
    parseCets = true,
  ): Promise<DlcAcceptV0> {
    const key = Buffer.concat([Buffer.from([Prefix.DlcAcceptV0]), contractId]);
    const raw = await this._safeGet<Buffer>(key);
    if (!raw) return;
    return DlcAcceptV0.deserialize(raw, parseCets);
  }

  public async findDlcAcceptByOutpoint(
    outpoint: OutPoint,
  ): Promise<DlcAcceptV0> {
    const key = Buffer.concat([
      Buffer.from([Prefix.Outpoint]),
      Buffer.from(outpoint.toString()),
    ]);
    const contractId = await this._safeGet<Buffer>(key);
    return this.findDlcAccept(contractId);
  }

  public async findContractIdFromTemp(temporaryContractId: Buffer): Promise<Buffer> {
    const key = Buffer.concat([
      Buffer.from([Prefix.TempContractId]),
      temporaryContractId,
    ]);
    const contractId = await this._safeGet<Buffer>(key);
    return contractId;
  }

  public async findTempContractIds(
    contractIds: Buffer[],
  ): Promise<[Buffer, Buffer][]> {
    const tempContractIdsMappings = await Promise.all(
      contractIds.map(async (contractId) => {
        const dlcAccept = await this.findDlcAccept(contractId, false);
        if (!dlcAccept) return;
        return [contractId, dlcAccept.temporaryContractId] as [Buffer, Buffer];
      }),
    );

    return tempContractIdsMappings.filter(
      (tempContractIdsMapping) => !!tempContractIdsMapping,
    );
  }

  public async saveDlcAccept(dlcAccept: DlcAcceptV0): Promise<void> {
    const dlcOffer = await this.findDlcOffer(dlcAccept.temporaryContractId);
    const txBuilder = new DlcTxBuilder(dlcOffer, dlcAccept.withoutSigs());
    const tx = txBuilder.buildFundingTransaction();
    const fundingTxid = tx.txId.serialize();
    const contractId = xor(fundingTxid, dlcAccept.temporaryContractId);
    const value = dlcAccept.serialize();
    const key = Buffer.concat([Buffer.from([Prefix.DlcAcceptV0]), contractId]);
    await this._db.put(key, value);

    // store funding input outpoint reference
    for (let i = 0; i < dlcAccept.fundingInputs.length; i++) {
      const fundingInput = dlcAccept.fundingInputs[i] as FundingInput;

      const outpoint = OutPoint.fromString(
        `${fundingInput.prevTx.txId.toString()}:${fundingInput.prevTxVout}`,
      );

      const key2 = Buffer.concat([
        Buffer.from([Prefix.Outpoint]),
        Buffer.from(outpoint.toString()),
      ]);
      await this._db.put(key2, contractId);
    }

    const key3 = Buffer.concat([
      Buffer.from([Prefix.TempContractId]),
      dlcAccept.temporaryContractId,
    ]);
    await this._db.put(key3, contractId);
  }

  public async deleteDlcAccept(contractId: Buffer): Promise<void> {
    const key = Buffer.concat([Buffer.from([Prefix.DlcAcceptV0]), contractId]);
    await this._db.del(key);
  }

  public async findDlcSigns(): Promise<DlcSignV0[]> {
    return new Promise((resolve, reject) => {
      const stream = this._db.createReadStream();
      const results: DlcSignV0[] = [];
      stream.on('data', (data) => {
        if (data.key[0] === Prefix.DlcSignV0) {
          results.push(DlcSignV0.deserialize(data.value));
        }
      });
      stream.on('end', () => {
        resolve(results);
      });
      stream.on('error', (err) => reject(err));
    });
  }

  public async findNumDlcSigns(): Promise<number> {
    return new Promise((resolve, reject) => {
      const stream = this._db.createReadStream();
      let num = 0;
      stream.on('data', (data) => {
        if (data.key[0] === Prefix.DlcSignV0) num++;
      });
      stream.on('end', () => {
        resolve(num);
      });
      stream.on('error', (err) => reject(err));
    });
  }

  public async findDlcSign(contractId: Buffer): Promise<DlcSignV0> {
    const key = Buffer.concat([Buffer.from([Prefix.DlcSignV0]), contractId]);
    const raw = await this._safeGet<Buffer>(key);
    if (!raw) return;
    return DlcSignV0.deserialize(raw);
  }

  public async saveDlcSign(dlcSign: DlcSignV0): Promise<void> {
    const value = dlcSign.serialize();
    const key = Buffer.concat([
      Buffer.from([Prefix.DlcSignV0]),
      dlcSign.contractId,
    ]);
    await this._db.put(key, value);
  }

  public async deleteDlcSign(contractId: Buffer): Promise<void> {
    const key = Buffer.concat([Buffer.from([Prefix.DlcSignV0]), contractId]);
    await this._db.del(key);
  }

  public async findDlcCancels(): Promise<DlcCancelV0[]> {
    return new Promise((resolve, reject) => {
      const stream = this._db.createReadStream();
      const results: DlcCancelV0[] = [];
      stream.on('data', (data) => {
        if (data.key[0] === Prefix.DlcCancelV0) {
          results.push(DlcCancelV0.deserialize(data.value));
        }
      });
      stream.on('end', () => {
        resolve(results);
      });
      stream.on('error', (err) => reject(err));
    });
  }

  public async findDlcCancel(contractId: Buffer): Promise<DlcCancelV0> {
    const key = Buffer.concat([Buffer.from([Prefix.DlcCancelV0]), contractId]);
    const raw = await this._safeGet<Buffer>(key);
    if (!raw) return;
    return DlcCancelV0.deserialize(raw);
  }

  public async saveDlcCancel(dlcCancel: DlcCancelV0): Promise<void> {
    const value = dlcCancel.serialize();
    const key = Buffer.concat([
      Buffer.from([Prefix.DlcCancelV0]),
      dlcCancel.contractId,
    ]);
    await this._db.put(key, value);
  }

  public async deleteDlcCancel(contractId: Buffer): Promise<void> {
    const key = Buffer.concat([Buffer.from([Prefix.DlcCancelV0]), contractId]);
    await this._db.del(key);
  }

  public async findDlcCloses(): Promise<DlcCloseV0[]> {
    return new Promise((resolve, reject) => {
      const stream = this._db.createReadStream();
      const results: DlcCloseV0[] = [];
      stream.on('data', (data) => {
        if (data.key[0] === Prefix.DlcCloseV0) {
          results.push(DlcCloseV0.deserialize(data.value));
        }
      });
      stream.on('end', () => {
        resolve(results);
      });
      stream.on('error', (err) => reject(err));
    });
  }

  public async findDlcClose(contractId: Buffer): Promise<DlcCloseV0> {
    const key = Buffer.concat([Buffer.from([Prefix.DlcCloseV0]), contractId]);
    const raw = await this._safeGet<Buffer>(key);
    if (!raw) return;
    return DlcCloseV0.deserialize(raw);
  }

  public async saveDlcClose(dlcClose: DlcCloseV0): Promise<void> {
    const value = dlcClose.serialize();
    const key = Buffer.concat([
      Buffer.from([Prefix.DlcCloseV0]),
      dlcClose.contractId,
    ]);
    await this._db.put(key, value);
  }

  public async deleteDlcClose(contractId: Buffer): Promise<void> {
    const key = Buffer.concat([Buffer.from([Prefix.DlcCloseV0]), contractId]);
    await this._db.del(key);
  }

  public async findDlcTransactionsList(): Promise<DlcTransactionsV0[]> {
    return new Promise((resolve, reject) => {
      const stream = this._db.createReadStream();
      const results: DlcTransactionsV0[] = [];
      stream.on('data', (data) => {
        if (data.key[0] === Prefix.DlcTransactionsV0) {
          // Don't parse cets to avoid java heap out of memory
          const dlcTxs = DlcTransactionsV0.deserialize(data.value, false);
          results.push(dlcTxs);
        }
      });
      stream.on('end', () => {
        resolve(results);
      });
      stream.on('error', (err) => reject(err));
    });
  }

  public async findNumDlcTransactionsList(): Promise<number> {
    return new Promise((resolve, reject) => {
      const stream = this._db.createReadStream();
      let num = 0;
      stream.on('data', (data) => {
        if (data.key[0] === Prefix.DlcTransactionsV0) num++;
      });
      stream.on('end', () => {
        resolve(num);
      });
      stream.on('error', (err) => reject(err));
    });
  }

  public async findDlcTransactions(
    contractId: Buffer,
  ): Promise<DlcTransactionsV0> {
    const key = Buffer.concat([
      Buffer.from([Prefix.DlcTransactionsV0]),
      contractId,
    ]);
    const raw = await this._safeGet<Buffer>(key);
    if (!raw) return;
    return DlcTransactionsV0.deserialize(raw);
  }

  public async findDlcTransactionsByOutpoint(
    outpoint: OutPoint,
  ): Promise<DlcTransactionsV0> {
    const key = Buffer.concat([
      Buffer.from([Prefix.Outpoint]),
      Buffer.from(outpoint.toString()),
    ]);
    const contractId = await this._safeGet<Buffer>(key);
    return this.findDlcTransactions(contractId);
  }

  public async findDlcTransactionsByScriptPubKey(
    scriptPubKey: Script,
  ): Promise<DlcTransactionsV0> {
    const key = Buffer.concat([
      Buffer.from([Prefix.ScriptPubKey]),
      scriptPubKey.serialize(),
    ]);
    const contractId = await this._safeGet<Buffer>(key);
    return this.findDlcTransactions(contractId);
  }

  public async saveDlcTransactions(
    dlcTransactions: DlcTransactionsV0,
  ): Promise<void> {
    const value = dlcTransactions.serialize();
    const key = Buffer.concat([
      Buffer.from([Prefix.DlcTransactionsV0]),
      dlcTransactions.contractId,
    ]);
    await this._db.put(key, value);

    // store outpoint reference
    const key2 = Buffer.concat([
      Buffer.from([Prefix.Outpoint]),
      Buffer.from(
        OutPoint.fromString(
          `${dlcTransactions.fundTx.txId.toString()}:${
            dlcTransactions.fundTxVout
          }`,
        ).toString(),
      ),
    ]);
    await this._db.put(key2, dlcTransactions.contractId);

    // store scriptpubkey reference
    const key3 = Buffer.concat([
      Buffer.from([Prefix.ScriptPubKey]),
      dlcTransactions.fundTx.outputs[
        dlcTransactions.fundTxVout
      ].scriptPubKey.serialize(),
    ]);
    await this._db.put(key3, dlcTransactions.contractId);
  }

  public async deleteDlcTransactions(contractId: Buffer): Promise<void> {
    const key = Buffer.concat([
      Buffer.from([Prefix.DlcTransactionsV0]),
      contractId,
    ]);
    await this._db.del(key);
  }
}
