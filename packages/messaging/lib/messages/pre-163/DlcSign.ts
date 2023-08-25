import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { getTlv } from '../../serialize/getTlv';
import {
  CetAdaptorSignaturesV0Pre163,
  ICetAdaptorSignaturesV0Pre163JSON,
} from './CetAdaptorSignatures';
import { IDlcMessagePre163 } from './DlcMessage';
import {
  FundingSignaturesV0Pre163,
  IFundingSignaturesV0Pre163JSON,
} from './FundingSignatures';

/**
 * DlcSign gives all of the initiator's signatures, which allows the
 * receiver to broadcast the funding transaction with both parties being
 * fully committed to all closing transactions.
 */
export class DlcSignV0Pre163 implements IDlcMessagePre163 {
  public static type = MessageType.DlcSignV0;

  /**
   * Deserializes an sign_dlc_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): DlcSignV0Pre163 {
    const instance = new DlcSignV0Pre163();
    const reader = new BufferReader(buf);

    const type = reader.readUInt16BE();
    assert(type === this.type, `Expected DlcSignV0, got type ${type}`);

    instance.contractId = reader.readBytes(32);
    instance.cetSignatures = CetAdaptorSignaturesV0Pre163.deserialize(
      getTlv(reader),
    );
    instance.refundSignature = reader.readBytes(64);
    instance.fundingSignatures = FundingSignaturesV0Pre163.deserialize(
      getTlv(reader),
    );

    return instance;
  }

  /**
   * The type for sign_dlc_v0 message. sign_dlc_v0 = 42782
   */
  public type = DlcSignV0Pre163.type;

  public contractId: Buffer;

  public cetSignatures: CetAdaptorSignaturesV0Pre163;

  public refundSignature: Buffer;

  public fundingSignatures: FundingSignaturesV0Pre163;

  /**
   * Converts sign_dlc_v0 to JSON
   */
  public toJSON(): IDlcSignV0Pre163JSON {
    return {
      type: this.type,
      contractId: this.contractId.toString('hex'),
      cetSignatures: this.cetSignatures.toJSON(),
      refundSignature: this.refundSignature.toString('hex'),
      fundingSignatures: this.fundingSignatures.toJSON(),
    };
  }

  /**
   * Serializes the sign_dlc_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.contractId);
    writer.writeBytes(this.cetSignatures.serialize());
    writer.writeBytes(this.refundSignature);
    writer.writeBytes(this.fundingSignatures.serialize());

    return writer.toBuffer();
  }
}

export interface IDlcSignV0Pre163JSON {
  type: number;
  contractId: string;
  cetSignatures: ICetAdaptorSignaturesV0Pre163JSON;
  refundSignature: string;
  fundingSignatures: IFundingSignaturesV0Pre163JSON;
}
