import { FundingInput } from '@node-dlc/messaging';

export class DualFundingTxFinalizer {
  constructor(
    readonly offerInputs: FundingInput[],
    readonly offerPayoutSPK: Buffer,
    readonly offerChangeSPK: Buffer,
    readonly acceptInputs: FundingInput[],
    readonly acceptPayoutSPK: Buffer,
    readonly acceptChangeSPK: Buffer,
    readonly feeRate: bigint,
  ) {}

  private computeFees(
    _inputs: FundingInput[],
    payoutSPK: Buffer,
    changeSPK: Buffer,
  ): IFees {
    const inputs: FundingInput[] = _inputs.map(
      (input) => input as FundingInput,
    );
    // https://github.com/discreetlogcontracts/dlcspecs/blob/8ee4bbe816c9881c832b1ce320b9f14c72e3506f/Transactions.md#expected-weight-of-the-contract-execution-or-refund-transaction
    const futureFeeWeight = 249 + 4 * payoutSPK.length;
    const futureFeeVBytes = Math.ceil(futureFeeWeight / 4);
    const futureFee = this.feeRate * BigInt(futureFeeVBytes);

    // https://github.com/discreetlogcontracts/dlcspecs/blob/8ee4bbe816c9881c832b1ce320b9f14c72e3506f/Transactions.md#expected-weight-of-the-funding-transaction
    const inputWeight = inputs.reduce((total, input) => {
      return total + 164 + input.maxWitnessLen + input.scriptSigLength();
    }, 0);
    const outputWeight = 36 + 4 * changeSPK.length;
    const weight = 107 + outputWeight + inputWeight;
    const vbytes = Math.ceil(weight / 4);
    const fundingFee = this.feeRate * BigInt(vbytes);

    return { futureFee, fundingFee };
  }

  private getOfferFees(): IFees {
    return this.computeFees(
      this.offerInputs,
      this.offerPayoutSPK,
      this.offerChangeSPK,
    );
  }

  private getAcceptFees(): IFees {
    return this.computeFees(
      this.acceptInputs,
      this.acceptPayoutSPK,
      this.acceptChangeSPK,
    );
  }

  public get offerFees(): bigint {
    const { futureFee, fundingFee } = this.getOfferFees();
    return futureFee + fundingFee;
  }

  public get offerFutureFee(): bigint {
    return this.getOfferFees().futureFee;
  }

  public get offerFundingFee(): bigint {
    return this.getOfferFees().fundingFee;
  }

  public get acceptFees(): bigint {
    const { futureFee, fundingFee } = this.getAcceptFees();
    return futureFee + fundingFee;
  }

  public get acceptFutureFee(): bigint {
    return this.getAcceptFees().futureFee;
  }

  public get acceptFundingFee(): bigint {
    return this.getAcceptFees().fundingFee;
  }
}

export class DualClosingTxFinalizer {
  constructor(
    readonly initiatorInputs: FundingInput[],
    readonly offerPayoutSPK: Buffer,
    readonly acceptPayoutSPK: Buffer,
    readonly feeRate: bigint,
  ) {}

  private computeFees(payoutSPK: Buffer, _inputs: FundingInput[] = []): bigint {
    const inputs: FundingInput[] = _inputs.map(
      (input) => input as FundingInput,
    );
    // https://gist.github.com/matthewjablack/08c36baa513af9377508111405b22e03
    const inputWeight = inputs.reduce((total, input) => {
      return total + 164 + input.maxWitnessLen + input.scriptSigLength();
    }, 0);
    const outputWeight = 36 + 4 * payoutSPK.length;
    const weight = 213 + outputWeight + inputWeight;
    const vbytes = Math.ceil(weight / 4);
    const fee = this.feeRate * BigInt(vbytes);

    return fee;
  }

  private getOfferInitiatorFees(): bigint {
    return this.computeFees(this.offerPayoutSPK, this.initiatorInputs);
  }

  private getOfferReciprocatorFees(): bigint {
    return this.computeFees(this.offerPayoutSPK);
  }

  private getAcceptInitiatorFees(): bigint {
    return this.computeFees(this.acceptPayoutSPK, this.initiatorInputs);
  }

  private getAcceptReciprocatorFees(): bigint {
    return this.computeFees(this.acceptPayoutSPK);
  }

  public get offerInitiatorFees(): bigint {
    return this.getOfferInitiatorFees();
  }

  public get offerReciprocatorFees(): bigint {
    return this.getOfferReciprocatorFees();
  }

  public get acceptInitiatorFees(): bigint {
    return this.getAcceptInitiatorFees();
  }

  public get acceptReciprocatorFees(): bigint {
    return this.getAcceptReciprocatorFees();
  }
}

interface IFees {
  futureFee: bigint;
  fundingFee: bigint;
}
