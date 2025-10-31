// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://lolme.cc',
  output: 'static',
  adapter: vercel({}),
});


// https://astro.build/config
// export default defineConfig({});
// import mdx from '@astrojs/mdx';
// import sitemap from '@astrojs/sitemap';
// import vercel from '@astrojs/vercel';

// export default defineConfig({
//   site: 'https://lolme.cc',
//   output: 'server',
//   adapter: vercel({}),
//   integrations: [mdx(), sitemap()],
// });
