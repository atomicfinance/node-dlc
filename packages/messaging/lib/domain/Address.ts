import { BufferReader, BufferWriter } from '@node-lightning/bufio';

export enum AddressType {
  IpV4 = 1,
}

export class Address {
  public static type = AddressType.IpV4;

  public static deserialize(buf: Buffer): Address {
    const reader = new BufferReader(buf);
    const type = reader.readBigSize(); // read off type

    let hostBuf: Buffer;
    let port: number;
    let instance: Address;
    switch (Number(type)) {
      case AddressType.IpV4:
        hostBuf = reader.readBytes(4);
        port = reader.readUInt16BE();
        instance = new Address(this.ipv4StringFromBuffer(hostBuf), port);
        break;
      default:
        throw new Error(
          `Node announcement message's address type must be IpV4`,
        );
    }

    return instance;
  }

  public type = AddressType.IpV4;

  /**
   * String notation representation of the host
   */
  public host: string;

  /**
   * Port number
   */
  public port: number;

  /**
   * Base class representing a network address
   */
  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
  }

  public toString(): string {
    return `${this.host}:${this.port}`;
  }

  /**
   * Serializes the dlc_transactions_v0 message into a Buffer
   */
  public serialize(): Buffer {
    const writer = new BufferWriter();
    writer.writeBigSize(this.type);
    writer.writeBytes(this.ipv4StringToBuffer(this.host));
    writer.writeUInt16BE(this.port);

    return writer.toBuffer();
  }

  /**
   * Converts a bytes buffer IPv4 host into string notation
   * of the format x.x.x.x where each x is an 8-bit integer.
   */
  private static ipv4StringFromBuffer(bytes: Buffer): string {
    return bytes.join('.');
  }

  /**
   * Converts an IPv4 host string of the format x.x.x.x where
   * each x is an 8-bit integer into a bytes buffer
   */
  private ipv4StringToBuffer(host: string): Buffer {
    const writer = new BufferWriter();
    host.split('.').map((val) => writer.writeUInt8(parseInt(val, 10)));
    return writer.toBuffer();
  }
}
