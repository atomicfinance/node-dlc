import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../MessageType';
import { IDlcMessage } from './DlcMessage';
import { OrderIrcInfoV0Pre163 } from './pre-163/OrderIrcInfo';

export abstract class OrderIrcInfo {
  public static deserialize(reader: Buffer | BufferReader): OrderIrcInfo {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());

    const type = Number(tempReader.readBigSize());

    switch (type) {
      case MessageType.OrderIrcInfoV0:
        return OrderIrcInfoV0.deserialize(reader);
      default:
        throw new Error(`Order irc info TLV type must be OrderIrcInfoV0`);
    }
  }

  public abstract type: number;

  public abstract toJSON(): IOrderIrcInfoJSON;

  public abstract serialize(): Buffer;
}

/**
 * OrderMetadata message contains information about a node and indicates its
 * desire to enter into a new contract. This is the first step toward
 * order negotiation.
 */
export class OrderIrcInfoV0 extends OrderIrcInfo implements IDlcMessage {
  public static type = MessageType.OrderIrcInfoV0;

  /**
   * Deserializes an offer_dlc_v0 message
   * @param reader
   */
  public static deserialize(reader: Buffer | BufferReader): OrderIrcInfoV0 {
    const instance = new OrderIrcInfoV0();
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const type = Number(reader.readBigSize());
    assert(type === this.type, `Expected OrderIrcInfoV0, got type ${type}`);

    reader.readBigSize(); // read off length
    const nickLength = reader.readBigSize();
    const nickBuf = reader.readBytes(Number(nickLength));
    instance.nick = nickBuf.toString();

    instance.pubKey = reader.readBytes(33);

    return instance;
  }

  public static fromPre163(ircInfo: OrderIrcInfoV0Pre163): OrderIrcInfoV0 {
    const instance = new OrderIrcInfoV0();

    instance.nick = ircInfo.nick;
    instance.pubKey = ircInfo.pubKey;

    return instance;
  }

  public static toPre163(ircInfo: OrderIrcInfoV0): OrderIrcInfoV0Pre163 {
    const instance = new OrderIrcInfoV0Pre163();

    instance.nick = ircInfo.nick;
    instance.pubKey = ircInfo.pubKey;

    return instance;
  }

  /**
   * The type for order_metadata_v0 message. order_metadata_v0 = 62774
   */
  public type = OrderIrcInfoV0.type;

  public nick: string;

  public pubKey: Buffer;

  /**
   * Converts order_metadata_v0 to JSON
   */
  public toJSON(): IOrderIrcInfoJSON {
    return {
      nick: this.nick,
      pubKey: this.pubKey.toString('hex'),
    };
  }

  /**
   * Serializes the oracle_event message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();

    dataWriter.writeBigSize(this.nick.length);
    dataWriter.writeBytes(Buffer.from(this.nick));
    dataWriter.writeBytes(this.pubKey);

    writer.writeBigSize(dataWriter.size);

    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

export interface IOrderIrcInfoJSON {
  nick: string;
  pubKey: string;
}
