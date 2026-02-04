// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
  site: "https://lolme.cc",
  output: "server",
  adapter: vercel({}),

  // ⭐ تحسين الأداء — منع CSS chunks الصغيرة
  build: {
    inlineStylesheets: "never", // دمج CSS بدل chunking
  },
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
