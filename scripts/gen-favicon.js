'use strict';
const sharp  = require('sharp');
const toIco  = require('to-ico');
const fs     = require('fs');
const path   = require('path');

// Logo SVG sans fond — traits couleur brand sur transparent
const svg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Cercle principal -->
  <circle cx="256" cy="256" r="160" stroke="#2f46ff" stroke-width="36" fill="none"/>
  <!-- Point central cyan -->
  <circle cx="256" cy="256" r="56" fill="#8af7f0"/>
  <!-- Branches cardinales -->
  <path d="M256 40v80M256 392v80M40 256h80M392 256h80"
        stroke="#2f46ff" stroke-width="28" stroke-linecap="round" opacity="0.65"/>
</svg>`;

const sizes = [16, 32, 48, 64, 128, 256];

async function main() {
    const pngBuffers = await Promise.all(
        sizes.map(size =>
            sharp(Buffer.from(svg))
                .resize(size, size)
                .png()
                .toBuffer()
        )
    );

    // Génère le .ico avec toutes les tailles
    const ico = await toIco(pngBuffers);
    fs.writeFileSync(path.join(__dirname, '..', 'favicon.ico'), ico);
    console.log('favicon.ico généré avec', sizes.join(', '), 'px');

    // PNG standalone pour apple-touch-icon et og:image
    await sharp(Buffer.from(svg)).resize(192, 192).png()
        .toFile(path.join(__dirname, '..', 'images', 'favicon-192x192.png'));
    await sharp(Buffer.from(svg)).resize(32, 32).png()
        .toFile(path.join(__dirname, '..', 'images', 'favicon-32x32.png'));
    await sharp(Buffer.from(svg)).resize(512, 512).png()
        .toFile(path.join(__dirname, '..', 'images', 'logo-512.png'));

    console.log('PNG exports done.');
}

main().catch(console.error);
