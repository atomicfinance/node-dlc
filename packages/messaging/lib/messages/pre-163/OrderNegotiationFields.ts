import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { IDlcMessagePre163 } from './DlcMessage';
import { IOrderOfferV0Pre163JSON, OrderOfferPre163 } from './OrderOffer';

export abstract class OrderNegotiationFieldsPre163 {
  public static deserialize(
    buf: Buffer,
  ): OrderNegotiationFieldsV0Pre163 | OrderNegotiationFieldsV1Pre163 {
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());

    switch (type) {
      case MessageType.OrderNegotiationFieldsV0:
        return OrderNegotiationFieldsV0Pre163.deserialize(buf);
      case MessageType.OrderNegotiationFieldsV1:
        return OrderNegotiationFieldsV1Pre163.deserialize(buf);
      default:
        throw new Error(
          `Order Negotiation Fields TLV type must be OrderNegotiationFieldsV0 or OrderNegotiationFieldsV1`,
        );
    }
  }

  public abstract type: number;

  public abstract length: bigint;

  public abstract toJSON():
    | IOrderNegotiationFieldsV0Pre163JSON
    | IOrderNegotiationFieldsV1Pre163JSON;

  public abstract serialize(): Buffer;
}

/**
 * OrderNegotiationFields V0 contains preferences of the accepter of a order
 * offer which are taken into account during DLC construction.
 */
export class OrderNegotiationFieldsV0Pre163
  extends OrderNegotiationFieldsPre163
  implements IDlcMessagePre163 {
  public static type = MessageType.OrderNegotiationFieldsV0;

  /**
   * Deserializes an order_negotiation_fields_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): OrderNegotiationFieldsV0Pre163 {
    const instance = new OrderNegotiationFieldsV0Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected OrderNegotiationFieldsV0, got type ${type}`,
    );

    instance.length = reader.readBigSize();

    return instance;
  }

  /**
   * The type for order_negotiation_fields_v0 message. order_negotiation_fields_v0 = 65334
   */
  public type = OrderNegotiationFieldsV0Pre163.type;

  public length: bigint;

  /**
   * Converts order_negotiation_fields_v0 to JSON
   */
  public toJSON(): IOrderNegotiationFieldsV0Pre163JSON {
    return {
      type: this.type,
    };
  }

  /**
   * Serializes the order_negotiation_fields_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);
    writer.writeBigSize(0);

    return writer.toBuffer();
  }
}

/**
 * OrderNegotiationFields V1 contains preferences of the acceptor of a order
 * offer which are taken into account during DLC construction.
 */
export class OrderNegotiationFieldsV1Pre163
  extends OrderNegotiationFieldsPre163
  implements IDlcMessagePre163 {
  public static type = MessageType.OrderNegotiationFieldsV1;

  /**
   * Deserializes an order_negotiation_fields_v1 message
   * @param buf
   */
  public static deserialize(buf: Buffer): OrderNegotiationFieldsV1Pre163 {
    const instance = new OrderNegotiationFieldsV1Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected OrderNegotiationFieldsV1, got type ${type}`,
    );

    instance.length = reader.readBigSize();
    const newBuf = reader.readBytes();
    instance.orderOffer = OrderOfferPre163.deserialize(newBuf);

    return instance;
  }

  /**
   * The type for order_negotiation_fields_v1 message. order_negotiation_fields_v1 = 65336
   */
  public type = OrderNegotiationFieldsV1Pre163.type;

  public length: bigint;

  public orderOffer: OrderOfferPre163;

  /**
   * Converts order_negotiation_fields_v1 to JSON
   */
  public toJSON(): IOrderNegotiationFieldsV1Pre163JSON {
    return {
      type: this.type,
      orderOffer: this.orderOffer.toJSON(),
    };
  }

  /**
   * Serializes the order_negotiation_fields_v1 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeBytes(this.orderOffer.serialize());

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

export interface IOrderNegotiationFieldsV0Pre163JSON {
  type: number;
}

export interface IOrderNegotiationFieldsV1Pre163JSON {
  type: number;
  orderOffer: IOrderOfferV0Pre163JSON;
}
