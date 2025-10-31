import { e as createComponent, k as renderComponent, r as renderTemplate, h as addAttribute, m as maybeRenderHead } from '../chunks/astro/server_tVLEeqaO.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CDAhgi8t.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const prerender = false;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const homeButtons = [
    {
      title: "\u{1F4F8} \u0627\u0639\u0645\u0644 \u0645\u064A\u0645\u064A\u0632 \u062F\u0644\u0648\u0642\u062A\u064A",
      slug: "/meme",
      img: "/images/meme.webp"
    },
    {
      title: "\u{1F52E} \u0625\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0645\u0636\u062D\u0643\u0629",
      slug: "/tests",
      img: "/images/tests.webp"
    },
    {
      title: "\u{1F525} \u0631\u0648\u0651\u0633\u062A \u0635\u0627\u062D\u0628\u0643",
      slug: "/roast",
      img: "/images/roast.webp"
    },
    {
      title: "\u{1F923} \u0646\u0643\u062A \u0645\u0636\u062D\u0643\u0629",
      slug: "/jokes",
      img: "/images/jokes.webp"
    },
    {
      title: "\u{1F923} \u0635\u0648\u0631 \u0645\u0636\u062D\u0643\u0629",
      slug: "/funnyImages",
      img: "/images/funny.webp"
    },
    {
      title: "\u062D\u0648\u0651\u0644 PDF \u0625\u0644\u0649 \u0635\u0648\u0631 \u{1F92F}",
      slug: "/pdf-to-images",
      img: "/images/pdf2imgs.webp"
    }
  ];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "\u{1F923} LOLME", "data-astro-cid-j7pv25f6": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<section style="text-align:center; padding: 0px 0.1rem ;" data-astro-cid-j7pv25f6> <!-- <h1>\u{1F923} LOLME</h1> --> <p style="margin: 0px;" data-astro-cid-j7pv25f6> \u0623\u062F\u0648\u0627\u062A \u062A\u0631\u0641\u064A\u0647\u064A\u0629 \u0647\u0627\u064A\u0641\u0629 \u0648\u0645\u062C\u0646\u0648\u0646\u0629 \u{1F57A}\u{1F525}</p> <p data-astro-cid-j7pv25f6> LOLME \u0647\u0648 \u0645\u0643\u0627\u0646\u0643 \u0644\u0644\u0636\u062D\u0643 \u0648\u0627\u0644\u0647\u0632\u0627\u0631! \u0627\u0631\u0641\u0639 \u0635\u0648\u0631\u0629\u060C \u0627\u0643\u062A\u0628 \u0645\u064A\u0645\u0632\u060C \u0648\u0631\u0648\u0651\u0633\u062A \u0623\u0635\u062D\u0627\u0628\u0643 \u0628\u0637\u0631\u064A\u0642\u0629 \u0645\u0631\u062D\u0629 \u{1F60E} </p> <button id="install-btn" class="appbtn" style="background:#f39c12;" data-astro-cid-j7pv25f6>\u2B07\uFE0F \u062D\u0645\u0651\u0644 LOLME \u0643\u062A\u0637\u0628\u064A\u0642</button> </section> <div class="imojidiv" data-astro-cid-j7pv25f6> <div class="emoji" style=" font-size:2rem;" data-astro-cid-j7pv25f6>\u{1F923}</div> <div class="emoji" style="left:20%;" data-astro-cid-j7pv25f6>\u{1F923}</div> <div class="emoji" style="left:35%;" data-astro-cid-j7pv25f6>\u{1F602}</div> <div class="emoji" style="left:50%;" data-astro-cid-j7pv25f6>\u{1F60E}</div> <div class="emoji" style="left:65%;" data-astro-cid-j7pv25f6>\u{1F973}</div> <div class="emoji" style="left:80%;" data-astro-cid-j7pv25f6>\u{1F92A}</div> <div class="emoji" style=" font-size:2rem;" data-astro-cid-j7pv25f6>\u{1F973}</div> </div> <main class="home-grid" data-astro-cid-j7pv25f6> ', ' </main>  <script type="module" src="/js/install-btn.js"><\/script> <script type="module" src="/js/open-meme.js"><\/script> '])), maybeRenderHead(), homeButtons.map((btn) => renderTemplate`<a${addAttribute(btn.slug, "href")} class="home-card" data-astro-cid-j7pv25f6> <img${addAttribute(btn.img, "src")}${addAttribute(btn.title, "alt")} loading="lazy" data-astro-cid-j7pv25f6> <div class="content" data-astro-cid-j7pv25f6> <h3 data-astro-cid-j7pv25f6>${btn.title}</h3> </div> </a>`)) })} `;
}, "/Users/khaledarafa/lolme/src/pages/index.astro", void 0);

const $$file = "/Users/khaledarafa/lolme/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
