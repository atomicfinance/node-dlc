import { BufferReader, BufferWriter } from '@node-lightning/bufio';

import { MessageType } from '../MessageType';
import {
  ContractInfo,
  IDisjointContractInfoJSON,
  ISingleContractInfoJSON,
} from './ContractInfo';
import { IDlcMessage } from './DlcMessage';
import {
  OrderNegotiationFieldsPre163,
  OrderNegotiationFieldsV1Pre163,
} from './pre-163/OrderNegotiationFields';
import { OrderOfferV0Pre163 } from './pre-163/OrderOffer';

/**
 * OrderNegotiationFields V1 contains preferences of the acceptor of an order
 * offer which are taken into account during DLC construction.
 */
export class OrderNegotiationFields implements IDlcMessage {
  /**
   * Deserializes an order_negotiation_fields_v1 message
   * @param reader
   */
  public static deserialize(
    reader: Buffer | BufferReader,
  ): OrderNegotiationFields {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const instance = new OrderNegotiationFields();

    instance.contractInfo = ContractInfo.deserialize(reader);
    instance.offerCollateral = reader.readUInt64BE();
    instance.feeRatePerVb = reader.readUInt64BE();
    instance.cetLocktime = reader.readUInt32BE();
    instance.refundLocktime = reader.readUInt32BE();

    return instance;
  }

  public static fromPre163(
    orderNegociationFields: OrderNegotiationFieldsPre163,
  ): OrderNegotiationFields {
    const instance = new OrderNegotiationFields();
    switch (orderNegociationFields.type) {
      case MessageType.OrderNegotiationFieldsV1:
        instance.contractInfo = ContractInfo.fromPre163(
          ((orderNegociationFields as OrderNegotiationFieldsV1Pre163)
            .orderOffer as OrderOfferV0Pre163).contractInfo,
        );
        instance.offerCollateral = ((orderNegociationFields as OrderNegotiationFieldsV1Pre163)
          .orderOffer as OrderOfferV0Pre163).offerCollateralSatoshis;
        instance.feeRatePerVb = ((orderNegociationFields as OrderNegotiationFieldsV1Pre163)
          .orderOffer as OrderOfferV0Pre163).feeRatePerVb;
        instance.cetLocktime = ((orderNegociationFields as OrderNegotiationFieldsV1Pre163)
          .orderOffer as OrderOfferV0Pre163).cetLocktime;
        instance.refundLocktime = ((orderNegociationFields as OrderNegotiationFieldsV1Pre163)
          .orderOffer as OrderOfferV0Pre163).refundLocktime;
        break;
      default:
        throw new Error(
          `OrderNegotiationFields type must be OrderNegotiationFieldsV1`,
        );
    }

    return instance;
  }

  public static toPre163(
    orderNegociationFields: OrderNegotiationFields,
    chainHash: string,
  ): OrderNegotiationFieldsV1Pre163 {
    const instance = new OrderNegotiationFieldsV1Pre163();

    const orderOffer = new OrderOfferV0Pre163();
    orderOffer.chainHash = Buffer.from(chainHash, 'hex');
    orderOffer.contractInfo = ContractInfo.toPre163(
      orderNegociationFields.contractInfo,
    );
    orderOffer.offerCollateralSatoshis = orderNegociationFields.offerCollateral;
    orderOffer.feeRatePerVb = orderNegociationFields.feeRatePerVb;
    orderOffer.cetLocktime = orderNegociationFields.cetLocktime;
    orderOffer.refundLocktime = orderNegociationFields.refundLocktime;

    instance.orderOffer = orderOffer;

    return instance;
  }

  public contractInfo: ContractInfo;

  public offerCollateral: bigint;

  public feeRatePerVb: bigint;

  public cetLocktime: number;

  public refundLocktime: number;

  /**
   * Converts order_negotiation_fields_v1 to JSON
   */
  public toJSON(): IOrderNegotiationFieldsJSON {
    return {
      offerCollateral: Number(this.offerCollateral),
      contractInfo: this.contractInfo.toJSON(),
      feeRatePerVb: Number(this.feeRatePerVb),
      cetLocktime: this.cetLocktime,
      refundLocktime: this.refundLocktime,
    };
  }

  /**
   * Serializes the order_negotiation_fields_v1 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();

    const dataWriter = new BufferWriter();

    dataWriter.writeBytes(this.contractInfo.serialize());
    dataWriter.writeUInt64BE(this.offerCollateral);
    dataWriter.writeUInt64BE(this.feeRatePerVb);
    dataWriter.writeUInt32BE(this.cetLocktime);
    dataWriter.writeUInt32BE(this.refundLocktime);

    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

export interface IOrderNegotiationFieldsJSON {
  offerCollateral: number;
  contractInfo: ISingleContractInfoJSON | IDisjointContractInfoJSON;
  feeRatePerVb: number;
  cetLocktime: number;
  refundLocktime: number;
}
