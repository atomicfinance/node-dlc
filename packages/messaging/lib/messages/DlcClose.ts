import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../MessageType';
import {
  deserializeTlv,
  ITlv,
  serializeTlv,
} from '../serialize/deserializeTlv';
import { getTlv } from '../serialize/getTlv';
import { IDlcMessage } from './DlcMessage';
import { FundingInput, IFundingInputJSON } from './FundingInput';
import { FundingSignatures, IFundingSignaturesJSON } from './FundingSignatures';
import { DlcCloseV0Pre163 } from './pre-163/DlcClose';

export abstract class DlcClose {
  public static deserialize(reader: Buffer | BufferReader): DlcCloseV0 {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());

    const type = Number(tempReader.readUInt16BE());

    switch (type) {
      case MessageType.DlcCloseV0:
        return DlcCloseV0.deserialize(reader);
      default:
        throw new Error(`DLC Close message type must be DlcCloseV0`); // This is a temporary measure while protocol is being developed
    }
  }

  public abstract type: number;

  public abstract toJSON(): IDlcCloseV0JSON;

  public abstract serialize(): Buffer;
}

/**
 * DlcClose message contains information about a node and indicates its
 * desire to close an existing contract.
 */
export class DlcCloseV0 extends DlcClose implements IDlcMessage {
  public static type = MessageType.DlcCloseV0;

  /**
   * Deserializes an close_dlc_v0 message
   * @param reader
   */
  public static deserialize(reader: Buffer | BufferReader): DlcCloseV0 {
    const instance = new DlcCloseV0();
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const type = reader.readUInt16BE();
    assert(type === this.type, `Expected DlcCloseV0, got type ${type}`);

    instance.contractId = reader.readBytes(32);
    instance.closeSignature = reader.readBytes(64);
    instance.offerPayoutSatoshis = reader.readUInt64BE();
    instance.acceptPayoutSatoshis = reader.readUInt64BE();
    instance.fundInputSerialId = reader.readUInt64BE();
    const fundingInputsLen = reader.readBigSize();
    for (let i = 0; i < fundingInputsLen; i++) {
      instance.fundingInputs.push(FundingInput.deserialize(reader));
    }
    instance.fundingSignatures = FundingSignatures.deserialize(reader);

    while (!reader.eof) {
      const buf = getTlv(reader);
      const tlvReader = new BufferReader(buf);
      const { type, length, body } = deserializeTlv(tlvReader);

      instance.tlvs.push({ type, length, body });
    }

    return instance;
  }

  public static fromPre163(close: DlcCloseV0Pre163): DlcCloseV0 {
    const instance = new DlcCloseV0();

    instance.contractId = close.contractId;
    instance.closeSignature = close.closeSignature;
    instance.offerPayoutSatoshis = close.offerPayoutSatoshis;
    instance.acceptPayoutSatoshis = close.acceptPayoutSatoshis;
    instance.fundInputSerialId = close.fundInputSerialId;
    close.fundingInputs.forEach((fundingInput) => {
      instance.fundingInputs.push(FundingInput.fromPre163(fundingInput));
    });
    instance.fundingSignatures = FundingSignatures.fromPre163(
      close.fundingSignatures,
    );

    return instance;
  }

  public static toPre163(close: DlcCloseV0): DlcCloseV0Pre163 {
    const instance = new DlcCloseV0Pre163();

    instance.contractId = close.contractId;
    instance.closeSignature = close.closeSignature;
    instance.offerPayoutSatoshis = close.offerPayoutSatoshis;
    instance.acceptPayoutSatoshis = close.acceptPayoutSatoshis;
    instance.fundInputSerialId = close.fundInputSerialId;
    close.fundingInputs.forEach((fundingInput) => {
      instance.fundingInputs.push(FundingInput.toPre163(fundingInput));
    });
    instance.fundingSignatures = FundingSignatures.toPre163(
      close.fundingSignatures,
    );

    return instance;
  }

  /**
   * The type for close_dlc_v0 message. close_dlc_v0 = 52170 // TODO
   */
  public type = DlcCloseV0.type;

  public contractId: Buffer;

  public closeSignature: Buffer;

  public offerPayoutSatoshis: bigint;

  public acceptPayoutSatoshis: bigint;

  public fundInputSerialId: bigint;

  public fundingInputs: FundingInput[] = [];

  public fundingSignatures: FundingSignatures;

  public tlvs: ITlv[] = [];

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
    writer.writeBigSize(this.fundingInputs.length);

    for (const fundingInput of this.fundingInputs) {
      writer.writeBytes(fundingInput.serialize());
    }
    writer.writeBytes(this.fundingSignatures.serialize());

    for (const tlv of this.tlvs) {
      serializeTlv(tlv, writer);
    }

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
      (input: FundingInput) => input.inputSerialId,
    );

    if (new Set(inputSerialIds).size !== inputSerialIds.length) {
      throw new Error('inputSerialIds must be unique');
    }

    // Ensure funding inputs are segwit
    this.fundingInputs.forEach((input: FundingInput) => input.validate());
  }

  /**
   * Converts dlc_close_v0 to JSON
   */
  public toJSON(): IDlcCloseV0JSON {
    return {
      message: {
        contractId: this.contractId.toString('hex'),
        closeSignature: this.closeSignature.toString('hex'),
        offerPayoutSatoshis: Number(this.offerPayoutSatoshis),
        acceptPayoutSatoshis: Number(this.acceptPayoutSatoshis),
        fundInputSerialId: Number(this.fundInputSerialId),
        fundingInputs: this.fundingInputs.map((input) => input.toJSON()),
        fundingSignatures: this.fundingSignatures.toJSON(),
      },
      serialized: this.serialize().toString('hex'),
    };
  }
}

export interface IDlcCloseV0JSON {
  message: {
    contractId: string;
    closeSignature: string;
    offerPayoutSatoshis: number;
    acceptPayoutSatoshis: number;
    fundInputSerialId: number;
    fundingInputs: IFundingInputJSON[];
    fundingSignatures: IFundingSignaturesJSON;
  };
  serialized: string;
}
