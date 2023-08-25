import { Value } from '@node-dlc/bitcoin';
import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../MessageType';
import { IDlcMessage } from './DlcMessage';
import {
  IHyperbolaPayoutCurvePieceJSON,
  IPolynomialPayoutCurvePieceJSON,
  PayoutCurvePiece,
} from './PayoutCurvePiece';
import { PayoutFunctionV0Pre163 } from './pre-163/PayoutFunction';

/**
 * PayoutFunction V0
 */
export class PayoutFunction implements IDlcMessage {
  public static type = MessageType.PayoutFunctionV0;

  /**
   * Deserializes an payout_function_v0 message
   * @param reader
   */
  public static deserialize(reader: Buffer | BufferReader): PayoutFunction {
    if (reader instanceof Buffer) reader = new BufferReader(reader);
    const instance = new PayoutFunction();

    const numPieces = reader.readBigSize(); // num_pieces

    for (let i = 0; i < numPieces; i++) {
      const eventOutcome = reader.readUInt64BE();
      const outcomePayout = reader.readUInt64BE();
      const extraPrecision = reader.readUInt16BE();
      const payoutCurvePiece = PayoutCurvePiece.deserialize(reader);

      instance.pieces.push({
        payoutCurvePiece,
        endPoint: {
          eventOutcome,
          outcomePayout: Value.fromSats(outcomePayout),
          extraPrecision,
        },
      });
    }

    instance.lastEndpoint.eventOutcome = reader.readUInt64BE(); // endpoint0
    instance.lastEndpoint.outcomePayout = Value.fromSats(reader.readUInt64BE()); // endpointPayout0
    instance.lastEndpoint.extraPrecision = reader.readUInt16BE();

    return instance;
  }

  public static fromPre163(
    payoutFunction: PayoutFunctionV0Pre163,
  ): PayoutFunction {
    const instance = new PayoutFunction();

    const pieces = payoutFunction.pieces;

    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];

      if (i === 0) {
        instance.pieces.push({
          endPoint: {
            eventOutcome: payoutFunction.endpoint0,
            outcomePayout: Value.fromSats(payoutFunction.endpointPayout0),
            extraPrecision: payoutFunction.extraPrecision0,
          },
          payoutCurvePiece: PayoutCurvePiece.fromPre163(piece.payoutCurvePiece),
        });
      } else {
        instance.pieces.push({
          endPoint: {
            eventOutcome: pieces[i - 1].endpoint,
            outcomePayout: Value.fromSats(pieces[i - 1].endpointPayout),
            extraPrecision: pieces[i - 1].extraPrecision,
          },
          payoutCurvePiece: PayoutCurvePiece.fromPre163(piece.payoutCurvePiece),
        });
      }
    }

    const lastPiece = pieces[pieces.length - 1];

    instance.lastEndpoint.eventOutcome = lastPiece.endpoint;
    instance.lastEndpoint.outcomePayout = Value.fromSats(
      lastPiece.endpointPayout,
    );
    instance.lastEndpoint.extraPrecision = lastPiece.extraPrecision;

    return instance;
  }

  public static toPre163(
    payoutFunction: PayoutFunction,
  ): PayoutFunctionV0Pre163 {
    const instance = new PayoutFunctionV0Pre163();

    const pieces = payoutFunction.pieces;

    for (let i = 0; i < pieces.length; i++) {
      if (i === 0) {
        instance.endpoint0 = pieces[i].endPoint.eventOutcome;
        instance.endpointPayout0 = pieces[i].endPoint.outcomePayout.sats;
        instance.extraPrecision0 = pieces[i].endPoint.extraPrecision;
      } else {
        instance.pieces.push({
          payoutCurvePiece: PayoutCurvePiece.toPre163(
            pieces[i - 1].payoutCurvePiece,
          ),
          endpoint: pieces[i].endPoint.eventOutcome,
          endpointPayout: pieces[i].endPoint.outcomePayout.sats,
          extraPrecision: pieces[i].endPoint.extraPrecision,
        });
      }
    }

    const lastPiece = pieces[pieces.length - 1];

    instance.pieces.push({
      payoutCurvePiece: PayoutCurvePiece.toPre163(lastPiece.payoutCurvePiece),
      endpoint: payoutFunction.lastEndpoint.eventOutcome,
      endpointPayout: payoutFunction.lastEndpoint.outcomePayout.sats,
      extraPrecision: payoutFunction.lastEndpoint.extraPrecision,
    });

    return instance;
  }

  /**
   * The type for payout_function_v0 message. payout_function_v0 = 42790
   */
  public type = PayoutFunction.type;

  public pieces: IPayoutCurvePieces[] = [];
  public lastEndpoint: IEndpoint = {
    eventOutcome: 0n,
    outcomePayout: Value.fromSats(0n),
    extraPrecision: 0,
  };

  public validate(): void {
    assert(this.pieces.length >= 1, `num pieces MUST be at least 1`);
    // TODO: add validation that endpoints must strictly increase
  }

  /**
   * Converts payout_function_v0 to JSON
   */
  public toJSON(): IPayoutFunctionJSON {
    return {
      payoutFunctionPieces: this.pieces.map((piece) => {
        return {
          endPoint: {
            eventOutcome: Number(piece.endPoint.eventOutcome),
            outcomePayout: Number(piece.endPoint.outcomePayout.sats),
            extraPrecision: piece.endPoint.extraPrecision,
          },
          payoutCurvePiece: piece.payoutCurvePiece.toJSON(),
        };
      }),
      lastEndpoint: {
        eventOutcome: Number(this.lastEndpoint.eventOutcome),
        outcomePayout: Number(this.lastEndpoint.outcomePayout.sats),
        extraPrecision: this.lastEndpoint.extraPrecision,
      },
    };
  }

  /**
   * Serializes the payout_function_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();

    const dataWriter = new BufferWriter();
    dataWriter.writeBigSize(this.pieces.length);

    for (const piece of this.pieces) {
      dataWriter.writeUInt64BE(piece.endPoint.eventOutcome);
      dataWriter.writeUInt64BE(piece.endPoint.outcomePayout.sats);
      dataWriter.writeUInt16BE(piece.endPoint.extraPrecision);
      dataWriter.writeBytes(piece.payoutCurvePiece.serialize());
    }

    dataWriter.writeUInt64BE(this.lastEndpoint.eventOutcome);
    dataWriter.writeUInt64BE(this.lastEndpoint.outcomePayout.sats);
    dataWriter.writeUInt16BE(this.lastEndpoint.extraPrecision);

    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

interface IEndpoint {
  eventOutcome: bigint;
  outcomePayout: Value;
  extraPrecision: number;
}

interface IEndpointJSON {
  eventOutcome: number;
  outcomePayout: number;
  extraPrecision: number;
}

interface IPayoutCurvePieces {
  payoutCurvePiece: PayoutCurvePiece;
  endPoint: IEndpoint;
}

interface IPayoutCurvePiecesJSON {
  endPoint: IEndpointJSON;
  payoutCurvePiece:
    | IPolynomialPayoutCurvePieceJSON
    | IHyperbolaPayoutCurvePieceJSON;
}

export interface IPayoutFunctionJSON {
  payoutFunctionPieces: IPayoutCurvePiecesJSON[];
  lastEndpoint: IEndpointJSON;
}
