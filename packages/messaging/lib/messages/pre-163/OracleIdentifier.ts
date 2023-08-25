import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { IDlcMessage } from '../DlcMessage';

export class OracleIdentifierV0Pre163 implements IDlcMessage {
  public static type = MessageType.OracleIdentifierV0;

  /**
   * Deserializes an oracle_event message
   * @param buf
   */
  public static deserialize(buf: Buffer): OracleIdentifierV0Pre163 {
    const instance = new OracleIdentifierV0Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(type === this.type, `Expected OracleIdentifierV0, got type ${type}`);

    instance.length = reader.readBigSize();

    const oracleNameLength = reader.readBigSize();
    const oracleNameBuf = reader.readBytes(Number(oracleNameLength));
    instance.oracleName = oracleNameBuf.toString();
    instance.oraclePubkey = reader.readBytes(32);

    return instance;
  }

  /**
   * The type for oracle_identifier message. oracle_identifier = 61472
   */
  public type = OracleIdentifierV0Pre163.type;

  public length: bigint;

  public oracleName: string;

  public oraclePubkey: Buffer;

  public validate(): void {
    return;
  }

  /**
   * Converts oracle_event to JSON
   */
  public toJSON(): IOracleIdentifierV0Pre163JSON {
    return {
      type: this.type,
      oracleName: this.oracleName,
      oraclePubkey: this.oraclePubkey.toString('hex'),
    };
  }

  /**
   * Serializes the oracle_event message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeBigSize(this.oracleName.length);
    dataWriter.writeBytes(Buffer.from(this.oracleName));

    dataWriter.writeBytes(this.oraclePubkey);

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

export interface IOracleIdentifierV0Pre163JSON {
  type: number;
  oracleName: string;
  oraclePubkey: string;
}
