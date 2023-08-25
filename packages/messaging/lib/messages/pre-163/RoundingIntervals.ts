import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { IDlcMessagePre163 } from './DlcMessage';

/**
 * RoundingIntervals V0
 */
export class RoundingIntervalsV0Pre163 implements IDlcMessagePre163 {
  public static type = MessageType.RoundingIntervalsV0;

  /**
   * Deserializes an rounding_intervals_v0 tlv
   * @param buf
   */
  public static deserialize(buf: Buffer): RoundingIntervalsV0Pre163 {
    const instance = new RoundingIntervalsV0Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected RoundingIntervalsV0, got type ${type}`,
    );

    instance.length = reader.readBigSize();
    reader.readUInt16BE(); // num_rounding_intervals

    while (!reader.eof) {
      const beginInterval = reader.readBigSize();
      const roundingMod = reader.readBigSize();

      instance.intervals.push({ beginInterval, roundingMod });
    }

    return instance;
  }

  /**
   * The type for rounding_intervals_v0 tlv. rounding_intervals_v0 = 42788
   */
  public type = RoundingIntervalsV0Pre163.type;

  public length: bigint;

  public intervals: IInterval[] = [];

  /**
   * Validates correctness of all fields in the message
   * https://github.com/discreetlogcontracts/dlcspecs/blob/master/NumericOutcome.md#requirements
   * @throws Will throw an error if validation fails
   */
  public validate(): void {
    // 1. Intervals must be non-negative
    for (const interval of this.intervals) {
      if (interval.beginInterval < 0) {
        throw new Error('beginInterval must be non-negative');
      }
    }

    // 2. Intervals must be strictly increasing
    for (let i = 1; i < this.intervals.length; ++i) {
      if (
        this.intervals[i - 1].beginInterval >= this.intervals[i].beginInterval
      ) {
        throw new Error(`Intervals must be strictly increasing`);
      }
    }
  }

  /**
   * Converts rounding_intervals_v0 to JSON
   */
  public toJSON(): IRoundingIntervalsV0Pre163JSON {
    return {
      type: this.type,
      intervals: this.intervals.map((interval) => {
        return {
          beginInterval: Number(interval.beginInterval),
          roundingMod: Number(interval.roundingMod),
        };
      }),
    };
  }

  /**
   * Serializes the rounding_intervals_v0 tlv into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeUInt16BE(this.intervals.length);

    for (const interval of this.intervals) {
      dataWriter.writeBigSize(interval.beginInterval);
      dataWriter.writeBigSize(interval.roundingMod);
    }

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

interface IInterval {
  beginInterval: bigint;
  roundingMod: bigint;
}

interface IIntervalJSON {
  beginInterval: number;
  roundingMod: number;
}

export interface IRoundingIntervalsV0Pre163JSON {
  type: number;
  intervals: IIntervalJSON[];
}
