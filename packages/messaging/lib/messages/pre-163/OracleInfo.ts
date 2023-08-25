import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { getTlv } from '../../serialize/getTlv';
import {
  IOracleAnnouncementV0Pre167JSON,
  OracleAnnouncementV0Pre167,
} from '../pre-167/OracleAnnouncement';
import { IDlcMessagePre163 } from './DlcMessage';

/**
 * OracleInfo contains information about the oracles to be used in
 * executing a DLC.
 */
export class OracleInfoV0Pre163 implements IDlcMessagePre163 {
  public static type = MessageType.OracleInfoV0;

  /**
   * Deserializes an oracle_info_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): OracleInfoV0Pre163 {
    const instance = new OracleInfoV0Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(type === this.type, `Expected OracleInfoV0, got type ${type}`);

    instance.length = reader.readBigSize();
    instance.announcement = OracleAnnouncementV0Pre167.deserialize(
      getTlv(reader),
    );

    return instance;
  }

  /**
   * The type for oracle_info_v0 message. oracle_info_v0 = 42770
   */
  public type = OracleInfoV0Pre163.type;

  public length: bigint;

  public announcement: OracleAnnouncementV0Pre167;

  public validate(): void {
    this.announcement.validate();
  }

  /**
   * Converts oracle_info_v0 to JSON
   */
  public toJSON(): IOracleInfoV0Pre163JSON {
    return {
      type: this.type,
      announcement: this.announcement.toJSON(),
    };
  }

  /**
   * Serializes the oracle_info_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeBytes(this.announcement.serialize());

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

export interface IOracleInfoV0Pre163JSON {
  type: number;
  announcement: IOracleAnnouncementV0Pre167JSON;
}
