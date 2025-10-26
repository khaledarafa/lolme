import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_C5xJaZc5.mjs';
import { manifest } from './manifest_DFbFIK70.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/api/pdf-process.astro.mjs');
const _page3 = () => import('./pages/articles/geel-kamel.astro.mjs');
const _page4 = () => import('./pages/articles/النكت:-العلاج-الطبيعي-للروح.astro.mjs');
const _page5 = () => import('./pages/articles/تاريخ-الميمز-وانتشارها.astro.mjs');
const _page6 = () => import('./pages/articles/ثقافة-الميمز.astro.mjs');
const _page7 = () => import('./pages/articles/ليه-الميمز-بتخلي-يومك-أحسن؟.astro.mjs');
const _page8 = () => import('./pages/articles.astro.mjs');
const _page9 = () => import('./pages/funnyimages.astro.mjs');
const _page10 = () => import('./pages/images-to-pdf.astro.mjs');
const _page11 = () => import('./pages/jokes.astro.mjs');
const _page12 = () => import('./pages/meme.astro.mjs');
const _page13 = () => import('./pages/mememob.astro.mjs');
const _page14 = () => import('./pages/pdf-to-images.astro.mjs');
const _page15 = () => import('./pages/privacy.astro.mjs');
const _page16 = () => import('./pages/roast.astro.mjs');
const _page17 = () => import('./pages/terms.astro.mjs');
const _page18 = () => import('./pages/tests/how-lazy-are-you.astro.mjs');
const _page19 = () => import('./pages/tests/if-you-were-drink.astro.mjs');
const _page20 = () => import('./pages/tests/if-you-were-food.astro.mjs');
const _page21 = () => import('./pages/tests/positive-or-negative-energy.astro.mjs');
const _page22 = () => import('./pages/tests/what-car-model-are-you.astro.mjs');
const _page23 = () => import('./pages/tests/what-kind-of-animal.astro.mjs');
const _page24 = () => import('./pages/tests/which-cartoon-character.astro.mjs');
const _page25 = () => import('./pages/tests/which-planet-are-you.astro.mjs');
const _page26 = () => import('./pages/tests.astro.mjs');
const _page27 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/about.astro", _page1],
    ["src/pages/api/pdf-process.js", _page2],
    ["src/pages/articles/geel-kamel.astro", _page3],
    ["src/pages/articles/النكت:-العلاج-الطبيعي-للروح.astro", _page4],
    ["src/pages/articles/تاريخ-الميمز-وانتشارها.astro", _page5],
    ["src/pages/articles/ثقافة-الميمز.astro", _page6],
    ["src/pages/articles/ليه-الميمز-بتخلي-يومك-أحسن؟.astro", _page7],
    ["src/pages/articles/index.astro", _page8],
    ["src/pages/funnyImages.astro", _page9],
    ["src/pages/images-to-pdf.astro", _page10],
    ["src/pages/jokes.astro", _page11],
    ["src/pages/meme.astro", _page12],
    ["src/pages/mememob.astro", _page13],
    ["src/pages/pdf-to-images.astro", _page14],
    ["src/pages/privacy.astro", _page15],
    ["src/pages/roast.astro", _page16],
    ["src/pages/terms.astro", _page17],
    ["src/pages/tests/how-lazy-are-you.astro", _page18],
    ["src/pages/tests/if-you-were-drink.astro", _page19],
    ["src/pages/tests/if-you-were-food.astro", _page20],
    ["src/pages/tests/positive-or-negative-energy.astro", _page21],
    ["src/pages/tests/what-car-model-are-you.astro", _page22],
    ["src/pages/tests/what-kind-of-animal.astro", _page23],
    ["src/pages/tests/which-cartoon-character.astro", _page24],
    ["src/pages/tests/which-planet-are-you.astro", _page25],
    ["src/pages/tests/index.astro", _page26],
    ["src/pages/index.astro", _page27]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "e27b6626-8247-4894-a32b-d64dc78b5fcc",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
