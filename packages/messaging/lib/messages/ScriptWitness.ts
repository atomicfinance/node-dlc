import { BufferReader, BufferWriter } from '@node-lightning/bufio';

import { ScriptWitnessV0Pre163 } from './pre-163/ScriptWitness';

/**
 * ScriptWitness is the data for a witness element in a witness stack.
 * An empty witness_stack is an error, as every input must be Segwit.
 * Witness elements should not include their length as part of the witness
 * data.
 */
export class ScriptWitness {
  /**
   * Deserializes an script_witness_v0 message
   * @param reader
   */
  public static deserialize(reader: Buffer | BufferReader): ScriptWitness {
    const instance = new ScriptWitness();
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    instance.length = Number(reader.readBigSize());
    instance.witness = reader.readBytes(instance.length);

    return instance;
  }

  public static fromPre163(witness: ScriptWitnessV0Pre163): ScriptWitness {
    const instance = new ScriptWitness();

    instance.witness = witness.witness;

    return instance;
  }

  public static toPre163(witness: ScriptWitness): ScriptWitnessV0Pre163 {
    const instance = new ScriptWitnessV0Pre163();

    instance.witness = witness.witness;

    return instance;
  }

  public static getWitness(reader: BufferReader): Buffer {
    const length = reader.readBigSize();
    const body = reader.readBytes(Number(length));

    const writer = new BufferWriter();
    writer.writeBigSize(length);
    writer.writeBytes(body);

    return writer.toBuffer();
  }

  public length: number;

  public witness: Buffer;

  /**
   * Converts script_witness_v0 to JSON
   */
  public toJSON(): IScriptWitnessJSON {
    return {
      witness: this.witness.toString('hex'),
    };
  }

  /**
   * Serializes the script_witness_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();

    writer.writeBigSize(this.witness.length);
    writer.writeBytes(this.witness);

    return writer.toBuffer();
  }
}

export interface IScriptWitnessJSON {
  witness: string;
}
