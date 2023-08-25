import {
  DlcIdsV0,
  OracleEventContainerV0Pre167,
  OracleIdentifierV0,
} from '@node-dlc/messaging';
import { sha256 } from '@node-lightning/crypto';
import { RocksdbBase } from '@node-lightning/gossip-rocksdb';

enum Prefix {
  OracleEventContainerV0 = 80,
  OracleNoncesV0 = 81,
  OracleIdentifierV0 = 82,
}

export class RocksdbOracleStore extends RocksdbBase {
  public async findOracleEventContainers(): Promise<
    OracleEventContainerV0Pre167[]
  > {
    return new Promise((resolve, reject) => {
      const stream = this._db.createReadStream();
      const results: OracleEventContainerV0Pre167[] = [];
      stream.on('data', (data) => {
        if (data.key[0] === Prefix.OracleEventContainerV0) {
          results.push(OracleEventContainerV0Pre167.deserialize(data.value));
        }
      });
      stream.on('end', () => {
        resolve(results);
      });
      stream.on('error', (err) => reject(err));
    });
  }

  public async findOracleEventContainer(
    announcementId: Buffer,
  ): Promise<OracleEventContainerV0Pre167> {
    const key = Buffer.concat([
      Buffer.from([Prefix.OracleEventContainerV0]),
      announcementId,
    ]);
    const raw = await this._safeGet<Buffer>(key);
    if (!raw) return;
    return OracleEventContainerV0Pre167.deserialize(raw);
  }

  public async saveOracleEventContainer(
    oracleEventContainer: OracleEventContainerV0Pre167,
  ): Promise<void> {
    const value = oracleEventContainer.serialize();
    const announcementId = sha256(
      oracleEventContainer.announcement.serialize(),
    );
    const key = Buffer.concat([
      Buffer.from([Prefix.OracleEventContainerV0]),
      announcementId,
    ]);
    await this._db.put(key, value);
  }

  public async deleteOracleEventContainer(
    announcementId: Buffer,
  ): Promise<void> {
    const key = Buffer.concat([
      Buffer.from([Prefix.OracleEventContainerV0]),
      announcementId,
    ]);
    await this._db.del(key);
  }

  public async findNonces(announcementId: Buffer): Promise<DlcIdsV0> {
    const key = Buffer.concat([
      Buffer.from([Prefix.OracleNoncesV0]),
      announcementId,
    ]);
    const raw = await this._safeGet<Buffer>(key);
    if (!raw) return;
    return DlcIdsV0.deserialize(raw);
  }

  public async saveNonces(
    nonces: DlcIdsV0,
    announcementId: Buffer,
  ): Promise<void> {
    const value = nonces.serialize();
    const key = Buffer.concat([
      Buffer.from([Prefix.OracleNoncesV0]),
      announcementId,
    ]);
    await this._db.put(key, value);
  }

  public async deleteNonces(announcementId: Buffer): Promise<void> {
    const key = Buffer.concat([
      Buffer.from([Prefix.OracleNoncesV0]),
      announcementId,
    ]);
    await this._db.del(key);
  }

  public async findOracleIdentifiers(): Promise<OracleIdentifierV0[]> {
    return new Promise((resolve, reject) => {
      const stream = this._db.createReadStream();
      const results: OracleIdentifierV0[] = [];
      stream.on('data', (data) => {
        if (data.key[0] === Prefix.OracleIdentifierV0) {
          results.push(OracleIdentifierV0.deserialize(data.value));
        }
      });
      stream.on('end', () => {
        resolve(results);
      });
      stream.on('error', (err) => reject(err));
    });
  }

  public async findOracleIdentifier(
    oraclePubkey: Buffer,
  ): Promise<OracleIdentifierV0> {
    const key = Buffer.concat([
      Buffer.from([Prefix.OracleIdentifierV0]),
      oraclePubkey,
    ]);
    const raw = await this._safeGet<Buffer>(key);
    if (!raw) return;
    return OracleIdentifierV0.deserialize(raw);
  }

  public async saveOracleIdentifier(
    oracleIdentifier: OracleIdentifierV0,
  ): Promise<void> {
    const value = oracleIdentifier.serialize();
    const key = Buffer.concat([
      Buffer.from([Prefix.OracleIdentifierV0]),
      oracleIdentifier.oraclePubkey,
    ]);
    await this._db.put(key, value);
  }

  public async deleteOracleIdentifier(oraclePubkey: Buffer): Promise<void> {
    const key = Buffer.concat([
      Buffer.from([Prefix.OracleIdentifierV0]),
      oraclePubkey,
    ]);
    await this._db.del(key);
  }
}
