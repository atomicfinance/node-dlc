import {
  DlcAcceptWithoutSigs,
  DlcOfferV0,
  FundingInput,
} from '@node-dlc/messaging';
import {
  LockTime,
  OutPoint,
  Script,
  Tx,
  TxBuilder,
  Value,
} from '@node-lightning/bitcoin';

import { DualFundingTxFinalizer } from './TxFinalizer';

export class DlcTxBuilder {
  constructor(
    readonly dlcOffer: DlcOfferV0,
    readonly dlcAccept: DlcAcceptWithoutSigs,
  ) {}

  public buildFundingTransaction(): Tx {
    const tx = new TxBuilder();
    tx.version = 2;
    tx.locktime = LockTime.zero();

    const multisigScript =
      Buffer.compare(
        this.dlcOffer.fundingPubKey,
        this.dlcAccept.fundingPubKey,
      ) === -1
        ? Script.p2msLock(
            2,
            this.dlcOffer.fundingPubKey,
            this.dlcAccept.fundingPubKey,
          )
        : Script.p2msLock(
            2,
            this.dlcAccept.fundingPubKey,
            this.dlcOffer.fundingPubKey,
          );
    const witScript = Script.p2wshLock(multisigScript);

    const offerInput = this.dlcOffer.offerCollateral;
    const acceptInput = this.dlcAccept.acceptCollateral;

    const totalInput = offerInput + acceptInput;

    const finalizer = new DualFundingTxFinalizer(
      this.dlcOffer.fundingInputs,
      this.dlcOffer.payoutSPK,
      this.dlcOffer.changeSPK,
      this.dlcAccept.fundingInputs,
      this.dlcAccept.payoutSPK,
      this.dlcAccept.changeSPK,
      this.dlcOffer.feeRatePerVb,
    );

    const offerFundingInputs: FundingInput[] = this.dlcOffer.fundingInputs.map(
      (input) => input as FundingInput,
    );

    const offerTotalFunding = offerFundingInputs.reduce((total, input) => {
      return total + input.prevTx.outputs[input.prevTxVout].value.sats;
    }, BigInt(0));

    const acceptTotalFunding = this.dlcAccept.fundingInputs.reduce(
      (total, input) => {
        return total + input.prevTx.outputs[input.prevTxVout].value.sats;
      },
      BigInt(0),
    );

    const fundingInputs: FundingInput[] = [
      ...offerFundingInputs,
      ...this.dlcAccept.fundingInputs,
    ];

    fundingInputs.sort(
      (a, b) => Number(a.inputSerialId) - Number(b.inputSerialId),
    );

    fundingInputs.forEach((input) => {
      tx.addInput(
        OutPoint.fromString(
          `${input.prevTx.txId.toString()}:${input.prevTxVout}`,
        ),
      );
    });

    const fundingValue =
      totalInput + finalizer.offerFutureFee + finalizer.acceptFutureFee;
    const offerChangeValue =
      offerTotalFunding - offerInput - finalizer.offerFees;
    const acceptChangeValue =
      acceptTotalFunding - acceptInput - finalizer.acceptFees;

    const outputs: Output[] = [];
    outputs.push({
      value: Value.fromSats(Number(fundingValue)),
      script: witScript,
      serialId: this.dlcOffer.fundOutputSerialId,
    });
    outputs.push({
      value: Value.fromSats(Number(offerChangeValue)),
      script: Script.p2wpkhLock(this.dlcOffer.changeSPK.slice(2)),
      serialId: this.dlcOffer.changeSerialId,
    });
    outputs.push({
      value: Value.fromSats(Number(acceptChangeValue)),
      script: Script.p2wpkhLock(this.dlcAccept.changeSPK.slice(2)),
      serialId: this.dlcAccept.changeSerialId,
    });

    outputs.sort((a, b) => Number(a.serialId) - Number(b.serialId));

    outputs.forEach((output) => {
      tx.addOutput(output.value, output.script);
    });

    return tx.toTx();
  }
}

interface Output {
  value: Value;
  script: Script;
  serialId: bigint;
}
