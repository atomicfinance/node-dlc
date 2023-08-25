import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';
import { math, verify } from 'bip-schnorr';

import { MessageType } from '../../MessageType';
import {
  deserializeTlv,
  ITlv,
  serializeTlv,
} from '../../serialize/deserializeTlv';
import { getTlv } from '../../serialize/getTlv';
import { IDlcMessage } from '../DlcMessage';
import { IOracleEventV0Pre167JSON, OracleEventV0Pre167 } from './OracleEvent';

/**
 * In order to make it possible to hold oracles accountable in cases where
 * they do not release a signature for an event outcome, there needs to be
 * a proof that an oracle has committed to a given outcome. This proof is
 * given in a so-called oracle announcement, which contains an oracle event
 * together with the oracle public key and a signature over its serialization,
 * which must be valid with respect to the specified public key.
 *
 * This also makes it possible for users to obtain oracle event information
 * from an un-trusted peer while being guaranteed that it originates from a
 * given oracle.
 */
export class OracleAnnouncementV0Pre167 implements IDlcMessage {
  public static type = MessageType.OracleAnnouncementV0;

  /**
   * Deserializes an oracle_announcement_v0 message
   * @param reader
   */
  public static deserialize(
    reader: Buffer | BufferReader,
  ): OracleAnnouncementV0Pre167 {
    const instance = new OracleAnnouncementV0Pre167();
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected OracleAnnouncementV0, got type ${type}`,
    );

    instance.length = reader.readBigSize();
    instance.announcementSig = reader.readBytes(64);
    instance.oraclePubkey = reader.readBytes(32);
    instance.oracleEvent = OracleEventV0Pre167.deserialize(getTlv(reader));

    while (!reader.eof) {
      const buf = getTlv(reader);
      const tlvReader = new BufferReader(buf);
      const { type, length, body } = deserializeTlv(tlvReader);

      instance.tlvs.push({ type, length, body });
    }

    return instance;
  }

  /**
   * The type for oracle_announcement_v0 message. oracle_announcement_v0 = 55332
   */
  public type = OracleAnnouncementV0Pre167.type;

  public length: bigint;

  public announcementSig: Buffer;

  public oraclePubkey: Buffer;

  public oracleEvent: OracleEventV0Pre167;

  public tlvs: ITlv[] = [];

  public validate(): void {
    this.oracleEvent.validate();

    // Verify announcement sig
    const msg = math.taggedHash(
      'DLC/oracle/announcement/v0',
      this.oracleEvent.serialize(),
    );
    verify(this.oraclePubkey, msg, this.announcementSig);
  }

  /**
   * Converts oracle_announcement_v0 to JSON
   */
  public toJSON(): IOracleAnnouncementV0Pre167JSON {
    return {
      announcementSignature: this.announcementSig.toString('hex'),
      oraclePublicKey: this.oraclePubkey.toString('hex'),
      oracleEvent: this.oracleEvent.toJSON(),
    };
  }

  /**
   * Serializes the oracle_announcement_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeBytes(this.announcementSig);
    dataWriter.writeBytes(this.oraclePubkey);
    dataWriter.writeBytes(this.oracleEvent.serialize());

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    for (const tlv of this.tlvs) {
      serializeTlv(tlv, writer);
    }

    return writer.toBuffer();
  }
}

export interface IOracleAnnouncementV0Pre167JSON {
  announcementSignature: string;
  oraclePublicKey: string;
  oracleEvent: IOracleEventV0Pre167JSON;
}
