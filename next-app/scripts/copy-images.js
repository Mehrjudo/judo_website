import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(__dirname, '../../content/images');
const dest = path.resolve(__dirname, '../public/images');
if (!fs.existsSync(src)) { console.warn('[copy-images] Source not found:', src); process.exit(0); }
fs.mkdirSync(dest, { recursive: true });
const files = fs.readdirSync(src);
let copied = 0;
for (const file of files) {
  const sf = path.join(src, file), df = path.join(dest, file);
  if (fs.statSync(sf).isFile() && !fs.existsSync(df)) { fs.copyFileSync(sf, df); copied++; }
}
console.log(`[copy-images] Copied ${copied} new image(s) to public/images/ (${files.length} total).`);
