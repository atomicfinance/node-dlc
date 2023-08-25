import { sigToDER } from '@node-lightning/crypto';
import { BitcoinNetworks } from 'bitcoin-networks';
import { expect } from 'chai';

import { CetAdaptorSignatures } from '../../lib/messages/CetAdaptorSignatures';
import { DlcAccept, DlcAcceptV0 } from '../../lib/messages/DlcAccept';
import { FundingInput } from '../../lib/messages/FundingInput';
import { SingleNegotiationFields } from '../../lib/messages/NegotiationFields';
import { CetAdaptorSignaturesV0Pre163 } from '../../lib/messages/pre-163/CetAdaptorSignatures';
import { DlcAcceptV0Pre163 } from '../../lib/messages/pre-163/DlcAccept';
import { FundingInputV0Pre163 } from '../../lib/messages/pre-163/FundingInput';
import {
  NegotiationFieldsPre163,
  NegotiationFieldsV1Pre163,
} from '../../lib/messages/pre-163/NegotiationFields';
import { MessageType } from '../../lib/MessageType';

describe('DlcAccept', () => {
  const bitcoinNetwork = BitcoinNetworks.bitcoin_regtest;
  let instance: DlcAcceptV0;

  const type = Buffer.from('a71c', 'hex');

  const protocolVersion = Buffer.from('00000001', 'hex');

  const temporaryContractId = Buffer.from(
    '960fb5f7960382ac7e76f3e24eb6b00059b1e68632a946843c22e1f65fdf216a',
    'hex',
  );

  const acceptCollateral = Buffer.from('0000000005f5e100', 'hex');

  const fundingPubKey = Buffer.from(
    '026d8bec9093f96ccc42de166cb9a6c576c95fc24ee16b10e87c3baaa4e49684d9',
    'hex',
  );

  const payoutSPKLen = Buffer.from('0016', 'hex');
  const payoutSPK = Buffer.from(
    '001436054fa379f7564b5e458371db643666365c8fb3',
    'hex',
  );

  const payoutSerialID = Buffer.from('000000000018534a', 'hex');

  const fundingInputsLen = Buffer.from('01', 'hex');
  const fundingInput = Buffer.from(
    '000000000000dae8' + // input_serial_id
      '29' + // prevtx_len
      '02000000000100c2eb0b000000001600149ea3bf2d6eb9c2ffa35e36f41e117403ed7fafe900000000' + // prevtx
      '00000000' + // prevtx_vout
      'ffffffff' + // sequence
      '006b' + // max_witness_len
      '0000', // redeem_script_len
    'hex',
  );

  const changeSPKLen = Buffer.from('0016', 'hex');
  const changeSPK = Buffer.from(
    '0014074c82dbe058212905bacc61814456b7415012ed',
    'hex',
  );

  const changeSerialID = Buffer.from('00000000000d8117', 'hex');

  const cetAdaptorSignatures = Buffer.from(
    '03' + // nb_signatures
      '016292f1b5c67b675aea69c95ec81e8462ab5bb9b7a01f810f6d1a7d1d886893b3605fe7fcb75a14b1b1de917917d37e9efac6437d7a080da53fb6dbbcfbfbe7a8' + // ecdsa_adaptor_signature_1
      '01efbecb2bce89556e1fb4d31622628830e02a6d04c487f67aca20e9f60fb127f985293541cd14e2bf04e4777d50953531e169dd37c65eb3cc17d6b5e4dbe58487f9fae1f68f603fe014a699a346b14a63048c26c9b31236d83a7e369a2b29a292' + // dleq_proof_1
      '00e52fe05d832bcce4538d9c27f3537a0f2086b265b6498f30cf667f77ff2fa87606574bc9a915ef57f7546ebb6852a490ad0547bdc52b19791d2d0f0cc0acabab' + // ecdsa_adaptor_signature_2
      '01f32459001a28850fa8ee4278111deb0494a8175f02e31a1c18b39bd82ec64026a6f341bcd5ba169d67b855030e36bdc65feecc0397a07d3bc514da69811ec5485f5553aebda782bc5ac9b47e8e11d701a38ef2c2b7d8af3906dd8dfc759754ce' + // dleq_proof_2
      '006f769592c744141a5ddface6e98f756a9df1bb75ad41508ea013bdfee133b396d85be51f870bf2e0ae836bfa984109dab96cc6f4ab2a7f118bc6b0b25a4c70d4' + // ecdsa_adaptor_signature_3
      '01c768c1d677c6ff0b7ea69fdf29aff1000794227db368dff16e838d1f44c4afe9e952ee63d603f7b14de13c1d73b363cc2b1740d0b688e73d8e71cddf40f8e7e912df413903779c4e5d6644c504c8609baec8fdcb90d6d341cf316748f5d7945f', // dleq_proof_3
    'hex',
  );

  const refundSignature = Buffer.from(
    '7c8ad6de287b62a1ed1d74ed9116a5158abc7f97376d201caa88e0f9daad68fcda4c271cc003512e768f403a57e5242bd1f6aa1750d7f3597598094a43b1c7bb',
    'hex',
  );

  const negotiationFields = Buffer.from('00', 'hex');

  const dlcAcceptHex = Buffer.concat([
    type,
    protocolVersion,
    temporaryContractId,
    acceptCollateral,
    fundingPubKey,
    payoutSPKLen,
    payoutSPK,
    payoutSerialID,
    fundingInputsLen,
    fundingInput,
    changeSPKLen,
    changeSPK,
    changeSerialID,
    cetAdaptorSignatures,
    refundSignature,
    negotiationFields,
  ]);

  beforeEach(() => {
    instance = new DlcAcceptV0();
    instance.protocolVersion = parseInt(protocolVersion.toString('hex'), 16);
    instance.temporaryContractId = temporaryContractId;
    instance.acceptCollateral = BigInt(100000000);
    instance.fundingPubKey = fundingPubKey;
    instance.payoutSPK = payoutSPK;
    instance.payoutSerialId = BigInt(1594186);
    instance.fundingInputs = [FundingInput.deserialize(fundingInput)];
    instance.changeSPK = changeSPK;
    instance.changeSerialId = BigInt(885015);
    instance.cetSignatures = CetAdaptorSignatures.deserialize(
      cetAdaptorSignatures,
    );
    instance.refundSignature = refundSignature;
  });

  describe('deserialize', () => {
    it('should throw if incorrect type', () => {
      instance.type = 0x123;
      expect(function () {
        DlcAccept.deserialize(instance.serialize());
      }).to.throw(Error);
    });

    it('has correct type', () => {
      expect(DlcAccept.deserialize(instance.serialize()).type).to.equal(
        instance.type,
      );
    });

    it('deserializes without cets', () => {
      const dlcAccept = DlcAccept.deserialize(instance.serialize(), false);
      expect(dlcAccept.cetSignatures.sigs.length).to.be.equal(0);
    });
  });

  describe('DlcAcceptV0', () => {
    describe('serialize', () => {
      it('serializes', () => {
        expect(instance.serialize().toString('hex')).to.equal(
          dlcAcceptHex.toString('hex'),
        );
      });

      it('serializes a dlcAccept without cets', () => {
        const _dlcAcceptWithoutSigs = DlcAccept.deserialize(
          instance.serialize(),
          false,
        );
        const dlcAcceptWithoutSigsHex = _dlcAcceptWithoutSigs
          .serialize()
          .toString('hex');
        const dlcAcceptWithoutSigs = DlcAccept.deserialize(
          Buffer.from(dlcAcceptWithoutSigsHex, 'hex'),
          true,
        );

        expect(dlcAcceptWithoutSigs.cetSignatures.sigs.length).to.be.equal(0);
      });
    });

    describe('deserialize', () => {
      it('deserializes', () => {
        const instance = DlcAcceptV0.deserialize(dlcAcceptHex);

        expect(instance.temporaryContractId).to.deep.equal(temporaryContractId);
        expect(Number(instance.acceptCollateral)).to.equal(100000000);
        expect(instance.fundingPubKey).to.deep.equal(fundingPubKey);
        expect(instance.payoutSPK).to.deep.equal(payoutSPK);
        expect(Number(instance.payoutSerialId)).to.equal(1594186);
        expect(instance.fundingInputs[0].serialize().toString('hex')).to.equal(
          fundingInput.toString('hex'),
        );
        expect(instance.changeSPK).to.deep.equal(changeSPK);
        expect(Number(instance.changeSerialId)).to.equal(885015);
        expect(instance.cetSignatures.serialize().toString('hex')).to.equal(
          cetAdaptorSignatures.toString('hex'),
        );
        expect(instance.refundSignature).to.deep.equal(refundSignature);
        expect(instance.negotiationFields).to.equal(null);
      });

      it('has correct type', () => {
        expect(DlcAcceptV0.deserialize(dlcAcceptHex).type).to.equal(
          MessageType.DlcAcceptV0,
        );
      });
    });

    describe('toJSON', () => {
      it('convert to JSON', async () => {
        const json = instance.toJSON();
        expect(json.message.temporaryContractId).to.equal(
          temporaryContractId.toString('hex'),
        );
        expect(json.message.fundingPubkey).to.equal(
          fundingPubKey.toString('hex'),
        );
        expect(json.message.payoutSpk).to.equal(payoutSPK.toString('hex'));
        expect(json.message.fundingInputs[0].prevTx).to.equal(
          instance.fundingInputs[0].prevTx.serialize().toString('hex'),
        );
        expect(json.message.changeSpk).to.equal(changeSPK.toString('hex'));
        expect(json.message.refundSignature).to.equal(
          sigToDER(refundSignature).toString('hex'),
        );
      });
    });

    describe('withoutSigs', () => {
      it('does not contain sigs', () => {
        const instance = DlcAcceptV0.deserialize(dlcAcceptHex).withoutSigs();
        expect(instance['cetSignatures']).to.not.exist;
      });
    });

    describe('getAddresses', () => {
      it('should get addresses', async () => {
        const expectedFundingAddress =
          'bcrt1qrhzxd53jmv7znf0ywvcvpm06ndhgp5fcxjy57k';
        const expectedChangeAddress =
          'bcrt1qqaxg9klqtqsjjpd6e3scz3zkkaq4qyhd7rg6dd';
        const expectedPayoutAddress =
          'bcrt1qxcz5lgme7atykhj9sdcakepkvcm9eran32jk9c';

        const instance = DlcAcceptV0.deserialize(dlcAcceptHex);

        const {
          fundingAddress,
          changeAddress,
          payoutAddress,
        } = instance.getAddresses(bitcoinNetwork);

        expect(fundingAddress).to.equal(expectedFundingAddress);
        expect(changeAddress).to.equal(expectedChangeAddress);
        expect(payoutAddress).to.equal(expectedPayoutAddress);
      });
    });

    describe('validate', () => {
      it('should throw if payout_spk is invalid', () => {
        instance.payoutSPK = Buffer.from('fff', 'hex');
        expect(function () {
          instance.validate();
        }).to.throw(Error);
      });
      it('should throw if change_spk is invalid', () => {
        instance.changeSPK = Buffer.from('fff', 'hex');
        expect(function () {
          instance.validate();
        }).to.throw(Error);
      });
      it('should throw if fundingpubkey is not a valid pubkey', () => {
        instance.fundingPubKey = Buffer.from(
          '00f003aa11f2a97b6be755a86b9fd798a7451c670196a5245b7bae971306b7c87e',
          'hex',
        );
        expect(function () {
          instance.validate();
        }).to.throw(Error);
      });
      it('should throw if fundingpubkey is not in compressed secp256k1 format', () => {
        instance.fundingPubKey = Buffer.from(
          '045162991c7299223973cabc99ef5087d7bab2dafe61f78e5388b2f9492f7978123f51fd05ef0693790c0b2d4f30848363a3f3fbcf2bd53a05ba0fd5bb708c3184',
          'hex',
        );
        expect(function () {
          instance.validate();
        }).to.throw(Error);
      });
      it('should throw if inputSerialIds arent unique', () => {
        instance.fundingInputs = [
          FundingInput.deserialize(fundingInput),
          FundingInput.deserialize(fundingInput),
        ];
        expect(function () {
          instance.validate();
        }).to.throw(Error);
      });
      it('should ensure funding inputs are segwit', () => {
        instance.fundingInputs = [FundingInput.deserialize(fundingInput)];
        expect(function () {
          instance.validate();
        }).to.throw(Error);
      });

      it('should throw if funding amount less than accept collateral satoshis', () => {
        instance.acceptCollateral = BigInt(3e8);
        expect(function () {
          instance.validate();
        }).to.throw(Error);
      });
    });

    describe('toPre163', () => {
      it('returns pre-163 instance', () => {
        const pre163 = DlcAcceptV0.toPre163(instance);

        expect(pre163).to.be.instanceof(DlcAcceptV0Pre163);
        expect(pre163.tempContractId).to.equal(instance.temporaryContractId);
        expect(pre163.acceptCollateralSatoshis).to.equal(
          instance.acceptCollateral,
        );
        expect(pre163.fundingPubKey).to.equal(instance.fundingPubKey);
        expect(pre163.payoutSPK).to.equal(instance.payoutSPK);
        expect(pre163.payoutSerialId).to.equal(instance.payoutSerialId);
        expect(pre163.fundingInputs.length).to.equal(
          instance.fundingInputs.length,
        );
        for (let i = 0; i < pre163.fundingInputs.length; i++) {
          expect(pre163.fundingInputs[i].inputSerialId).to.equal(
            instance.fundingInputs[i].inputSerialId,
          );
          expect(pre163.fundingInputs[i].prevTx).to.equal(
            instance.fundingInputs[i].prevTx,
          );
          expect(pre163.fundingInputs[i].prevTxVout).to.equal(
            instance.fundingInputs[i].prevTxVout,
          );
          expect(pre163.fundingInputs[i].sequence).to.equal(
            instance.fundingInputs[i].sequence,
          );
          expect(pre163.fundingInputs[i].maxWitnessLen).to.equal(
            instance.fundingInputs[i].maxWitnessLen,
          );
          expect(pre163.fundingInputs[i].redeemScript).to.equal(
            instance.fundingInputs[i].redeemScript,
          );
        }
        expect(pre163.changeSPK).to.equal(instance.changeSPK);
        expect(pre163.changeSerialId).to.equal(instance.changeSerialId);
        expect(pre163.cetSignatures.sigs).to.deep.equal(
          instance.cetSignatures.sigs,
        );
        expect(pre163.refundSignature).to.equal(instance.refundSignature);
        expect(
          (pre163.negotiationFields as NegotiationFieldsV1Pre163)
            ?.roundingIntervals?.intervals,
        ).to.deep.equal(
          (instance.negotiationFields as SingleNegotiationFields)
            ?.roundingIntervals?.intervals,
        );
      });
    });

    describe('fromPre163', () => {
      const fundingInputV0Pre163 = Buffer.from(
        'fda714' + // type funding_input_v0
          '3f' + // length
          '000000000000dae8' + // input_serial_id
          '0029' + // prevtx_len
          '02000000000100c2eb0b000000001600149ea3bf2d6eb9c2ffa35e36f41e117403ed7fafe900000000' + // prevtx
          '00000000' + // prevtx_vout
          'ffffffff' + // sequence
          '006b' + // max_witness_len
          '0000', // redeem_script_len
        'hex',
      );
      const cetAdaptorSignaturesV0Pre163 = Buffer.from(
        'fda716' + // type cet_adaptor_signatures_v0
          'fd01e7' + // length
          '03' + // nb_signatures
          '016292f1b5c67b675aea69c95ec81e8462ab5bb9b7a01f810f6d1a7d1d886893b3605fe7fcb75a14b1b1de917917d37e9efac6437d7a080da53fb6dbbcfbfbe7a8' + // ecdsa_adaptor_signature_1
          '01efbecb2bce89556e1fb4d31622628830e02a6d04c487f67aca20e9f60fb127f985293541cd14e2bf04e4777d50953531e169dd37c65eb3cc17d6b5e4dbe58487f9fae1f68f603fe014a699a346b14a63048c26c9b31236d83a7e369a2b29a292' + // dleq_proof_1
          '00e52fe05d832bcce4538d9c27f3537a0f2086b265b6498f30cf667f77ff2fa87606574bc9a915ef57f7546ebb6852a490ad0547bdc52b19791d2d0f0cc0acabab' + // ecdsa_adaptor_signature_2
          '01f32459001a28850fa8ee4278111deb0494a8175f02e31a1c18b39bd82ec64026a6f341bcd5ba169d67b855030e36bdc65feecc0397a07d3bc514da69811ec5485f5553aebda782bc5ac9b47e8e11d701a38ef2c2b7d8af3906dd8dfc759754ce' + // dleq_proof_2
          '006f769592c744141a5ddface6e98f756a9df1bb75ad41508ea013bdfee133b396d85be51f870bf2e0ae836bfa984109dab96cc6f4ab2a7f118bc6b0b25a4c70d4' + // ecdsa_adaptor_signature_3
          '01c768c1d677c6ff0b7ea69fdf29aff1000794227db368dff16e838d1f44c4afe9e952ee63d603f7b14de13c1d73b363cc2b1740d0b688e73d8e71cddf40f8e7e912df413903779c4e5d6644c504c8609baec8fdcb90d6d341cf316748f5d7945f',
        'hex',
      );
      const negotiationFieldsV0Pre163 = Buffer.from('fdd82600', 'hex'); // empty negotiation fields

      const pre163 = new DlcAcceptV0Pre163();

      before(() => {
        pre163.tempContractId = temporaryContractId;
        pre163.acceptCollateralSatoshis = BigInt(100000000);
        pre163.fundingPubKey = fundingPubKey;
        pre163.payoutSPK = payoutSPK;
        pre163.payoutSerialId = BigInt(1594186);
        pre163.fundingInputs = [
          FundingInputV0Pre163.deserialize(fundingInputV0Pre163),
        ];
        pre163.changeSPK = changeSPK;
        pre163.changeSerialId = BigInt(885015);
        pre163.cetSignatures = CetAdaptorSignaturesV0Pre163.deserialize(
          cetAdaptorSignaturesV0Pre163,
        );
        pre163.refundSignature = refundSignature;
        pre163.negotiationFields = NegotiationFieldsPre163.deserialize(
          negotiationFieldsV0Pre163,
        );
      });

      it('returns post-163 instance', () => {
        const post163 = DlcAcceptV0.fromPre163(pre163);

        expect(post163).to.be.instanceof(DlcAcceptV0);
        expect(post163.protocolVersion).to.equal(1);
        expect(post163.temporaryContractId).to.equal(pre163.tempContractId);
        expect(post163.acceptCollateral).to.equal(
          pre163.acceptCollateralSatoshis,
        );
        expect(post163.fundingPubKey).to.equal(pre163.fundingPubKey);
        expect(post163.payoutSPK).to.equal(pre163.payoutSPK);
        expect(post163.payoutSerialId).to.equal(pre163.payoutSerialId);
        expect(post163.fundingInputs.length).to.equal(
          pre163.fundingInputs.length,
        );
        for (let i = 0; i < pre163.fundingInputs.length; i++) {
          expect(post163.fundingInputs[i].inputSerialId).to.equal(
            pre163.fundingInputs[i].inputSerialId,
          );
          expect(post163.fundingInputs[i].prevTx).to.equal(
            pre163.fundingInputs[i].prevTx,
          );
          expect(post163.fundingInputs[i].prevTxVout).to.equal(
            pre163.fundingInputs[i].prevTxVout,
          );
          expect(post163.fundingInputs[i].sequence).to.equal(
            pre163.fundingInputs[i].sequence,
          );
          expect(post163.fundingInputs[i].maxWitnessLen).to.equal(
            pre163.fundingInputs[i].maxWitnessLen,
          );
          expect(post163.fundingInputs[i].redeemScript).to.equal(
            pre163.fundingInputs[i].redeemScript,
          );
        }
        expect(post163.changeSPK).to.equal(pre163.changeSPK);
        expect(post163.changeSerialId).to.equal(pre163.changeSerialId);
        expect(post163.cetSignatures.sigs).to.deep.equal(
          pre163.cetSignatures.sigs,
        );
        expect(post163.refundSignature).to.equal(pre163.refundSignature);
        expect(
          (post163.negotiationFields as SingleNegotiationFields)
            ?.roundingIntervals?.intervals,
        ).to.deep.equal(
          (pre163.negotiationFields as NegotiationFieldsV1Pre163)
            ?.roundingIntervals?.intervals,
        );
      });
    });
  });
});
