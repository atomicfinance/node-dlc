import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../MessageType';
import {
  deserializeTlv,
  ITlv,
  serializeTlv,
} from '../serialize/deserializeTlv';
import { getTlv } from '../serialize/getTlv';
import { IDlcMessage } from './DlcMessage';
import {
  IOrderNegotiationFieldsJSON,
  OrderNegotiationFields,
} from './OrderNegotiationFields';
import { OrderAcceptV0Pre163 } from './pre-163/OrderAccept';
import { OrderNegotiationFieldsV0Pre163 } from './pre-163/OrderNegotiationFields';

export abstract class OrderAccept {
  public static deserialize(reader: Buffer | BufferReader): OrderAccept {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());

    const type = Number(tempReader.readUInt16BE());

    switch (type) {
      case MessageType.OrderAcceptV0:
        return OrderAcceptV0.deserialize(reader);
      default:
        throw new Error(`Order accept TLV type must be OrderAcceptV0`);
    }
  }

  public abstract type: number;

  public abstract toJSON(): IOrderAcceptV0JSON;

  public abstract serialize(): Buffer;
}

/**
 * OrderAccept contains information about a node and indicates its
 * acceptance of the new order offer. This is the second step towards
 * order negotiation.
 */
export class OrderAcceptV0 extends OrderAccept implements IDlcMessage {
  public static type = MessageType.OrderAcceptV0;

  /**
   * Deserializes an order_accept_v0 message
   * @param reader
   */
  public static deserialize(reader: Buffer | BufferReader): OrderAcceptV0 {
    const instance = new OrderAcceptV0();
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const type = reader.readUInt16BE();
    assert(type === this.type, `Expected OrderAcceptV0, got type ${type}`);

    instance.protocolVersion = reader.readUInt32BE();
    instance.tempOrderId = reader.readBytes(32);
    const hasNegotiationFields = reader.readUInt8() === 1;
    if (hasNegotiationFields) {
      instance.negotiationFields = OrderNegotiationFields.deserialize(reader);
    }

    while (!reader.eof) {
      const buf = getTlv(reader);
      const tlvReader = new BufferReader(buf);
      const { type, length, body } = deserializeTlv(tlvReader);

      instance.tlvs.push({ type, length, body });
    }

    return instance;
  }

  public static fromPre163(accept: OrderAcceptV0Pre163): OrderAcceptV0 {
    const instance = new OrderAcceptV0();

    instance.protocolVersion = 1;
    instance.tempOrderId = accept.tempOrderId;
    if (accept.negotiationFields) {
      instance.negotiationFields = OrderNegotiationFields.fromPre163(
        accept.negotiationFields,
      );
    } else {
      instance.negotiationFields = new OrderNegotiationFields();
    }

    return instance;
  }

  public static toPre163(
    accept: OrderAcceptV0,
    chainHash: string,
  ): OrderAcceptV0Pre163 {
    const instance = new OrderAcceptV0Pre163();

    instance.tempOrderId = accept.tempOrderId;
    if (accept.negotiationFields) {
      instance.negotiationFields = OrderNegotiationFields.toPre163(
        accept.negotiationFields,
        chainHash,
      );
    } else {
      instance.negotiationFields = new OrderNegotiationFieldsV0Pre163();
    }

    return instance;
  }

  /**
   * The type for order_accept_v0 message. order_accept_v0 = 62772
   */
  public type = OrderAcceptV0.type;

  public protocolVersion: number;

  public tempOrderId: Buffer;

  public negotiationFields: null | OrderNegotiationFields = null;

  public tlvs: ITlv[] = [];

  /**
   * Converts order_negotiation_fields_v0 to JSON
   */
  public toJSON(): IOrderAcceptV0JSON {
    return {
      message: {
        protocolVersion: this.protocolVersion,
        tempOrderId: this.tempOrderId.toString('hex'),
        negotiationFields: this.negotiationFields.toJSON(),
      },
      serialized: this.serialize().toString('hex'),
    };
  }

  /**
   * Serializes the order_accept_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeUInt16BE(this.type);
    writer.writeUInt32BE(this.protocolVersion);
    writer.writeBytes(this.tempOrderId);
    writer.writeUInt8(this.negotiationFields ? 1 : 0);
    if (this.negotiationFields) {
      writer.writeBytes(this.negotiationFields.serialize());
    }

    for (const tlv of this.tlvs) {
      serializeTlv(tlv, writer);
    }

    return writer.toBuffer();
  }
}

export interface IOrderAcceptV0JSON {
  message: {
    protocolVersion: number;
    tempOrderId: string;
    negotiationFields: IOrderNegotiationFieldsJSON;
  };
  serialized: string;
}
