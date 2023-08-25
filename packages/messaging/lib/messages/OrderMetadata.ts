import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../MessageType';
import { IDlcMessage } from './DlcMessage';
import { OrderMetadataV0Pre163 } from './pre-163/OrderMetadata';

export abstract class OrderMetadata {
  public static deserialize(reader: Buffer | BufferReader): OrderMetadata {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());

    const type = Number(tempReader.readBigSize());

    switch (type) {
      case MessageType.OrderMetadataV0:
        return OrderMetadataV0.deserialize(reader);
      default:
        throw new Error(`Order metadata TLV type must be OrderMetadataV0`);
    }
  }

  public abstract type: number;

  public abstract toJSON(): IOrderMetadataJSON;

  public abstract serialize(): Buffer;
}

/**
 * OrderMetadata message contains information about a node and indicates its
 * desire to enter into a new contract. This is the first step toward
 * order negotiation.
 */
export class OrderMetadataV0 extends OrderMetadata implements IDlcMessage {
  public static type = MessageType.OrderMetadataV0;

  /**
   * Deserializes an offer_dlc_v0 message
   * @param reader
   */
  public static deserialize(reader: Buffer | BufferReader): OrderMetadataV0 {
    const instance = new OrderMetadataV0();
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const type = Number(reader.readBigSize());
    assert(type === this.type, `Expected OrderMetadataV0, got type ${type}`);

    reader.readBigSize(); // read off length
    const offerIdLength = reader.readBigSize();
    const offerIdBuf = reader.readBytes(Number(offerIdLength));
    instance.offerId = offerIdBuf.toString();

    if (!reader.eof) {
      instance.createdAt = reader.readUInt32BE();
      instance.goodTill = reader.readUInt32BE();
    }

    return instance;
  }

  public static fromPre163(metadata: OrderMetadataV0Pre163): OrderMetadataV0 {
    const instance = new OrderMetadataV0();

    instance.offerId = metadata.offerId;
    instance.createdAt = metadata.createdAt;
    instance.goodTill = metadata.goodTill;

    return instance;
  }

  public static toPre163(metadata: OrderMetadataV0): OrderMetadataV0Pre163 {
    const instance = new OrderMetadataV0Pre163();

    instance.offerId = metadata.offerId;
    instance.createdAt = metadata.createdAt;
    instance.goodTill = metadata.goodTill;

    return instance;
  }

  /**
   * The type for order_metadata_v0 message. order_metadata_v0 = 62774
   */
  public type = OrderMetadataV0.type;

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
  public toJSON(): IOrderMetadataJSON {
    return {
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

export interface IOrderMetadataJSON {
  offerId: string;
  createdAt: number;
  goodTill: number;
}
