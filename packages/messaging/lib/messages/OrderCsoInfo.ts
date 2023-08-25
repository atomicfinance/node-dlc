import { BufferReader, BufferWriter } from '@node-lightning/bufio';

import { MessageType } from '../MessageType';
import { IDlcMessage } from './DlcMessage';
import { OrderMetadataV0Pre163 } from "./pre-163/OrderMetadata";
import { OrderCsoInfoV0Pre163 } from "./pre-163/OrderCsoInfo";

export type DlcParty = 'offeror' | 'acceptor' | 'neither';

export abstract class OrderCsoInfo {
  public static deserialize(buf: Buffer): OrderCsoInfo {
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());

    switch (type) {
      case MessageType.OrderCsoInfoV0:
        return OrderCsoInfoV0.deserialize(buf);
      default:
        throw new Error(`Order cso info TLV type must be OrderCsoInfoV0`);
    }
  }

  public abstract type: number;

  public abstract toJSON(): IOrderCsoInfoJSON;

  public abstract serialize(): Buffer;
}

/**
 * OrderCsoInfo message
 */
export class OrderCsoInfoV0 extends OrderCsoInfo implements IDlcMessage {
  public static type = MessageType.OrderCsoInfoV0;

  /**
   * Deserializes an offer_dlc_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): OrderCsoInfoV0 {
    const instance = new OrderCsoInfoV0();
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

  public static fromPre163(csoInfo: OrderCsoInfoV0Pre163): OrderCsoInfoV0 {
    const instance = new OrderCsoInfoV0();

    instance.length = csoInfo.length;
    instance.shiftForFees = csoInfo.shiftForFees;
    instance.fees = csoInfo.fees;

    return instance;
  }

  public static toPre163(csoInfo: OrderCsoInfoV0): OrderCsoInfoV0Pre163 {
    const instance = new OrderCsoInfoV0Pre163();

    instance.length = csoInfo.length;
    instance.shiftForFees = csoInfo.shiftForFees;
    instance.fees = csoInfo.fees;

    return instance;
  }

  /**
   * The type for order_metadata_v0 message. order_metadata_v0 = 62774
   */
  public type = OrderCsoInfoV0.type;

  public length: bigint;

  public shiftForFees: DlcParty = 'neither';

  public fees = BigInt(0);

  /**
   * Converts order_metadata_v0 to JSON
   */
  public toJSON(): IOrderCsoInfoJSON {
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

export interface IOrderCsoInfoJSON {
  type: number;
  shiftForFees: string;
  fees: number;
}
