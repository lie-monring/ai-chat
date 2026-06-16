const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
let html = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');

html = html.replace(/<!-- @include (.+?) -->/g, (match, file) => {
  const filePath = path.join(srcDir, file.trim());
  if (!fs.existsSync(filePath)) {
    console.error('ERROR: file not found: ' + filePath);
    process.exit(1);
  }
  return fs.readFileSync(filePath, 'utf8');
});

const outPath = path.join(__dirname, 'yuki-chat.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('Built: ' + outPath + ' (' + (html.length / 1024).toFixed(0) + ' KB)');
