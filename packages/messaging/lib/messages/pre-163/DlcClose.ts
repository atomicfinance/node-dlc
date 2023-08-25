import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { getTlv } from '../../serialize/getTlv';
import { IDlcMessagePre163 } from './DlcMessage';
import {
  FundingInputV0Pre163,
  IFundingInputV0Pre163JSON,
} from './FundingInput';
import {
  FundingSignaturesV0Pre163,
  IFundingSignaturesV0Pre163JSON,
} from './FundingSignatures';

export abstract class DlcClosePre163 {
  public static deserialize(buf: Buffer): DlcCloseV0Pre163 {
    const reader = new BufferReader(buf);

    const type = Number(reader.readUInt16BE());

    switch (type) {
      case MessageType.DlcCloseV0:
        return DlcCloseV0Pre163.deserialize(buf);
      default:
        throw new Error(`DLC Close message type must be DlcCloseV0`); // This is a temporary measure while protocol is being developed
    }
  }

  public abstract type: number;

  public abstract toJSON(): IDlcCloseV0Pre163JSON;

  public abstract serialize(): Buffer;
}

/**
 * DlcClose message contains information about a node and indicates its
 * desire to close an existing contract.
 */
export class DlcCloseV0Pre163
  extends DlcClosePre163
  implements IDlcMessagePre163 {
  public static type = MessageType.DlcCloseV0;

  /**
   * Deserializes an close_dlc_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): DlcCloseV0Pre163 {
    const instance = new DlcCloseV0Pre163();
    const reader = new BufferReader(buf);

    const type = reader.readUInt16BE();
    assert(type === this.type, `Expected DlcCloseV0, got type ${type}`);

    instance.contractId = reader.readBytes(32);
    instance.closeSignature = reader.readBytes(64);
    instance.offerPayoutSatoshis = reader.readUInt64BE();
    instance.acceptPayoutSatoshis = reader.readUInt64BE();
    instance.fundInputSerialId = reader.readUInt64BE();
    const fundingInputsLen = reader.readUInt16BE();
    for (let i = 0; i < fundingInputsLen; i++) {
      instance.fundingInputs.push(
        FundingInputV0Pre163.deserialize(getTlv(reader)),
      );
    }
    instance.fundingSignatures = FundingSignaturesV0Pre163.deserialize(
      getTlv(reader),
    );

    return instance;
  }

  /**
   * The type for close_dlc_v0 message. close_dlc_v0 = 52170 // TODO
   */
  public type = DlcCloseV0Pre163.type;

  public contractId: Buffer;

  public closeSignature: Buffer;

  public offerPayoutSatoshis: bigint;

  public acceptPayoutSatoshis: bigint;

  public fundInputSerialId: bigint;

  public fundingInputs: FundingInputV0Pre163[] = [];

  public fundingSignatures: FundingSignaturesV0Pre163;

  /**
   * Serializes the close_dlc_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.contractId);
    writer.writeBytes(this.closeSignature);
    writer.writeUInt64BE(this.offerPayoutSatoshis);
    writer.writeUInt64BE(this.acceptPayoutSatoshis);
    writer.writeUInt64BE(this.fundInputSerialId);
    writer.writeUInt16BE(this.fundingInputs.length);

    for (const fundingInput of this.fundingInputs) {
      writer.writeBytes(fundingInput.serialize());
    }
    writer.writeBytes(this.fundingSignatures.serialize());

    return writer.toBuffer();
  }

  /**
   * Validates correctness of all fields
   * @throws Will throw an error if validation fails
   */
  public validate(): void {
    // Type is set automatically in class

    // Ensure input serial ids are unique
    const inputSerialIds = this.fundingInputs.map(
      (input: FundingInputV0Pre163) => input.inputSerialId,
    );

    if (new Set(inputSerialIds).size !== inputSerialIds.length) {
      throw new Error('inputSerialIds must be unique');
    }

    // Ensure funding inputs are segwit
    this.fundingInputs.forEach((input: FundingInputV0Pre163) =>
      input.validate(),
    );
  }

  /**
   * Converts dlc_close_v0 to JSON
   */
  public toJSON(): IDlcCloseV0Pre163JSON {
    return {
      type: this.type,
      contractId: this.contractId.toString('hex'),
      closeSignature: this.closeSignature.toString('hex'),
      offerPayoutSatoshis: Number(this.offerPayoutSatoshis),
      acceptPayoutSatoshis: Number(this.acceptPayoutSatoshis),
      fundInputSerialId: Number(this.fundInputSerialId),
      fundingInputs: this.fundingInputs.map((input) => input.toJSON()),
      fundingSignatures: this.fundingSignatures.toJSON(),
    };
  }
}

export interface IDlcCloseV0Pre163JSON {
  type: number;
  contractId: string;
  closeSignature: string;
  offerPayoutSatoshis: number;
  acceptPayoutSatoshis: number;
  fundInputSerialId: number;
  fundingInputs: IFundingInputV0Pre163JSON[];
  fundingSignatures: IFundingSignaturesV0Pre163JSON;
}
