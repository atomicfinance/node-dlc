import { BufferReader } from '@node-lightning/bufio';

import { MessageType } from '../MessageType';
import { DlcAcceptV0 } from './DlcAccept';
import { DlcCloseV0 } from './DlcClose';
import { DlcOfferV0 } from './DlcOffer';
import { DlcSignV0 } from './DlcSign';
import { NodeAnnouncementMessage } from './NodeAnnouncementMessage';
import { OrderAcceptV0 } from './OrderAccept';
import { OrderOfferV0 } from './OrderOffer';
import { OracleAnnouncementV0Pre167 } from './pre-167/OracleAnnouncement';
import { OracleAttestationV0Pre167 } from './pre-167/OracleAttestation';

export interface IDlcMessage {
  serialize(): Buffer;
}

export abstract class DlcMessage {
  public static deserialize(
    reader: Buffer | BufferReader,
  ):
    | OrderOfferV0
    | OrderAcceptV0
    | DlcOfferV0
    | DlcAcceptV0
    | DlcSignV0
    | DlcCloseV0
    | NodeAnnouncementMessage
    | OracleAttestationV0Pre167
    | OracleAnnouncementV0Pre167 {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());

    const type = Number(tempReader.readUInt16BE());

    switch (type) {
      case MessageType.OrderOfferV0:
        return OrderOfferV0.deserialize(reader);
      case MessageType.OrderAcceptV0:
        return OrderAcceptV0.deserialize(reader);
      case MessageType.DlcOfferV0:
        return DlcOfferV0.deserialize(reader);
      case MessageType.DlcAcceptV0:
        return DlcAcceptV0.deserialize(reader);
      case MessageType.DlcSignV0:
        return DlcSignV0.deserialize(reader);
      case MessageType.DlcCloseV0:
        return DlcCloseV0.deserialize(reader);
      case MessageType.NodeAnnouncement:
        return NodeAnnouncementMessage.deserialize(reader);
      default:
        return this.deserializePre167(reader);
    }
  }

  public static deserializePre167(
    reader: Buffer | BufferReader,
  ): OracleAttestationV0Pre167 | OracleAnnouncementV0Pre167 {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());

    const type = Number(tempReader.readBigSize()); // Handle BigSize type for pre167 messages

    switch (type) {
      case MessageType.OracleAttestationV0:
        return OracleAttestationV0Pre167.deserialize(reader);
      case MessageType.OracleAnnouncementV0:
        return OracleAnnouncementV0Pre167.deserialize(reader);
      default:
        throw new Error(`Dlc Message type invalid`);
    }
  }

  public abstract type: number;

  public abstract serialize(): Buffer;
}
