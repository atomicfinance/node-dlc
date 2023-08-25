import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';
import { math, verify } from 'bip-schnorr';

import { MessageType } from '../../MessageType';
import { IDlcMessage } from '../DlcMessage';

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
export class OracleAttestationV0Pre163 implements IDlcMessage {
  public static type = MessageType.OracleAttestationV0;

  /**
   * Deserializes an oracle_announcement_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): OracleAttestationV0Pre163 {
    const instance = new OracleAttestationV0Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected OracleAttestationV0, got type ${type}`,
    );

    instance.length = reader.readBigSize();

    const eventIdLength = reader.readBigSize();
    const eventIdBuf = reader.readBytes(Number(eventIdLength));
    instance.eventId = eventIdBuf.toString();

    instance.oraclePubkey = reader.readBytes(32);

    const numSignatures = reader.readUInt16BE();

    for (let i = 0; i < numSignatures; i++) {
      const signature = reader.readBytes(64);
      instance.signatures.push(signature);
    }

    while (!reader.eof) {
      const outcomeLen = reader.readBigSize();
      const outcomeBuf = reader.readBytes(Number(outcomeLen));
      instance.outcomes.push(outcomeBuf.toString());
    }

    return instance;
  }

  /**
   * The type for oracle_announcement_v0 message. oracle_announcement_v0 = 55332
   */
  public type = OracleAttestationV0Pre163.type;

  public length: bigint;

  public eventId: string;

  public oraclePubkey: Buffer;

  public signatures: Buffer[] = [];

  public outcomes: string[] = [];

  public validate(): void {
    if (this.signatures.length !== this.outcomes.length) {
      throw Error('signature and outcome length must be the same');
    }

    // Verify attestation outcome signatures
    for (let i = 0; i < this.signatures.length; i++) {
      const msg = math.taggedHash(
        'DLC/oracle/attestation/v0',
        this.outcomes[i],
      );
      verify(this.oraclePubkey, msg, this.signatures[i]);
    }
  }

  /**
   * Converts oracle_attestation_v0 to JSON
   */
  public toJSON(): IOracleAttestationV0Pre163JSON {
    return {
      type: this.type,
      eventId: this.eventId,
      oraclePubkey: this.oraclePubkey.toString('hex'),
      signatures: this.signatures.map((sig) => sig.toString('hex')),
      outcomes: this.outcomes,
    };
  }

  /**
   * Serializes the oracle_announcement_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeBigSize(this.eventId.length);
    dataWriter.writeBytes(Buffer.from(this.eventId));
    dataWriter.writeBytes(this.oraclePubkey);
    dataWriter.writeUInt16BE(this.signatures.length);

    for (const signature of this.signatures) {
      dataWriter.writeBytes(signature);
    }

    for (const outcome of this.outcomes) {
      dataWriter.writeBigSize(outcome.length);
      dataWriter.writeBytes(Buffer.from(outcome));
    }

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

export interface IOracleAttestationV0Pre163JSON {
  type: number;
  eventId: string;
  oraclePubkey: string;
  signatures: string[];
  outcomes: string[];
}
