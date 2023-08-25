import { Tx } from '@node-lightning/core';

import { DlcAcceptV0Pre163 } from './DlcAccept';
import { DlcOfferV0Pre163 } from './DlcOffer';
import { DlcTransactionsV0Pre163 } from './DlcTransactions';

/**
 * DlcClose Metadata object contains information required for verifying DlcClose
 * message.
 */
export class DlcCloseMetadataV0Pre163 {
  /**
   * Convert JSON to DlcCloseMetadata
   * @param json
   */
  public static fromJSON(
    json: IDlcCloseMetadataV0Pre163JSON,
  ): DlcCloseMetadataV0Pre163 {
    const instance = new DlcCloseMetadataV0Pre163();

    instance.offerFundingPubKey = Buffer.from(json.offerFundingPubKey, 'hex');
    instance.acceptFundingPubKey = Buffer.from(json.acceptFundingPubKey, 'hex');
    instance.offerPayoutSPK = Buffer.from(json.offerPayoutSPK, 'hex');
    instance.acceptPayoutSPK = Buffer.from(json.acceptPayoutSPK, 'hex');
    instance.offerPayoutSerialId = BigInt(json.offerPayoutSerialId);
    instance.acceptPayoutSerialId = BigInt(json.acceptPayoutSerialId);
    instance.feeRatePerVb = BigInt(json.feeRatePerVb);
    instance.fundTx = Tx.fromHex(json.fundTx);
    instance.fundTxVout = json.fundTxVout;

    return instance;
  }

  public static fromDlcMessages(
    dlcOffer: DlcOfferV0Pre163,
    dlcAccept: DlcAcceptV0Pre163,
    dlcTxs: DlcTransactionsV0Pre163,
  ): DlcCloseMetadataV0Pre163 {
    const instance = new DlcCloseMetadataV0Pre163();

    instance.offerFundingPubKey = dlcOffer.fundingPubKey;
    instance.acceptFundingPubKey = dlcAccept.fundingPubKey;
    instance.offerPayoutSPK = dlcOffer.payoutSPK;
    instance.acceptPayoutSPK = dlcAccept.payoutSPK;
    instance.offerPayoutSerialId = dlcOffer.payoutSerialId;
    instance.acceptPayoutSerialId = dlcAccept.payoutSerialId;
    instance.feeRatePerVb = dlcOffer.feeRatePerVb;
    instance.fundTx = dlcTxs.fundTx;
    instance.fundTxVout = dlcTxs.fundTxVout;

    return instance;
  }

  public offerFundingPubKey: Buffer;

  public acceptFundingPubKey: Buffer;

  public offerPayoutSPK: Buffer;

  public acceptPayoutSPK: Buffer;

  public offerPayoutSerialId: bigint;

  public acceptPayoutSerialId: bigint;

  public feeRatePerVb: bigint;

  public fundTx: Tx;

  public fundTxVout: number;

  /**
   * Converts dlc_close_metadata to JSON
   */
  public toJSON(): IDlcCloseMetadataV0Pre163JSON {
    return {
      offerFundingPubKey: this.offerFundingPubKey.toString('hex'),
      acceptFundingPubKey: this.acceptFundingPubKey.toString('hex'),
      offerPayoutSPK: this.offerPayoutSPK.toString('hex'),
      acceptPayoutSPK: this.acceptPayoutSPK.toString('hex'),
      offerPayoutSerialId: Number(this.offerPayoutSerialId),
      acceptPayoutSerialId: Number(this.acceptPayoutSerialId),
      feeRatePerVb: Number(this.feeRatePerVb),
      fundTx: this.fundTx.serialize().toString('hex'),
      fundTxVout: this.fundTxVout,
    };
  }

  public toDlcMessages(): {
    dlcOffer: DlcOfferV0Pre163;
    dlcAccept: DlcAcceptV0Pre163;
    dlcTxs: DlcTransactionsV0Pre163;
  } {
    const dlcOffer = new DlcOfferV0Pre163();
    const dlcAccept = new DlcAcceptV0Pre163();
    const dlcTxs = new DlcTransactionsV0Pre163();

    dlcOffer.fundingPubKey = this.offerFundingPubKey;
    dlcAccept.fundingPubKey = this.acceptFundingPubKey;
    dlcOffer.payoutSPK = this.offerPayoutSPK;
    dlcAccept.payoutSPK = this.acceptPayoutSPK;
    dlcOffer.payoutSerialId = this.offerPayoutSerialId;
    dlcAccept.payoutSerialId = this.acceptPayoutSerialId;
    dlcOffer.feeRatePerVb = this.feeRatePerVb;
    dlcTxs.fundTx = this.fundTx;
    dlcTxs.fundTxVout = this.fundTxVout;

    return { dlcOffer, dlcAccept, dlcTxs };
  }
}

export interface IDlcCloseMetadataV0Pre163JSON {
  offerFundingPubKey: string;
  acceptFundingPubKey: string;
  offerPayoutSPK: string;
  acceptPayoutSPK: string;
  offerPayoutSerialId: number;
  acceptPayoutSerialId: number;
  feeRatePerVb: number;
  fundTx: string;
  fundTxVout: number;
}
