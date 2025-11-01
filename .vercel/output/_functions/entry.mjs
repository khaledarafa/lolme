import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_Cr0WHkB2.mjs';
import { manifest } from './manifest_DQ42cs8t.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/about.astro.mjs');
const _page3 = () => import('./pages/api/comments.astro.mjs');
const _page4 = () => import('./pages/api/delete-comments.astro.mjs');
const _page5 = () => import('./pages/articles/ai-jokes-2025.astro.mjs');
const _page6 = () => import('./pages/articles/ai-social-media-funny.astro.mjs');
const _page7 = () => import('./pages/articles/funny-celebs-ai.astro.mjs');
const _page8 = () => import('./pages/articles/geel-kamel.astro.mjs');
const _page9 = () => import('./pages/articles/tiktok-crazy-ideas.astro.mjs');
const _page10 = () => import('./pages/articles/tiktok-funny-money.astro.mjs');
const _page11 = () => import('./pages/articles/النكت:-العلاج-الطبيعي-للروح.astro.mjs');
const _page12 = () => import('./pages/articles/تاريخ-الميمز-وانتشارها.astro.mjs');
const _page13 = () => import('./pages/articles/ثقافة-الميمز.astro.mjs');
const _page14 = () => import('./pages/articles/ليه-الميمز-بتخلي-يومك-أحسن؟.astro.mjs');
const _page15 = () => import('./pages/articles.astro.mjs');
const _page16 = () => import('./pages/funnyimages.astro.mjs');
const _page17 = () => import('./pages/images-to-pdf.astro.mjs');
const _page18 = () => import('./pages/jokes.astro.mjs');
const _page19 = () => import('./pages/meme.astro.mjs');
const _page20 = () => import('./pages/mememob.astro.mjs');
const _page21 = () => import('./pages/pdf-to-images.astro.mjs');
const _page22 = () => import('./pages/privacy.astro.mjs');
const _page23 = () => import('./pages/roast.astro.mjs');
const _page24 = () => import('./pages/terms.astro.mjs');
const _page25 = () => import('./pages/tests/how-lazy-are-you.astro.mjs');
const _page26 = () => import('./pages/tests/if-you-were-drink.astro.mjs');
const _page27 = () => import('./pages/tests/if-you-were-food.astro.mjs');
const _page28 = () => import('./pages/tests/if-your-life-was-a-movie.astro.mjs');
const _page29 = () => import('./pages/tests/positive-or-negative-energy.astro.mjs');
const _page30 = () => import('./pages/tests/what-car-model-are-you.astro.mjs');
const _page31 = () => import('./pages/tests/what-kind-of-animal.astro.mjs');
const _page32 = () => import('./pages/tests/which-cartoon-character.astro.mjs');
const _page33 = () => import('./pages/tests/which-influencer-are-you.astro.mjs');
const _page34 = () => import('./pages/tests/which-planet-are-you.astro.mjs');
const _page35 = () => import('./pages/tests.astro.mjs');
const _page36 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/about.astro", _page2],
    ["src/pages/api/comments.ts", _page3],
    ["src/pages/api/delete-comments.ts", _page4],
    ["src/pages/articles/ai-jokes-2025.astro", _page5],
    ["src/pages/articles/ai-social-media-funny.astro", _page6],
    ["src/pages/articles/funny-celebs-ai.astro", _page7],
    ["src/pages/articles/geel-kamel.astro", _page8],
    ["src/pages/articles/tiktok-crazy-ideas.astro", _page9],
    ["src/pages/articles/tiktok-funny-money.astro", _page10],
    ["src/pages/articles/النكت:-العلاج-الطبيعي-للروح.astro", _page11],
    ["src/pages/articles/تاريخ-الميمز-وانتشارها.astro", _page12],
    ["src/pages/articles/ثقافة-الميمز.astro", _page13],
    ["src/pages/articles/ليه-الميمز-بتخلي-يومك-أحسن؟.astro", _page14],
    ["src/pages/articles/index.astro", _page15],
    ["src/pages/funnyImages.astro", _page16],
    ["src/pages/images-to-pdf.astro", _page17],
    ["src/pages/jokes.astro", _page18],
    ["src/pages/meme.astro", _page19],
    ["src/pages/mememob.astro", _page20],
    ["src/pages/pdf-to-images.astro", _page21],
    ["src/pages/privacy.astro", _page22],
    ["src/pages/roast.astro", _page23],
    ["src/pages/terms.astro", _page24],
    ["src/pages/tests/how-lazy-are-you.astro", _page25],
    ["src/pages/tests/if-you-were-drink.astro", _page26],
    ["src/pages/tests/if-you-were-food.astro", _page27],
    ["src/pages/tests/if-your-life-was-a-movie.astro", _page28],
    ["src/pages/tests/positive-or-negative-energy.astro", _page29],
    ["src/pages/tests/what-car-model-are-you.astro", _page30],
    ["src/pages/tests/what-kind-of-animal.astro", _page31],
    ["src/pages/tests/which-cartoon-character.astro", _page32],
    ["src/pages/tests/which-influencer-are-you.astro", _page33],
    ["src/pages/tests/which-planet-are-you.astro", _page34],
    ["src/pages/tests/index.astro", _page35],
    ["src/pages/index.astro", _page36]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "09603b5d-54ce-4a46-b717-45ddf0f12cd6",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
