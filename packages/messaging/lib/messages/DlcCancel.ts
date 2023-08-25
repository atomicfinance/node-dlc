import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../MessageType';
import { IDlcMessage } from './DlcMessage';
import { DlcCancelV0Pre163 } from './pre-163/DlcCancel';

export abstract class DlcCancel {
  public static deserialize(reader: Buffer | BufferReader): DlcCancelV0 {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());

    const type = Number(tempReader.readUInt16BE());

    switch (type) {
      case MessageType.DlcCancelV0:
        return DlcCancelV0.deserialize(reader);
      default:
        throw new Error(`DLC Cancel message type must be DlcCancelV0`); // This is a temporary measure while protocol is being developed
    }
  }

  public abstract type: number;

  public abstract serialize(): Buffer;
}

/**
 * DlcOffer message contains information about a node and indicates its
 * desire to enter into a new contract. This is the first step toward
 * creating the funding transaction and CETs.
 */
export class DlcCancelV0 extends DlcCancel implements IDlcMessage {
  public static type = MessageType.DlcCancelV0;

  /**
   * Deserializes an offer_dlc_v0 message
   * @param reader
   */
  public static deserialize(reader: Buffer | BufferReader): DlcCancelV0 {
    const instance = new DlcCancelV0();
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const type = reader.readUInt16BE();
    assert(type === this.type, `Expected DlcCancelV0, got type ${type}`);

    instance.contractId = reader.readBytes(32);
    instance.cancelType = reader.readUInt8();

    return instance;
  }

  public static fromPre163(cancel: DlcCancelV0Pre163): DlcCancelV0 {
    const instance = new DlcCancelV0();

    instance.contractId = cancel.contractId;
    instance.cancelType = cancel.cancelType;

    return instance;
  }

  public static toPre163(cancel: DlcCancelV0): DlcCancelV0Pre163 {
    const instance = new DlcCancelV0Pre163();

    instance.contractId = cancel.contractId;
    instance.cancelType = cancel.cancelType;

    return instance;
  }

  /**
   * The type for cancel_dlc_v0 message. cancel_dlc_v0 = 52172
   */
  public type = DlcCancelV0.type;

  public contractId: Buffer;

  public cancelType: CancelType = 0;

  /**
   * Serializes the offer_dlc_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.contractId);
    writer.writeUInt8(this.cancelType);

    return writer.toBuffer();
  }
}

export enum CancelType {
  Unknown = 0,
  Market = 1,
  Error = 2,
}
