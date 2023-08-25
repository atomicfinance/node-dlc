import { ECPair } from 'bitcoinjs-lib';
import chai from 'chai';
import sinonChai from 'sinon-chai';

import { ChannelType } from '../../lib/irc/ChannelType';
import { IrcManager } from '../../lib/irc/IrcManager';
import { IrcServers } from '../../lib/irc/Servers';
import { sleep } from '../util';
import { createFakeLogger } from './helpers';

chai.should();
chai.use(sinonChai);
const expect = chai.expect;

describe('IrcManager', () => {
  let sut: IrcManager;
  let bob: IrcManager;
  beforeEach(async () => {
    const keyPair1 = ECPair.makeRandom();
    const keyPair2 = ECPair.makeRandom();

    sut = new IrcManager(
      createFakeLogger(),
      keyPair1.privateKey,
      [IrcServers.primary_server.host],
      false,
      ChannelType.TestMarketPit,
    );
    bob = new IrcManager(
      createFakeLogger(),
      keyPair2.privateKey,
      [IrcServers.primary_server.host],
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

  describe('generateNick', () => {
    const pubKey = Buffer.from(
      '023d90176df405d11739b661595a9737f95bb1edaf7f9c9a9730c51dcd43bd1ad8',
      'hex',
    );

    const pubKey2 = Buffer.from(
      '030587494db53db3e3eaa173377e75afb69c1f1235cb0178cacde8afd4b251573d',
      'hex',
    );

    it('should generate nicks and pad if necessary', async () => {
      const nick = sut.generateNick(pubKey);
      const nick2 = sut.generateNick(pubKey2);

      const nickValid = IrcManager.nickValid(nick);
      const nick2Valid = IrcManager.nickValid(nick2);

      expect(nickValid).to.equal(true);
      expect(nick2Valid).to.equal(true);

      expect(nick.length).to.equal(nick2.length);
    });
  });
});
