import { Sequence, Tx } from '@node-lightning/bitcoin';
import {
  BufferReader,
  BufferWriter,
  StreamReader,
} from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { IDlcMessagePre163 } from './DlcMessage';

/**
 * FundingInput V0 contains information about a specific input to be used
 * in a funding transaction, as well as its corresponding on-chain UTXO.
 */
export class FundingInputV0Pre163 implements IDlcMessagePre163 {
  public static type = MessageType.FundingInputV0;

  /**
   * Deserializes an funding_input_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): FundingInputV0Pre163 {
    const instance = new FundingInputV0Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(type === this.type, `Expected DlcTransactionsV0, got type ${type}`);

    instance.length = reader.readBigSize();
    instance.inputSerialId = reader.readUInt64BE();
    const prevTxLen = reader.readUInt16BE();
    instance.prevTx = Tx.decode(
      StreamReader.fromBuffer(reader.readBytes(prevTxLen)),
    );
    instance.prevTxVout = reader.readUInt32BE();
    instance.sequence = new Sequence(reader.readUInt32LE());
    instance.maxWitnessLen = reader.readUInt16BE();
    const redeemScriptLen = reader.readUInt16BE();
    instance.redeemScript = reader.readBytes(redeemScriptLen);

    return instance;
  }

  /**
   * The type for funding_input_v0 message. funding_input_v0 = 42772
   */
  public type = FundingInputV0Pre163.type;

  public length: bigint;

  public inputSerialId: bigint;

  public prevTx: Tx;

  public prevTxVout: number;

  public sequence: Sequence;

  public maxWitnessLen: number;

  public redeemScript: Buffer;

  public scriptSigLength(): number {
    if (this.redeemScript.length > 0) {
      return 1 + this.redeemScript.length;
    } else {
      return 0;
    }
  }

  /**
   * Validates correctness of all fields
   * @throws Will throw an error if validation fails
   */
  public validate(): void {
    // 1. Type is set automatically in class
    // 2. Ensure inputs are segwit
    if (!this.prevTx.isSegWit) throw new Error('fundingInput must be segwit');
  }

  /**
   * Converts funding_input_v0 to JSON
   */
  public toJSON(): IFundingInputV0Pre163JSON {
    return {
      type: this.type,
      inputSerialId: Number(this.inputSerialId),
      prevTx: this.prevTx.serialize().toString('hex'),
      prevTxVout: this.prevTxVout,
      sequence: this.sequence.value,
      maxWitnessLen: this.maxWitnessLen,
      redeemScript: this.redeemScript.toString('hex'),
    };
  }

  /**
   * Serializes the funding_input_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeUInt64BE(this.inputSerialId);
    dataWriter.writeUInt16BE(this.prevTx.serialize().length);
    dataWriter.writeBytes(this.prevTx.serialize());
    dataWriter.writeUInt32BE(this.prevTxVout);
    dataWriter.writeUInt32BE(this.sequence.value);
    dataWriter.writeUInt16BE(this.maxWitnessLen);
    dataWriter.writeUInt16BE(this.redeemScript.length);
    dataWriter.writeBytes(this.redeemScript);

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

export interface IFundingInputV0Pre163JSON {
  type: number;
  inputSerialId: number;
  prevTx: string;
  prevTxVout: number;
  sequence: number;
  maxWitnessLen: number;
  redeemScript: string;
}
