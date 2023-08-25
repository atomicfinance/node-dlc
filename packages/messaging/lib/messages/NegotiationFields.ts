import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { IDlcMessage } from './DlcMessage';
import {
  NegotiationFieldsPre163,
  NegotiationFieldsV0Pre163,
  NegotiationFieldsV1Pre163,
  NegotiationFieldsV2Pre163,
} from './pre-163/NegotiationFields';
import { IRoundingIntervalsJSON, RoundingIntervals } from './RoundingIntervals';

export enum NegotiationFieldsType {
  Single = 0,
  Disjoint = 1,
}

export abstract class NegotiationFields {
  public static deserialize(
    reader: Buffer | BufferReader,
  ): SingleNegotiationFields | DisjointNegotiationFields {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());
    const type = Number(tempReader.readBigSize());

    switch (type) {
      case NegotiationFieldsType.Single:
        return SingleNegotiationFields.deserialize(reader);
      case NegotiationFieldsType.Disjoint:
        return DisjointNegotiationFields.deserialize(reader);
      default:
        throw new Error(
          `Negotiation fields TLV type must be SingleNegotiationFields or DisjointNegotiationFields`,
        );
    }
  }

  public static fromPre163(
    negotiationFields: NegotiationFieldsPre163,
  ): NegotiationFields {
    if (negotiationFields instanceof NegotiationFieldsV0Pre163) {
      return null;
    } else if (negotiationFields instanceof NegotiationFieldsV1Pre163) {
      return SingleNegotiationFields.fromPre163(negotiationFields);
    } else if (negotiationFields instanceof NegotiationFieldsV2Pre163) {
      return DisjointNegotiationFields.fromPre163(negotiationFields);
    } else {
      throw new Error(
        'Negotiation fields must be NegotiationFieldsV0 or NegotiationFieldsV1 or NegotiationFieldsV2',
      );
    }
  }

  public static toPre163(
    negotiationFields: NegotiationFields,
  ): NegotiationFieldsPre163 {
    if (negotiationFields instanceof SingleNegotiationFields) {
      return SingleNegotiationFields.toPre163(negotiationFields);
    } else if (negotiationFields instanceof DisjointNegotiationFields) {
      return DisjointNegotiationFields.toPre163(negotiationFields);
    } else {
      throw new Error(
        'Negotiation fields must be SingleNegotiationFields or DisjointNegotiationFields',
      );
    }
  }

  public abstract type: number;

  public abstract toJSON():
    | ISingleNegotiationFieldsJSON
    | IDisjointNegotiationFieldsJSON;

  public abstract serialize(): Buffer;
}

/**
 * NegotiationFields V1 contains preferences of the acceptor of a DLC
 * which are taken into account during DLC construction.
 */
export class SingleNegotiationFields
  extends NegotiationFields
  implements IDlcMessage {
  public static type = NegotiationFieldsType.Single;

  /**
   * Deserializes an negotiation_fields_v1 message
   * @param reader
   */
  public static deserialize(
    reader: Buffer | BufferReader,
  ): SingleNegotiationFields {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const instance = new SingleNegotiationFields();

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected NegotiationFieldsType.Single, got type ${type}`,
    );

    instance.roundingIntervals = RoundingIntervals.deserialize(reader);

    return instance;
  }

  public static fromPre163(
    negotiationFields: NegotiationFieldsV1Pre163,
  ): SingleNegotiationFields {
    const instance = new SingleNegotiationFields();

    instance.roundingIntervals = RoundingIntervals.fromPre163(
      negotiationFields.roundingIntervals,
    );

    return instance;
  }

  public static toPre163(
    negotiationFields: SingleNegotiationFields,
  ): NegotiationFieldsV1Pre163 {
    const instance = new NegotiationFieldsV1Pre163();

    instance.roundingIntervals = RoundingIntervals.toPre163(
      negotiationFields.roundingIntervals,
    );

    return instance;
  }

  /**
   * The type for negotiation_fields_v1 message. negotiation_fields_v1 = 55336
   */
  public type = SingleNegotiationFields.type;

  public roundingIntervals: RoundingIntervals;

  /**
   * Converts negotiation_fields_v1 to JSON
   */
  public toJSON(): ISingleNegotiationFieldsJSON {
    return {
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

    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

/**
 * NegotiationFields V2 contains preferences of the acceptor of a DLC
 * which are taken into account during DLC construction.
 */
export class DisjointNegotiationFields
  extends NegotiationFields
  implements IDlcMessage {
  public static type = NegotiationFieldsType.Disjoint;

  /**
   * Deserializes an negotiation_fields_v1 message
   * @param reader
   */
  public static deserialize(
    reader: Buffer | BufferReader,
  ): DisjointNegotiationFields {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const instance = new DisjointNegotiationFields();

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected NegotiationFieldsType.Disjoint, got type ${type}`,
    );

    const numDisjointEvents = reader.readBigSize(); // num_disjoint_events

    for (let i = 0; i < numDisjointEvents; i++) {
      instance.negotiationFieldsList.push(
        NegotiationFields.deserialize(reader),
      );
    }

    return instance;
  }

  public static fromPre163(
    negotiationFields: NegotiationFieldsV2Pre163,
  ): DisjointNegotiationFields {
    const instance = new DisjointNegotiationFields();

    instance.negotiationFieldsList = negotiationFields.negotiationFieldsList.map(
      NegotiationFields.fromPre163,
    );

    return instance;
  }

  public static toPre163(
    negotiationFields: DisjointNegotiationFields,
  ): NegotiationFieldsV2Pre163 {
    const instance = new NegotiationFieldsV2Pre163();

    instance.negotiationFieldsList = negotiationFields.negotiationFieldsList.map(
      NegotiationFields.toPre163,
    );

    return instance;
  }

  /**
   * The type for negotiation_fields_v2 message. negotiation_fields_v2 = 55346
   */
  public type = DisjointNegotiationFields.type;

  public negotiationFieldsList: NegotiationFields[] = [];

  /**
   * Converts negotiation_fields_v2 to JSON
   */
  public toJSON(): IDisjointNegotiationFieldsJSON {
    return {
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

    writer.writeBytes(dataWriter.toBuffer());
    return writer.toBuffer();
  }
}

// TODO: fix JSON here

export interface ISingleNegotiationFieldsJSON {
  roundingIntervals: IRoundingIntervalsJSON;
}

export interface IDisjointNegotiationFieldsJSON {
  negotiationFieldsList: (
    | ISingleNegotiationFieldsJSON
    | IDisjointNegotiationFieldsJSON
  )[];
}
