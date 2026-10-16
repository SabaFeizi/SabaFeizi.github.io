// Generates neutral placeholder images (avatar, certificates, blog covers) into
// src/assets/uploads. Shapes only — no text — so rendering needs no system fonts.
// Usage: npm run placeholders
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("src/assets/uploads");
await mkdir(OUT, { recursive: true });

const render = (svg, file) =>
  sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(OUT, file));

// Avatar: soft gradient with a generic person silhouette.
await render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4a4a52"/><stop offset="1" stop-color="#2b2b30"/></linearGradient></defs>
    <rect width="400" height="400" fill="url(#g)"/>
    <circle cx="200" cy="160" r="72" fill="#c9a0e2" opacity="0.9"/>
    <path d="M70 400c10-90 66-140 130-140s120 50 130 140z" fill="#c9a0e2" opacity="0.9"/>
  </svg>`,
  "avatar.png",
);

// Certificates: framed "document" with seal and text bars.
const cert = (accent, seal) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850">
  <rect width="1200" height="850" fill="#f4f1ea"/>
  <rect x="40" y="40" width="1120" height="770" fill="none" stroke="${accent}" stroke-width="10"/>
  <rect x="70" y="70" width="1060" height="710" fill="none" stroke="${accent}" stroke-width="2"/>
  <rect x="350" y="170" width="500" height="34" rx="6" fill="#3a3a40"/>
  <rect x="430" y="240" width="340" height="18" rx="6" fill="#8a8a92"/>
  <rect x="300" y="330" width="600" height="46" rx="8" fill="${accent}"/>
  <rect x="380" y="420" width="440" height="16" rx="6" fill="#8a8a92"/>
  <rect x="410" y="455" width="380" height="16" rx="6" fill="#8a8a92"/>
  <rect x="200" y="640" width="240" height="4" fill="#3a3a40"/>
  <rect x="760" y="640" width="240" height="4" fill="#3a3a40"/>
  <circle cx="600" cy="640" r="70" fill="${seal}"/>
  <circle cx="600" cy="640" r="52" fill="none" stroke="#f4f1ea" stroke-width="4"/>
</svg>`;
await render(cert("#b8913a", "#c9a0e2"), "certificate-1.png");
await render(cert("#3b6e8f", "#ffd66b"), "certificate-2.png");
await render(cert("#7a4f9a", "#9fccd0"), "certificate-3.png");
await render(cert("#4f7a5a", "#ffb86b"), "certificate-4.png");

// Blog covers: abstract compositions.
await render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
    <rect width="1200" height="700" fill="#e3eef0"/>
    <g stroke="#3a3a40" stroke-width="5" fill="none">
      <line x1="230" y1="250" x2="560" y2="380"/><line x1="560" y1="380" x2="850" y2="230"/>
      <line x1="560" y1="380" x2="760" y2="560"/><line x1="230" y1="250" x2="380" y2="560" stroke-dasharray="18 14"/>
    </g>
    <circle cx="230" cy="250" r="60" fill="#c49a6c"/><circle cx="560" cy="380" r="70" fill="#6cb4e4"/>
    <circle cx="850" cy="230" r="80" fill="#e06a5c"/><circle cx="760" cy="560" r="55" fill="#8a5aa8"/>
    <circle cx="380" cy="560" r="55" fill="#6cbf6a"/>
  </svg>`,
  "blog-1.png",
);
await render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
    <rect width="1200" height="700" fill="#2f3a44"/>
    <circle cx="900" cy="200" r="90" fill="#ffd66b"/>
    <path d="M0 520 L260 330 L460 470 L700 280 L1200 560 L1200 700 L0 700z" fill="#5d7a8a"/>
    <path d="M0 600 L320 470 L620 590 L900 450 L1200 620 L1200 700 L0 700z" fill="#9fccd0"/>
  </svg>`,
  "blog-2.png",
);
await render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
    <rect width="1200" height="700" fill="#f1e9f6"/>
    <path d="M80 600 C 300 600, 300 360, 560 360 S 820 120, 1120 120" stroke="#7a4f9a" stroke-width="14" fill="none" stroke-linecap="round" stroke-dasharray="2 34"/>
    <circle cx="80" cy="600" r="34" fill="#9fccd0"/><circle cx="560" cy="360" r="34" fill="#ffd66b"/>
    <circle cx="1120" cy="120" r="34" fill="#e06a5c"/>
  </svg>`,
  "blog-3.png",
);

// Favicon: rounded yellow square on dark, matching the site accent.
await sharp(
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill="#1e1e1f"/>
    <rect x="14" y="14" width="36" height="36" rx="9" fill="#ffd66b"/>
  </svg>`),
)
  .png()
  .toFile(path.resolve("src/assets/favicon.png"));

console.log("Placeholder images written to", OUT);
