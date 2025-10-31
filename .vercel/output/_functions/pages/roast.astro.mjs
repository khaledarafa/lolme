import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_tVLEeqaO.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CDAhgi8t.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const prerender = false;
const $$Roast = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "" }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<main class="roast-container"> <header> <h1>\u0631\u0648\u0633\u062A \u0623\u0635\u062D\u0627\u0628\u0643 \u{1F92A}</h1> <p class="roast-lead">\u0623\u062F\u062E\u0644 \u0627\u0633\u0645 \u0635\u0627\u062D\u0628\u0643 \u0648\u0627\u062E\u062A\u0627\u0631 \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0647\u0632\u0627\u0631. \u062E\u0644\u064A\u0647\u0627 \u0645\u0631\u062D\u0629 \u0648\u0645\u0627 \u062A\u062E\u0634 \u0641\u064A \u0627\u0644\u0625\u0647\u0627\u0646\u0629 \u0627\u0644\u0634\u062E\u0635\u064A\u0629.</p> </header> <section class="roast-controls"> <label for="name">\u0627\u0633\u0645 \u0635\u0627\u062D\u0628\u0643</label> <input id="name" placeholder="\u0627\u0643\u062A\u0628 \u0627\u0633\u0645 \u0635\u0627\u062D\u064E\u0628\u0643 \u0647\u0646\u0627 (\u0645\u062B\u0627\u0644: \u0645\u062D\u0645\u062F)"> <label for="tone">\u0627\u0644\u0645\u0633\u062A\u0648\u0649</label> <select id="tone"> <option value="gentle">\u0644\u0637\u064A\u0641</option> <option value="roast">\u0631\u0648\u0633\u062A \u0639\u0627\u062F\u064A</option> <option value="hard">\u062C\u0627\u0645\u062F (\u0627\u0646\u062A \u0645\u0633\u0626\u0648\u0644)</option> </select> <div class="roast-buttons"> <button id="generate">\u0637\u0644\u0639 \u0631\u0648\u0633\u062A \u062C\u062F\u064A\u062F</button> <button id="copy">\u0627\u0646\u0633\u062E</button> <button id="share">\u0634\u0627\u0631\u0643</button> </div> </section> <section class="roast-result"> <div id="roastBox" class="roastBox">\u0627\u0636\u063A\u0637 "\u0637\u0644\u0639 \u0631\u0648\u0633\u062A \u062C\u062F\u064A\u062F" \u{1F602}</div> <small id="warn" class="roast-warn"></small> </section> <br><br> </main> <script type="module" src="/js/roast.js"><\/script>  '])), maybeRenderHead()) })}`;
}, "/Users/khaledarafa/lolme/src/pages/roast.astro", void 0);

const $$file = "/Users/khaledarafa/lolme/src/pages/roast.astro";
const $$url = "/roast";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Roast,
    file: $$file,
    prerender,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
