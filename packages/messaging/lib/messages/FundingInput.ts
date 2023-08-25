import { Sequence, Tx } from '@node-lightning/bitcoin';
import {
  BufferReader,
  BufferWriter,
  StreamReader,
} from '@node-lightning/bufio';

import { IDlcMessage } from './DlcMessage';
import { FundingInputV0Pre163 } from './pre-163/FundingInput';

/**
 * FundingInput V0 contains information about a specific input to be used
 * in a funding transaction, as well as its corresponding on-chain UTXO.
 */
export class FundingInput implements IDlcMessage {
  /**
   * Deserializes an funding_input_v0 message
   * @param reader
   */
  public static deserialize(reader: Buffer | BufferReader): FundingInput {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const instance = new FundingInput();

    instance.inputSerialId = reader.readUInt64BE();
    const prevTxLen = reader.readBigSize();
    instance.prevTx = Tx.decode(
      StreamReader.fromBuffer(reader.readBytes(Number(prevTxLen))),
    );
    instance.prevTxVout = reader.readUInt32BE();
    instance.sequence = new Sequence(reader.readUInt32LE());
    instance.maxWitnessLen = reader.readUInt16BE();
    const redeemScriptLen = reader.readUInt16BE();
    instance.redeemScript = reader.readBytes(redeemScriptLen);

    return instance;
  }

  public static fromPre163(fundingInput: FundingInputV0Pre163): FundingInput {
    const instance = new FundingInput();

    instance.inputSerialId = fundingInput.inputSerialId;
    instance.prevTx = fundingInput.prevTx;
    instance.prevTxVout = fundingInput.prevTxVout;
    instance.sequence = fundingInput.sequence;
    instance.maxWitnessLen = fundingInput.maxWitnessLen;
    instance.redeemScript = fundingInput.redeemScript;

    return instance;
  }

  public static toPre163(fundingInput: FundingInput): FundingInputV0Pre163 {
    const instance = new FundingInputV0Pre163();

    instance.inputSerialId = fundingInput.inputSerialId;
    instance.prevTx = fundingInput.prevTx;
    instance.prevTxVout = fundingInput.prevTxVout;
    instance.sequence = fundingInput.sequence;
    instance.maxWitnessLen = fundingInput.maxWitnessLen;
    instance.redeemScript = fundingInput.redeemScript;

    return instance;
  }

  /**
   * The type for funding_input_v0 message. funding_input_v0 = 42772
   */
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
  public toJSON(): IFundingInputJSON {
    return {
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

    const dataWriter = new BufferWriter();
    dataWriter.writeUInt64BE(this.inputSerialId);
    dataWriter.writeBigSize(this.prevTx.serialize().length);
    dataWriter.writeBytes(this.prevTx.serialize());
    dataWriter.writeUInt32BE(this.prevTxVout);
    dataWriter.writeUInt32BE(this.sequence.value);
    dataWriter.writeUInt16BE(this.maxWitnessLen);
    dataWriter.writeUInt16BE(this.redeemScript.length);
    dataWriter.writeBytes(this.redeemScript);

    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

export interface IFundingInputJSON {
  inputSerialId: number;
  prevTx: string;
  prevTxVout: number;
  sequence: number;
  maxWitnessLen: number;
  redeemScript: string;
}
