import { BufferReader, BufferWriter } from '@node-lightning/bufio';

export function deserializeTlv(reader: BufferReader): ITlv {
  const type = reader.readBigSize();
  const length = reader.readBigSize();
  const body = reader.readBytes(Number(length));

  return { type, length, body };
}

export function serializeTlv(tlv: ITlv, writer: BufferWriter): void {
  const { type, length, body } = tlv;

  writer.writeBigSize(type);
  writer.writeBigSize(length);
  writer.writeBytes(body);
}

export interface ITlv {
  type: bigint;
  length: bigint;
  body: Buffer;
}
