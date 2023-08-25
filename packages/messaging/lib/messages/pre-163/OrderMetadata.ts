import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { IDlcMessagePre163 } from './DlcMessage';

export abstract class OrderMetadataPre163 {
  public static deserialize(buf: Buffer): OrderMetadataPre163 {
    const reader = new BufferReader(buf);

    const type = Number(reader.readUInt16BE());

    switch (type) {
      case MessageType.OrderMetadataV0:
        return OrderMetadataV0Pre163.deserialize(buf);
      default:
        throw new Error(`Order metadata TLV type must be OrderMetadataV0`);
    }
  }

  public abstract type: number;

  public abstract toJSON(): IOrderMetadataV0Pre163JSON;

  public abstract serialize(): Buffer;
}

/**
 * OrderMetadata message contains information about a node and indicates its
 * desire to enter into a new contract. This is the first step toward
 * order negotiation.
 */
export class OrderMetadataV0Pre163
  extends OrderMetadataPre163
  implements IDlcMessagePre163 {
  public static type = MessageType.OrderMetadataV0;

  /**
   * Deserializes an offer_dlc_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): OrderMetadataV0Pre163 {
    const instance = new OrderMetadataV0Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(type === this.type, `Expected OrderMetadataV0, got type ${type}`);

    instance.length = reader.readBigSize();
    const offerIdLength = reader.readBigSize();
    const offerIdBuf = reader.readBytes(Number(offerIdLength));
    instance.offerId = offerIdBuf.toString();

    if (!reader.eof) {
      instance.createdAt = reader.readUInt32BE();
      instance.goodTill = reader.readUInt32BE();
    }

    return instance;
  }

  /**
   * The type for order_metadata_v0 message. order_metadata_v0 = 62774
   */
  public type = OrderMetadataV0Pre163.type;

  public length: bigint;

  /**
   * offerId is a unique identifier for an offer
   * It can be used for updating liquidity for a particular category
   * For example, how much liquidity is remaining for a particular strategy
   * which a market maker is providing liquidity for
   */
  public offerId: string;

  /**
   * Timestamp for order creation
   */
  public createdAt = 0;

  /**
   * Amount of time order is good untill
   */
  public goodTill = 0;

  /**
   * Converts order_metadata_v0 to JSON
   */
  public toJSON(): IOrderMetadataV0Pre163JSON {
    return {
      type: this.type,
      offerId: this.offerId,
      createdAt: this.createdAt,
      goodTill: this.goodTill,
    };
  }

  /**
   * Serializes the oracle_event message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeBigSize(this.offerId.length);
    dataWriter.writeBytes(Buffer.from(this.offerId));
    dataWriter.writeUInt32BE(this.createdAt);
    dataWriter.writeUInt32BE(this.goodTill);

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

export interface IOrderMetadataV0Pre163JSON {
  type: number;
  offerId: string;
  createdAt: number;
  goodTill: number;
}
