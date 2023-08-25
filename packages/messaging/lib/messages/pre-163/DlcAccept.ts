import { Script } from '@node-lightning/bitcoin';
import { BufferReader, BufferWriter } from '@node-lightning/bufio';
import { hash160 } from '@node-lightning/crypto';
import assert from 'assert';
import { BitcoinNetwork } from 'bitcoin-networks';
import { address } from 'bitcoinjs-lib';
import secp256k1 from 'secp256k1';

import { MessageType } from '../../MessageType';
import { getTlv, skipTlv } from '../../serialize/getTlv';
import {
  CetAdaptorSignaturesV0Pre163,
  ICetAdaptorSignaturesV0Pre163JSON,
} from './CetAdaptorSignatures';
import { IDlcMessagePre163 } from './DlcMessage';
import {
  FundingInputV0Pre163,
  IFundingInputV0Pre163JSON,
} from './FundingInput';
import {
  INegotiationFieldsV0Pre163JSON,
  INegotiationFieldsV1Pre163JSON,
  INegotiationFieldsV2Pre163JSON,
  NegotiationFieldsPre163,
} from './NegotiationFields';

/**
 * DlcAccept contains information about a node and indicates its
 * acceptance of the new DLC, as well as its CET and refund
 * transaction signatures. This is the second step toward creating
 * the funding transaction and closing transactions.
 */
export class DlcAcceptV0Pre163 implements IDlcMessagePre163 {
  public static type = MessageType.DlcAcceptV0;

  /**
   * Deserializes an oracle_info message
   * @param buf
   */
  public static deserialize(buf: Buffer, parseCets = true): DlcAcceptV0Pre163 {
    const instance = new DlcAcceptV0Pre163();
    const reader = new BufferReader(buf);

    const type = reader.readUInt16BE();
    assert(type === this.type, `Expected DlcAcceptV0, got type ${type}`);

    instance.tempContractId = reader.readBytes(32);
    instance.acceptCollateralSatoshis = reader.readUInt64BE();
    instance.fundingPubKey = reader.readBytes(33);
    const payoutSPKLen = reader.readUInt16BE();
    instance.payoutSPK = reader.readBytes(payoutSPKLen);
    instance.payoutSerialId = reader.readUInt64BE();
    const fundingInputsLen = reader.readUInt16BE();
    for (let i = 0; i < fundingInputsLen; i++) {
      instance.fundingInputs.push(
        FundingInputV0Pre163.deserialize(getTlv(reader)),
      );
    }
    const changeSPKLen = reader.readUInt16BE();
    instance.changeSPK = reader.readBytes(changeSPKLen);
    instance.changeSerialId = reader.readUInt64BE();
    if (parseCets) {
      instance.cetSignatures = CetAdaptorSignaturesV0Pre163.deserialize(
        getTlv(reader),
      );
    } else {
      skipTlv(reader);
      instance.cetSignatures = new CetAdaptorSignaturesV0Pre163();
    }
    instance.refundSignature = reader.readBytes(64);
    instance.negotiationFields = NegotiationFieldsPre163.deserialize(
      getTlv(reader),
    );

    return instance;
  }

  /**
   * The type for accept_channel message. accept_channel = 33
   */
  public type = DlcAcceptV0Pre163.type;

  public tempContractId: Buffer;

  public acceptCollateralSatoshis: bigint;

  public fundingPubKey: Buffer;

  public payoutSPK: Buffer;

  public payoutSerialId: bigint;

  public fundingInputs: FundingInputV0Pre163[] = [];

  public changeSPK: Buffer;

  public changeSerialId: bigint;

  public cetSignatures: CetAdaptorSignaturesV0Pre163;

  public refundSignature: Buffer;

  public negotiationFields: NegotiationFieldsPre163;

  /**
   * Get funding, change and payout address from DlcOffer
   * @param network Bitcoin Network
   * @returns {IDlcOfferV0Addresses}
   */
  public getAddresses(network: BitcoinNetwork): IDlcAcceptV0Pre163Addresses {
    const fundingSPK = Script.p2wpkhLock(hash160(this.fundingPubKey))
      .serialize()
      .slice(1);
    const fundingAddress = address.fromOutputScript(fundingSPK, network);
    const changeAddress = address.fromOutputScript(this.changeSPK, network);
    const payoutAddress = address.fromOutputScript(this.payoutSPK, network);

    return {
      fundingAddress,
      changeAddress,
      payoutAddress,
    };
  }

  /**
   * Validates correctness of all fields
   * https://github.com/discreetlogcontracts/dlcspecs/blob/master/Protocol.md#the-accept_dlc-message
   * @throws Will throw an error if validation fails
   */
  public validate(): void {
    // 1. Type is set automatically in class
    // 2. payout_spk and change_spk must be standard script pubkeys

    try {
      address.fromOutputScript(this.payoutSPK);
    } catch (e) {
      throw new Error('payoutSPK is invalid');
    }

    try {
      address.fromOutputScript(this.changeSPK);
    } catch (e) {
      throw new Error('changeSPK is invalid');
    }

    // 3. funding_pubkey must be a valid secp256k1 pubkey in compressed format
    // https://github.com/bitcoin/bips/blob/master/bip-0137.mediawiki#background-on-ecdsa-signatures

    if (secp256k1.publicKeyVerify(Buffer.from(this.fundingPubKey))) {
      if (this.fundingPubKey[0] != 0x02 && this.fundingPubKey[0] != 0x03) {
        throw new Error('fundingPubKey must be in compressed format');
      }
    } else {
      throw new Error('fundingPubKey is not a valid secp256k1 key');
    }

    // 4. inputSerialId must be unique for each input

    const inputSerialIds = this.fundingInputs.map(
      (input: FundingInputV0Pre163) => input.inputSerialId,
    );

    if (new Set(inputSerialIds).size !== inputSerialIds.length) {
      throw new Error('inputSerialIds must be unique');
    }

    // 5. Ensure funding inputs are segwit
    this.fundingInputs.forEach((input: FundingInputV0Pre163) =>
      input.validate(),
    );

    // validate funding amount
    const fundingAmount = this.fundingInputs.reduce((acc, fundingInput) => {
      const input = fundingInput as FundingInputV0Pre163;
      return acc + input.prevTx.outputs[input.prevTxVout].value.sats;
    }, BigInt(0));
    if (this.acceptCollateralSatoshis >= fundingAmount) {
      throw new Error(
        'fundingAmount must be greater than acceptCollateralSatoshis',
      );
    }
  }

  /**
   * Converts dlc_accept_v0 to JSON
   */
  public toJSON(): IDlcAcceptV0Pre163JSON {
    return {
      type: this.type,
      tempContractId: this.tempContractId.toString('hex'),
      acceptCollateralSatoshis: Number(this.acceptCollateralSatoshis),
      fundingPubKey: this.fundingPubKey.toString('hex'),
      payoutSPK: this.payoutSPK.toString('hex'),
      payoutSerialId: Number(this.payoutSerialId),
      fundingInputs: this.fundingInputs.map((input) => input.toJSON()),
      changeSPK: this.changeSPK.toString('hex'),
      changeSerialId: Number(this.changeSerialId),
      cetSignatures: this.cetSignatures.toJSON(),
      refundSignature: this.refundSignature.toString('hex'),
      negotiationFields: this.negotiationFields.toJSON(),
    };
  }

  /**
   * Serializes the accept_channel message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeUInt16BE(this.type);
    writer.writeBytes(this.tempContractId);
    writer.writeUInt64BE(this.acceptCollateralSatoshis);
    writer.writeBytes(this.fundingPubKey);
    writer.writeUInt16BE(this.payoutSPK.length);
    writer.writeBytes(this.payoutSPK);
    writer.writeUInt64BE(this.payoutSerialId);
    writer.writeUInt16BE(this.fundingInputs.length);

    for (const fundingInput of this.fundingInputs) {
      writer.writeBytes(fundingInput.serialize());
    }

    writer.writeUInt16BE(this.changeSPK.length);
    writer.writeBytes(this.changeSPK);
    writer.writeUInt64BE(this.changeSerialId);
    writer.writeBytes(this.cetSignatures.serialize());
    writer.writeBytes(this.refundSignature);
    writer.writeBytes(this.negotiationFields.serialize());

    return writer.toBuffer();
  }

  public withoutSigs(): DlcAcceptV0Pre163WithoutSigs {
    return new DlcAcceptV0Pre163WithoutSigs(
      this.tempContractId,
      this.acceptCollateralSatoshis,
      this.fundingPubKey,
      this.payoutSPK,
      this.payoutSerialId,
      this.fundingInputs,
      this.changeSPK,
      this.changeSerialId,
      this.negotiationFields,
    );
  }
}

export class DlcAcceptV0Pre163WithoutSigs {
  constructor(
    readonly tempContractId: Buffer,
    readonly acceptCollateralSatoshis: bigint,
    readonly fundingPubKey: Buffer,
    readonly payoutSPK: Buffer,
    readonly payoutSerialId: bigint,
    readonly fundingInputs: FundingInputV0Pre163[],
    readonly changeSPK: Buffer,
    readonly changeSerialId: bigint,
    readonly negotiationFields: NegotiationFieldsPre163,
  ) {}
}

export interface IDlcAcceptV0Pre163JSON {
  type: number;
  tempContractId: string;
  acceptCollateralSatoshis: number;
  fundingPubKey: string;
  payoutSPK: string;
  payoutSerialId: number;
  fundingInputs: IFundingInputV0Pre163JSON[];
  changeSPK: string;
  changeSerialId: number;
  cetSignatures: ICetAdaptorSignaturesV0Pre163JSON;
  refundSignature: string;
  negotiationFields:
    | INegotiationFieldsV0Pre163JSON
    | INegotiationFieldsV1Pre163JSON
    | INegotiationFieldsV2Pre163JSON;
}

export interface IDlcAcceptV0Pre163Addresses {
  fundingAddress: string;
  changeAddress: string;
  payoutAddress: string;
}
