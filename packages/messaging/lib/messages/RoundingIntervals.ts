import { BufferReader, BufferWriter } from '@node-lightning/bufio';

import { IDlcMessage } from './DlcMessage';
import { RoundingIntervalsV0Pre163 } from './pre-163/RoundingIntervals';

/**
 * RoundingIntervals
 */
export class RoundingIntervals implements IDlcMessage {
  /**
   * Deserializes an rounding_intervals_v0 tlv
   * @param reader
   */
  public static deserialize(reader: Buffer | BufferReader): RoundingIntervals {
    if (reader instanceof Buffer) reader = new BufferReader(reader);
    const instance = new RoundingIntervals();

    const numRoundingIntervals = reader.readBigSize(); // num_rounding_intervals

    for (let i = 0; i < numRoundingIntervals; i++) {
      const beginInterval = reader.readUInt64BE();
      const roundingMod = reader.readUInt64BE();

      instance.intervals.push({ beginInterval, roundingMod });
    }

    return instance;
  }

  public static fromPre163(
    roundingIntervals: RoundingIntervalsV0Pre163,
  ): RoundingIntervals {
    const instance = new RoundingIntervals();

    instance.intervals = roundingIntervals.intervals;

    return instance;
  }

  public static toPre163(
    roundingIntervals: RoundingIntervals,
  ): RoundingIntervalsV0Pre163 {
    const instance = new RoundingIntervalsV0Pre163();

    instance.intervals = roundingIntervals.intervals;

    return instance;
  }

  /**
   * The type for rounding_intervals_v0 tlv. rounding_intervals_v0 = 42788
   */
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
  public toJSON(): IRoundingIntervalsJSON {
    return {
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

    const dataWriter = new BufferWriter();
    dataWriter.writeBigSize(this.intervals.length);

    for (const interval of this.intervals) {
      dataWriter.writeUInt64BE(interval.beginInterval);
      dataWriter.writeUInt64BE(interval.roundingMod);
    }

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

export interface IRoundingIntervalsJSON {
  intervals: IIntervalJSON[];
}
