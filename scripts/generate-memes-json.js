import fs from 'fs';
import path from 'path';

const memesDir = path.resolve('./public/memes');
const outputFile = path.resolve('./public/memes.json');

const categories = fs.readdirSync(memesDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

const data = {};

categories.forEach(cat => {
  const catDir = path.join(memesDir, cat);
  const files = fs.readdirSync(catDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  data[cat] = files.map(f => `/memes/${cat}/${f}`);
});

fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
console.log('✅ memes.json generated successfully!');
