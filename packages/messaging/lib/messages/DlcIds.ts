import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../MessageType';
import { IDlcMessage } from './DlcMessage';

export abstract class DlcIds {
  public static deserialize(reader: Buffer | BufferReader): DlcIdsV0 {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());

    const type = Number(tempReader.readUInt16BE());

    switch (type) {
      case MessageType.DlcIdsV0:
        return DlcIdsV0.deserialize(reader);
      default:
        throw new Error(`DLC IDs message type must be DlcIdsV0`);
    }
  }

  public abstract type: number;

  public abstract serialize(): Buffer;
}

/**
 * DlcIds message contains list of buffers
 */
export class DlcIdsV0 extends DlcIds implements IDlcMessage {
  public static type = MessageType.DlcIdsV0;

  /**
   * Deserializes an dlc_ids_v0 message
   * @param reader
   */
  public static deserialize(reader: Buffer | BufferReader): DlcIdsV0 {
    const instance = new DlcIdsV0();
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const type = reader.readUInt16BE();
    assert(type === this.type, `Expected DlcIdsV0, got type ${type}`);

    const idsLen = reader.readBigSize(); // ids length

    for (let i = 0; i < idsLen; i++) {
      instance.ids.push(reader.readBytes(32));
    }

    return instance;
  }

  /**
   * The type for dlc_ids_v0 message
   */
  public type = DlcIdsV0.type;

  public ids: Buffer[] = [];

  /**
   * Serializes the dlc_ids_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeUInt16BE(this.type);
    writer.writeBigSize(this.ids.length);
    for (const id of this.ids) {
      writer.writeBytes(id);
    }

    return writer.toBuffer();
  }
}
