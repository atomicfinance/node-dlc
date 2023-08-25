// BigSize integers are deserialized using @node-lightning/bufio BufferReader.readBigSize()
// Refer to https://github.com/node-lightning/node-lightning/blob/e9b349b200997b8c5e46751ae6eb13a283323f5b/packages/bufio/lib/BufferReader.ts#L194

/**
 * Extract the size of a deserialized bigSize integer
 * @param val
 * @returns The size in bytes of the value parameter
 */

export const getBigSizeBytesLength = (val: bigint): number => {
  if (val < BigInt('0xfd')) return 1;
  if (val < BigInt('0x10000')) return 3;
  if (val < BigInt('0x100000000')) return 5;
  return 9;
};
