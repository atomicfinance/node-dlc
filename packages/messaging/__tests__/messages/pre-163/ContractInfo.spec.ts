import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {
  ContractDescriptorPre163,
  ContractDescriptorV1Pre163,
} from '../../../lib/messages/pre-163/ContractDescriptor';
import {
  ContractInfoPre163,
  ContractInfoV0Pre163,
} from '../../../lib/messages/pre-163/ContractInfo';
import { OracleInfoV0Pre163 } from '../../../lib/messages/pre-163/OracleInfo';
import { HyperbolaPayoutCurvePiecePre163 } from '../../../lib/messages/pre-163/PayoutCurvePiece';
import { PayoutFunctionV0Pre163 } from '../../../lib/messages/pre-163/PayoutFunction';
import { RoundingIntervalsV0Pre163 } from '../../../lib/messages/pre-163/RoundingIntervals';
import { DigitDecompositionEventDescriptorV0Pre167 } from '../../../lib/messages/pre-167/EventDescriptor';
import { OracleAnnouncementV0Pre167 } from '../../../lib/messages/pre-167/OracleAnnouncement';
import { OracleEventV0Pre167 } from '../../../lib/messages/pre-167/OracleEvent';
import { MessageType } from '../../../lib/MessageType';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('ContractInfoV0Pre163', () => {
  describe('serialize', () => {
    it('serializes', () => {
      const instance = new ContractInfoV0Pre163();

      instance.length = BigInt(305);
      instance.totalCollateral = BigInt(200000000);
      instance.contractDescriptor = ContractDescriptorPre163.deserialize(
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
      instance.oracleInfo = OracleInfoV0Pre163.deserialize(
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

      expect(instance.serialize().toString("hex")).to.equal(
        "fdd82e" + // type contract_info
        "fd0131" + // length
        "000000000bebc200" + // total_collateral
        "fda710" + // type contract_descriptor
        "79" + // length
        "03" + // num_outcomes
        "c5a7affd51901bc7a51829b320d588dc7af0ad1f3d56f20a1d3c60c9ba7c6722" + // outcome_1
        "0000000000000000" + // payout_1
        "adf1c23fbeed6611efa5caa0e9ed4c440c450a18bc010a6c867e05873ac08ead" + // outcome_2
        "00000000092363a3" + // payout_2
        "6922250552ad6bb10ab3ddd6981b530aa9a6fd05725bf85b59e3e51163905288" + // outcome_3
        "000000000bebc200" + // payout_3
        "fda712" + // type oracle_info
        "a8" + // length
        "fdd824" + // type oracle_announcement
        "a4" + // length
        "fab22628f6e2602e1671c286a2f63a9246794008627a1749639217f4214cb4a9" + // announcement_signature_r
        "494c93d1a852221080f44f697adb4355df59eb339f6ba0f9b01ba661a8b108d4" + // announcement_signature_s
        "da078bbb1d34e7729e38e2ae34236e776da121af442626fa31e31ae55a279a0b" + // oracle_public_key
        "fdd822" + // type oracle_event
        "40" + // length
        "0001" + // nb_nonces
        "3cfba011378411b20a5ab773cb95daab93e9bcd1e4cce44986a7dda84e01841b" + // oracle_nonces
        "00000000" + // event_maturity_epoch
        "fdd806" + // type enum_event_descriptor
        "10" + // length
        "0002" + // num_outcomes
        "06" + // outcome_1_len
        "64756d6d7931" + // outcome_1
        "06" + // outcome_2_len
        "64756d6d7932" + // outcome_2
        "05" + // event_id_length
        "64756d6d79" // event_id
      ); // prettier-ignore
    });
  });

  describe('deserialize', () => {
    it('deserializes', () => {
      const buf = Buffer.from(
        "fdd82e" + // type contract_info
        "fd0131" + // length
        "000000000bebc200" + // total_collateral
        "fda710" + // type contract_descriptor
        "79" + // length
        "03" + // num_outcomes
        "c5a7affd51901bc7a51829b320d588dc7af0ad1f3d56f20a1d3c60c9ba7c6722" + // outcome_1
        "0000000000000000" + // payout_1
        "adf1c23fbeed6611efa5caa0e9ed4c440c450a18bc010a6c867e05873ac08ead" + // outcome_2
        "00000000092363a3" + // payout_2
        "6922250552ad6bb10ab3ddd6981b530aa9a6fd05725bf85b59e3e51163905288" + // outcome_3
        "000000000bebc200" + // payout_3
        "fda712" + // type oracle_info
        "a8" + // length
        "fdd824" + // type oracle_announcement
        "a4" + // length
        "fab22628f6e2602e1671c286a2f63a9246794008627a1749639217f4214cb4a9" + // announcement_signature_r
        "494c93d1a852221080f44f697adb4355df59eb339f6ba0f9b01ba661a8b108d4" + // announcement_signature_s
        "da078bbb1d34e7729e38e2ae34236e776da121af442626fa31e31ae55a279a0b" + // oracle_public_key
        "fdd822" + // type oracle_event
        "40" + // length
        "0001" + // nb_nonces
        "3cfba011378411b20a5ab773cb95daab93e9bcd1e4cce44986a7dda84e01841b" + // oracle_nonces
        "00000000" + // event_maturity_epoch
        "fdd806" + // type enum_event_descriptor
        "10" + // length
        "0002" + // num_outcomes
        "06" + // outcome_1_len
        "64756d6d7931" + // outcome_1
        "06" + // outcome_2_len
        "64756d6d7932" + // outcome_2
        "05" + // event_id_length
        "64756d6d79" // event_id
        , "hex"
      ); // prettier-ignore

      const unknownInstance = ContractInfoPre163.deserialize(buf);

      if (unknownInstance.type === MessageType.ContractInfoV0) {
        const instance = unknownInstance as ContractInfoV0Pre163;

        expect(instance.length).to.deep.equal(BigInt(305));
        expect(Number(instance.totalCollateral)).to.equal(200000000);
        expect(
          instance.contractDescriptor.serialize().toString('hex'),
        ).to.equal(
          'fda710' + // type contract_descriptor
            '79' + // length
            '03' + // num_outcomes
            'c5a7affd51901bc7a51829b320d588dc7af0ad1f3d56f20a1d3c60c9ba7c6722' + // outcome_1
            '0000000000000000' + // payout_1
            'adf1c23fbeed6611efa5caa0e9ed4c440c450a18bc010a6c867e05873ac08ead' + // outcome_2
            '00000000092363a3' + // payout_2
            '6922250552ad6bb10ab3ddd6981b530aa9a6fd05725bf85b59e3e51163905288' + // outcome_3
            '000000000bebc200', // payout_3
        );
        expect(instance.oracleInfo.serialize().toString('hex')).to.equal(
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
        );
      }
    });
  });

  describe('validate', () => {
    let eventDescriptorNumDigits;
    let contractDescriptorNumDigits;
    let oracleInfo: OracleInfoV0Pre163;
    let oracleAnnouncement: OracleAnnouncementV0Pre167;
    let hyperbolaPayoutCurvePiece: HyperbolaPayoutCurvePiecePre163;
    let payoutFunction: PayoutFunctionV0Pre163;

    beforeEach(() => {
      eventDescriptorNumDigits = 18;
      contractDescriptorNumDigits = 18;

      const eventDescriptor = new DigitDecompositionEventDescriptorV0Pre167();
      eventDescriptor.base = 2;
      eventDescriptor.isSigned = false;
      eventDescriptor.unit = 'BTCUSD';
      eventDescriptor.precision = 0;
      eventDescriptor.nbDigits = eventDescriptorNumDigits;

      const oracleEvent = new OracleEventV0Pre167();
      oracleEvent.oracleNonces = [
        'c3347aa29db9f5e619483a92e746be91982bc66127e856bee62daeb91148cb92',
        'fbdffe731b410c1d735ad7ce868f40d5b4a44c29131b0feca0f9c28f3a5c2fee',
        '4326fc9c19013d4ca30f9f5dc184a6dab417acd4486528f14dbae2d2279bd29e',
        'dd88db0628df7e17ddcafe3a274518d0a4f6baa100308b5522ad099b27305b5b',
        '448774d5544b0151f112dd6f1cfc28df0e575e38bb8acb5c164357ebdb8bd364',
        '5b8dd47e80fe9c12741190a515ff7d8a801911ab64f8c6117303cf0f065ae055',
        '4b1f14efbba6e3bf7e5f4c40d5735ff126f23ac9a41659a05bebdd3596eb8d56',
        'd8d7524476c8f5e014a536cf513de7136fac9d3925d1f479c2f68b09ea3f43cd',
        '3719a5d31121084fd9f25f77bf042d2da23075102acf59e3e592e8a3a2220940',
        '64cf5b50bbc405c14078f82240aa38403fafcbee3c74c3e8ca361e60001cbc74',
        '149631c02f1f26ead45f9560ffe6cb1684c8c068d6eb1f03fdd655827b9f2531',
        '2669158073d4c5ebe4855e724b6650f8214697b17eeac1ef33a582d4efb73c90',
        '6abaac5f261322a5097115aaadaeca025e4eae0cdfb26fc591bc05820606929e',
        'b437c474dff5ed40fb7dcf298f5a1a70e95658135cb72008c3fbd515d86e59c3',
        'f85acb02775200421eda2c99c4a12975c9ac0d460ae7c9340e814745df4ebb54',
        '5a719fe0b7e44bab56448a4007f40a09f3adc57fcee18089d6334655c407a63a',
        '27540f4887299b36646b7c2202aef86bb0e7e68efc508583039f74c41cb57d66',
        'ed5b9a675d77506b71f597dc59e6777cbba054c82d3ba139e82d74ca717b0d0c',
      ].map((hex) => Buffer.from(hex, 'hex'));

      oracleEvent.eventMaturityEpoch = 1635321600;
      oracleEvent.eventDescriptor = eventDescriptor;
      oracleEvent.eventId = 'Deribit-BTC-27OCT21';

      oracleAnnouncement = new OracleAnnouncementV0Pre167();
      oracleAnnouncement.announcementSig = Buffer.from(
        'c3347aa29db9f5e619483a92e746be91982bc66127e856bee62daeb91148cb92a1074a802a481c008ba44143c752e519c28d906658e5257d9d82e80ef66cbf0f',
        'hex',
      );
      oracleAnnouncement.oraclePubkey = Buffer.from(
        '4f15b5e4b8000c33a8e5bbdbc6802375a7d6e7cefcfbf098aa51ce7da0f910c1',
        'hex',
      );
      oracleAnnouncement.oracleEvent = oracleEvent;

      oracleInfo = new OracleInfoV0Pre163();
      oracleInfo.announcement = oracleAnnouncement;

      hyperbolaPayoutCurvePiece = new HyperbolaPayoutCurvePiecePre163();
      hyperbolaPayoutCurvePiece.usePositivePiece = true;
      hyperbolaPayoutCurvePiece.translateOutcomeSign = true;
      hyperbolaPayoutCurvePiece.translateOutcome = BigInt(0);
      hyperbolaPayoutCurvePiece.translateOutcomeExtraPrecision = 0;
      hyperbolaPayoutCurvePiece.translatePayoutSign = false;
      hyperbolaPayoutCurvePiece.translatePayout = BigInt(30518);
      hyperbolaPayoutCurvePiece.translatePayoutExtraPrecision = 0;
      hyperbolaPayoutCurvePiece.aSign = true;
      hyperbolaPayoutCurvePiece.a = BigInt(1);
      hyperbolaPayoutCurvePiece.aExtraPrecision = 0;
      hyperbolaPayoutCurvePiece.bSign = true;
      hyperbolaPayoutCurvePiece.b = BigInt(0);
      hyperbolaPayoutCurvePiece.bExtraPrecision = 0;
      hyperbolaPayoutCurvePiece.cSign = true;
      hyperbolaPayoutCurvePiece.c = BigInt(0);
      hyperbolaPayoutCurvePiece.cExtraPrecision = 0;
      hyperbolaPayoutCurvePiece.dSign = true;
      hyperbolaPayoutCurvePiece.d = BigInt(4000000000);
      hyperbolaPayoutCurvePiece.dExtraPrecision = 0;

      payoutFunction = new PayoutFunctionV0Pre163();
      payoutFunction.endpoint0 = BigInt(0);
      payoutFunction.endpointPayout0 = BigInt(969482);
      payoutFunction.extraPrecision0 = 0;
      payoutFunction.pieces = [
        {
          payoutCurvePiece: hyperbolaPayoutCurvePiece,
          endpoint: BigInt(131071),
          endpointPayout: BigInt(0),
          extraPrecision: 0,
        },
      ];
    });
    it('should throw Error if oracle numDigits does not match', () => {
      const roundingIntervals = new RoundingIntervalsV0Pre163();
      roundingIntervals.intervals = [
        {
          beginInterval: BigInt(0),
          roundingMod: BigInt(500),
        },
      ];

      const contractDescriptor = new ContractDescriptorV1Pre163();
      contractDescriptor.numDigits = 5; // modified
      contractDescriptor.payoutFunction = payoutFunction;
      contractDescriptor.roundingIntervals = roundingIntervals;

      const contractInfo = new ContractInfoV0Pre163();
      contractInfo.totalCollateral = BigInt(969482);
      contractInfo.contractDescriptor = contractDescriptor;
      contractInfo.oracleInfo = oracleInfo;

      expect(function () {
        contractInfo.validate();
      }).to.throw(Error);
    });

    it('should throw Error if roundingMod is too big', () => {
      const roundingIntervals = new RoundingIntervalsV0Pre163();
      roundingIntervals.intervals = [
        {
          beginInterval: BigInt(0),
          roundingMod: BigInt(1000000),
        },
      ];

      const contractDescriptor = new ContractDescriptorV1Pre163();
      contractDescriptor.numDigits = contractDescriptorNumDigits;
      contractDescriptor.payoutFunction = payoutFunction;
      contractDescriptor.roundingIntervals = roundingIntervals;

      const contractInfo = new ContractInfoV0Pre163();
      contractInfo.totalCollateral = BigInt(969482);
      contractInfo.contractDescriptor = contractDescriptor;
      contractInfo.oracleInfo = oracleInfo;

      expect(function () {
        contractInfo.validate();
      }).to.throw(
        'Rounding modulus 1000000 is greater than total collateral 969482',
      );
    });

    it('should throw Error if oracle nonces length different than nbDigits', () => {
      oracleInfo.announcement.oracleEvent.oracleNonces.pop();

      const roundingIntervals = new RoundingIntervalsV0Pre163();
      roundingIntervals.intervals = [
        {
          beginInterval: BigInt(0),
          roundingMod: BigInt(500),
        },
      ];

      const contractDescriptor = new ContractDescriptorV1Pre163();
      contractDescriptor.numDigits = contractDescriptorNumDigits;
      contractDescriptor.payoutFunction = payoutFunction;
      contractDescriptor.roundingIntervals = roundingIntervals;

      const contractInfo = new ContractInfoV0Pre163();
      contractInfo.totalCollateral = BigInt(969482);
      contractInfo.contractDescriptor = contractDescriptor;
      contractInfo.oracleInfo = oracleInfo;

      expect(function () {
        contractInfo.validate();
      }).to.throw(
        'OracleEvent oracleNonces length must match DigitDecompositionEventDescriptor nbDigits',
      );
    });
  });
});
