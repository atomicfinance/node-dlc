import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../MessageType';
import {
  deserializeTlv,
  ITlv,
  serializeTlv,
} from '../serialize/deserializeTlv';
import { getTlv } from '../serialize/getTlv';
import {
  validateBigInt,
  validateBuffer,
  validateNumber,
} from '../validation/validate';
import {
  ContractInfo,
  IDisjointContractInfoJSON,
  ISingleContractInfoJSON,
} from './ContractInfo';
import { IDlcMessage } from './DlcMessage';
import { OrderCsoInfo, OrderCsoInfoV0 } from './OrderCsoInfo';
import {
  OrderIrcInfo,
  OrderIrcInfoV0,
} from './OrderIrcInfo';
import { OrderMetadata, OrderMetadataV0 } from './OrderMetadata';
import { OrderMetadataV0Pre163 } from './pre-163/OrderMetadata';
import { OrderIrcInfoV0Pre163 } from './pre-163/OrderIrcInfo';
import { OrderCsoInfoV0Pre163 } from "./pre-163/OrderCsoInfo";
import { OrderOfferV0Pre163 } from './pre-163/OrderOffer';

const LOCKTIME_THRESHOLD = 500000000;
export abstract class OrderOffer {
  public static deserialize(reader: Buffer | BufferReader): OrderOffer {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());

    const type = Number(tempReader.readUInt16BE());

    switch (type) {
      case MessageType.OrderOfferV0:
        return OrderOfferV0.deserialize(reader);
      default:
        throw new Error(`Order offer TLV type must be OrderOfferV0`);
    }
  }

  public abstract type: number;

  public abstract validate(): void;

  public abstract toJSON(): IOrderOfferJSON;

  public abstract serialize(): Buffer;
}

/**
 * OrderOffer message contains information about a node and indicates its
 * desire to enter into a new contract. This is the first step toward
 * order negotiation.
 */
export class OrderOfferV0 extends OrderOffer implements IDlcMessage {
  public static type = MessageType.OrderOfferV0;

  /**
   * Deserializes an offer_dlc_v0 message
   * @param reader
   */
  public static deserialize(reader: Buffer | BufferReader): OrderOfferV0 {
    const instance = new OrderOfferV0();
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const type = reader.readUInt16BE();
    assert(type === this.type, `Expected OrderOfferV0, got type ${type}`);

    instance.protocolVersion = reader.readUInt32BE();
    instance.contractFlags = reader.readUInt8();
    instance.chainHash = reader.readBytes(32);
    instance.contractInfo = ContractInfo.deserialize(reader);
    instance.offerCollateral = reader.readUInt64BE();
    instance.feeRatePerVb = reader.readUInt64BE();
    instance.cetLocktime = reader.readUInt32BE();
    instance.refundLocktime = reader.readUInt32BE();

    while (!reader.eof) {
      const buf = getTlv(reader);
      const tlvReader = new BufferReader(buf);
      const { type, length, body } = deserializeTlv(tlvReader);

      instance.tlvs.push({ type, length, body });

      switch (Number(type)) {
        case MessageType.OrderMetadataV0:
          instance.metadata = OrderMetadataV0.deserialize(buf);
          break;
        case MessageType.OrderIrcInfoV0:
          instance.ircInfo = OrderIrcInfoV0.deserialize(buf);
          break;
        case MessageType.OrderCsoInfoV0:
          instance.csoInfo = OrderCsoInfo.deserialize(buf);
          break;
        default:
          break;
      }
    }

    return instance;
  }

  public static fromPre163(
    offer: OrderOfferV0Pre163,
    contractFlags: number,
  ): OrderOfferV0 {
    const instance = new OrderOfferV0();
    instance.protocolVersion = 1;
    instance.contractFlags = contractFlags;
    instance.chainHash = offer.chainHash;
    instance.contractInfo = ContractInfo.fromPre163(offer.contractInfo);
    instance.offerCollateral = offer.offerCollateralSatoshis;
    instance.feeRatePerVb = offer.feeRatePerVb;
    instance.cetLocktime = offer.cetLocktime;
    instance.refundLocktime = offer.refundLocktime;
    if (offer.metadata) {
      instance.metadata = OrderMetadataV0.fromPre163(
        offer.metadata as OrderMetadataV0Pre163,
      );
    }
    if (offer.ircInfo) {
      instance.ircInfo = OrderIrcInfoV0.fromPre163(
        offer.ircInfo as OrderIrcInfoV0Pre163,
      );
    }
    if (offer.csoInfo) {
      instance.csoInfo = OrderCsoInfoV0.fromPre163(
        offer.csoInfo as OrderCsoInfoV0Pre163,
      );
    }

    return instance;
  }

  public static toPre163(offer: OrderOfferV0): OrderOfferV0Pre163 {
    const instance = new OrderOfferV0Pre163();
    instance.chainHash = offer.chainHash;
    instance.contractInfo = ContractInfo.toPre163(offer.contractInfo);
    instance.offerCollateralSatoshis = offer.offerCollateral;
    instance.feeRatePerVb = offer.feeRatePerVb;
    instance.cetLocktime = offer.cetLocktime;
    instance.refundLocktime = offer.refundLocktime;
    if (offer.metadata) {
      instance.metadata = OrderMetadataV0.toPre163(
        offer.metadata as OrderMetadataV0Pre163,
      );
    }
    if (offer.ircInfo) {
      instance.ircInfo = OrderIrcInfoV0.toPre163(
        offer.ircInfo as OrderIrcInfoV0Pre163,
      );
    }
    if (offer.csoInfo) {
      instance.csoInfo = OrderCsoInfoV0.toPre163(
        offer.csoInfo as OrderCsoInfoV0Pre163,
      );
    }

    return instance;
  }

  /**
   * The type for order_offer_v0 message. order_offer_v0 = 62770
   */
  public type = OrderOfferV0.type;

  public protocolVersion: number;

  public contractFlags: number;

  public chainHash: Buffer;

  public contractInfo: ContractInfo;

  public offerCollateral: bigint;

  public feeRatePerVb: bigint;

  public cetLocktime: number;

  public refundLocktime: number;

  public metadata?: OrderMetadata;

  public ircInfo?: OrderIrcInfo;

  public csoInfo?: OrderCsoInfo;

  public tlvs: ITlv[] = [];

  public validate(): void {
    validateBuffer(this.chainHash, 'chainHash', OrderOfferV0.name, 32);
    this.contractInfo.validate();
    validateBigInt(
      this.offerCollateral,
      'offerCollateral',
      OrderOfferV0.name,
    );
    validateBigInt(this.feeRatePerVb, 'feeRatePerVb', OrderOfferV0.name);
    validateNumber(this.cetLocktime, 'cetLocktime', OrderOfferV0.name);
    validateNumber(this.refundLocktime, 'refundLocktime', OrderOfferV0.name);

    // 1. Type is set automatically in class
    // 2. chain_hash must be validated as input by end user

    // 3. offer_collateral_satoshis must be greater than or equal to 1000
    if (this.offerCollateral < 1000) {
      throw new Error(
        'offer_collateral must be greater than or equal to 1000',
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
    if (this.contractInfo.totalCollateral <= this.offerCollateral) {
      throw new Error('totalCollateral should be greater than offerCollateral');
    }
  }

  /**
   * Converts order_offer_v0 to JSON
   */
  public toJSON(): IOrderOfferJSON {
    return {
      message: {
        protocolVersion: this.protocolVersion,
        contractFlags: this.contractFlags,
        chainHash: this.chainHash.toString('hex'),
        contractInfo: this.contractInfo.toJSON(),
        offerCollateral: Number(this.offerCollateral),
        feeRatePerVb: Number(this.feeRatePerVb),
        cetLocktime: this.cetLocktime,
        refundLocktime: this.refundLocktime,
        tlvs: this.tlvs,
      },
      serialized: this.serialize().toString('hex'),
    };
  }

  /**
   * Serializes the order_offer_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeUInt16BE(this.type);
    writer.writeUInt32BE(this.protocolVersion);
    writer.writeUInt8(this.contractFlags);
    writer.writeBytes(this.chainHash);
    writer.writeBytes(this.contractInfo.serialize());
    writer.writeUInt64BE(this.offerCollateral);
    writer.writeUInt64BE(this.feeRatePerVb);
    writer.writeUInt32BE(this.cetLocktime);
    writer.writeUInt32BE(this.refundLocktime);

    for (const tlv of this.tlvs) {
      serializeTlv(tlv, writer);
    }

    return writer.toBuffer();
  }
}
export interface ITlvJSON {
  type: number;
  length: number;
  body: string;
}

export interface IOrderOfferJSON {
  message: {
    protocolVersion: number;
    contractFlags: number;
    chainHash: string;
    contractInfo: ISingleContractInfoJSON | IDisjointContractInfoJSON;
    offerCollateral: number;
    feeRatePerVb: number;
    cetLocktime: number;
    refundLocktime: number;
    tlvs: ITlv[];
  };
  serialized: string;
}
