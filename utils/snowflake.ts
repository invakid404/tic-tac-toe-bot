export const isValidSnowflake = (value: bigint): boolean => {
  return value !== BigInt(0);
};
