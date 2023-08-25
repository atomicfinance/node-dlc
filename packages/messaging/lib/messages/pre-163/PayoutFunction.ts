import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { getTlv } from '../../serialize/getTlv';
import { IDlcMessagePre163 } from './DlcMessage';
import {
  IHyperbolaPayoutCurvePiecePre163JSON,
  IPolynomialPayoutCurvePiecePre163JSON,
  PayoutCurvePiecePre163,
} from './PayoutCurvePiece';

export abstract class PayoutFunctionPre163 {
  public static deserialize(buf: Buffer): PayoutFunctionV0Pre163 {
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());

    switch (type) {
      case MessageType.PayoutFunctionV0:
        return PayoutFunctionV0Pre163.deserialize(buf);
      default:
        throw new Error(`Payout function TLV type must be PayoutFunctionV0`);
    }
  }

  public abstract type: number;

  public abstract length: bigint;

  public abstract toJSON(): IPayoutFunctionV0Pre163JSON;

  public abstract serialize(): Buffer;
}

/**
 * PayoutFunction V0
 */
export class PayoutFunctionV0Pre163
  extends PayoutFunctionPre163
  implements IDlcMessagePre163 {
  public static type = MessageType.PayoutFunctionV0;

  /**
   * Deserializes an payout_function_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): PayoutFunctionV0Pre163 {
    const instance = new PayoutFunctionV0Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(type === this.type, `Expected PayoutFunctionV0, got type ${type}`);

    instance.length = reader.readBigSize();
    reader.readUInt16BE(); // num_pieces
    instance.endpoint0 = reader.readBigSize();
    instance.endpointPayout0 = reader.readBigSize();
    instance.extraPrecision0 = reader.readUInt16BE();

    while (!reader.eof) {
      const payoutCurvePiece = PayoutCurvePiecePre163.deserialize(
        getTlv(reader),
      );
      const endpoint = reader.readBigSize();
      const endpointPayout = reader.readBigSize();
      const extraPrecision = reader.readUInt16BE();

      instance.pieces.push({
        payoutCurvePiece,
        endpoint,
        endpointPayout,
        extraPrecision,
      });
    }

    return instance;
  }

  /**
   * The type for payout_function_v0 message. payout_function_v0 = 42790
   */
  public type = PayoutFunctionV0Pre163.type;

  public length: bigint;

  public endpoint0: bigint;
  public endpointPayout0: bigint;
  public extraPrecision0: number;

  public pieces: IPayoutCurvePiecesPre163[] = [];

  /**
   * Converts payout_function_v0 to JSON
   */
  public toJSON(): IPayoutFunctionV0Pre163JSON {
    return {
      type: this.type,
      endpoint0: Number(this.endpoint0),
      endpointPayout0: Number(this.endpointPayout0),
      extraPrecision0: this.extraPrecision0,
      pieces: this.pieces.map((piece) => {
        return {
          payoutCurvePiece: piece.payoutCurvePiece.toJSON(),
          endpoint: Number(piece.endpoint),
          endpointPayout: Number(piece.endpointPayout),
          extraPrecision: piece.extraPrecision,
        };
      }),
    };
  }

  /**
   * Serializes the payout_function_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeUInt16BE(this.pieces.length);
    dataWriter.writeBigSize(this.endpoint0);
    dataWriter.writeBigSize(this.endpointPayout0);
    dataWriter.writeUInt16BE(this.extraPrecision0);

    for (const piece of this.pieces) {
      dataWriter.writeBytes(piece.payoutCurvePiece.serialize());
      dataWriter.writeBigSize(piece.endpoint);
      dataWriter.writeBigSize(piece.endpointPayout);
      dataWriter.writeUInt16BE(piece.extraPrecision);
    }

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

interface IPayoutCurvePiecesPre163 {
  payoutCurvePiece: PayoutCurvePiecePre163;
  endpoint: bigint;
  endpointPayout: bigint;
  extraPrecision: number;
}

interface IPayoutCurvePiecesPre163JSON {
  payoutCurvePiece:
    | IPolynomialPayoutCurvePiecePre163JSON
    | IHyperbolaPayoutCurvePiecePre163JSON;
  endpoint: number;
  endpointPayout: number;
  extraPrecision: number;
}

export interface IPayoutFunctionV0Pre163JSON {
  type: number;
  endpoint0: number;
  endpointPayout0: number;
  extraPrecision0: number;
  pieces: IPayoutCurvePiecesPre163JSON[];
}
