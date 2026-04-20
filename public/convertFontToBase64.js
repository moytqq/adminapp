const fs = require('fs');
const path = require('path');

const fontPath = path.join(__dirname, '../public/fonts/inter.ttf');
const fontData = fs.readFileSync(fontPath);
const base64 = fontData.toString('base64');

console.log('Font base64 (первые 100 символов):', base64.substring(0, 100));
console.log('Full length:', base64.length);

fs.writeFileSync(path.join(__dirname, '../public/fonts/inter-base64.txt'), base64);
console.log('Base64 saved to inter-base64.txt');