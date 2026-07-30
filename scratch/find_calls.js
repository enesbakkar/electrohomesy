const fs = require('fs');
const c = fs.readFileSync('js/app.js', 'utf8');
const lines = c.split('\n');
const targets = ['renderProducts(', 'fetchProductsFrom', 'allProducts', 'isGoogleSheets'];
for (const t of targets) {
  const found = lines.map((l,i) => l.includes(t) ? (i+1) + ': ' + l.trim() : null).filter(Boolean);
  console.log('=== ' + t + ' ===');
  found.forEach(f => console.log(f));
  console.log('');
}
