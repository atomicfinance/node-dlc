import { BufferReader } from '@node-lightning/bufio';

import { MessageType } from '../../MessageType';
import { OracleAttestationV0Pre167 } from '../pre-167/OracleAttestation';
import {
  ContractDescriptorV0Pre163,
  ContractDescriptorV1Pre163,
} from './ContractDescriptor';
import { ContractInfoV0Pre163, ContractInfoV1Pre163 } from './ContractInfo';
import { DlcAcceptV0Pre163 } from './DlcAccept';
import { DlcCloseV0Pre163 } from './DlcClose';
import { DlcOfferV0Pre163 } from './DlcOffer';
import { DlcSignV0Pre163 } from './DlcSign';
import { OrderAcceptV0Pre163 } from './OrderAccept';
import { OrderOfferV0Pre163 } from './OrderOffer';

export interface IDlcMessagePre163 {
  type: MessageType;
  serialize(): Buffer;
}

export abstract class DlcMessagePre163 {
  public static deserialize(
    buf: Buffer,
  ):
    | ContractDescriptorV0Pre163
    | ContractDescriptorV1Pre163
    | ContractInfoV0Pre163
    | ContractInfoV1Pre163
    | OrderOfferV0Pre163
    | OrderAcceptV0Pre163
    | DlcOfferV0Pre163
    | DlcAcceptV0Pre163
    | DlcSignV0Pre163
    | DlcCloseV0Pre163
    | OracleAttestationV0Pre167 {
    const reader = new BufferReader(buf);

    const type = Number(reader.readUInt16BE());

    switch (type) {
      case MessageType.ContractDescriptorV0:
        return ContractDescriptorV0Pre163.deserialize(buf);
      case MessageType.ContractDescriptorV1:
        return ContractDescriptorV1Pre163.deserialize(buf);
      case MessageType.ContractInfoV0:
        return ContractInfoV0Pre163.deserialize(buf);
      case MessageType.ContractInfoV1:
        return ContractInfoV1Pre163.deserialize(buf);
      case MessageType.OrderOfferV0:
        return OrderOfferV0Pre163.deserialize(buf);
      case MessageType.OrderAcceptV0:
        return OrderAcceptV0Pre163.deserialize(buf);
      case MessageType.DlcOfferV0:
        return DlcOfferV0Pre163.deserialize(buf);
      case MessageType.DlcAcceptV0:
        return DlcAcceptV0Pre163.deserialize(buf);
      case MessageType.DlcSignV0:
        return DlcSignV0Pre163.deserialize(buf);
      case MessageType.DlcCloseV0:
        return DlcCloseV0Pre163.deserialize(buf);
      case MessageType.OracleAttestationV0:
        return OracleAttestationV0Pre167.deserialize(buf);
      default:
        throw new Error(`Dlc Message type invalid`);
    }
  }

  public abstract type: number;

  public abstract serialize(): Buffer;
}
