import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';
import BigNumber from 'bignumber.js';

import {
  fromPrecision,
  getIntegerValue,
  getPrecision,
} from '../utils/precision';
import { IDlcMessage } from './DlcMessage';
import {
  HyperbolaPayoutCurvePiecePre163,
  PayoutCurvePiecePre163,
  PolynomialPayoutCurvePiecePre163,
} from './pre-163/PayoutCurvePiece';

export enum PayoutCurvePieceType {
  PolynomialPayoutCurvePiece = 0,
  HyperbolaPayoutCurvePiece = 1,
}

export abstract class PayoutCurvePiece {
  public static deserialize(
    reader: Buffer | BufferReader,
  ): PolynomialPayoutCurvePiece | HyperbolaPayoutCurvePiece {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());

    const type = Number(tempReader.readBigSize());

    switch (type) {
      case PayoutCurvePieceType.PolynomialPayoutCurvePiece:
        return PolynomialPayoutCurvePiece.deserialize(reader);
      case PayoutCurvePieceType.HyperbolaPayoutCurvePiece:
        return HyperbolaPayoutCurvePiece.deserialize(reader);
      default:
        throw new Error(
          `Payout function type must be PolynomialPayoutCurvePiece or HyperbolaPayoutCurvePiece`,
        );
    }
  }

  public static fromPre163(
    payoutCurvePiece: PayoutCurvePiecePre163,
  ): PolynomialPayoutCurvePiece | HyperbolaPayoutCurvePiece {
    if (payoutCurvePiece instanceof PolynomialPayoutCurvePiecePre163) {
      return PolynomialPayoutCurvePiece.fromPre163(payoutCurvePiece);
    } else if (payoutCurvePiece instanceof HyperbolaPayoutCurvePiecePre163) {
      return HyperbolaPayoutCurvePiece.fromPre163(payoutCurvePiece);
    } else {
      throw new Error(
        'Payout Curve Piece must be PolynomialPayoutCurvePiecePre163 or HyperbolaPayoutCurvePiecePre163',
      );
    }
  }

  public static toPre163(
    payoutCurvePiece: PayoutCurvePiece,
  ): PolynomialPayoutCurvePiecePre163 | HyperbolaPayoutCurvePiecePre163 {
    if (payoutCurvePiece instanceof PolynomialPayoutCurvePiece) {
      return PolynomialPayoutCurvePiece.toPre163(payoutCurvePiece);
    } else if (payoutCurvePiece instanceof HyperbolaPayoutCurvePiece) {
      return HyperbolaPayoutCurvePiece.toPre163(payoutCurvePiece);
    } else {
      throw new Error(
        'Payout Curve Piece must be PolynomialPayoutCurvePiece or HyperbolaPayoutCurvePiece',
      );
    }
  }

  public abstract type: number;

  public abstract toJSON():
    | IPolynomialPayoutCurvePieceJSON
    | IHyperbolaPayoutCurvePieceJSON;

  public abstract serialize(): Buffer;
}

/**
 * PolynomialPayoutCurvePiece
 */
export class PolynomialPayoutCurvePiece
  extends PayoutCurvePiece
  implements IDlcMessage {
  public static type = PayoutCurvePieceType.PolynomialPayoutCurvePiece;

  /**
   * Deserializes an polynomial_payout_curve_piece message
   * @param reader
   */
  public static deserialize(
    reader: Buffer | BufferReader,
  ): PolynomialPayoutCurvePiece {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const instance = new PolynomialPayoutCurvePiece();

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected PayoutCurvePieceType.PolynomialPayoutCurvePiece, got type ${type}`,
    );

    const numPoints = reader.readBigSize(); // num_pts

    for (let i = 0; i < numPoints; i++) {
      const eventOutcome = reader.readUInt64BE();
      const outcomePayout = reader.readUInt64BE();
      const extraPrecision = reader.readUInt16BE();

      instance.points.push({
        eventOutcome,
        outcomePayout,
        extraPrecision,
      });
    }

    return instance;
  }

  public static fromPre163(
    polynomialPayoutCurvePiece: PolynomialPayoutCurvePiecePre163,
  ): PolynomialPayoutCurvePiece {
    const instance = new PolynomialPayoutCurvePiece();

    instance.points = polynomialPayoutCurvePiece.points.map((point) => {
      return {
        eventOutcome: point.eventOutcome,
        outcomePayout: point.outcomePayout,
        extraPrecision: point.extraPrecision,
      };
    });

    return instance;
  }

  public static toPre163(
    polynomialPayoutCurvePiece: PolynomialPayoutCurvePiece,
  ): PolynomialPayoutCurvePiecePre163 {
    const instance = new PolynomialPayoutCurvePiecePre163();

    instance.points = polynomialPayoutCurvePiece.points.map((point) => {
      return {
        eventOutcome: point.eventOutcome,
        outcomePayout: point.outcomePayout,
        extraPrecision: point.extraPrecision,
      };
    });

    return instance;
  }

  /**
   * The type for polynomial_payout_curve_piece message. polynomial_payout_curve_piece = ???
   */
  public type = PolynomialPayoutCurvePiece.type;

  public points: IPoint[] = [];

  public migrate(): PolynomialPayoutCurvePiece {
    return this;
  }

  /**
   * Converts polynomial_payout_curve_piece to JSON
   */
  public toJSON(): IPolynomialPayoutCurvePieceJSON {
    return {
      polynomialPayoutCurvePiece: {
        payoutPoints: this.points.map((point) => {
          return {
            eventOutcome: Number(point.eventOutcome),
            outcomePayout: Number(point.outcomePayout),
            extraPrecision: Number(point.extraPrecision),
          };
        }),
      },
    };
  }

  /**
   * Serializes the polynomial_payout_curve_piece message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeBigSize(this.points.length);

    for (const point of this.points) {
      dataWriter.writeUInt64BE(point.eventOutcome);
      dataWriter.writeUInt64BE(point.outcomePayout);
      dataWriter.writeUInt16BE(point.extraPrecision);
    }

    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

/**
 * HyperbolaPayoutCurvePiece
 */
export class HyperbolaPayoutCurvePiece
  extends PayoutCurvePiece
  implements IDlcMessage {
  public static type = PayoutCurvePieceType.HyperbolaPayoutCurvePiece;
  public static points = [
    'translateOutcome',
    'translatePayout',
    'a',
    'b',
    'c',
    'd',
  ];

  /**
   * Deserializes an hyperbola_payout_curve_piece message
   * @param buf
   */
  public static deserialize(
    reader: Buffer | BufferReader,
  ): HyperbolaPayoutCurvePiece {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const instance = new HyperbolaPayoutCurvePiece();

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected PayoutCurvePieceType.HyperbolaPayoutCurvePiece, got type ${type}`,
    );

    instance.usePositivePiece = reader.readUInt8() === 1;

    const points = HyperbolaPayoutCurvePiece.points;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      const sign = reader.readUInt8() === 1;
      const value = reader.readUInt64BE();
      const precision = reader.readUInt16BE();

      instance[point] = this.computePoint(sign, value, precision);
    }

    return instance;
  }

  public static fromPre163(
    hyperbolaPayoutCurvePiece: HyperbolaPayoutCurvePiecePre163,
  ): HyperbolaPayoutCurvePiece {
    const instance = new HyperbolaPayoutCurvePiece();

    instance.usePositivePiece = hyperbolaPayoutCurvePiece.usePositivePiece;

    const points = HyperbolaPayoutCurvePiece.points;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      const sign: boolean = hyperbolaPayoutCurvePiece[`${point}Sign`];
      const value: bigint = hyperbolaPayoutCurvePiece[point];
      const precision: number =
        hyperbolaPayoutCurvePiece[`${point}ExtraPrecision`];

      instance[point] = this.computePoint(sign, value, precision);
    }

    return instance;
  }

  public static toPre163(
    hyperbolaPayoutCurvePiece: HyperbolaPayoutCurvePiece,
  ): HyperbolaPayoutCurvePiecePre163 {
    const instance = new HyperbolaPayoutCurvePiecePre163();

    instance.usePositivePiece = hyperbolaPayoutCurvePiece.usePositivePiece;

    const points = HyperbolaPayoutCurvePiece.points;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      instance[`${point}Sign`] = hyperbolaPayoutCurvePiece[point].gte(
        new BigNumber(0),
      );
      instance[point] = BigInt(
        getIntegerValue(hyperbolaPayoutCurvePiece[point]),
      );
      instance[`${point}ExtraPrecision`] = getPrecision(
        hyperbolaPayoutCurvePiece[point],
      );
    }

    return instance;
  }

  /**
   * The type for hyperbola_payout_curve_piece message. hyperbola_payout_curve_piece = ???
   */
  public type = HyperbolaPayoutCurvePiece.type;

  public usePositivePiece: boolean;

  public translateOutcome: BigNumber;

  public translatePayout: BigNumber;

  public a: BigNumber;

  public b: BigNumber;

  public c: BigNumber;

  public d: BigNumber;

  /**
   * Converts hyperbola_payout_curve_piece to JSON
   */
  public toJSON(): IHyperbolaPayoutCurvePieceJSON {
    return {
      hyperbolaPayoutCurvePiece: {
        usePositivePiece: this.usePositivePiece,
        translateOutcome: this.translateOutcome.toNumber(),
        translatePayout: this.translatePayout.toNumber(),
        a: this.a.toNumber(),
        b: this.b.toNumber(),
        c: this.c.toNumber(),
        d: this.d.toNumber(),
      },
    };
  }

  /**
   *
   * https://github.com/discreetlogcontracts/dlcspecs/blob/740045234f610ea30e52d5880312a949b0d5e21d/PayoutCurve.md#curve-serialization
   *
   * @param sign
   * @param value
   * @param precision
   * @returns
   */
  public calculatePoint(
    sign: boolean,
    value: bigint,
    precision: number,
  ): number {
    return (sign ? 1 : -1) * (Number(value) + precision / (1 << 16));
  }

  public static computePoint(
    sign: boolean,
    value: bigint,
    precision: number,
  ): BigNumber {
    return new BigNumber(value.toString())
      .plus(fromPrecision(precision))
      .times(sign ? 1 : -1);
  }

  /**
   * Serializes the hyperbola_payout_curve_piece message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();

    dataWriter.writeUInt8(this.usePositivePiece ? 1 : 0);

    const points = HyperbolaPayoutCurvePiece.points;
    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      dataWriter.writeUInt8(this[point].isPositive() ? 1 : 0);
      dataWriter.writeUInt64BE(getIntegerValue(this[point]));
      dataWriter.writeUInt16BE(getPrecision(this[point]));
    }

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

export interface IPolynomialPayoutCurvePieceJSON {
  polynomialPayoutCurvePiece: {
    payoutPoints: IPointJSON[];
  };
}

export interface IHyperbolaPayoutCurvePieceJSON {
  hyperbolaPayoutCurvePiece: {
    usePositivePiece: boolean;
    translateOutcome: number;
    translatePayout: number;
    a: number;
    b: number;
    c: number;
    d: number;
  };
}
