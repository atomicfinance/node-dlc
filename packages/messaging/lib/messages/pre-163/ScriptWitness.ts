import { BufferReader, BufferWriter } from '@node-lightning/bufio';

/**
 * ScriptWitness is the data for a witness element in a witness stack.
 * An empty witness_stack is an error, as every input must be Segwit.
 * Witness elements should not include their length as part of the witness
 * data.
 */
export class ScriptWitnessV0Pre163 {
  /**
   * Deserializes an script_witness_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): ScriptWitnessV0Pre163 {
    const instance = new ScriptWitnessV0Pre163();
    const reader = new BufferReader(buf);

    instance.length = reader.readUInt16BE();
    instance.witness = reader.readBytes(instance.length);

    return instance;
  }

  public static getWitness(reader: BufferReader): Buffer {
    const length = reader.readUInt16BE();
    const body = reader.readBytes(Number(length));

    const writer = new BufferWriter();
    writer.writeUInt16BE(length);
    writer.writeBytes(body);

    return writer.toBuffer();
  }

  public length: number;

  public witness: Buffer;

  /**
   * Converts script_witness_v0 to JSON
   */
  public toJSON(): IScriptWitnessV0Pre163JSON {
    return {
      witness: this.witness.toString('hex'),
    };
  }

  /**
   * Serializes the script_witness_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();

    writer.writeUInt16BE(this.witness.length);
    writer.writeBytes(this.witness);

    return writer.toBuffer();
  }
}

export interface IScriptWitnessV0Pre163JSON {
  witness: string;
}
