import { Logger } from '@node-lightning/logger';
import { Application } from 'express';
import basicAuth, { IAsyncAuthorizerOptions } from 'express-basic-auth';
import { IArguments, IDB } from '../../utils/config';
import { wrapAsync, validApiKey } from '../../utils/helper';
import { Client } from '../../client';
import ContractRoutes from './contract';
import { Endpoint } from '../Endpoint';
import InfoRoutes from './getinfo';
import WalletRoutes from './wallet';
import OrderRoutes from './order';

export class RoutesAPI {
  public info: InfoRoutes;
  public wallet: WalletRoutes;
  public contract: ContractRoutes;
  public order: OrderRoutes;
  public db: IDB;
  public client: Client;
  public prefix = 'api';

  constructor(
    app: Application,
    argv: IArguments,
    db: IDB,
    logger: Logger,
    client: Client,
  ) {
    this.db = db;
    this.client = client;
    this.info = new InfoRoutes(argv, db, logger, client);
    this.wallet = new WalletRoutes(argv, db, logger, client);
    this.contract = new ContractRoutes(argv, db, logger, client);
    this.order = new OrderRoutes(argv, db, logger, client);

    const options: IAsyncAuthorizerOptions = {
      authorizeAsync: true,
      authorizer: this.authorizer.bind(this),
    };

    app.get(
      this.getEndpoint(Endpoint.GetInfo),
      wrapAsync(this.info.getInfo.bind(this.info)),
    );
    app.post(
      this.getEndpoint(Endpoint.WalletCreate),
      wrapAsync(this.wallet.postCreate.bind(this.wallet)),
    );
    app.get(
      this.getEndpoint(Endpoint.WalletNewAddress),
      basicAuth(options),
      wrapAsync(this.wallet.getNewAddress.bind(this.wallet)),
    );
    app.get(
      this.getEndpoint(Endpoint.WalletBalance),
      basicAuth(options),
      wrapAsync(this.wallet.getBalance.bind(this.wallet)),
    );
    app.post(
      this.getEndpoint(Endpoint.ContractInfo, 'decode'),
      wrapAsync(this.contract.postInfoDecode.bind(this.contract)),
    );
    app.post(
      this.getEndpoint(Endpoint.OrderOffer, 'decode'),
      wrapAsync(this.order.postOfferDecode.bind(this.order)),
    );
    app.post(
      this.getEndpoint(Endpoint.OrderAccept, 'decode'),
      wrapAsync(this.order.postAcceptDecode.bind(this.order)),
    );
  }

  private getEndpoint(endpoint: Endpoint, suffix?: string): string {
    return `/${this.prefix}/${endpoint}${suffix ? `/${suffix}` : ``}`;
  }

  private async authorizer(_: string, password: string, cb) {
    console.log('password', password);
    const walletExists = await this.db.wallet.checkSeed();
    if (!walletExists) return cb('Wallet not created', false);

    const valid = validApiKey(password);
    if (!valid) return cb('Invalid API Key', false);

    try {
      const apiKey = Buffer.from(password, 'hex');
      const mnemonic = await this.db.wallet.findSeed(apiKey);
      if (!this.client.seedSet) {
        this.client.setSeed(mnemonic);
      }
      return cb(null, true);
    } catch (e) {
      return cb('Incorrect API Key', false);
    }
  }
}
