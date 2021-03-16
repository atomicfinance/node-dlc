import { BufferReader, BufferWriter } from '@node-lightning/bufio';

/**
 * ScriptWitness is the data for a witness element in a witness stack.
 * An empty witness_stack is an error, as every input must be Segwit.
 * Witness elements should not include their length as part of the witness
 * data.
 */
export class ScriptWitnessV0 {
  /**
   * Deserializes an script_witness_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): ScriptWitnessV0 {
    const instance = new ScriptWitnessV0();
    const reader = new BufferReader(buf);

    instance.length = reader.readUInt16BE(); // need to fix this
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
   * Serializes the script_witness_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();

    const dataWriter = new BufferWriter();
    dataWriter.writeBytes(this.witness);

    writer.writeUInt16BE(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}
