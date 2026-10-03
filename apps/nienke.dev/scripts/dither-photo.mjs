import { Buffer } from "node:buffer";
import process from "node:process";
import sharp from "sharp";

const SOURCE = "public/nienke.jpg";
const OUTPUT = "public/nienke-dither.png";
const WIDTH = 320;
const INK = [0x32, 0x42, 0xa8];

const { data, info } = await sharp(SOURCE)
  .resize({ width: WIDTH })
  .grayscale()
  .normalise()
  .linear(1.15, -10)
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height } = info;
const pixels = Float32Array.from(data);
const spread = [
  [1, 0],
  [2, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
  [0, 2],
];

const out = Buffer.alloc(width * height * 4);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = y * width + x;
    const ink = pixels[i] < 128;
    const error = (pixels[i] - (ink ? 0 : 255)) / 8;
    for (const [dx, dy] of spread) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny < height)
        pixels[ny * width + nx] += error;
    }
    if (ink) out.set([...INK, 255], i * 4);
  }
}

await sharp(out, { raw: { width, height, channels: 4 } })
  .png({ palette: true, colours: 2 })
  .toFile(OUTPUT);
process.stdout.write(`Wrote ${OUTPUT} (${width}×${height})\n`);
