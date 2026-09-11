/**
 * Generates the Open Graph share image.
 *
 * The meta tags pointed at /og-image.jpg for months and the file never
 * existed, so every share — TikTok bio, Discord, iMessage, Facebook — rendered
 * a blank card. Generating it from source here means it can be regenerated
 * when the positioning changes, rather than being a mystery binary nobody
 * dares touch.
 *
 * Run: node scripts/generate-og-image.js
 */

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// The size every scraper expects. Facebook and LinkedIn crop anything else,
// and X will silently fall back to a small square card.
const WIDTH = 1200;
const HEIGHT = 630;

// Brand tokens, matching tailwind.config.js.
const SURFACE = '#0F1117';
const CARD = '#1A1D24';
const ACCENT = '#2D9B8F';
const WHITE = '#FFFFFF';
const MUTED = '#8B909A';

const FONT_STACK = 'Segoe UI, DejaVu Sans, Helvetica, Arial, sans-serif';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${SURFACE}"/>
  <rect x="0" y="0" width="${WIDTH}" height="10" fill="${ACCENT}"/>

  <!-- Card edge, so the image reads as the product rather than a poster. -->
  <rect x="72" y="84" width="${WIDTH - 144}" height="${HEIGHT - 168}" rx="28" fill="${CARD}"/>

  <text x="128" y="228" font-family="${FONT_STACK}" font-size="42" font-weight="600" fill="${ACCENT}">
    Habitat Builder
  </text>

  <text x="128" y="330" font-family="${FONT_STACK}" font-size="76" font-weight="700" fill="${WHITE}">
    Know your setup is right
  </text>

  <text x="128" y="404" font-family="${FONT_STACK}" font-size="34" fill="${MUTED}">
    Not just recorded.
  </text>

  <text x="128" y="472" font-family="${FONT_STACK}" font-size="27" fill="${MUTED}">
    Reptile &amp; amphibian husbandry, graded against your
  </text>
  <text x="128" y="510" font-family="${FONT_STACK}" font-size="27" fill="${MUTED}">
    species' Ferguson zone and care targets.
  </text>
</svg>`;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'public', 'og-image.png');

const info = await sharp(Buffer.from(svg)).png().toFile(outputPath);

// A missing font renders as an empty box rather than an error, and a blank
// share card is exactly the bug this script exists to fix. Channel variance
// near zero means nothing but the background was drawn.
const stats = await sharp(outputPath).stats();
const variance = Math.max(...stats.channels.map((channel) => channel.stdev));

console.log(`Wrote ${outputPath} (${info.width}x${info.height}, ${info.size} bytes)`);
if (variance < 5) {
  console.error(`FAILED: image looks blank (max channel stdev ${variance.toFixed(2)}).`);
  console.error('The font stack probably resolved to nothing on this machine.');
  process.exit(1);
}
console.log(`Content check passed (max channel stdev ${variance.toFixed(2)}).`);
