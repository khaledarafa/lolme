// scripts/generate-sitemap.js
import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream, statSync } from 'fs';
import path from 'path';
import { glob } from 'glob';

const siteUrl = 'https://lolme.cc'; // رابط موقعك

(async () => {
  const sitemap = new SitemapStream({ hostname: siteUrl });
  const writeStream = createWriteStream(path.resolve('dist/sitemap.xml'));
  sitemap.pipe(writeStream);

  const files = await glob('dist/**/*.html');

  for (const file of files) {
    let url = file
      .replace(/^dist/, '')
      .replace(/index\.html$/, '')
      .replace(/\.html$/, '');
    if (!url.startsWith('/')) url = '/' + url;
    if (url === '') url = '/';

    const lastmod = statSync(file).mtime.toISOString();

    console.log('🌀 Added to sitemap:', url);

    sitemap.write({
      url,
      lastmod,
      changefreq: 'weekly',
      priority: url === '/' ? 1.0 : 0.7
    });
  }

  sitemap.end();
  await streamToPromise(sitemap); // ✅ هنا التعديل المهم

  console.log('✅ sitemap.xml created successfully!');
})();
