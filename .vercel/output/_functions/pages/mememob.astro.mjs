import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CaO2XoRP.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_sQaw-IYp.mjs';
/* empty css                                   */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const prerender = false;
const $$Mememob = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "", "data-astro-cid-ag4qrznx": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", `<div style="display:flex; flex-direction:column; margin:0; padding:0;" data-astro-cid-ag4qrznx> <!-- \u0627\u0644\u0643\u0627\u0646\u0641\u0627\u0633 --> <div style="display:flex; justify-content:center; align-items:center; margin-top: 5px; position:relative;" data-astro-cid-ag4qrznx> <canvas id="memeCanvas" style="max-width:100%; max-height:60vh; touch-action:none;" data-astro-cid-ag4qrznx></canvas> </div> <!-- gallery \u0627\u0644\u0635\u0648\u0631 --> <div id="meme-gallery" style="display:flex; gap:8px; overflow-x:auto; margin-top:8px; border-radius: 8px; scroll-behavior:smooth;" data-astro-cid-ag4qrznx></div> <!-- drawer \u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0623\u0633\u0641\u0644 \u0627\u0644\u0634\u0627\u0634\u0629 --> <div id="drawer" style="
    position:fixed; bottom:0; left:0; right:0;
    background:var(--bg); border-top:2px solid var(--shadow-color);
    max-height:35%; overflow-y:auto; padding:10px;
    display:none; flex-direction:column; gap:10px; border-radius:16px;
  " data-astro-cid-ag4qrznx> <!-- \u0623\u0632\u0631\u0627\u0631 \u0627\u0644\u0641\u0626\u0627\u062A --> <div id="category-buttons" style="margin-bottom:8px;" data-astro-cid-ag4qrznx></div> <div style="display:flex; gap:0.5rem; align-items:center; justify-content: space-between;" data-astro-cid-ag4qrznx> <label data-astro-cid-ag4qrznx><input type="checkbox" id="darkOverlay" data-astro-cid-ag4qrznx> \u063A\u0627\u0645\u0642</label> <label data-astro-cid-ag4qrznx><input type="checkbox" id="blurBackground" data-astro-cid-ag4qrznx> \u0636\u0628\u0627\u0628</label> <label data-astro-cid-ag4qrznx><input type="checkbox" id="shadow-toggle" data-astro-cid-ag4qrznx> \u0638\u0644</label> <div id="canvas-size-buttons" style="display:flex; gap:0.8rem; flex-wrap:wrap; margin-top:0.0rem; padding: 2px;" data-astro-cid-ag4qrznx> <!-- <label style="padding: 2px;">\u{1F4D0} \u0627\u062E\u062A\u0631 \u0645\u0642\u0627\u0633 \u0627\u0644\u0643\u0627\u0646\u0641\u0627\u0633:</label> --> <button type="button" data-size="original" style="font-size:0.7rem; padding:0.2rem 0.4rem;" data-astro-cid-ag4qrznx>\u{1F4F7}</button> <button type="button" data-size="1:1" style="font-size:0.7rem; padding:0.2rem 0.4rem;" data-astro-cid-ag4qrznx>1:1</button> <button type="button" data-size="16:9" style="font-size:0.7rem; padding:0.2rem 0.4rem;" data-astro-cid-ag4qrznx>16:9</button> <!-- <button type="button" data-size="9:16" style="font-size:0.7rem; padding:0.2rem 0.4rem;">9:16</button> --> </div> </div> <label style="display:block; margin-top:0.6rem;" data-astro-cid-ag4qrznx>
\u0625\u062E\u062A\u0631 \u0635\u0648\u0631\u0629 \u0627\u0648 \u0627\u0631\u0641\u0639 \u0635\u0648\u0631\u0629:
<span style="color:red; font-size:12px; margin-top:4px;" data-astro-cid-ag4qrznx>
\u26A0\uFE0F \u0628\u0639\u0636 \u0627\u0644\u0645\u062A\u0635\u0641\u062D\u0627\u062A \u0642\u062F \u0644\u0627 \u062A\u062F\u0639\u0645 \u0631\u0641\u0639 \u0627\u0644\u0635\u0648\u0631. <br data-astro-cid-ag4qrznx>\u0625\u0630\u0627 \u0644\u0645 \u062A\u0639\u0645\u0644\u060C \u062D\u0627\u0648\u0644 \u0645\u062A\u0635\u0641\u062D \u0622\u062E\u0631.</span> <input type="file" id="upload-image" accept="image/*" data-astro-cid-ag4qrznx> </label> <label for="category" style="margin-top:0.6rem;" data-astro-cid-ag4qrznx>\u{1F3AF} \u0627\u062E\u062A\u0631 \u0646\u0648\u0639 \u0627\u0644\u062C\u0645\u0644:</label> <select id="category" style="width:100%; margin-top:0.4rem;" data-astro-cid-ag4qrznx> <option value="any" data-astro-cid-ag4qrznx>\u{1F3B2} \u0639\u0634\u0648\u0627\u0626\u064A \u0645\u0646 \u0623\u064A \u062D\u0627\u062C\u0629</option> </select> <hr style="margin:12px 0;" data-astro-cid-ag4qrznx> <div style="display:flex; gap:0.5rem; align-items:center;" data-astro-cid-ag4qrznx> <button id="add-text" class="btn" style="flex:1;" data-astro-cid-ag4qrznx>\u2795 \u0625\u0636\u0627\u0641\u0629 \u0646\u0635</button> <button id="random-text" class="btn" style="flex:1;" data-astro-cid-ag4qrznx>\u{1F3B2} \u0646\u0635 \u0639\u0634\u0648\u0627\u0626\u064A</button> <button id="random-meme" class="btn" style="flex:1;" data-astro-cid-ag4qrznx>\u{1F3B2} \u0635\u0648\u0631\u0629 \u0639\u0634\u0648\u0627\u0626\u064A\u0629</button> </div> <div id="layers-container" style="margin-top:12px;" data-astro-cid-ag4qrznx></div> <hr style="margin:12px 0;" data-astro-cid-ag4qrznx> <div id="font-buttons" style="display:flex; flex-wrap:nowrap; gap:6px; overflow-x:auto; padding-bottom:5px;" data-astro-cid-ag4qrznx> <button class="font-btn" data-font="Tajawal" style="font-family:Tajawal;" data-astro-cid-ag4qrznx>Tajawal</button> <button class="font-btn" data-font="Amiri" style="font-family:Amiri;" data-astro-cid-ag4qrznx>Amiri</button> <button class="font-btn" data-font="Cairo" style="font-family:Cairo;" data-astro-cid-ag4qrznx>Cairo</button> <button class="font-btn" data-font="Changa" style="font-family:Changa;" data-astro-cid-ag4qrznx>Changa</button> <button class="font-btn" data-font="Reem Kufi" style="font-family:'Reem Kufi';" data-astro-cid-ag4qrznx>Reem</button> <button class="font-btn" data-font="Marhey" style="font-family:'Marhey';" data-astro-cid-ag4qrznx>Marhey</button> <button class="font-btn" data-font="Anton" style="font-family:Anton;" data-astro-cid-ag4qrznx>Anton</button> <button class="font-btn" data-font="Impact" style="font-family:Impact;" data-astro-cid-ag4qrznx>Impact</button> </div> <div style="display:flex; gap:0.6rem;" data-astro-cid-ag4qrznx> <button id="download-btn" class="btn" style="flex:1; background:#2ecc71;" data-astro-cid-ag4qrznx>\u2B07\uFE0F \u062A\u062D\u0645\u064A\u0644</button> <button id="share-btn" class="btn" style="flex:1; background:#9b59b6;" data-astro-cid-ag4qrznx>\u{1F517} \u0645\u0634\u0627\u0631\u0643\u0629</button> </div> <br data-astro-cid-ag4qrznx><br data-astro-cid-ag4qrznx><br data-astro-cid-ag4qrznx> </div> <!-- \u0632\u0631 \u0641\u062A\u062D drawer --> <button id="open-drawer" style="
    position:fixed; bottom:50px; left:50%; transform:translateX(-50%);
    padding:10px 20px; border-radius:25px; background:var(--bg); color:va(--accent); font-size:1.1rem;
  " data-astro-cid-ag4qrznx>\u2699\uFE0F \u0623\u062F\u0648\u0627\u062A</button> </div> <script type="module" src="/js/meme.js"><\/script> <script type="module" src="/js/drawer.js"><\/script>  `])), maybeRenderHead()) })}`;
}, "/Users/khaledarafa/lolme/src/pages/mememob.astro", void 0);

const $$file = "/Users/khaledarafa/lolme/src/pages/mememob.astro";
const $$url = "/mememob";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Mememob,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
