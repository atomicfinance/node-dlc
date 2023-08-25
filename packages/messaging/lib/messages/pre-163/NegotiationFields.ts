import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { getTlv } from '../../serialize/getTlv';
import { IDlcMessagePre163 } from './DlcMessage';
import { RoundingIntervalsV0Pre163 } from './RoundingIntervals';
import { IRoundingIntervalsV0Pre163JSON } from './RoundingIntervals';

export abstract class NegotiationFieldsPre163 {
  public static deserialize(
    buf: Buffer,
  ):
    | NegotiationFieldsV0Pre163
    | NegotiationFieldsV1Pre163
    | NegotiationFieldsV2Pre163 {
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());

    switch (type) {
      case MessageType.NegotiationFieldsV0:
        return NegotiationFieldsV0Pre163.deserialize(buf);
      case MessageType.NegotiationFieldsV1:
        return NegotiationFieldsV1Pre163.deserialize(buf);
      case MessageType.NegotiationFieldsV2:
        return NegotiationFieldsV2Pre163.deserialize(buf);
      default:
        throw new Error(
          `Negotiation fields TLV type must be NegotiationFieldsV0, NegotiationFieldsV1 or NegotiationFieldsV2`,
        );
    }
  }

  public abstract type: number;

  public abstract length: bigint;

  public abstract toJSON():
    | INegotiationFieldsV0Pre163JSON
    | INegotiationFieldsV1Pre163JSON
    | INegotiationFieldsV2Pre163JSON;

  public abstract serialize(): Buffer;
}

/**
 * NegotiationFields V0 contains preferences of the accepter of a DLC
 * which are taken into account during DLC construction.
 */
export class NegotiationFieldsV0Pre163
  extends NegotiationFieldsPre163
  implements IDlcMessagePre163 {
  public static type = MessageType.NegotiationFieldsV0;

  /**
   * Deserializes an negotiation_fields_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): NegotiationFieldsV0Pre163 {
    const instance = new NegotiationFieldsV0Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected NegotiationFieldsV0, got type ${type}`,
    );

    instance.length = reader.readBigSize();

    return instance;
  }

  /**
   * The type for negotiation_fields_v0 message. negotiation_fields_v0 = 55334
   */
  public type = NegotiationFieldsV0Pre163.type;

  public length: bigint;

  /**
   * Converts negotiation_fields_v0 to JSON
   */
  public toJSON(): INegotiationFieldsV0Pre163JSON {
    return {
      type: this.type,
    };
  }

  /**
   * Serializes the negotiation_fields_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);
    writer.writeBigSize(0);

    return writer.toBuffer();
  }
}

/**
 * NegotiationFields V1 contains preferences of the acceptor of a DLC
 * which are taken into account during DLC construction.
 */
export class NegotiationFieldsV1Pre163
  extends NegotiationFieldsPre163
  implements IDlcMessagePre163 {
  public static type = MessageType.NegotiationFieldsV1;

  /**
   * Deserializes an negotiation_fields_v1 message
   * @param buf
   */
  public static deserialize(buf: Buffer): NegotiationFieldsV1Pre163 {
    const instance = new NegotiationFieldsV1Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected NegotiationFieldsV1, got type ${type}`,
    );

    instance.length = reader.readBigSize();
    instance.roundingIntervals = RoundingIntervalsV0Pre163.deserialize(
      getTlv(reader),
    );

    return instance;
  }

  /**
   * The type for negotiation_fields_v1 message. negotiation_fields_v1 = 55336
   */
  public type = NegotiationFieldsV1Pre163.type;

  public length: bigint;

  public roundingIntervals: RoundingIntervalsV0Pre163;

  /**
   * Converts negotiation_fields_v1 to JSON
   */
  public toJSON(): INegotiationFieldsV1Pre163JSON {
    return {
      type: this.type,
      roundingIntervals: this.roundingIntervals.toJSON(),
    };
  }

  /**
   * Serializes the negotiation_fields_v1 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeBytes(this.roundingIntervals.serialize());

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

/**
 * NegotiationFields V2 contains preferences of the acceptor of a DLC
 * which are taken into account during DLC construction.
 */
export class NegotiationFieldsV2Pre163
  extends NegotiationFieldsPre163
  implements IDlcMessagePre163 {
  public static type = MessageType.NegotiationFieldsV2;

  /**
   * Deserializes an negotiation_fields_v1 message
   * @param buf
   */
  public static deserialize(buf: Buffer): NegotiationFieldsV2Pre163 {
    const instance = new NegotiationFieldsV2Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected NegotiationFieldsV2, got type ${type}`,
    );

    instance.length = reader.readBigSize();
    reader.readBigSize(); // num_disjoint_events

    while (!reader.eof) {
      instance.negotiationFieldsList.push(
        NegotiationFieldsPre163.deserialize(getTlv(reader)),
      );
    }

    return instance;
  }

  /**
   * The type for negotiation_fields_v2 message. negotiation_fields_v2 = 55346
   */
  public type = NegotiationFieldsV2Pre163.type;

  public length: bigint;

  public negotiationFieldsList: NegotiationFieldsPre163[] = [];

  /**
   * Converts negotiation_fields_v2 to JSON
   */
  public toJSON(): INegotiationFieldsV2Pre163JSON {
    return {
      type: this.type,
      negotiationFieldsList: this.negotiationFieldsList.map((field) =>
        field.toJSON(),
      ),
    };
  }

  /**
   * Serializes the negotiation_fields_v2 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeBigSize(this.negotiationFieldsList.length);

    for (const negotiationFields of this.negotiationFieldsList) {
      dataWriter.writeBytes(negotiationFields.serialize());
    }

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());
    return writer.toBuffer();
  }
}

export interface INegotiationFieldsV0Pre163JSON {
  type: number;
}

export interface INegotiationFieldsV1Pre163JSON {
  type: number;
  roundingIntervals: IRoundingIntervalsV0Pre163JSON;
}

export interface INegotiationFieldsV2Pre163JSON {
  type: number;
  negotiationFieldsList:
    | INegotiationFieldsV0Pre163JSON[]
    | INegotiationFieldsV1Pre163JSON[]
    | INegotiationFieldsV2Pre163JSON[];
}
