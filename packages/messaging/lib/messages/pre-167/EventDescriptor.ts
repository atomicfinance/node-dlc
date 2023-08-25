import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { IDlcMessage } from '../DlcMessage';

export abstract class EventDescriptorPre167 {
  public static deserialize(
    reader: Buffer | BufferReader,
  ): EnumEventDescriptorV0Pre167 | DigitDecompositionEventDescriptorV0Pre167 {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());

    const type = Number(tempReader.readBigSize());

    switch (type) {
      case MessageType.EnumEventDescriptorV0:
        return EnumEventDescriptorV0Pre167.deserialize(reader);
      case MessageType.DigitDecompositionEventDescriptorV0:
        return DigitDecompositionEventDescriptorV0Pre167.deserialize(reader);
      default:
        throw new Error(
          `Payout function TLV type must be EnumEventDescriptorV0 or DigitDecompositionEventDescriptorV0`,
        );
    }
  }

  public abstract type: number;

  public abstract length: bigint;

  public abstract toJSON():
    | IEnumEventDescriptorV0Pre167JSON
    | IDigitDecompositionEventDescriptorV0Pre167JSON;

  public abstract serialize(): Buffer;
}

/**
 * EnumEventDescriptor V0 is a simple enumeration of outcomes
 */
export class EnumEventDescriptorV0Pre167
  extends EventDescriptorPre167
  implements IDlcMessage {
  public static type = MessageType.EnumEventDescriptorV0;

  /**
   * Deserializes an enum_event_descriptor_v0 message
   * @param reader
   */
  public static deserialize(
    reader: Buffer | BufferReader,
  ): EnumEventDescriptorV0Pre167 {
    const instance = new EnumEventDescriptorV0Pre167();
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected EnumEventDescriptorV0, got type ${type}`,
    );

    instance.length = reader.readBigSize();
    reader.readUInt16BE(); // num_outcomes

    while (!reader.eof) {
      const outcomeLen = reader.readBigSize();
      const outcomeBuf = reader.readBytes(Number(outcomeLen));
      instance.outcomes.push(outcomeBuf.toString());
    }

    return instance;
  }

  /**
   * The type for enum_event_descriptor_v0 message. enum_event_descriptor_v0 = 55302
   */
  public type = EnumEventDescriptorV0Pre167.type;

  public length: bigint;

  public outcomes: string[] = [];

  /**
   * Converts enum_event_descriptor_v0 to JSON
   */
  public toJSON(): IEnumEventDescriptorV0Pre167JSON {
    return {
      enumEvent: {
        outcomes: this.outcomes,
      },
    };
  }

  /**
   * Serializes the enum_event_descriptor_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeUInt16BE(this.outcomes.length);

    for (const outcome of this.outcomes) {
      dataWriter.writeBigSize(outcome.length);
      dataWriter.writeBytes(Buffer.from(outcome));
    }

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

/**
 * DigitDecompositionEventDescriptorV0 V0 is a simple enumeration of outcomes
 */
export class DigitDecompositionEventDescriptorV0Pre167
  extends EventDescriptorPre167
  implements IDlcMessage {
  public static type = MessageType.DigitDecompositionEventDescriptorV0;

  /**
   * Deserializes an digit_decomposition_event_descriptor_v0 message
   * @param reader
   */
  public static deserialize(
    reader: Buffer | BufferReader,
  ): DigitDecompositionEventDescriptorV0Pre167 {
    const instance = new DigitDecompositionEventDescriptorV0Pre167();
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected DigitDecompositionEventDescriptorV0, got type ${type}`,
    );

    instance.length = reader.readBigSize();

    /**
     * NOTE: BASE IS INCORRECT FORMAT FOR DLC SPEC (SHOULD BE BIGSIZE)
     * Will be fixed in oracle_announcement_v1
     * https://github.com/discreetlogcontracts/dlcspecs/blob/master/Oracle.md#version-0-digit_decomposition_event_descriptor
     */
    instance.base = reader.readUInt16BE();
    instance.isSigned = reader.readUInt8() === 1;
    const unitLen = reader.readBigSize();
    const unitBuf = reader.readBytes(Number(unitLen));
    instance.unit = unitBuf.toString();
    instance.precision = reader.readUInt32BE();
    instance.nbDigits = reader.readUInt16BE();

    return instance;
  }

  /**
   * The type for digit_decomposition_event_descriptor_v0 message. digit_decomposition_event_descriptor_v0 = 55302
   */
  public type = DigitDecompositionEventDescriptorV0Pre167.type;

  public length: bigint;

  public base: number; // Switch to bigint in oracle_announcement_v1

  public isSigned: boolean;

  public unit: string;

  public precision: number;

  public nbDigits: number;

  /**
   * Validates correctness of all fields in the message
   * https://github.com/discreetlogcontracts/dlcspecs/blob/master/Oracle.md
   * @throws Will throw an error if validation fails
   */
  public validate(): void {
    if (this.base <= 0) {
      throw new Error('base must be greater than 0');
    }

    // TODO: support isSigned according to specifications
    if (this.isSigned) {
      throw new Error('node-dlc does not support isSigned');
    }
  }

  /**
   * Converts digit_decomposition_event_descriptor_v0 to JSON
   */
  public toJSON(): IDigitDecompositionEventDescriptorV0Pre167JSON {
    return {
      digitDecompositionEvent: {
        base: this.base,
        isSigned: this.isSigned,
        unit: this.unit,
        precision: this.precision,
        nbDigits: this.nbDigits,
      },
    };
  }

  /**
   * Serializes the digit_decomposition_event_descriptor_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeUInt16BE(this.base); // Switch to BigSize in oracle_announcement_v1
    dataWriter.writeUInt8(this.isSigned ? 1 : 0);
    dataWriter.writeBigSize(this.unit.length);
    dataWriter.writeBytes(Buffer.from(this.unit));
    dataWriter.writeUInt32BE(this.precision);
    dataWriter.writeUInt16BE(this.nbDigits);

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

export interface IEnumEventDescriptorV0Pre167JSON {
  enumEvent: {
    outcomes: string[];
  };
}

export interface IDigitDecompositionEventDescriptorV0Pre167JSON {
  digitDecompositionEvent: {
    base: number;
    isSigned: boolean;
    unit: string;
    precision: number;
    nbDigits: number;
  };
}
