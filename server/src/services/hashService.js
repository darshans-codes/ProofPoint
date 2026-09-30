import sharp from 'sharp';

/**
 * Calculates a 64-bit difference hash (dHash) for an image buffer.
 * Returns a 16-character hexadecimal string.
 */
export async function dHash(buffer) {
  try {
    const rawBuffer = await sharp(buffer)
      .grayscale()
      .resize(9, 8, { fit: 'fill' })
      .raw()
      .toBuffer();

    let bits = '';
    // 8 rows, 9 columns = 72 pixels total
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const leftPixel = rawBuffer[row * 9 + col];
        const rightPixel = rawBuffer[row * 9 + col + 1];
        bits += leftPixel > rightPixel ? '1' : '0';
      }
    }

    // Convert 64-bit binary string into 16-character hex string
    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      const nibble = bits.substring(i, i + 4);
      hex += parseInt(nibble, 2).toString(16);
    }
    return hex.padStart(16, '0');
  } catch (error) {
    console.error('[dHash] Error computing perceptual hash:', error.message);
    return null;
  }
}

/**
 * Calculates the Hamming distance between two 16-character hex strings
 */
export function hammingDistance(hexA, hexB) {
  if (!hexA || !hexB || hexA.length !== 16 || hexB.length !== 16) {
    return 64;
  }

  let dist = 0;
  for (let i = 0; i < 16; i++) {
    const valA = parseInt(hexA[i], 16);
    const valB = parseInt(hexB[i], 16);
    let xor = valA ^ valB;
    while (xor > 0) {
      dist += xor & 1;
      xor >>= 1;
    }
  }
  return dist;
}
