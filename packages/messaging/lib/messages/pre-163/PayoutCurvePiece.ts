import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { IDlcMessagePre163 } from './DlcMessage';

export abstract class PayoutCurvePiecePre163 {
  public static deserialize(
    buf: Buffer,
  ): PolynomialPayoutCurvePiecePre163 | HyperbolaPayoutCurvePiecePre163 {
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());

    switch (type) {
      case MessageType.PolynomialPayoutCurvePiece:
        return PolynomialPayoutCurvePiecePre163.deserialize(buf);
      case MessageType.HyperbolaPayoutCurvePiece:
        return HyperbolaPayoutCurvePiecePre163.deserialize(buf);
      case MessageType.OldHyperbolaPayoutCurvePiece:
        return HyperbolaPayoutCurvePiecePre163.deserialize(buf);
      default:
        throw new Error(
          `Payout function TLV type must be PolynomialPayoutCurvePiece or HyperbolaPayoutCurvePiece`,
        );
    }
  }

  public abstract type: number;

  public abstract length: bigint;

  public abstract toJSON():
    | IPolynomialPayoutCurvePiecePre163JSON
    | IHyperbolaPayoutCurvePiecePre163JSON;

  public abstract serialize(): Buffer;
}

/**
 * PolynomialPayoutCurvePiece
 */
export class PolynomialPayoutCurvePiecePre163
  extends PayoutCurvePiecePre163
  implements IDlcMessagePre163 {
  public static type = MessageType.PolynomialPayoutCurvePiece;

  /**
   * Deserializes an polynomial_payout_curve_piece message
   * @param buf
   */
  public static deserialize(buf: Buffer): PolynomialPayoutCurvePiecePre163 {
    const instance = new PolynomialPayoutCurvePiecePre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected PolynomialPayoutCurvePiece, got type ${type}`,
    );

    instance.length = reader.readBigSize(); // need to fix this
    reader.readUInt16BE(); // num_pts

    while (!reader.eof) {
      const eventOutcome = reader.readBigSize();
      const outcomePayout = reader.readBigSize();
      const extraPrecision = reader.readUInt16BE();

      instance.points.push({
        eventOutcome,
        outcomePayout,
        extraPrecision,
      });
    }

    return instance;
  }

  /**
   * The type for polynomial_payout_curve_piece message. polynomial_payout_curve_piece = ???
   */
  public type = PolynomialPayoutCurvePiecePre163.type;

  public length: bigint;

  public points: IPoint[] = [];

  /**
   * Converts polynomial_payout_curve_piece to JSON
   */
  public toJSON(): IPolynomialPayoutCurvePiecePre163JSON {
    return {
      type: this.type,
      points: this.points.map((point) => {
        return {
          eventOutcome: Number(point.eventOutcome),
          outcomePayout: Number(point.outcomePayout),
          extraPrecision: Number(point.extraPrecision),
        };
      }),
    };
  }

  /**
   * Serializes the polynomial_payout_curve_piece message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeUInt16BE(this.points.length);

    for (const point of this.points) {
      dataWriter.writeBigSize(point.eventOutcome);
      dataWriter.writeBigSize(point.outcomePayout);
      dataWriter.writeUInt16BE(point.extraPrecision);
    }

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

/**
 * HyperbolaPayoutCurvePiece
 */
export class HyperbolaPayoutCurvePiecePre163
  extends PayoutCurvePiecePre163
  implements IDlcMessagePre163 {
  public static type = MessageType.HyperbolaPayoutCurvePiece;

  /**
   * Deserializes an hyperbola_payout_curve_piece message
   * @param buf
   */
  public static deserialize(buf: Buffer): HyperbolaPayoutCurvePiecePre163 {
    const instance = new HyperbolaPayoutCurvePiecePre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(
      type === this.type || type === MessageType.OldHyperbolaPayoutCurvePiece,
      `Expected HyperbolaPayoutCurvePiece or OldHyperbolaPayoutCurvePiece, got type ${type}`,
    );

    instance.length = reader.readBigSize();
    instance.usePositivePiece = reader.readUInt8() === 1;
    instance.translateOutcomeSign = reader.readUInt8() === 1;
    instance.translateOutcome = reader.readBigSize();
    instance.translateOutcomeExtraPrecision = reader.readUInt16BE();
    instance.translatePayoutSign = reader.readUInt8() === 1;
    instance.translatePayout = reader.readBigSize();
    instance.translatePayoutExtraPrecision = reader.readUInt16BE();
    instance.aSign = reader.readUInt8() === 1;
    instance.a = reader.readBigSize();
    instance.aExtraPrecision = reader.readUInt16BE();
    instance.bSign = reader.readUInt8() === 1;
    instance.b = reader.readBigSize();
    instance.bExtraPrecision = reader.readUInt16BE();
    instance.cSign = reader.readUInt8() === 1;
    instance.c = reader.readBigSize();
    instance.cExtraPrecision = reader.readUInt16BE();
    instance.dSign = reader.readUInt8() === 1;
    instance.d = reader.readBigSize();
    instance.dExtraPrecision = reader.readUInt16BE();

    return instance;
  }

  /**
   * The type for hyperbola_payout_curve_piece message. hyperbola_payout_curve_piece = ???
   */
  public type = HyperbolaPayoutCurvePiecePre163.type;

  public length: bigint;

  public usePositivePiece: boolean;

  public translateOutcomeSign: boolean;

  public translateOutcome: bigint;

  public translateOutcomeExtraPrecision: number;

  public translatePayoutSign: boolean;

  public translatePayout: bigint;

  public translatePayoutExtraPrecision: number;

  public aSign: boolean;

  public a: bigint;

  public aExtraPrecision: number;

  public bSign: boolean;

  public b: bigint;

  public bExtraPrecision: number;

  public cSign: boolean;

  public c: bigint;

  public cExtraPrecision: number;

  public dSign: boolean;

  public d: bigint;

  public dExtraPrecision: number;

  /**
   * Converts hyperbola_payout_curve_piece to JSON
   */
  public toJSON(): IHyperbolaPayoutCurvePiecePre163JSON {
    return {
      type: this.type,
      usePositivePiece: this.usePositivePiece,
      translateOutcomeSign: this.translateOutcomeSign,
      translateOutcome: Number(this.translateOutcome),
      translateOutcomeExtraPrecision: this.translateOutcomeExtraPrecision,
      translatePayoutSign: this.translatePayoutSign,
      translatePayout: Number(this.translatePayout),
      translatePayoutExtraPrecision: this.translatePayoutExtraPrecision,
      aSign: this.aSign,
      a: Number(this.a),
      aExtraPrecision: this.aExtraPrecision,
      bSign: this.bSign,
      b: Number(this.b),
      bExtraPrecision: this.bExtraPrecision,
      cSign: this.cSign,
      c: Number(this.c),
      cExtraPrecision: this.cExtraPrecision,
      dSign: this.dSign,
      d: Number(this.d),
      dExtraPrecision: this.dExtraPrecision,
    };
  }

  /**
   * Serializes the hyperbola_payout_curve_piece message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();

    dataWriter.writeUInt8(this.usePositivePiece ? 1 : 0);
    dataWriter.writeUInt8(this.translateOutcomeSign ? 1 : 0);
    dataWriter.writeBigSize(this.translateOutcome);
    dataWriter.writeUInt16BE(this.translateOutcomeExtraPrecision);
    dataWriter.writeUInt8(this.translatePayoutSign ? 1 : 0);
    dataWriter.writeBigSize(this.translatePayout);
    dataWriter.writeUInt16BE(this.translatePayoutExtraPrecision);
    dataWriter.writeUInt8(this.aSign ? 1 : 0);
    dataWriter.writeBigSize(this.a);
    dataWriter.writeUInt16BE(this.aExtraPrecision);
    dataWriter.writeUInt8(this.bSign ? 1 : 0);
    dataWriter.writeBigSize(this.b);
    dataWriter.writeUInt16BE(this.bExtraPrecision);
    dataWriter.writeUInt8(this.cSign ? 1 : 0);
    dataWriter.writeBigSize(this.c);
    dataWriter.writeUInt16BE(this.cExtraPrecision);
    dataWriter.writeUInt8(this.dSign ? 1 : 0);
    dataWriter.writeBigSize(this.d);
    dataWriter.writeUInt16BE(this.dExtraPrecision);

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

interface IPoint {
  eventOutcome: bigint;
  outcomePayout: bigint;
  extraPrecision: number;
}

interface IPointJSON {
  eventOutcome: number;
  outcomePayout: number;
  extraPrecision: number;
}

export interface IPolynomialPayoutCurvePiecePre163JSON {
  type: number;
  points: IPointJSON[];
}

export interface IHyperbolaPayoutCurvePiecePre163JSON {
  type: number;
  usePositivePiece: boolean;
  translateOutcomeSign: boolean;
  translateOutcome: number;
  translateOutcomeExtraPrecision: number;
  translatePayoutSign: boolean;
  translatePayout: number;
  translatePayoutExtraPrecision: number;
  aSign: boolean;
  a: number;
  aExtraPrecision: number;
  bSign: boolean;
  b: number;
  bExtraPrecision: number;
  cSign: boolean;
  c: number;
  cExtraPrecision: number;
  dSign: boolean;
  d: number;
  dExtraPrecision: number;
}
