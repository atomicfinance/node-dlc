// tslint:disable: no-unused-expression
import chai from 'chai';
import sinonChai from 'sinon-chai';
import { IrcManager } from '../../lib/irc/IrcManager';
import { createFakeLogger } from './helpers';
import { sleep } from '@liquality/utils';
import { ChannelType } from '../../lib/irc/ChannelType';
import { sha256 } from '@node-lightning/crypto';

chai.should();
chai.use(sinonChai);
const expect = chai.expect;

describe('IrcManager', () => {
  let sut: IrcManager;
  let bob: IrcManager;
  beforeEach(async () => {
    const pubKey1 = Buffer.concat([
      Buffer.from('03', 'hex'),
      sha256(Buffer.from(Math.random().toString())),
    ]);
    const pubKey2 = Buffer.concat([
      Buffer.from('03', 'hex'),
      sha256(Buffer.from(Math.random().toString())),
    ]);

    sut = new IrcManager(
      createFakeLogger(),
      pubKey1,
      ['irc.darkscience.net'],
      false,
      ChannelType.TestMarketPit,
    );
    bob = new IrcManager(
      createFakeLogger(),
      pubKey2,
      ['irc.darkscience.net'],
      false,
      ChannelType.TestMarketPit,
    );

    sut.start();
    bob.start();

    while (!sut.started) {
      await sleep(50);
    }
  });

  afterEach(() => {
    bob.stop();
    sut.stop();
  });

  describe('emit messages', () => {
    it('should only emit msgs from valid nicks in channel', (done) => {
      const expectedMsg = '0110';

      sut.on('message', (from, to, msg) => {
        const actualMsg = Buffer.from(msg, 'hex').toString('ascii');
        expect(actualMsg).to.equal(expectedMsg);
        expect(from).to.equal(bob.nick);
        expect(to).to.equal(ChannelType.TestMarketPit);

        sut.removeAllListeners();

        done();
      });

      bob.say(Buffer.from(expectedMsg));
    });

    it('should only emit msgs from valid nicks privately', (done) => {
      const expectedMsg = '1010';

      sut.on('message', (from, to, msg) => {
        const actualMsg = Buffer.from(msg, 'hex').toString('ascii');
        expect(actualMsg).to.equal(expectedMsg);
        expect(from).to.equal(bob.nick);
        expect(to).to.equal(sut.nick);

        sut.removeAllListeners();

        done();
      });

      bob.say(Buffer.from(expectedMsg), sut.nick);
    });
  });

  describe('say messages', () => {
    it('should default to trading pit channel', (done) => {
      const expectedMsg = '0101';

      bob.on('message', (from, to, msg) => {
        const actualMsg = Buffer.from(msg, 'hex').toString('ascii');
        expect(actualMsg).to.equal(expectedMsg);
        expect(from).to.equal(sut.nick);
        expect(to).to.equal(ChannelType.TestMarketPit);

        bob.removeAllListeners();

        done();
      });

      sut.say(Buffer.from(expectedMsg));
    });

    it('should correctly send msgs privately', (done) => {
      const expectedMsg = '1001';

      bob.on('message', (from, to, msg) => {
        const actualMsg = Buffer.from(msg, 'hex').toString('ascii');
        expect(actualMsg).to.equal(expectedMsg);
        expect(from).to.equal(sut.nick);
        expect(to).to.equal(bob.nick);

        bob.removeAllListeners();

        done();
      });

      sut.say(Buffer.from(expectedMsg), bob.nick);
    });
  });
});