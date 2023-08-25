import { BufferReader, BufferWriter } from '@node-lightning/bufio';

import { MessageType } from '../MessageType';
import { IDlcMessage } from './DlcMessage';
import { CetAdaptorSignaturesV0Pre163 } from './pre-163/CetAdaptorSignatures';
/**
 * CetAdaptorSignatures V0 contains CET signatures and any necessary
 * information linking the signatures to their corresponding outcome
 */
export class CetAdaptorSignatures implements IDlcMessage {
  public static type = MessageType.CetAdaptorSignaturesV0;

  /**
   * Deserializes a cet_adaptor_signature_v0 message
   * @param reader
   */
  public static deserialize(
    reader: Buffer | BufferReader,
    parseCets = true,
  ): CetAdaptorSignatures {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const instance = new CetAdaptorSignatures();

    const nbSignatures = reader.readBigSize();

    if (parseCets) {
      for (let i = 0; i < nbSignatures; i++) {
        const encryptedSig = reader.readBytes(65);
        const dleqProof = reader.readBytes(97);
        instance.sigs.push({ encryptedSig, dleqProof });
      }
    } else {
      const cetsByteLength = nbSignatures * (BigInt(65) + BigInt(97));
      reader.readBytes(Number(cetsByteLength));
    }

    return instance;
  }

  public static fromPre163(
    cetSignatures: CetAdaptorSignaturesV0Pre163,
  ): CetAdaptorSignatures {
    const instance = new CetAdaptorSignatures();

    instance.sigs = cetSignatures.sigs;

    return instance;
  }

  public static toPre163(
    cetSignatures: CetAdaptorSignatures,
  ): CetAdaptorSignaturesV0Pre163 {
    const instance = new CetAdaptorSignaturesV0Pre163();

    instance.sigs = cetSignatures.sigs;

    return instance;
  }

  /**
   * The type for cet_adaptor_signature message. cet_adaptor_signature = 42774
   */
  public type = CetAdaptorSignatures.type;

  public sigs: ISig[] = [];

  /**
   * Converts cet_adaptor_signature to JSON
   */
  public toJSON(): ICetAdaptorSignaturesJSON {
    return {
      ecdsaAdaptorSignatures: this.sigs.map((sig) => {
        return {
          signature:
            sig.encryptedSig.toString('hex') + sig.dleqProof.toString('hex'),
        };
      }),
    };
  }

  /**
   * Serializes the cet_adaptor_signature message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();

    const dataWriter = new BufferWriter();
    dataWriter.writeBigSize(this.sigs.length);

    for (const sig of this.sigs) {
      dataWriter.writeBytes(sig.encryptedSig);
      dataWriter.writeBytes(sig.dleqProof);
    }

    writer.writeBytes(dataWriter.toBuffer());
    return writer.toBuffer();
  }
}

interface ISig {
  encryptedSig: Buffer;
  dleqProof: Buffer;
}

export interface ICetAdaptorSignaturesJSON {
  ecdsaAdaptorSignatures: ISigJSON[];
}

export interface ISigJSON {
  signature: string;
}
