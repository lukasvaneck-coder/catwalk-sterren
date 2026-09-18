// Maakt dist/artifact.html: dezelfde pagina zonder <html>/<head>/<body>-omhulsel,
// zodat hij als Claude-artifact gepubliceerd kan worden. Lokaal open je gewoon index.html.
const fs = require('fs');
const path = require('path');
const root = __dirname;
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html
  .replace(/<!doctype html>\s*/i, '')
  .replace(/<\/?html[^>]*>\s*/gi, '')
  .replace(/<\/?head>\s*/gi, '')
  .replace(/<\/?body[^>]*>\s*/gi, '')
  .replace(/<meta[^>]*>\s*/gi, '')
  .trim();
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'artifact.html'), html + '\n');
console.log('dist/artifact.html geschreven (' + html.length + ' tekens)');
