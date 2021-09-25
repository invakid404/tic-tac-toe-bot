import { encode, decode } from "../deps.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export const decodeString = (hex: string) => {
  return decode(encoder.encode(hex));
};

export const encodeToString = (data: Uint8Array) => {
  return decoder.decode(encode(data));
};
