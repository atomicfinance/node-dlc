import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { getTlv } from '../../serialize/getTlv';
import { IDlcMessagePre163 } from './DlcMessage';
import {
  IOrderNegotiationFieldsV0Pre163JSON,
  IOrderNegotiationFieldsV1Pre163JSON,
  OrderNegotiationFieldsPre163,
} from './OrderNegotiationFields';

export abstract class OrderAcceptPre163 {
  public static deserialize(buf: Buffer): OrderAcceptPre163 {
    const reader = new BufferReader(buf);

    const type = Number(reader.readUInt16BE());

    switch (type) {
      case MessageType.OrderAcceptV0:
        return OrderAcceptV0Pre163.deserialize(buf);
      default:
        throw new Error(`Order accept TLV type must be OrderAcceptV0`);
    }
  }

  public abstract type: number;

  public abstract toJSON(): IOrderAcceptV0Pre163JSON;

  public abstract serialize(): Buffer;
}

/**
 * OrderAccept contains information about a node and indicates its
 * acceptance of the new order offer. This is the second step towards
 * order negotiation.
 */
export class OrderAcceptV0Pre163
  extends OrderAcceptPre163
  implements IDlcMessagePre163 {
  public static type = MessageType.OrderAcceptV0;

  /**
   * Deserializes an order_accept_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): OrderAcceptV0Pre163 {
    const instance = new OrderAcceptV0Pre163();
    const reader = new BufferReader(buf);

    const type = reader.readUInt16BE();
    assert(type === this.type, `Expected OrderAcceptV0, got type ${type}`);

    instance.tempOrderId = reader.readBytes(32);
    instance.negotiationFields = OrderNegotiationFieldsPre163.deserialize(
      getTlv(reader),
    );

    return instance;
  }

  /**
   * The type for order_accept_v0 message. order_accept_v0 = 62772
   */
  public type = OrderAcceptV0Pre163.type;

  public tempOrderId: Buffer;

  public negotiationFields: OrderNegotiationFieldsPre163;

  /**
   * Converts order_negotiation_fields_v0 to JSON
   */
  public toJSON(): IOrderAcceptV0Pre163JSON {
    return {
      type: this.type,
      tempOrderId: this.tempOrderId.toString('hex'),
      negotiationFields: this.negotiationFields.toJSON(),
    };
  }

  /**
   * Serializes the order_accept_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.tempOrderId);
    writer.writeBytes(this.negotiationFields.serialize());

    return writer.toBuffer();
  }
}

export interface IOrderAcceptV0Pre163JSON {
  type: number;
  tempOrderId: string;
  negotiationFields:
    | IOrderNegotiationFieldsV0Pre163JSON
    | IOrderNegotiationFieldsV1Pre163JSON;
}
