import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { getTlv } from '../serialize/getTlv';
import { IDlcMessage } from './DlcMessage';
import { OracleInfoV0Pre163 } from './pre-163/OracleInfo';
import {
  IOracleAnnouncementV0Pre167JSON,
  OracleAnnouncementV0Pre167,
} from './pre-167/OracleAnnouncement';

export enum OracleInfoType {
  Single = 0,
  Multi = 1,
}

export abstract class OracleInfo implements IDlcMessage {
  public static deserialize(
    reader: Buffer | BufferReader,
  ): SingleOracleInfo | MultiOracleInfo {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());

    const type = Number(tempReader.readBigSize());

    switch (type) {
      case OracleInfoType.Single:
        return SingleOracleInfo.deserialize(reader);
      case OracleInfoType.Multi:
        return MultiOracleInfo.deserialize(reader);
      default:
        throw new Error(
          `Contract info type must be ContractInfoV0 or ContractInfoV1`,
        );
    }
  }

  public static fromPre163(oracleInfo: OracleInfoV0Pre163): OracleInfo {
    if (oracleInfo instanceof OracleInfoV0Pre163) {
      return SingleOracleInfo.fromPre163(oracleInfo);
    } else {
      throw new Error('fromPre163 only supports OracleInfoV0');
    }
  }

  public static toPre163(oracleInfo: OracleInfo): OracleInfoV0Pre163 {
    if (oracleInfo instanceof SingleOracleInfo) {
      return SingleOracleInfo.toPre163(oracleInfo);
    } else {
      throw new Error('toPre163 only supports SingleOracleInfo');
    }
  }

  public abstract type: number;

  public abstract validate(): void;

  public abstract toJSON(): ISingleOracleInfoJSON | IMultiOracleInfoJSON;

  public abstract serialize(): Buffer;
}

/**
 * OracleInfo contains information about the oracles to be used in
 * executing a DLC.
 */
export class SingleOracleInfo extends OracleInfo implements IDlcMessage {
  public static type = OracleInfoType.Single;

  /**
   * Deserializes an oracle_info_v0 message
   * @param reader
   */
  public static deserialize(reader: Buffer | BufferReader): SingleOracleInfo {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const instance = new SingleOracleInfo();

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected OracleInfoType.Single, got type ${type}`,
    );

    instance.announcement = OracleAnnouncementV0Pre167.deserialize(
      getTlv(reader),
    );

    return instance;
  }

  public static fromPre163(oracleInfo: OracleInfoV0Pre163): SingleOracleInfo {
    const instance = new SingleOracleInfo();

    instance.announcement = oracleInfo.announcement;

    return instance;
  }

  public static toPre163(oracleInfo: SingleOracleInfo): OracleInfoV0Pre163 {
    const instance = new OracleInfoV0Pre163();

    instance.announcement = oracleInfo.announcement;

    return instance;
  }

  /**
   * The type for oracle_info_v0 message. oracle_info_v0 = 42770
   */
  public type = SingleOracleInfo.type;

  public announcement: OracleAnnouncementV0Pre167;

  public validate(): void {
    this.announcement.validate();
  }

  /**
   * Converts oracle_info_v0 to JSON
   */
  public toJSON(): ISingleOracleInfoJSON {
    return {
      single: {
        oracleAnnouncement: this.announcement.toJSON(),
      },
    };
  }

  /**
   * Serializes the oracle_info_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeBytes(this.announcement.serialize());

    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

/**
 * OracleInfo contains information about the oracles to be used in
 * executing a DLC.
 */
export class MultiOracleInfo extends OracleInfo implements IDlcMessage {
  public static type = OracleInfoType.Multi;

  /**
   * Deserializes an oracle_info_v0 message
   * @param reader
   */
  public static deserialize(reader: Buffer | BufferReader): MultiOracleInfo {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const instance = new MultiOracleInfo();

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected OracleInfoType.Multi, got type ${type}`,
    );

    instance.threshold = reader.readUInt16BE();
    const numOracles = reader.readBigSize();
    for (let i = 0; i < numOracles; i++) {
      const announcement = OracleAnnouncementV0Pre167.deserialize(
        getTlv(reader),
      );
      instance.announcements.push(announcement);
    }
    instance.hasOracleParams = reader.readUInt8() === 1;
    if (instance.hasOracleParams) {
      instance.oracleParams = OracleParams.deserialize(reader);
    }

    return instance;
  }

  /**
   * The type for oracle_info_v0 message. oracle_info_v0 = 42770
   */
  public type = MultiOracleInfo.type;

  public threshold: number;

  public announcements: OracleAnnouncementV0Pre167[] = [];

  public hasOracleParams: boolean;

  public oracleParams: OracleParams;

  public validate(): void {
    this.announcements.forEach((announcement) => {
      announcement.validate();
    });
  }

  /**
   * Converts oracle_info_v0 to JSON
   */
  public toJSON(): IMultiOracleInfoJSON {
    return {
      multi: {
        threshold: this.threshold,
        oracleAnnouncements: this.announcements.map((announcement) =>
          announcement.toJSON(),
        ),
        oracleParams: this.hasOracleParams ? this.oracleParams.toJSON() : null,
      },
    };
  }

  /**
   * Serializes the oracle_info_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeUInt16BE(this.threshold);
    dataWriter.writeBigSize(this.announcements.length);
    this.announcements.forEach((announcement) => {
      dataWriter.writeBytes(announcement.serialize());
    });
    dataWriter.writeUInt8(this.hasOracleParams ? 1 : 0);
    if (this.hasOracleParams) {
      dataWriter.writeBytes(this.oracleParams.serialize());
    }

    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

export class OracleParams implements IDlcMessage {
  /**
   * Deserializes an oracle_info_v0 message
   * @param buf
   */
  public static deserialize(reader: Buffer | BufferReader): OracleParams {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const instance = new OracleParams();

    instance.maxErrorExp = reader.readUInt16BE();
    instance.minFailExp = reader.readUInt16BE();
    instance.maximizeCoverage = reader.readUInt8() === 1;

    return instance;
  }

  public maxErrorExp: number;

  public minFailExp: number;

  public maximizeCoverage: boolean;

  /**
   * Converts oracle_info_v0 to JSON
   */
  public toJSON(): IOracleParamsJSON {
    return {
      maxErrorExp: this.maxErrorExp,
      minFailExp: this.minFailExp,
      maximizeCoverage: this.maximizeCoverage,
    };
  }

  public serialize(): Buffer {
    const writer = new BufferWriter();

    const dataWriter = new BufferWriter();
    dataWriter.writeUInt16BE(this.maxErrorExp);
    dataWriter.writeUInt16BE(this.minFailExp);
    dataWriter.writeUInt8(this.maximizeCoverage ? 1 : 0);

    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

export interface IOracleParamsJSON {
  maxErrorExp: number;
  minFailExp: number;
  maximizeCoverage: boolean;
}
export interface ISingleOracleInfoJSON {
  single: {
    oracleAnnouncement: IOracleAnnouncementV0Pre167JSON;
  };
}
export interface IMultiOracleInfoJSON {
  multi: {
    threshold: number;
    oracleAnnouncements: IOracleAnnouncementV0Pre167JSON[];
    oracleParams: IOracleParamsJSON | null;
  };
}
