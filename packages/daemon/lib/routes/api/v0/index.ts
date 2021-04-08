import { Logger } from '@node-lightning/logger';
import { Application } from 'express';
import basicAuth, { IAsyncAuthorizerOptions } from 'express-basic-auth';
import { IArguments, IDB } from '../../../utils/config';
import { wrapAsync, validApiKey } from '../../../utils/helper';
import OrderRoutes from './order';
import DlcRoutes from './dlc';
import { Endpoint } from '../../Endpoint';
import { Client } from '../../../client';
import ContractInfoRoutes from './contract';

export class RoutesV1 {
  public contractInfo: ContractInfoRoutes;
  public order: OrderRoutes;
  public dlc: DlcRoutes;
  public db: IDB;
  public client: Client;
  public prefix = 'api/v0';

  constructor(
    app: Application,
    argv: IArguments,
    db: IDB,
    logger: Logger,
    client: Client,
  ) {
    this.db = db;
    this.client = client;
    this.contractInfo = new ContractInfoRoutes(argv, db, logger, client);
    this.order = new OrderRoutes(argv, db, logger, client);
    this.dlc = new DlcRoutes(argv, db, logger, client);

    const options: IAsyncAuthorizerOptions = {
      authorizeAsync: true,
      authorizer: this.authorizer.bind(this),
    };

    app.post(
      this.getEndpoint(Endpoint.OrderOffer),
      basicAuth(options),
      wrapAsync(this.order.postOffer.bind(this.order)),
    );
    app.post(
      this.getEndpoint(Endpoint.OrderAccept),
      basicAuth(options),
      wrapAsync(this.order.postAccept.bind(this.order)),
    );

    app.post(
      this.getEndpoint(Endpoint.DlcOffer),
      basicAuth(options),
      wrapAsync(this.dlc.postOffer.bind(this.dlc)),
    );
    app.post(
      this.getEndpoint(Endpoint.DlcAccept),
      basicAuth(options),
      wrapAsync(this.dlc.postAccept.bind(this.dlc)),
    );
  }

  private getEndpoint(endpoint: Endpoint): string {
    return `/${this.prefix}/${endpoint}`;
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
