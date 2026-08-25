"use strict";

const fs = require("fs");
const MAX_IMAGE_BYTES = 64 * 1024 * 1024;

function readImageFile(filePath) {
  const descriptor = fs.openSync(filePath, "r");
  try {
    const stats = fs.fstatSync(descriptor);
    if (!stats.isFile() || stats.size <= 0 || stats.size > MAX_IMAGE_BYTES) {
      throw new TypeError("Image file has an unsupported size");
    }
    const input = Buffer.allocUnsafe(stats.size);
    let offset = 0;
    while (offset < input.length) {
      const bytesRead = fs.readSync(descriptor, input, offset, input.length - offset, offset);
      if (bytesRead === 0) throw new TypeError("Image file ended unexpectedly");
      offset += bytesRead;
    }
    return input;
  } finally {
    fs.closeSync(descriptor);
  }
}

function requireBytes(input, offset, count) {
  if (offset < 0 || count < 0 || offset + count > input.length) {
    throw new TypeError("Invalid or truncated image data");
  }
}

function u16le(input, offset) {
  requireBytes(input, offset, 2);
  return input[offset] | (input[offset + 1] << 8);
}

function u16be(input, offset) {
  requireBytes(input, offset, 2);
  return (input[offset] << 8) | input[offset + 1];
}

function u24le(input, offset) {
  requireBytes(input, offset, 3);
  return input[offset] | (input[offset + 1] << 8) | (input[offset + 2] << 16);
}

function u32le(input, offset) {
  requireBytes(input, offset, 4);
  return input.readUInt32LE(offset);
}

function u32be(input, offset) {
  requireBytes(input, offset, 4);
  return input.readUInt32BE(offset);
}

function dimensions(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new TypeError("Image dimensions must be positive");
  }
  return { width, height };
}

function jpegSize(input) {
  requireBytes(input, 0, 4);
  if (input[0] !== 0xff || input[1] !== 0xd8) throw new TypeError("Invalid JPEG data");
  let offset = 2;
  while (offset + 4 <= input.length) {
    while (offset < input.length && input[offset] === 0xff) offset += 1;
    const marker = input[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const size = u16be(input, offset);
    if (size < 2 || offset + size > input.length) throw new TypeError("Invalid JPEG segment");
    const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSof) return dimensions(u16be(input, offset + 5), u16be(input, offset + 3));
    offset += size;
  }
  throw new TypeError("JPEG dimensions not found");
}

function webpSize(input) {
  requireBytes(input, 0, 16);
  if (input.toString("ascii", 0, 4) !== "RIFF" || input.toString("ascii", 8, 12) !== "WEBP") {
    throw new TypeError("Invalid WebP data");
  }
  const chunk = input.toString("ascii", 12, 16);
  if (chunk === "VP8X") return dimensions(u24le(input, 24) + 1, u24le(input, 27) + 1);
  if (chunk === "VP8L") {
    requireBytes(input, 20, 5);
    if (input[20] !== 0x2f) throw new TypeError("Invalid lossless WebP data");
    const bits = input.readUInt32LE(21);
    return dimensions((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1);
  }
  if (chunk === "VP8 ") {
    requireBytes(input, 23, 7);
    if (input[23] !== 0x9d || input[24] !== 0x01 || input[25] !== 0x2a) throw new TypeError("Invalid lossy WebP data");
    return dimensions(u16le(input, 26) & 0x3fff, u16le(input, 28) & 0x3fff);
  }
  throw new TypeError("Unsupported WebP encoding");
}

function svgSize(input) {
  const source = input.subarray(0, 256 * 1024).toString("utf8");
  const viewBox = source.match(/viewBox\s*=\s*["'][^"']*?([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)[^"']*["']/i);
  const width = source.match(/\bwidth\s*=\s*["']([\d.]+)(?:px)?["']/i);
  const height = source.match(/\bheight\s*=\s*["']([\d.]+)(?:px)?["']/i);
  if (width && height) return dimensions(Number(width[1]), Number(height[1]));
  if (viewBox) return dimensions(Number(viewBox[3]), Number(viewBox[4]));
  throw new TypeError("SVG dimensions not found");
}

function tiffSize(input) {
  requireBytes(input, 0, 8);
  const order = input.toString("ascii", 0, 2);
  if (order !== "II" && order !== "MM") throw new TypeError("Invalid TIFF data");
  const littleEndian = order === "II";
  const read16 = littleEndian ? u16le : u16be;
  const read32 = littleEndian ? u32le : u32be;
  if (read16(input, 2) !== 42) throw new TypeError("Unsupported TIFF format");
  const directoryOffset = read32(input, 4);
  const entryCount = read16(input, directoryOffset);
  if (entryCount > 4096) throw new TypeError("TIFF contains too many directory entries");

  let width;
  let height;
  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = directoryOffset + 2 + index * 12;
    requireBytes(input, entryOffset, 12);
    const tag = read16(input, entryOffset);
    if (tag !== 256 && tag !== 257) continue;
    const type = read16(input, entryOffset + 2);
    const count = read32(input, entryOffset + 4);
    if (count !== 1 || (type !== 3 && type !== 4)) continue;
    const value = type === 3 ? read16(input, entryOffset + 8) : read32(input, entryOffset + 8);
    if (tag === 256) width = value;
    else height = value;
  }
  return dimensions(width, height);
}

function ktxSize(input) {
  requireBytes(input, 0, 28);
  const signature = input.toString("ascii", 1, 7);
  if (signature === "KTX 11") {
    requireBytes(input, 0, 44);
    const endianness = u32le(input, 12);
    const read32 = endianness === 0x04030201 ? u32le : endianness === 0x01020304 ? u32be : null;
    if (!read32) throw new TypeError("Invalid KTX endianness");
    return dimensions(read32(input, 36), read32(input, 40));
  }
  if (signature === "KTX 20") return dimensions(u32le(input, 20), u32le(input, 24));
  throw new TypeError("Invalid KTX data");
}

function imageSize(value) {
  const input = typeof value === "string" ? readImageFile(value) : Buffer.isBuffer(value) ? value : Buffer.from(value);
  requireBytes(input, 0, 2);
  if (input.length > MAX_IMAGE_BYTES) throw new TypeError("Image data is too large");
  if (input.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return dimensions(u32be(input, 16), u32be(input, 20));
  }
  if (input[0] === 0xff && input[1] === 0xd8) return jpegSize(input);
  if (input.subarray(0, 3).toString("ascii") === "GIF") return dimensions(u16le(input, 6), u16le(input, 8));
  if (input.subarray(0, 2).toString("ascii") === "BM") return dimensions(Math.abs(input.readInt32LE(18)), Math.abs(input.readInt32LE(22)));
  if (input.subarray(0, 4).toString("ascii") === "RIFF") return webpSize(input);
  if (input.subarray(0, 4).toString("ascii") === "8BPS") return dimensions(u32be(input, 18), u32be(input, 14));
  if (input.subarray(0, 5).toString("utf8").toLowerCase() === "<?xml" || input.toString("utf8", 0, 256).includes("<svg")) return svgSize(input);
  if (input.subarray(0, 2).toString("ascii") === "II" || input.subarray(0, 2).toString("ascii") === "MM") return tiffSize(input);
  if (input.toString("ascii", 1, 7) === "KTX 11" || input.toString("ascii", 1, 7) === "KTX 20") return ktxSize(input);
  throw new TypeError("Unsupported image format");
}

module.exports = imageSize;
module.exports.default = imageSize;
module.exports.imageSize = imageSize;