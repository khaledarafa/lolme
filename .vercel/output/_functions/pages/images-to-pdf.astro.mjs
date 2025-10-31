import { e as createComponent, k as renderComponent, r as renderTemplate, n as renderScript, m as maybeRenderHead } from '../chunks/astro/server_tVLEeqaO.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CDAhgi8t.mjs';
/* empty css                                         */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const prerender = false;
const $$ImagesToPdf = createComponent(($$result, $$props, $$slots) => {
  const pageTitle = "\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0635\u0648\u0631 \u0625\u0644\u0649 PDF";
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": pageTitle, "data-astro-cid-z5du4vdf": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<section class="tool" data-astro-cid-z5du4vdf> <h1 data-astro-cid-z5du4vdf>\u{1F4F8} \u062D\u0648\u0644 \u0635\u0648\u0631\u0643 \u0625\u0644\u0649 PDF</h1> <input type="file" id="imageInput" accept="image/*" multiple data-astro-cid-z5du4vdf> <div class="options" data-astro-cid-z5du4vdf> <label data-astro-cid-z5du4vdf>\u{1F4CF} \u062D\u062C\u0645 \u0627\u0644\u0635\u0648\u0631\u0629:\n<select id="imgSize" data-astro-cid-z5du4vdf> <option value="small" data-astro-cid-z5du4vdf>\u0635\u063A\u064A\u0631</option> <option value="medium" selected data-astro-cid-z5du4vdf>\u0645\u062A\u0648\u0633\u0637</option> <option value="large" data-astro-cid-z5du4vdf>\u0643\u0628\u064A\u0631</option> </select> </label> <label data-astro-cid-z5du4vdf>\u{1F4C4} \u0627\u0644\u0627\u062A\u062C\u0627\u0647:\n<select id="orientation" data-astro-cid-z5du4vdf> <option value="p" selected data-astro-cid-z5du4vdf>\u0637\u0648\u0644\u064A</option> <option value="l" data-astro-cid-z5du4vdf>\u0639\u0631\u0636\u064A</option> </select> </label> </div> <div id="previewContainer" class="preview-container" data-astro-cid-z5du4vdf></div> <button id="convertBtn" data-astro-cid-z5du4vdf>\u062A\u062D\u0648\u064A\u0644 \u0625\u0644\u0649 PDF</button> </section>  ', '  <script type="module" src="/js/images-to-pdf.js"><\/script>  '])), maybeRenderHead(), renderScript($$result2, "/Users/khaledarafa/lolme/src/pages/images-to-pdf.astro?astro&type=script&index=0&lang.ts")) })}`;
}, "/Users/khaledarafa/lolme/src/pages/images-to-pdf.astro", void 0);

const $$file = "/Users/khaledarafa/lolme/src/pages/images-to-pdf.astro";
const $$url = "/images-to-pdf";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$ImagesToPdf,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
