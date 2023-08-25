import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { deserializeTlv } from '../../serialize/deserializeTlv';
import { getTlv } from '../../serialize/getTlv';
import {
  validateBigInt,
  validateBuffer,
  validateNumber,
} from '../../validation/validate';
import {
  ContractInfoPre163,
  IContractInfoV0Pre163JSON,
  IContractInfoV1Pre163JSON,
} from './ContractInfo';
import { IDlcMessagePre163 } from './DlcMessage';
import {
  IOrderIrcInfoV0Pre163JSON,
  OrderIrcInfoPre163,
  OrderIrcInfoV0Pre163,
} from './OrderIrcInfo';
import {
  IOrderMetadataV0Pre163JSON,
  OrderMetadataPre163,
  OrderMetadataV0Pre163,
} from './OrderMetadata';
import {
  IOrderCsoInfoV0Pre163JSON,
  OrderCsoInfoPre163,
  OrderCsoInfoV0Pre163,
} from './OrderCsoInfo';

const LOCKTIME_THRESHOLD = 500000000;
export abstract class OrderOfferPre163 {
  public static deserialize(buf: Buffer): OrderOfferPre163 {
    const reader = new BufferReader(buf);

    const type = Number(reader.readUInt16BE());

    switch (type) {
      case MessageType.OrderOfferV0:
        return OrderOfferV0Pre163.deserialize(buf);
      default:
        throw new Error(`Order offer TLV type must be OrderOfferV0`);
    }
  }

  public abstract type: number;

  public abstract validate(): void;

  public abstract toJSON(): IOrderOfferV0Pre163JSON;

  public abstract serialize(): Buffer;
}

/**
 * OrderOffer message contains information about a node and indicates its
 * desire to enter into a new contract. This is the first step toward
 * order negotiation.
 */
export class OrderOfferV0Pre163
  extends OrderOfferPre163
  implements IDlcMessagePre163 {
  public static type = MessageType.OrderOfferV0;

  /**
   * Deserializes an offer_dlc_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): OrderOfferV0Pre163 {
    const instance = new OrderOfferV0Pre163();
    const reader = new BufferReader(buf);

    const type = reader.readUInt16BE();
    assert(type === this.type, `Expected OrderOfferV0, got type ${type}`);

    instance.chainHash = reader.readBytes(32);
    instance.contractInfo = ContractInfoPre163.deserialize(getTlv(reader));
    instance.offerCollateralSatoshis = reader.readUInt64BE();
    instance.feeRatePerVb = reader.readUInt64BE();
    instance.cetLocktime = reader.readUInt32BE();
    instance.refundLocktime = reader.readUInt32BE();

    while (!reader.eof) {
      const buf = getTlv(reader);
      const tlvReader = new BufferReader(buf);
      const { type } = deserializeTlv(tlvReader);

      switch (Number(type)) {
        case MessageType.OrderMetadataV0:
          instance.metadata = OrderMetadataV0Pre163.deserialize(buf);
          break;
        case MessageType.OrderIrcInfoV0:
          instance.ircInfo = OrderIrcInfoV0Pre163.deserialize(buf);
          break;
        case MessageType.OrderCsoInfoV0:
          instance.csoInfo = OrderCsoInfoV0Pre163.deserialize(buf);
          break;
        default:
          break;
      }
    }

    return instance;
  }

  /**
   * The type for order_offer_v0 message. order_offer_v0 = 62770
   */
  public type = OrderOfferV0Pre163.type;

  public chainHash: Buffer;

  public contractInfo: ContractInfoPre163;

  public offerCollateralSatoshis: bigint;

  public feeRatePerVb: bigint;

  public cetLocktime: number;

  public refundLocktime: number;

  public metadata?: OrderMetadataPre163;

  public ircInfo?: OrderIrcInfoPre163;

  public csoInfo?: OrderCsoInfoPre163;

  public validate(): void {
    validateBuffer(this.chainHash, 'chainHash', OrderOfferV0Pre163.name, 32);
    this.contractInfo.validate();
    validateBigInt(
      this.offerCollateralSatoshis,
      'offerCollateralSatoshis',
      OrderOfferV0Pre163.name,
    );
    validateBigInt(this.feeRatePerVb, 'feeRatePerVb', OrderOfferV0Pre163.name);
    validateNumber(this.cetLocktime, 'cetLocktime', OrderOfferV0Pre163.name);
    validateNumber(
      this.refundLocktime,
      'refundLocktime',
      OrderOfferV0Pre163.name,
    );

    // 1. Type is set automatically in class
    // 2. chain_hash must be validated as input by end user

    // 3. offer_collateral_satoshis must be greater than or equal to 1000
    if (this.offerCollateralSatoshis < 1000) {
      throw new Error(
        'offer_collateral_satoshis must be greater than or equal to 1000',
      );
    }

    if (this.cetLocktime < 0) {
      throw new Error('cet_locktime must be greater than or equal to 0');
    }

    if (this.refundLocktime < 0) {
      throw new Error('refund_locktime must be greater than or equal to 0');
    }

    // 4. cet_locktime and refund_locktime must either both be unix timestamps, or both be block heights.
    // https://en.bitcoin.it/wiki/NLockTime
    // https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki#detailed-specification
    // https://github.com/bitcoin/bitcoin/blob/master/src/script/script.h#L39
    if (
      !(
        (this.cetLocktime < LOCKTIME_THRESHOLD &&
          this.refundLocktime < LOCKTIME_THRESHOLD) ||
        (this.cetLocktime >= LOCKTIME_THRESHOLD &&
          this.refundLocktime >= LOCKTIME_THRESHOLD)
      )
    ) {
      throw new Error('cetLocktime and refundLocktime must be in same units');
    }

    // 5. cetLocktime must be less than refundLocktime
    if (this.cetLocktime >= this.refundLocktime) {
      throw new Error('cetLocktime must be less than refundLocktime');
    }

    // 6. validate contractInfo
    this.contractInfo.validate();

    // totalCollaterial should be > offerCollaterial (logical validation)
    if (this.contractInfo.totalCollateral <= this.offerCollateralSatoshis) {
      throw new Error('totalCollateral should be greater than offerCollateral');
    }
  }

  /**
   * Converts order_offer_v0 to JSON
   */
  public toJSON(): IOrderOfferV0Pre163JSON {
    const tlvs = [];

    if (this.metadata) tlvs.push(this.metadata.toJSON());
    if (this.ircInfo) tlvs.push(this.ircInfo.toJSON());
    if (this.csoInfo) tlvs.push(this.csoInfo.toJSON());

    return {
      type: this.type,
      chainHash: this.chainHash.toString('hex'),
      contractInfo: this.contractInfo.toJSON(),
      offerCollateralSatoshis: Number(this.offerCollateralSatoshis),
      feeRatePerVb: Number(this.feeRatePerVb),
      cetLocktime: this.cetLocktime,
      refundLocktime: this.refundLocktime,
      tlvs,
    };
  }

  /**
   * Serializes the order_offer_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.chainHash);
    writer.writeBytes(this.contractInfo.serialize());
    writer.writeUInt64BE(this.offerCollateralSatoshis);
    writer.writeUInt64BE(this.feeRatePerVb);
    writer.writeUInt32BE(this.cetLocktime);
    writer.writeUInt32BE(this.refundLocktime);

    if (this.metadata) writer.writeBytes(this.metadata.serialize());
    if (this.ircInfo) writer.writeBytes(this.ircInfo.serialize());
    if (this.csoInfo) writer.writeBytes(this.csoInfo.serialize());

    return writer.toBuffer();
  }
}

export interface IOrderOfferV0Pre163JSON {
  type: number;
  chainHash: string;
  contractInfo: IContractInfoV0Pre163JSON | IContractInfoV1Pre163JSON;
  offerCollateralSatoshis: number;
  feeRatePerVb: number;
  cetLocktime: number;
  refundLocktime: number;
  tlvs: (
    | IOrderMetadataV0Pre163JSON
    | IOrderIrcInfoV0Pre163JSON
    | IOrderCsoInfoV0Pre163JSON
  )[];
}
