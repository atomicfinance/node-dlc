import { BufferReader, BufferWriter } from '@node-lightning/bufio';

import { MessageType } from '../../MessageType';
import { IDlcMessagePre163 } from './DlcMessage';

export type DlcParty = 'offeror' | 'acceptor' | 'neither';

export abstract class OrderCsoInfoPre163 {
  public static deserialize(buf: Buffer): OrderCsoInfoPre163 {
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());

    switch (type) {
      case MessageType.OrderCsoInfoV0:
        return OrderCsoInfoV0Pre163.deserialize(buf);
      default:
        throw new Error(`Order cso info TLV type must be OrderCsoInfoV0`);
    }
  }

  public abstract type: number;

  public abstract toJSON(): IOrderCsoInfoV0Pre163JSON;

  public abstract serialize(): Buffer;
}

/**
 * OrderCsoInfo message
 */
export class OrderCsoInfoV0Pre163
  extends OrderCsoInfoPre163
  implements IDlcMessagePre163 {
  public static type = MessageType.OrderCsoInfoV0;

  /**
   * Deserializes an offer_dlc_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): OrderCsoInfoV0Pre163 {
    const instance = new OrderCsoInfoV0Pre163();
    const reader = new BufferReader(buf);

    reader.readBigSize(); // read type
    instance.length = reader.readBigSize();

    const encodedShiftForFees = reader.readUInt8();
    if (encodedShiftForFees === 0) {
      instance.shiftForFees = 'neither';
    } else if (encodedShiftForFees === 1) {
      instance.shiftForFees = 'offeror';
    } else if (encodedShiftForFees === 2) {
      instance.shiftForFees = 'acceptor';
    } else {
      throw new Error(`Invalid shift for fees value: ${encodedShiftForFees}`);
    }

    instance.fees = reader.readUInt64BE();

    return instance;
  }

  /**
   * The type for order_metadata_v0 message. order_metadata_v0 = 62774
   */
  public type = OrderCsoInfoV0Pre163.type;

  public length: bigint;

  public shiftForFees: DlcParty = 'neither';

  public fees = 0n;

  /**
   * Converts order_metadata_v0 to JSON
   */
  public toJSON(): IOrderCsoInfoV0Pre163JSON {
    return {
      type: this.type,
      shiftForFees: this.shiftForFees,
      fees: Number(this.fees),
    };
  }

  /**
   * Serializes the oracle_event message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeUInt8(
      this.shiftForFees === 'neither'
        ? 0
        : this.shiftForFees === 'offeror'
        ? 1
        : 2,
    );
    dataWriter.writeUInt64BE(this.fees);

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

export interface IOrderCsoInfoV0Pre163JSON {
  type: number;
  shiftForFees: string;
  fees: number;
}
