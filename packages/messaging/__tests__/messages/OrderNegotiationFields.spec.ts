import { expect } from 'chai';

import { EnumeratedContractDescriptor } from '../../lib/messages/ContractDescriptor';
import {
  ContractInfo,
  SingleContractInfo,
} from '../../lib/messages/ContractInfo';
import { SingleOracleInfo } from '../../lib/messages/OracleInfo';
import { OrderNegotiationFields } from '../../lib/messages/OrderNegotiationFields';
import {
  ContractDescriptorPre163,
  ContractDescriptorV0Pre163,
} from '../../lib/messages/pre-163/ContractDescriptor';
import { ContractInfoV0Pre163 } from '../../lib/messages/pre-163/ContractInfo';
import { OracleInfoV0Pre163 } from '../../lib/messages/pre-163/OracleInfo';
import { OrderNegotiationFieldsV1Pre163 } from '../../lib/messages/pre-163/OrderNegotiationFields';
import { OrderOfferV0Pre163 } from '../../lib/messages/pre-163/OrderOffer';

const contractDescriptorHex =
  '00' + // type enumerated_contract_descriptor
  '03' + // num_outcomes
  '09' + // outcome_1_length
  '6f7574636f6d655f31' + // outcome_1 (hex-encoded utf-8 bytes of 'outcome_1' string)
  '0000000000000000' + // payout_1
  '09' +
  '6f7574636f6d655f32' + // outcome_2 (hex-encoded utf-8 bytes of 'outcome_2' string)
  '00000000092363a3' + // payout_2
  '09' +
  '6f7574636f6d655f33' + // outcome_3 (hex-encoded utf-8 bytes of 'outcome_3' string)
  '000000000bebc200'; // payout_3

const oracleEventDescriptorHex =
  'fdd806' + // type enum_event_descriptor
  '10' + // length
  '0002' + // num_outcomes
  '06' + // outcome_1_len
  '64756d6d7931' + // outcome_1
  '06' + // outcome_2_len
  '64756d6d7932'; // outcome_2

const oracleEventHex =
  'fdd822' + // type oracle_event
  '40' + // length
  '0001' + // nb_nonces
  '3cfba011378411b20a5ab773cb95daab93e9bcd1e4cce44986a7dda84e01841b' + // oracle_nonces
  '00000000' + // event_maturity_epoch
  oracleEventDescriptorHex +
  '05' + // event_id_length
  '64756d6d79'; // event_id;

const oracleAnnouncementHex =
  'fdd824' + // type oracle_announcement
  'a4' + // length
  'fab22628f6e2602e1671c286a2f63a9246794008627a1749639217f4214cb4a9' + // announcement_signature_r
  '494c93d1a852221080f44f697adb4355df59eb339f6ba0f9b01ba661a8b108d4' + // announcement_signature_s
  'da078bbb1d34e7729e38e2ae34236e776da121af442626fa31e31ae55a279a0b' + // oracle_public_key
  oracleEventHex;

const oracleInfoHex =
  '00' + // type single_oracle_info;
  oracleAnnouncementHex;

const contractInfoHex =
  '00' + // type single_contract_info
  '000000000bebc200' + // total_collateral
  contractDescriptorHex +
  oracleInfoHex;

const orderNegotiationFieldsHex =
  contractInfoHex +
  '0000000005f5e100' + // offer_collateral
  '0000000000000001' + // fee_rate_per_vb
  '00000064' + // cet_locktime
  '000000c8'; // refund_locktime

describe('OrderNegotiationFields', () => {
  describe('serialize', () => {
    it('serializes', () => {
      const instance = OrderNegotiationFields.deserialize(
        Buffer.from(orderNegotiationFieldsHex, 'hex'),
      );

      expect(instance.serialize().toString('hex')).to.equal(
        orderNegotiationFieldsHex,
      );
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const instance = OrderNegotiationFields.deserialize(
        Buffer.from(orderNegotiationFieldsHex, 'hex'),
      );

      expect(instance.serialize().toString('hex')).to.equal(
        orderNegotiationFieldsHex,
      );
    });
  });

  describe('toPre163', () => {
    const instance = new OrderNegotiationFields();

    before(() => {
      instance.contractInfo = ContractInfo.deserialize(
        Buffer.from(contractInfoHex, 'hex'),
      );
      instance.offerCollateral = BigInt(100000000);
      instance.feeRatePerVb = BigInt(1);
      instance.cetLocktime = 100;
      instance.refundLocktime = 200;
    });

    it('returns pre-163 instance', () => {
      const chainHash = Buffer.from(
        '06226e46111a0b59caaf126043eb5bbf28c34f3a5e332a1fc7b2b73cf188910f',
        'hex',
      );
      const pre163 = OrderNegotiationFields.toPre163(
        instance,
        chainHash.toString('hex'),
      );
      expect(pre163).to.be.instanceof(OrderNegotiationFieldsV1Pre163);
      expect(pre163.orderOffer).to.be.instanceof(OrderOfferV0Pre163);
      expect((pre163.orderOffer as OrderOfferV0Pre163).chainHash).to.deep.equal(
        chainHash,
      );
      expect(
        (pre163.orderOffer as OrderOfferV0Pre163).contractInfo,
      ).to.be.instanceof(ContractInfoV0Pre163);
      expect(
        (pre163.orderOffer as OrderOfferV0Pre163).contractInfo.totalCollateral,
      ).to.equal(instance.contractInfo.totalCollateral);
      expect(
        ((pre163.orderOffer as OrderOfferV0Pre163)
          .contractInfo as ContractInfoV0Pre163).contractDescriptor,
      ).to.be.instanceof(ContractDescriptorV0Pre163);
      for (
        let i = 0;
        i <
        (((pre163.orderOffer as OrderOfferV0Pre163)
          .contractInfo as ContractInfoV0Pre163)
          .contractDescriptor as ContractDescriptorV0Pre163).outcomes.length;
        i++
      ) {
        expect(
          (((pre163.orderOffer as OrderOfferV0Pre163)
            .contractInfo as ContractInfoV0Pre163)
            .contractDescriptor as ContractDescriptorV0Pre163).outcomes[
            i
          ].outcome.toString('utf-8'),
        ).to.equal(
          ((instance.contractInfo as SingleContractInfo)
            .contractDescriptor as EnumeratedContractDescriptor).outcomes[i]
            .outcome,
        );
        expect(
          (((pre163.orderOffer as OrderOfferV0Pre163)
            .contractInfo as ContractInfoV0Pre163)
            .contractDescriptor as ContractDescriptorV0Pre163).outcomes[i]
            .localPayout,
        ).to.equal(
          ((instance.contractInfo as SingleContractInfo)
            .contractDescriptor as EnumeratedContractDescriptor).outcomes[i]
            .localPayout,
        );
      }
      expect(
        ((pre163.orderOffer as OrderOfferV0Pre163)
          .contractInfo as ContractInfoV0Pre163).oracleInfo,
      ).to.be.instanceof(OracleInfoV0Pre163);
      expect(
        ((pre163.orderOffer as OrderOfferV0Pre163)
          .contractInfo as ContractInfoV0Pre163).oracleInfo.announcement,
      ).to.equal(
        ((instance.contractInfo as SingleContractInfo)
          .oracleInfo as SingleOracleInfo).announcement,
      );
      expect(
        (pre163.orderOffer as OrderOfferV0Pre163).offerCollateralSatoshis,
      ).to.equal(instance.offerCollateral);
      expect((pre163.orderOffer as OrderOfferV0Pre163).feeRatePerVb).to.equal(
        instance.feeRatePerVb,
      );
      expect((pre163.orderOffer as OrderOfferV0Pre163).cetLocktime).to.equal(
        instance.cetLocktime,
      );
      expect((pre163.orderOffer as OrderOfferV0Pre163).refundLocktime).to.equal(
        instance.refundLocktime,
      );
    });
  });

  describe('fromPre163', () => {
    const contractInfoPre163 = new ContractInfoV0Pre163();
    contractInfoPre163.length = BigInt(305);
    contractInfoPre163.totalCollateral = BigInt(200000000);
    contractInfoPre163.contractDescriptor = ContractDescriptorPre163.deserialize(
      Buffer.from(
        'fda710' + // type contract_descriptor
          '79' + // length
          '03' + // num_outcomes
          'c5a7affd51901bc7a51829b320d588dc7af0ad1f3d56f20a1d3c60c9ba7c6722' + // outcome_1
          '0000000000000000' + // payout_1
          'adf1c23fbeed6611efa5caa0e9ed4c440c450a18bc010a6c867e05873ac08ead' + // outcome_2
          '00000000092363a3' + // payout_2
          '6922250552ad6bb10ab3ddd6981b530aa9a6fd05725bf85b59e3e51163905288' + // outcome_3
          '000000000bebc200', // payout_3
        'hex',
      ),
    );
    contractInfoPre163.oracleInfo = OracleInfoV0Pre163.deserialize(
      Buffer.from(
        'fda712' + // type oracle_info
          'a8' + // length
          'fdd824' + // type oracle_announcement
          'a4' + // length
          'fab22628f6e2602e1671c286a2f63a9246794008627a1749639217f4214cb4a9' + // announcement_signature_r
          '494c93d1a852221080f44f697adb4355df59eb339f6ba0f9b01ba661a8b108d4' + // announcement_signature_s
          'da078bbb1d34e7729e38e2ae34236e776da121af442626fa31e31ae55a279a0b' + // oracle_public_key
          'fdd822' + // type oracle_event
          '40' + // length
          '0001' + // nb_nonces
          '3cfba011378411b20a5ab773cb95daab93e9bcd1e4cce44986a7dda84e01841b' + // oracle_nonces
          '00000000' + // event_maturity_epoch
          'fdd806' + // type enum_event_descriptor
          '10' + // length
          '0002' + // num_outcomes
          '06' + // outcome_1_len
          '64756d6d7931' + // outcome_1
          '06' + // outcome_2_len
          '64756d6d7932' + // outcome_2
          '05' + // event_id_length
          '64756d6d79', // event_id
        'hex',
      ),
    );
    const orderOfferPre163 = new OrderOfferV0Pre163();
    const pre163 = new OrderNegotiationFieldsV1Pre163();

    before(() => {
      orderOfferPre163.contractInfo = contractInfoPre163;
      orderOfferPre163.offerCollateralSatoshis = BigInt(100000000);
      orderOfferPre163.feeRatePerVb = BigInt(1);
      orderOfferPre163.cetLocktime = 100;
      orderOfferPre163.refundLocktime = 200;
      pre163.orderOffer = orderOfferPre163;
    });

    it('returns post-163 instance', () => {
      const post163 = OrderNegotiationFields.fromPre163(pre163);
      expect(post163).to.be.instanceof(OrderNegotiationFields);

      expect(post163.contractInfo).to.be.instanceof(SingleContractInfo);
      expect(post163.contractInfo.totalCollateral).to.equal(
        (pre163.orderOffer as OrderOfferV0Pre163).contractInfo.totalCollateral,
      );
      expect(
        (post163.contractInfo as SingleContractInfo).contractDescriptor,
      ).to.be.instanceof(EnumeratedContractDescriptor);
      for (
        let i = 0;
        i <
        ((post163.contractInfo as SingleContractInfo)
          .contractDescriptor as EnumeratedContractDescriptor).outcomes.length;
        i++
      ) {
        expect(
          ((post163.contractInfo as SingleContractInfo)
            .contractDescriptor as EnumeratedContractDescriptor).outcomes[i]
            .outcome,
        ).to.equal(
          (((pre163.orderOffer as OrderOfferV0Pre163)
            .contractInfo as ContractInfoV0Pre163)
            .contractDescriptor as ContractDescriptorV0Pre163).outcomes[
            i
          ].outcome.toString('utf-8'),
        );
        expect(
          ((post163.contractInfo as SingleContractInfo)
            .contractDescriptor as EnumeratedContractDescriptor).outcomes[i]
            .localPayout,
        ).to.equal(
          (((pre163.orderOffer as OrderOfferV0Pre163)
            .contractInfo as ContractInfoV0Pre163)
            .contractDescriptor as ContractDescriptorV0Pre163).outcomes[i]
            .localPayout,
        );
      }
      expect(
        (post163.contractInfo as SingleContractInfo).oracleInfo,
      ).to.be.instanceof(SingleOracleInfo);
      expect(
        ((post163.contractInfo as SingleContractInfo)
          .oracleInfo as SingleOracleInfo).announcement,
      ).to.equal(
        (((pre163.orderOffer as OrderOfferV0Pre163)
          .contractInfo as ContractInfoV0Pre163)
          .oracleInfo as OracleInfoV0Pre163).announcement,
      );
      expect(post163.offerCollateral).to.equal(
        (pre163.orderOffer as OrderOfferV0Pre163).offerCollateralSatoshis,
      );
      expect(post163.feeRatePerVb).to.equal(
        (pre163.orderOffer as OrderOfferV0Pre163).feeRatePerVb,
      );
      expect(post163.cetLocktime).to.equal(
        (pre163.orderOffer as OrderOfferV0Pre163).cetLocktime,
      );
      expect(post163.refundLocktime).to.equal(
        (pre163.orderOffer as OrderOfferV0Pre163).refundLocktime,
      );
    });
  });
});
