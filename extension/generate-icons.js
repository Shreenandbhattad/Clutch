// Run with: node generate-icons.js
// Generates PNG icons using Canvas API (Node.js >= 18 with --experimental-vm-modules or use browser)
// If you don't have canvas, use the SVG icons directly via manifest (Chrome supports SVG icons)

const fs = require("fs");
const path = require("path");

// Minimal PNG generator using raw binary
// Creates a solid green square with "C" letter
// This is a placeholder - for production use proper image tools

function createSVGIcon(size) {
  const fontSize = Math.round(size * 0.55);
  const radius = Math.round(size * 0.22);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#16A34A"/>
  <text x="${size/2}" y="${size * 0.68}" font-size="${fontSize}" font-weight="900" text-anchor="middle" fill="white" font-family="system-ui, sans-serif">C</text>
</svg>`;
}

const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, "icons");

sizes.forEach(size => {
  const svg = createSVGIcon(size);
  // Save as SVG (Chrome extensions support SVG icons in Manifest V3)
  fs.writeFileSync(path.join(iconsDir, `icon${size}.svg`), svg);
  console.log(`Created icon${size}.svg`);
});

console.log("\nIcons created as SVG. Chrome MV3 accepts SVG icons.");
console.log("Update manifest.json to use .svg extensions if needed.");
