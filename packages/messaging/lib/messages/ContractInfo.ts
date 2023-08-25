import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../MessageType';
import {
  ContractDescriptor,
  ContractDescriptorType,
  IEnumContractDescriptorJSON,
  INumericContractDescriptorJSON,
  NumericContractDescriptor,
} from './ContractDescriptor';
import { IDlcMessage } from './DlcMessage';
import {
  IMultiOracleInfoJSON,
  ISingleOracleInfoJSON,
  OracleInfo,
  OracleInfoType,
  SingleOracleInfo,
} from './OracleInfo';
import {
  ContractInfoPre163,
  ContractInfoV0Pre163,
  ContractInfoV1Pre163,
} from './pre-163/ContractInfo';
import { DigitDecompositionEventDescriptorV0Pre167 } from './pre-167/EventDescriptor';
import { OracleAnnouncementV0Pre167 } from './pre-167/OracleAnnouncement';
import { OracleEventV0Pre167 } from './pre-167/OracleEvent';

export enum ContractInfoType {
  Single = 0,
  Disjoint = 1,
}
export abstract class ContractInfo implements IDlcMessage {
  public static deserialize(
    reader: Buffer | BufferReader,
  ): SingleContractInfo | DisjointContractInfo {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const tempReader = new BufferReader(reader.peakBytes());
    const type = Number(tempReader.readBigSize());

    switch (type) {
      case ContractInfoType.Single:
        return SingleContractInfo.deserialize(reader);
      case ContractInfoType.Disjoint:
        return DisjointContractInfo.deserialize(reader);
      default:
        throw new Error(
          `ContractInfo type must be Single or Disjoint. Received ${type}`,
        );
    }
  }

  public static fromPre163(
    contractInfo: ContractInfoPre163,
  ): SingleContractInfo | DisjointContractInfo {
    if (contractInfo instanceof ContractInfoV0Pre163) {
      return SingleContractInfo.fromPre163(contractInfo);
    } else if (contractInfo instanceof ContractInfoV1Pre163) {
      return DisjointContractInfo.fromPre163(contractInfo);
    } else {
      throw new Error('ContractInfo must be ContractInfoV0 or ContractInfoV1');
    }
  }

  public static toPre163(
    contractInfo: ContractInfo,
  ): ContractInfoV0Pre163 | ContractInfoV1Pre163 {
    if (contractInfo instanceof SingleContractInfo) {
      return SingleContractInfo.toPre163(contractInfo);
    } else if (contractInfo instanceof DisjointContractInfo) {
      return DisjointContractInfo.toPre163(contractInfo);
    } else {
      throw new Error(
        'ContractInfo must be SingleContractInfo or DisjointContractInfo',
      );
    }
  }

  public abstract type: number;

  public abstract totalCollateral: bigint;

  public abstract validate(): void;

  public abstract toJSON(): ISingleContractInfoJSON | IDisjointContractInfoJSON;

  public abstract serialize(): Buffer;
}

/**
 * SingleContractInfo contains information about a contract's outcomes,
 * their corresponding payouts, and the oracles to be used.
 */
export class SingleContractInfo extends ContractInfo implements IDlcMessage {
  public static type = ContractInfoType.Single;

  /**
   * Deserializes an contract_info_v0 message
   * @param reader
   */
  public static deserialize(reader: Buffer | BufferReader): SingleContractInfo {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const instance = new SingleContractInfo();

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected ContractInfoType.Single, got type ${type}`,
    );

    instance.totalCollateral = reader.readUInt64BE();
    instance.contractDescriptor = ContractDescriptor.deserialize(reader);
    instance.oracleInfo = OracleInfo.deserialize(reader);

    return instance;
  }

  public static fromPre163(
    contractInfo: ContractInfoV0Pre163,
  ): SingleContractInfo {
    const instance = new SingleContractInfo();

    instance.totalCollateral = contractInfo.totalCollateral;
    instance.contractDescriptor = ContractDescriptor.fromPre163(
      contractInfo.contractDescriptor,
    );
    instance.oracleInfo = OracleInfo.fromPre163(contractInfo.oracleInfo);

    return instance;
  }

  public static toPre163(
    contractInfo: SingleContractInfo,
  ): ContractInfoV0Pre163 {
    const instance = new ContractInfoV0Pre163();

    instance.totalCollateral = contractInfo.totalCollateral;
    instance.contractDescriptor = ContractDescriptor.toPre163(
      contractInfo.contractDescriptor,
    );
    instance.oracleInfo = OracleInfo.toPre163(contractInfo.oracleInfo);

    return instance;
  }

  /**
   * The type for single_contract_info message.
   */
  public type = SingleContractInfo.type;

  public totalCollateral: bigint;

  public contractDescriptor: ContractDescriptor;

  public oracleInfo: OracleInfo;

  /**
   * Validates correctness of all fields in the message
   * https://github.com/discreetlogcontracts/dlcspecs/blob/master/Messaging.md#the-contract_info-type
   * @throws Will throw an error if validation fails
   */
  public validate(): void {
    this.oracleInfo.validate();
    switch (this.contractDescriptor.type) {
      case ContractDescriptorType.Numeric:
        // eslint-disable-next-line no-case-declarations
        const descriptor = this.contractDescriptor as NumericContractDescriptor;
        descriptor.validate();

        // roundingmod should not be greater than totalCollateral
        for (const interval of descriptor.roundingIntervals.intervals) {
          if (interval.roundingMod > this.totalCollateral) {
            throw new Error(
              `Rounding modulus ${interval.roundingMod} is greater than total collateral ${this.totalCollateral}`,
            );
          }
        }

        switch (this.oracleInfo.type) {
          case OracleInfoType.Single:
            this.validateOracleAnnouncement(
              descriptor,
              (this.oracleInfo as SingleOracleInfo).announcement,
            );
        }
    }
  }

  private validateOracleAnnouncement(
    descriptor: NumericContractDescriptor,
    announcement: OracleAnnouncementV0Pre167,
  ) {
    // eslint-disable-next-line no-case-declarations
    const oracleInfo = this.oracleInfo as SingleOracleInfo;
    switch (oracleInfo.announcement.oracleEvent.eventDescriptor.type) {
      case MessageType.DigitDecompositionEventDescriptorV0:
        // eslint-disable-next-line no-case-declarations
        const eventDescriptor = oracleInfo.announcement.oracleEvent
          .eventDescriptor as DigitDecompositionEventDescriptorV0Pre167;
        if (eventDescriptor.nbDigits !== descriptor.numDigits)
          throw new Error(
            'DigitDecompositionEventDescriptorV0 and ContractDescriptorV1 must have the same numDigits',
          );

        // Sanity check. Shouldn't be hit since there are other validations which should catch this in OracleEvent.
        // eslint-disable-next-line no-case-declarations
        const oracleEvent = oracleInfo.announcement
          .oracleEvent as OracleEventV0Pre167;
        if (oracleEvent.oracleNonces.length !== descriptor.numDigits) {
          throw new Error(
            'oracleEvent.oracleNonces.length and contractDescriptor.numDigits must be the same',
          );
        }
        break;
      default:
        throw new Error(
          'Only ContractDescriptorV1 can be used with DigitDecompositionEventDescriptor',
        );
    }
  }

  /**
   * Converts single_contract_info to JSON
   */
  public toJSON(): ISingleContractInfoJSON {
    return {
      singleContractInfo: {
        totalCollateral: Number(this.totalCollateral),
        contractInfo: {
          contractDescriptor: this.contractDescriptor.toJSON(),
          oracleInfo: this.oracleInfo.toJSON(),
        },
      },
    };
  }

  /**
   * Serializes the single_contract_info message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();

    dataWriter.writeUInt64BE(this.totalCollateral);
    dataWriter.writeBytes(this.contractDescriptor.serialize());
    dataWriter.writeBytes(this.oracleInfo.serialize());

    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

/**
 * DisjointContractInfo contains information about a contract's outcomes,
 * their corresponding payouts, and the oracles to be used.
 */
export class DisjointContractInfo implements IDlcMessage {
  public static type = ContractInfoType.Disjoint;

  /**
   * Deserializes an disjoint_contract_info message
   * @param reader
   */
  public static deserialize(
    reader: Buffer | BufferReader,
  ): DisjointContractInfo {
    if (reader instanceof Buffer) reader = new BufferReader(reader);

    const instance = new DisjointContractInfo();

    const type = Number(reader.readBigSize());
    assert(
      type === this.type,
      `Expected ContractInfoType.Disjoint, got type ${type}`,
    );

    instance.totalCollateral = reader.readUInt64BE();

    const numDisjointEvents = reader.readBigSize(); // read num_disjoint_events
    for (let i = 0; i < numDisjointEvents; i++) {
      const contractDescriptor = ContractDescriptor.deserialize(reader);
      const oracleInfo = OracleInfo.deserialize(reader);

      instance.contractOraclePairs.push({ contractDescriptor, oracleInfo });
    }

    return instance;
  }

  public static fromPre163(
    contractInfo: ContractInfoV1Pre163,
  ): DisjointContractInfo {
    const instance = new DisjointContractInfo();

    instance.totalCollateral = contractInfo.totalCollateral;

    contractInfo.contractOraclePairs.forEach((oraclePair) => {
      instance.contractOraclePairs.push({
        contractDescriptor: ContractDescriptor.fromPre163(
          oraclePair.contractDescriptor,
        ),
        oracleInfo: OracleInfo.fromPre163(oraclePair.oracleInfo),
      });
    });

    return instance;
  }

  public static toPre163(
    contractInfo: DisjointContractInfo,
  ): ContractInfoV1Pre163 {
    const instance = new ContractInfoV1Pre163();

    instance.totalCollateral = contractInfo.totalCollateral;

    contractInfo.contractOraclePairs.forEach((oraclePair) => {
      instance.contractOraclePairs.push({
        contractDescriptor: ContractDescriptor.toPre163(
          oraclePair.contractDescriptor,
        ),
        oracleInfo: OracleInfo.toPre163(oraclePair.oracleInfo),
      });
    });

    return instance;
  }

  /**
   * The type for contract_info_v1 message. contract_info_v0 = 55342
   */
  public type = DisjointContractInfo.type;

  public totalCollateral: bigint;

  public contractOraclePairs: IContractOraclePair[] = [];

  /**
   * Validates correctness of all fields in the message
   * https://github.com/discreetlogcontracts/dlcspecs/blob/master/Messaging.md#the-contract_info-type
   * @throws Will throw an error if validation fails
   */
  public validate(): void {
    this.contractOraclePairs.forEach((contractOraclePair) => {
      const instance = new SingleContractInfo();
      instance.totalCollateral = this.totalCollateral;
      instance.oracleInfo = contractOraclePair.oracleInfo;
      instance.contractDescriptor = contractOraclePair.contractDescriptor;
      instance.validate();
    });
  }

  /**
   * Converts contract_info_v1 to JSON
   */
  public toJSON(): IDisjointContractInfoJSON {
    return {
      disjointContractInfo: {
        totalCollateral: Number(this.totalCollateral),
        contractInfos: this.contractOraclePairs.map((oraclePairs) => {
          return {
            contractDescriptor: oraclePairs.contractDescriptor.toJSON(),
            oracleInfo: oraclePairs.oracleInfo.toJSON(),
          };
        }),
      },
    };
  }

  /**
   * Serializes the contract_info_v1 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();
    dataWriter.writeUInt64BE(this.totalCollateral);
    dataWriter.writeBigSize(this.contractOraclePairs.length);

    for (const contractOraclePair of this.contractOraclePairs) {
      const { contractDescriptor, oracleInfo } = contractOraclePair;
      dataWriter.writeBytes(contractDescriptor.serialize());
      dataWriter.writeBytes(oracleInfo.serialize());
    }

    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

interface IContractOraclePair {
  contractDescriptor: ContractDescriptor;
  oracleInfo: OracleInfo;
}

interface IContractOraclePairJSON {
  contractDescriptor:
    | IEnumContractDescriptorJSON
    | INumericContractDescriptorJSON;
  oracleInfo: ISingleOracleInfoJSON | IMultiOracleInfoJSON;
}

export interface ISingleContractInfoJSON {
  singleContractInfo: {
    totalCollateral: number;
    contractInfo: IContractOraclePairJSON;
  };
}

export interface IDisjointContractInfoJSON {
  disjointContractInfo: {
    totalCollateral: number;
    contractInfos: IContractOraclePairJSON[];
  };
}
