import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { IDlcMessagePre163 } from './DlcMessage';

/**
 * CetAdaptorSignatures V0 contains CET signatures and any necessary
 * information linking the signatures to their corresponding outcome
 */
export class CetAdaptorSignaturesV0Pre163 implements IDlcMessagePre163 {
  public static type = MessageType.CetAdaptorSignaturesV0;

  /**
   * Deserializes a cet_adaptor_signature_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): CetAdaptorSignaturesV0Pre163 {
    const instance = new CetAdaptorSignaturesV0Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected CetAdaptorSignaturesV0, got type ${type}`,
    );

    instance.length = reader.readBigSize();
    reader.readBigSize(); // nb_signatures

    while (!reader.eof) {
      const encryptedSig = reader.readBytes(65);
      const dleqProof = reader.readBytes(97);
      instance.sigs.push({ encryptedSig, dleqProof });
    }

    return instance;
  }

  /**
   * The type for cet_adaptor_signature message. cet_adaptor_signature = 42774
   */
  public type = CetAdaptorSignaturesV0Pre163.type;

  public length: bigint;

  public sigs: ISig[] = [];

  /**
   * Converts cet_adaptor_signature to JSON
   */
  public toJSON(): ICetAdaptorSignaturesV0Pre163JSON {
    return {
      type: this.type,
      sigs: this.sigs.map((sig) => {
        return {
          encryptedSig: sig.encryptedSig.toString('hex'),
          dleqProof: sig.dleqProof.toString('hex'),
        };
      }),
    };
  }

  /**
   * Serializes the cet_adaptor_signature message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeBigSize(this.sigs.length);

    for (const sig of this.sigs) {
      dataWriter.writeBytes(sig.encryptedSig);
      dataWriter.writeBytes(sig.dleqProof);
    }

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());
    return writer.toBuffer();
  }
}

interface ISig {
  encryptedSig: Buffer;
  dleqProof: Buffer;
}

export interface ICetAdaptorSignaturesV0Pre163JSON {
  type: number;
  sigs: ISigJSON[];
}

export interface ISigJSON {
  encryptedSig: string;
  dleqProof: string;
}
