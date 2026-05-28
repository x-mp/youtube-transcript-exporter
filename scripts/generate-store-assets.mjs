import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function png(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    pixels.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function setPixel(pixels, width, x, y, color) {
  if (x < 0 || y < 0 || x >= width) return;
  const index = (y * width + x) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

function inRoundedRect(x, y, rect) {
  const { left, top, width, height, radius } = rect;
  const right = left + width;
  const bottom = top + height;
  const cx = x < left + radius ? left + radius : x > right - radius ? right - radius : x;
  const cy = y < top + radius ? top + radius : y > bottom - radius ? bottom - radius : y;
  return x >= left && x <= right && y >= top && y <= bottom && (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function inTriangle(x, y, a, b, c) {
  const area = (p1, p2, p3) => Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2);
  const whole = area(a, b, c);
  const parts = area({ x, y }, b, c) + area(a, { x, y }, c) + area(a, b, { x, y });
  return Math.abs(whole - parts) < 0.7;
}

function drawIcon(size, path) {
  const scale = size / 128;
  const pixels = Buffer.alloc(size * size * 4);
  const red = [213, 32, 32, 255];
  const white = [255, 255, 255, 255];
  const soft = [255, 232, 232, 255];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const ux = x / scale;
      const uy = y / scale;
      if (inRoundedRect(ux, uy, { left: 16, top: 16, width: 96, height: 96, radius: 22 })) {
        setPixel(pixels, size, x, y, red);
      }
      if (inRoundedRect(ux, uy, { left: 31, top: 29, width: 66, height: 42, radius: 10 })) {
        setPixel(pixels, size, x, y, white);
      }
      if (inTriangle(ux, uy, { x: 56, y: 42 }, { x: 56, y: 59 }, { x: 76, y: 50.5 })) {
        setPixel(pixels, size, x, y, red);
      }
      if ((uy > 79 && uy < 85 && ux > 38 && ux < 90) || (uy > 93 && uy < 99 && ux > 50 && ux < 78)) {
        setPixel(pixels, size, x, y, soft);
      }
    }
  }

  writeFileSync(path, png(size, size, pixels));
}

function writeSvg(path, svg) {
  writeFileSync(path, `${svg.trim()}\n`);
}

ensureDir(join(root, "icons"));
ensureDir(join(root, "store-assets"));

writeSvg(join(root, "icons/icon.svg"), `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="16" y="16" width="96" height="96" rx="22" fill="#d52020"/>
  <rect x="31" y="29" width="66" height="42" rx="10" fill="#fff"/>
  <path d="M56 42v17l20-8.5z" fill="#d52020"/>
  <path d="M38 82h52M50 96h28" stroke="#ffe8e8" stroke-width="7" stroke-linecap="round"/>
</svg>`);

for (const size of [16, 32, 48, 128]) {
  drawIcon(size, join(root, `icons/icon${size}.png`));
}

writeSvg(join(root, "store-assets/screenshot-1-main-1280x800.svg"), `
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <rect width="1280" height="800" fill="#f7f8fb"/>
  <rect x="46" y="42" width="1188" height="716" rx="24" fill="#fff" stroke="#d8e0ea"/>
  <rect x="46" y="42" width="1188" height="64" rx="24" fill="#f0f2f5"/>
  <circle cx="80" cy="74" r="8" fill="#ff5f57"/><circle cx="106" cy="74" r="8" fill="#febc2e"/><circle cx="132" cy="74" r="8" fill="#28c840"/>
  <rect x="186" y="62" width="570" height="24" rx="12" fill="#e1e6ec"/>
  <text x="212" y="80" font-family="Inter, Arial, sans-serif" font-size="15" fill="#5b6877">youtube.com/watch?v=research-video</text>
  <rect x="88" y="146" width="735" height="414" rx="14" fill="#111827"/>
  <rect x="88" y="146" width="735" height="414" rx="14" fill="#202938"/>
  <circle cx="455" cy="353" r="54" fill="#d52020"/><path d="M439 322v62l54-31z" fill="#fff"/>
  <rect x="88" y="584" width="430" height="28" rx="6" fill="#17202a"/>
  <rect x="88" y="628" width="156" height="38" rx="19" fill="#f1f2f3"/><text x="134" y="652" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700" fill="#0f0f0f">Like</text>
  <rect x="258" y="628" width="44" height="38" rx="19" fill="#ffe8e8"/><path d="M280 638v17M272 647l8 8 8-8" stroke="#d52020" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="318" y="628" width="122" height="38" rx="19" fill="#f1f2f3"/><text x="350" y="652" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700" fill="#0f0f0f">Share</text>
  <rect x="866" y="146" width="322" height="514" rx="14" fill="#f7f8fb" stroke="#d8e0ea"/>
  <text x="898" y="198" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800" fill="#17202a">Transcript exported</text>
  <text x="898" y="234" font-family="Inter, Arial, sans-serif" font-size="18" fill="#5b6877">Clean TXT with timestamps,</text>
  <text x="898" y="260" font-family="Inter, Arial, sans-serif" font-size="18" fill="#5b6877">title, URL, channel and chapters.</text>
  <rect x="898" y="300" width="258" height="300" rx="10" fill="#fff" stroke="#d8e0ea"/>
  <text x="922" y="338" font-family="SFMono-Regular, Menlo, monospace" font-size="15" fill="#17202a">=== Video metadata ===</text>
  <text x="922" y="373" font-family="SFMono-Regular, Menlo, monospace" font-size="14" fill="#5b6877">Title: Product research</text>
  <text x="922" y="401" font-family="SFMono-Regular, Menlo, monospace" font-size="14" fill="#5b6877">URL: youtube.com/...</text>
  <text x="922" y="446" font-family="SFMono-Regular, Menlo, monospace" font-size="15" fill="#17202a">=== Transcript ===</text>
  <text x="922" y="481" font-family="SFMono-Regular, Menlo, monospace" font-size="14" fill="#5b6877">[00:03] Welcome...</text>
  <text x="922" y="509" font-family="SFMono-Regular, Menlo, monospace" font-size="14" fill="#5b6877">[00:18] The key point...</text>
  <text x="922" y="537" font-family="SFMono-Regular, Menlo, monospace" font-size="14" fill="#5b6877">[01:04] Summary...</text>
</svg>`);

writeSvg(join(root, "store-assets/promo-small-440x280.svg"), `
<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
  <rect width="440" height="280" rx="0" fill="#f7f8fb"/>
  <rect x="30" y="32" width="96" height="96" rx="24" fill="#d52020"/>
  <rect x="52" y="56" width="52" height="34" rx="8" fill="#fff"/><path d="M73 65v17l17-8.5z" fill="#d52020"/>
  <path d="M56 106h44M66 120h24" stroke="#ffe8e8" stroke-width="6" stroke-linecap="round"/>
  <text x="152" y="67" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800" fill="#17202a">YouTube</text>
  <text x="152" y="102" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800" fill="#17202a">Transcript Exporter</text>
  <text x="34" y="174" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#17202a">Export transcripts to clean TXT</text>
  <text x="34" y="209" font-family="Inter, Arial, sans-serif" font-size="16" fill="#5b6877">Timestamps, metadata, chapters, local download.</text>
  <rect x="34" y="232" width="140" height="30" rx="15" fill="#ffe8e8"/>
  <text x="54" y="253" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="800" fill="#b91d1d">Free extension</text>
</svg>`);

writeSvg(join(root, "store-assets/promo-marquee-1400x560.svg"), `
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">
  <rect width="1400" height="560" fill="#f7f8fb"/>
  <rect x="76" y="84" width="160" height="160" rx="40" fill="#d52020"/>
  <rect x="112" y="124" width="88" height="58" rx="13" fill="#fff"/><path d="M147 139v30l30-15z" fill="#d52020"/>
  <path d="M118 208h76M136 232h40" stroke="#ffe8e8" stroke-width="10" stroke-linecap="round"/>
  <text x="284" y="142" font-family="Inter, Arial, sans-serif" font-size="58" font-weight="850" fill="#17202a">YouTube Transcript</text>
  <text x="284" y="208" font-family="Inter, Arial, sans-serif" font-size="58" font-weight="850" fill="#17202a">Exporter</text>
  <text x="286" y="274" font-family="Inter, Arial, sans-serif" font-size="31" fill="#5b6877">Save transcripts with timestamps,</text>
  <text x="286" y="318" font-family="Inter, Arial, sans-serif" font-size="31" fill="#5b6877">metadata and chapters.</text>
  <rect x="286" y="366" width="222" height="48" rx="24" fill="#ffe8e8"/>
  <text x="320" y="398" font-family="Inter, Arial, sans-serif" font-size="19" font-weight="800" fill="#b91d1d">Free Chrome extension</text>
  <rect x="836" y="88" width="450" height="360" rx="22" fill="#fff" stroke="#d8e0ea"/>
  <text x="884" y="153" font-family="SFMono-Regular, Menlo, monospace" font-size="24" fill="#17202a">=== Transcript ===</text>
  <text x="884" y="210" font-family="SFMono-Regular, Menlo, monospace" font-size="21" fill="#5b6877">[00:03] Introduction...</text>
  <text x="884" y="260" font-family="SFMono-Regular, Menlo, monospace" font-size="21" fill="#5b6877">[00:42] Main insight...</text>
  <text x="884" y="310" font-family="SFMono-Regular, Menlo, monospace" font-size="21" fill="#5b6877">[02:18] Action items...</text>
  <rect x="884" y="358" width="220" height="48" rx="24" fill="#d52020"/>
  <text x="928" y="390" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="800" fill="#fff">Download TXT</text>
</svg>`);

console.log("Generated icons and SVG sources.");
