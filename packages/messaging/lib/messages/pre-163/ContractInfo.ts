import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import assert from 'assert';

import { MessageType } from '../../MessageType';
import { getTlv } from '../../serialize/getTlv';
import { DigitDecompositionEventDescriptorV0Pre167 } from '../pre-167/EventDescriptor';
import { OracleEventV0Pre167 } from '../pre-167/OracleEvent';
import {
  ContractDescriptorPre163,
  ContractDescriptorV1Pre163,
  IContractDescriptorV0Pre163JSON,
  IContractDescriptorV1Pre163JSON,
} from './ContractDescriptor';
import { DlcMessagePre163, IDlcMessagePre163 } from './DlcMessage';
import { IOracleInfoV0Pre163JSON, OracleInfoV0Pre163 } from './OracleInfo';

export abstract class ContractInfoPre163 extends DlcMessagePre163 {
  public static deserialize(
    buf: Buffer,
  ): ContractInfoV0Pre163 | ContractInfoV1Pre163 {
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());

    switch (type) {
      case MessageType.ContractInfoV0:
        return ContractInfoV0Pre163.deserialize(buf);
      case MessageType.ContractInfoV1:
        return ContractInfoV1Pre163.deserialize(buf);
      default:
        throw new Error(
          `Contract info TLV type must be ContractInfoV0 or ContractInfoV1`,
        );
    }
  }

  public abstract type: number;

  public abstract length: bigint;

  public abstract totalCollateral: bigint;

  public abstract validate(): void;

  public abstract toJSON():
    | IContractInfoV0Pre163JSON
    | IContractInfoV1Pre163JSON;

  public abstract serialize(): Buffer;
}

/**
 * ContractInfo V0 contains information about a contract's outcomes,
 * their corresponding payouts, and the oracles to be used.
 */
export class ContractInfoV0Pre163
  extends ContractInfoPre163
  implements IDlcMessagePre163 {
  public static type = MessageType.ContractInfoV0;

  /**
   * Deserializes an contract_info_v0 message
   * @param bufContractInfo must be V0 or V1
   */
  public static deserialize(buf: Buffer): ContractInfoV0Pre163 {
    const instance = new ContractInfoV0Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(type === this.type, `Expected ContractInfoV0, got type ${type}`);

    instance.length = reader.readBigSize();
    instance.totalCollateral = reader.readUInt64BE();
    instance.contractDescriptor = ContractDescriptorPre163.deserialize(
      getTlv(reader),
    );
    instance.oracleInfo = OracleInfoV0Pre163.deserialize(getTlv(reader));

    return instance;
  }

  /**
   * The type for contract_info_v0 message. contract_info_v0 = 55342
   */
  public type = ContractInfoV0Pre163.type;

  public length: bigint;

  public totalCollateral: bigint;

  public contractDescriptor: ContractDescriptorPre163;

  public oracleInfo: OracleInfoV0Pre163;

  /**
   * Validates correctness of all fields in the message
   * https://github.com/discreetlogcontracts/dlcspecs/blob/master/Messaging.md#the-contract_info-type
   * @throws Will throw an error if validation fails
   */
  public validate(): void {
    this.oracleInfo.validate();
    switch (this.contractDescriptor.type) {
      case MessageType.ContractDescriptorV1:
        // eslint-disable-next-line no-case-declarations
        const contractDescriptor = this
          .contractDescriptor as ContractDescriptorV1Pre163;
        contractDescriptor.validate();

        // roundingmod should not be greater than totalCollateral
        for (const interval of contractDescriptor.roundingIntervals.intervals) {
          if (interval.roundingMod > this.totalCollateral) {
            throw new Error(
              `Rounding modulus ${interval.roundingMod} is greater than total collateral ${this.totalCollateral}`,
            );
          }
        }

        switch (this.oracleInfo.announcement.oracleEvent.eventDescriptor.type) {
          case MessageType.DigitDecompositionEventDescriptorV0:
            // eslint-disable-next-line no-case-declarations
            const eventDescriptor = this.oracleInfo.announcement.oracleEvent
              .eventDescriptor as DigitDecompositionEventDescriptorV0Pre167;
            if (eventDescriptor.nbDigits !== contractDescriptor.numDigits)
              throw new Error(
                'DigitDecompositionEventDescriptorV0 and ContractDescriptorV1 must have the same numDigits',
              );

            // Sanity check. Shouldn't be hit since there are other validations which should catch this in OracleEvent.
            // eslint-disable-next-line no-case-declarations
            const oracleEvent = this.oracleInfo.announcement
              .oracleEvent as OracleEventV0Pre167;
            if (
              oracleEvent.oracleNonces.length !== contractDescriptor.numDigits
            ) {
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
  }

  /**
   * Converts contract_info_v0 to JSON
   */
  public toJSON(): IContractInfoV0Pre163JSON {
    return {
      type: this.type,
      totalCollateral: Number(this.totalCollateral),
      contractDescriptor: this.contractDescriptor.toJSON(),
      oracleInfo: this.oracleInfo.toJSON(),
    };
  }

  /**
   * Serializes the contract_info_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);

    const dataWriter = new BufferWriter();

    dataWriter.writeUInt64BE(this.totalCollateral);
    dataWriter.writeBytes(this.contractDescriptor.serialize());
    dataWriter.writeBytes(this.oracleInfo.serialize());

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

/**
 * ContractInfo V1 contains information about a contract's outcomes,
 * their corresponding payouts, and the oracles to be used.
 */
export class ContractInfoV1Pre163
  extends ContractInfoPre163
  implements IDlcMessagePre163 {
  public static type = MessageType.ContractInfoV1;

  /**
   * Deserializes an contract_info_v0 message
   * @param buf
   */
  public static deserialize(buf: Buffer): ContractInfoV1Pre163 {
    const instance = new ContractInfoV1Pre163();
    const reader = new BufferReader(buf);

    const type = Number(reader.readBigSize());
    assert(type === this.type, `Expected ContractInfoV1, got type ${type}`);

    instance.length = reader.readBigSize();
    instance.totalCollateral = reader.readUInt64BE();

    reader.readBigSize(); // read num_disjoint_events
    while (!reader.eof) {
      const contractDescriptor = ContractDescriptorPre163.deserialize(
        getTlv(reader),
      );
      const oracleInfo = OracleInfoV0Pre163.deserialize(getTlv(reader));

      instance.contractOraclePairs.push({ contractDescriptor, oracleInfo });
    }

    return instance;
  }

  /**
   * The type for contract_info_v1 message. contract_info_v0 = 55342
   */
  public type = ContractInfoV1Pre163.type;

  public length: bigint;

  public totalCollateral: bigint;

  public contractOraclePairs: IContractOraclePair[] = [];

  /**
   * Validates correctness of all fields in the message
   * https://github.com/discreetlogcontracts/dlcspecs/blob/master/Messaging.md#the-contract_info-type
   * @throws Will throw an error if validation fails
   */
  public validate(): void {
    this.contractOraclePairs.forEach((oraclePair) => {
      oraclePair.oracleInfo.validate();
      switch (oraclePair.contractDescriptor.type) {
        case MessageType.ContractDescriptorV1:
          // eslint-disable-next-line no-case-declarations
          const contractDescriptor = oraclePair.contractDescriptor as ContractDescriptorV1Pre163;
          contractDescriptor.validate();

          switch (
            oraclePair.oracleInfo.announcement.oracleEvent.eventDescriptor.type
          ) {
            case MessageType.DigitDecompositionEventDescriptorV0:
              // eslint-disable-next-line no-case-declarations
              const eventDescriptor = oraclePair.oracleInfo.announcement
                .oracleEvent
                .eventDescriptor as DigitDecompositionEventDescriptorV0Pre167;
              if (eventDescriptor.nbDigits !== contractDescriptor.numDigits)
                throw new Error(
                  'DigitDecompositionEventDescriptorV0 and ContractDescriptorV1 must have the same numDigits',
                );
              // eslint-disable-next-line no-case-declarations
              const oracleEvent = oraclePair.oracleInfo.announcement
                .oracleEvent as OracleEventV0Pre167;
              if (
                oracleEvent.oracleNonces.length !== contractDescriptor.numDigits
              ) {
                throw new Error(
                  'oracleEvent.oracleNonces.length and contractDescriptor.numDigits must be the same',
                );
              }
          }
      }
    });
  }

  /**
   * Converts contract_info_v1 to JSON
   */
  public toJSON(): IContractInfoV1Pre163JSON {
    return {
      type: this.type,
      totalCollateral: Number(this.totalCollateral),
      contractOraclePairs: this.contractOraclePairs.map((oraclePairs) => {
        return {
          contractDescriptor: oraclePairs.contractDescriptor.toJSON(),
          oracleInfo: oraclePairs.oracleInfo.toJSON(),
        };
      }),
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

    writer.writeBigSize(dataWriter.size);
    writer.writeBytes(dataWriter.toBuffer());

    return writer.toBuffer();
  }
}

interface IContractOraclePair {
  contractDescriptor: ContractDescriptorPre163;
  oracleInfo: OracleInfoV0Pre163;
}

interface IContractOraclePairJSON {
  contractDescriptor:
    | IContractDescriptorV0Pre163JSON
    | IContractDescriptorV1Pre163JSON;
  oracleInfo: IOracleInfoV0Pre163JSON;
}

export interface IContractInfoV0Pre163JSON {
  type: number;
  totalCollateral: number;
  contractDescriptor:
    | IContractDescriptorV0Pre163JSON
    | IContractDescriptorV1Pre163JSON;
  oracleInfo: IOracleInfoV0Pre163JSON;
}

export interface IContractInfoV1Pre163JSON {
  type: number;
  totalCollateral: number;
  contractOraclePairs: IContractOraclePairJSON[];
}
