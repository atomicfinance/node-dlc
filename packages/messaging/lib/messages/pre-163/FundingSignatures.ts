import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { IDlcMessagePre163 } from './DlcMessage';
import {
  IScriptWitnessV0Pre163JSON,
  ScriptWitnessV0Pre163,
} from './ScriptWitness';

/**
 * FundingSignatures V0 contains signatures of the funding transaction
 * and any necessary information linking the signatures to their inputs.
 */
export class FundingSignaturesV0Pre163 implements IDlcMessagePre163 {
  public static type = MessageType.FundingSignaturesV0;

  /**
   * Deserializes an funding_signatures_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): FundingSignaturesV0Pre163 {
    const instance = new FundingSignaturesV0Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected FundingSignaturesV0, got type ${type}`,
    );

    instance.length = reader.readBigSize();
    const numWitnesses = reader.readUInt16BE();

    for (let i = 0; i < numWitnesses; i++) {
      const numWitnessElements = reader.readUInt16BE();
      const witnessElements: ScriptWitnessV0Pre163[] = [];
      for (let j = 0; j < numWitnessElements; j++) {
        const witness = ScriptWitnessV0Pre163.getWitness(reader);
        witnessElements.push(ScriptWitnessV0Pre163.deserialize(witness));
      }
      instance.witnessElements.push(witnessElements);
    }

    return instance;
  }

  /**
   * The type for funding_signatures_v0 message. funding_signatures_v0 = 42776
   */
  public type = FundingSignaturesV0Pre163.type;

  public length: bigint;

  public witnessElements: ScriptWitnessV0Pre163[][] = [];

  /**
   * Converts funding_signatures_v0 to JSON
   */
  public toJSON(): IFundingSignaturesV0Pre163JSON {
    return {
      type: this.type,
      witnessElements: this.witnessElements.map((witnessElement) => {
        return witnessElement.map((witness) => witness.toJSON());
      }),
    };
  }

  /**
   * Serializes the funding_signatures_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();

    dataWriter.writeUInt16BE(this.witnessElements.length);

    for (const witnessElements of this.witnessElements) {
      dataWriter.writeUInt16BE(witnessElements.length);
      for (const witnessElement of witnessElements) {
        dataWriter.writeBytes(witnessElement.serialize());
      }
    }

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

export interface IFundingSignaturesV0Pre163JSON {
  type: number;
  witnessElements: IScriptWitnessV0Pre163JSON[][];
}
