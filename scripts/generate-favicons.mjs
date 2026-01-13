import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const logoDir = join(rootDir, 'public', 'logo');
const publicDir = join(rootDir, 'public');

const svgPath = join(logoDir, 'H4KU-Logo.svg');
const svgBuffer = readFileSync(svgPath);

const sizes = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192.png', size: 192 },
  { name: 'android-chrome-512.png', size: 512 },
];

async function generateFavicons() {
  console.log('Generating favicons from:', svgPath);

  for (const { name, size } of sizes) {
    const outputPath = join(logoDir, name);
    await sharp(svgBuffer, { density: 400 })
      .resize(size, size, { kernel: 'lanczos3' })
      .sharpen()
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }

  // Generate ICO file (contains 16x16 and 32x32)
  const ico16 = await sharp(svgBuffer, { density: 400 }).resize(16, 16, { kernel: 'lanczos3' }).sharpen().png().toBuffer();
  const ico32 = await sharp(svgBuffer, { density: 400 }).resize(32, 32, { kernel: 'lanczos3' }).sharpen().png().toBuffer();

  // ICO file format
  const icoBuffer = createIco([
    { buffer: ico16, size: 16 },
    { buffer: ico32, size: 32 },
  ]);

  writeFileSync(join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('✓ Generated favicon.ico (16x16 + 32x32)');

  console.log('\nAll favicons generated successfully!');
}

function createIco(images) {
  // ICO header: 6 bytes
  // ICO directory entry: 16 bytes per image
  // Image data follows

  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * images.length;
  let dataOffset = headerSize + dirSize;

  const entries = images.map((img) => {
    const entry = {
      buffer: img.buffer,
      size: img.size,
      offset: dataOffset,
    };
    dataOffset += img.buffer.length;
    return entry;
  });

  const totalSize = dataOffset;
  const ico = Buffer.alloc(totalSize);

  // ICO header
  ico.writeUInt16LE(0, 0); // Reserved
  ico.writeUInt16LE(1, 2); // Type: 1 = ICO
  ico.writeUInt16LE(images.length, 4); // Number of images

  // Directory entries
  let offset = headerSize;
  for (const entry of entries) {
    ico.writeUInt8(entry.size === 256 ? 0 : entry.size, offset); // Width
    ico.writeUInt8(entry.size === 256 ? 0 : entry.size, offset + 1); // Height
    ico.writeUInt8(0, offset + 2); // Color palette
    ico.writeUInt8(0, offset + 3); // Reserved
    ico.writeUInt16LE(1, offset + 4); // Color planes
    ico.writeUInt16LE(32, offset + 6); // Bits per pixel
    ico.writeUInt32LE(entry.buffer.length, offset + 8); // Size of image data
    ico.writeUInt32LE(entry.offset, offset + 12); // Offset to image data
    offset += dirEntrySize;
  }

  // Image data
  for (const entry of entries) {
    entry.buffer.copy(ico, entry.offset);
  }

  return ico;
}

generateFavicons().catch(console.error);
