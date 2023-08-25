import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import { sigToDER } from '@node-lightning/crypto';
import assert from 'assert';

import { MessageType } from '../MessageType';
import {
  deserializeTlv,
  ITlv,
  serializeTlv,
} from '../serialize/deserializeTlv';
import { getTlv } from '../serialize/getTlv';
import {
  CetAdaptorSignatures,
  ICetAdaptorSignaturesJSON,
} from './CetAdaptorSignatures';
import { IDlcMessage } from './DlcMessage';
import { FundingSignatures, IFundingSignaturesJSON } from './FundingSignatures';
import { DlcSignV0Pre163 } from './pre-163/DlcSign';

export abstract class DlcSign {
  public static deserialize(reader: Buffer | BufferReader): DlcSignV0 {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());

    const type = Number(tempReader.readUInt16BE());

    switch (type) {
      case MessageType.DlcSignV0:
        return DlcSignV0.deserialize(reader);
      default:
        throw new Error(`Dlc Sign message type must be DlcSignV0`);
    }
  }

  public abstract type: number;

  public abstract toJSON(): IDlcSignV0JSON;

  public abstract serialize(): Buffer;
}

/**
 * DlcSign gives all of the initiator's signatures, which allows the
 * receiver to broadcast the funding transaction with both parties being
 * fully committed to all closing transactions.
 */
export class DlcSignV0 extends DlcSign implements IDlcMessage {
  public static type = MessageType.DlcSignV0;

  /**
   * Deserializes an sign_dlc_v0 message
   * @param reader
   */
  public static deserialize(reader: Buffer | BufferReader): DlcSignV0 {
    const instance = new DlcSignV0();
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const type = reader.readUInt16BE();
    assert(type === this.type, `Expected DlcSignV0, got type ${type}`);

    instance.protocolVersion = reader.readUInt32BE();
    instance.contractId = reader.readBytes(32);
    instance.cetSignatures = CetAdaptorSignatures.deserialize(reader);
    instance.refundSignature = reader.readBytes(64);
    instance.fundingSignatures = FundingSignatures.deserialize(reader);

    while (!reader.eof) {
      const buf = getTlv(reader);
      const tlvReader = new BufferReader(buf);
      const { type, length, body } = deserializeTlv(tlvReader);

      instance.tlvs.push({ type, length, body });
    }

    return instance;
  }

  public static fromPre163(sign: DlcSignV0Pre163): DlcSignV0 {
    const instance = new DlcSignV0();

    instance.protocolVersion = 1;
    instance.contractId = sign.contractId;
    instance.cetSignatures = CetAdaptorSignatures.fromPre163(
      sign.cetSignatures,
    );
    instance.refundSignature = sign.refundSignature;
    instance.fundingSignatures = FundingSignatures.fromPre163(
      sign.fundingSignatures,
    );

    return instance;
  }

  public static toPre163(sign: DlcSignV0): DlcSignV0Pre163 {
    const instance = new DlcSignV0Pre163();

    instance.contractId = sign.contractId;
    instance.cetSignatures = CetAdaptorSignatures.toPre163(sign.cetSignatures);
    instance.refundSignature = sign.refundSignature;
    instance.fundingSignatures = FundingSignatures.toPre163(
      sign.fundingSignatures,
    );

    return instance;
  }

  /**
   * The type for sign_dlc_v0 message. sign_dlc_v0 = 42782
   */
  public type = DlcSignV0.type;

  public protocolVersion: number;

  public contractId: Buffer;

  public cetSignatures: CetAdaptorSignatures;

  public refundSignature: Buffer;

  public fundingSignatures: FundingSignatures;

  public tlvs: ITlv[] = [];

  /**
   * Converts sign_dlc_v0 to JSON
   */
  public toJSON(): IDlcSignV0JSON {
    return {
      message: {
        protocolVersion: this.protocolVersion,
        contractId: this.contractId.toString('hex'),
        cetAdaptorSignatures: this.cetSignatures.toJSON(),
        refundSignature: sigToDER(this.refundSignature).toString('hex'),
        fundingSignatures: this.fundingSignatures.toJSON(),
      },
      serialized: this.serialize().toString('hex'),
    };
  }

  /**
   * Serializes the sign_dlc_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeUInt16BE(this.type);
    writer.writeUInt32BE(this.protocolVersion);
    writer.writeBytes(this.contractId);
    writer.writeBytes(this.cetSignatures.serialize());
    writer.writeBytes(this.refundSignature);
    writer.writeBytes(this.fundingSignatures.serialize());

    for (const tlv of this.tlvs) {
      serializeTlv(tlv, writer);
    }

    return writer.toBuffer();
  }
}

export interface IDlcSignV0JSON {
  message: {
    protocolVersion: number;
    contractId: string;
    cetAdaptorSignatures: ICetAdaptorSignaturesJSON;
    refundSignature: string;
    fundingSignatures: IFundingSignaturesJSON;
  };
  serialized: string;
}
