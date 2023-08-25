import { Tx } from '@node-lightning/bitcoin';
import {
  BufferReader,
  BufferWriter,
  StreamReader,
} from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../MessageType';
import { IDlcMessage } from './DlcMessage';
import { DlcTransactionsV0Pre163 } from './pre-163/DlcTransactions';

export abstract class DlcTransactions {
  public static deserialize(
    reader: Buffer | BufferReader,
    parseCets = true,
  ): DlcTransactionsV0 {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());

    const type = Number(tempReader.readUInt16BE());

    switch (type) {
      case MessageType.DlcTransactionsV0:
        return DlcTransactionsV0.deserialize(reader, parseCets);
      default:
        throw new Error(`Dlc Transactions type must be DlcTransactionsV0`);
    }
  }

  public abstract type: number;

  public abstract toJSON(): IDlcTransactionsV0JSON;

  public abstract serialize(): Buffer;
}

/**
 * DlcTransactions message contains information about state of DLC
 * contract such as fundtx and closetx
 */
export class DlcTransactionsV0 extends DlcTransactions implements IDlcMessage {
  public static type = MessageType.DlcTransactionsV0;

  /**
   * Deserializes an offer_dlc_v0 message
   * @param reader
   */
  public static deserialize(
    reader: Buffer | BufferReader,
    parseCets = true,
  ): DlcTransactionsV0 {
    const instance = new DlcTransactionsV0();
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const type = reader.readUInt16BE();
    assert(type === this.type, `Expected DlcTransactionsV0, got type ${type}`);

    instance.contractId = reader.readBytes(32);

    const fundTxLen = reader.readBigSize();
    instance.fundTx = Tx.decode(
      StreamReader.fromBuffer(reader.readBytes(Number(fundTxLen))),
    );

    instance.fundTxVout = reader.readUInt32BE();

    const fundHash = reader.readBytes(32);
    const fundHeight = reader.readUInt32BE();
    instance.fundEpoch = {
      hash: fundHash,
      height: fundHeight,
    };

    instance.fundBroadcastHeight = reader.readUInt32BE();

    const refundTxLen = reader.readBigSize();
    instance.refundTx = Tx.decode(
      StreamReader.fromBuffer(reader.readBytes(Number(refundTxLen))),
    );

    const numCets = reader.readBigSize(); // num_cets
    for (let i = 0; i < numCets; i++) {
      const cetLen = reader.readBigSize();
      if (parseCets || i === 0) {
        instance.cets.push(
          Tx.decode(StreamReader.fromBuffer(reader.readBytes(Number(cetLen)))),
        );
      } else {
        reader.readBytes(Number(cetLen));
      }
    }

    const closeHash = reader.readBytes(32);
    const closeHeight = reader.readUInt32BE();
    instance.closeEpoch = {
      hash: closeHash,
      height: closeHeight,
    };

    instance.closeTxHash = reader.readBytes(32);

    instance.closeType = reader.readUInt8();

    instance.closeBroadcastHeight = reader.readUInt32BE();

    return instance;
  }

  public static fromPre163(dlcTxs: DlcTransactionsV0Pre163): DlcTransactionsV0 {
    const instance = new DlcTransactionsV0();

    instance.contractId = dlcTxs.contractId;
    instance.fundTx = dlcTxs.fundTx;
    instance.fundTxVout = dlcTxs.fundTxVout;
    instance.fundEpoch = dlcTxs.fundEpoch;
    instance.fundBroadcastHeight = dlcTxs.fundBroadcastHeight;
    instance.refundTx = dlcTxs.refundTx;
    instance.cets = dlcTxs.cets;
    instance.closeEpoch = dlcTxs.closeEpoch;
    instance.closeTxHash = dlcTxs.closeTxHash;
    instance.closeType = dlcTxs.closeType;
    instance.closeBroadcastHeight = dlcTxs.closeBroadcastHeight;

    return instance;
  }

  public static toPre163(dlcTxs: DlcTransactionsV0): DlcTransactionsV0Pre163 {
    const instance = new DlcTransactionsV0Pre163();

    instance.contractId = dlcTxs.contractId;
    instance.fundTx = dlcTxs.fundTx;
    instance.fundTxVout = dlcTxs.fundTxVout;
    instance.fundEpoch = dlcTxs.fundEpoch;
    instance.fundBroadcastHeight = dlcTxs.fundBroadcastHeight;
    instance.refundTx = dlcTxs.refundTx;
    instance.cets = dlcTxs.cets;
    instance.closeEpoch = dlcTxs.closeEpoch;
    instance.closeTxHash = dlcTxs.closeTxHash;
    instance.closeType = dlcTxs.closeType;
    instance.closeBroadcastHeight = dlcTxs.closeBroadcastHeight;

    return instance;
  }

  /**
   * The type for offer_dlc_v0 message. offer_dlc_v0 = 42778
   */
  public type = DlcTransactionsV0.type;

  public contractId: Buffer;

  public fundTx: Tx;

  public fundTxVout: number;

  public fundEpoch: IBlockEpoch = {
    hash: Buffer.alloc(32),
    height: 0,
  };

  public fundBroadcastHeight = 0;

  public refundTx: Tx;

  public cets: Tx[] = [];

  public closeEpoch: IBlockEpoch = {
    hash: Buffer.alloc(32),
    height: 0,
  };

  public closeTxHash: Buffer = Buffer.alloc(32);

  public closeType: CloseType = 0;

  public closeBroadcastHeight = 0;

  /**
   * Converts dlc_transactions_v0 to JSON
   */
  public toJSON(): IDlcTransactionsV0JSON {
    return {
      contractId: this.contractId.toString('hex'),
      fundTx: this.fundTx.serialize().toString('hex'),
      fundTxVout: this.fundTxVout,
      fundEpoch: {
        hash: this.fundEpoch.hash.toString('hex'),
        height: this.fundEpoch.height,
      },
      fundBroadcastHeight: this.fundBroadcastHeight,
      refundTx: this.refundTx.serialize().toString('hex'),
      cets: this.cets.map((cet) => cet.serialize().toString('hex')),
      closeEpoch: {
        hash: this.closeEpoch.hash.toString('hex'),
        height: this.closeEpoch.height,
      },
      closeTxHash: this.closeTxHash.toString('hex'),
      closeType: closeTypeToStr(this.closeType),
      closeBroadcastHeight: this.closeBroadcastHeight,
    };
  }

  /**
   * Serializes the dlc_transactions_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.contractId);
    writer.writeBigSize(this.fundTx.serialize().length);
    writer.writeBytes(this.fundTx.serialize());
    writer.writeUInt32BE(this.fundTxVout);
    writer.writeBytes(this.fundEpoch.hash);
    writer.writeUInt32BE(this.fundEpoch.height);
    writer.writeUInt32BE(this.fundBroadcastHeight);
    writer.writeBigSize(this.refundTx.serialize().length);
    writer.writeBytes(this.refundTx.serialize());

    writer.writeBigSize(this.cets.length);
    for (const cet of this.cets) {
      writer.writeBigSize(cet.serialize().length);
      writer.writeBytes(cet.serialize());
    }

    writer.writeBytes(this.closeEpoch.hash);
    writer.writeUInt32BE(this.closeEpoch.height);
    writer.writeBytes(this.closeTxHash);
    writer.writeUInt8(this.closeType);
    writer.writeUInt32BE(this.closeBroadcastHeight);

    return writer.toBuffer();
  }
}

const closeTypeToStr = (closeType: CloseType): string => {
  switch (closeType) {
    case CloseType.ExecuteClose:
      return 'ExecuteClose';
    case CloseType.RefundClose:
      return 'RefundClose';
    case CloseType.CooperativeClose:
      return 'CooperativeClose';
    default:
      return 'NotClosed';
  }
};

export interface IDlcTransactionsV0JSON {
  contractId: string;
  fundTx: string;
  fundTxVout: number;
  fundEpoch: IBlockEpochJSON;
  fundBroadcastHeight: number;
  refundTx: string;
  cets: string[];
  closeEpoch: IBlockEpochJSON;
  closeTxHash: string;
  closeType: string;
  closeBroadcastHeight: number;
}

export interface IBlockEpochJSON {
  hash: string;
  height: number;
}

export interface IBlockEpoch {
  hash: Buffer;
  height: number;
}

export enum CloseType {
  NotClosed = 0,
  ExecuteClose = 1,
  RefundClose = 2,
  CooperativeClose = 3,
}
