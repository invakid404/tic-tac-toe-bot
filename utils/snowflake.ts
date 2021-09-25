export const isValidSnowflake = (value: bigint | undefined): boolean => {
  return value != null && value !== BigInt(0);
};
