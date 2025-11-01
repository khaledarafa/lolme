import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_CaO2XoRP.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_sQaw-IYp.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const prerender = false;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const title = "\u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062A";
  const description = "\u0623\u062D\u062F\u062B \u0645\u0642\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u064A\u0645\u0632 \u0648\u0627\u0644\u062A\u0631\u0641\u064A\u0647";
  const articles = [
    {
      title: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0645\u064A\u0645\u0632 \u0648\u0627\u0646\u062A\u0634\u0627\u0631\u0647\u0627",
      slug: "/articles/\u062A\u0627\u0631\u064A\u062E-\u0627\u0644\u0645\u064A\u0645\u0632-\u0648\u0627\u0646\u062A\u0634\u0627\u0631\u0647\u0627",
      img: "/images/meme-origin.webp"
    },
    {
      title: "\u062B\u0642\u0627\u0641\u0629 \u0627\u0644\u0645\u064A\u0645\u0632: \u0644\u064A\u0647 \u0628\u0642\u062A \u0644\u063A\u0629 \u0627\u0644\u0639\u0627\u0644\u0645 \u0627\u0644\u062C\u062F\u064A\u062F\u061F",
      slug: "/articles/\u062B\u0642\u0627\u0641\u0629-\u0627\u0644\u0645\u064A\u0645\u0632",
      img: "/images/1.webp"
    },
    {
      title: "\u0644\u064A\u0647 \u0627\u0644\u0645\u064A\u0645\u0632 \u0628\u062A\u062E\u0644\u064A \u064A\u0648\u0645\u0643 \u0623\u062D\u0633\u0646\u061F",
      slug: "/articles/\u0644\u064A\u0647-\u0627\u0644\u0645\u064A\u0645\u0632-\u0628\u062A\u062E\u0644\u064A-\u064A\u0648\u0645\u0643-\u0623\u062D\u0633\u0646\u061F",
      img: "/images/6.webp"
    },
    {
      title: "\u0627\u0644\u0645\u064A\u0645\u0632: \u0627\u0644\u0645\u0631\u0622\u0629 \u0627\u0644\u0644\u064A \u0628\u062A\u0639\u0643\u0633 \u062C\u064A\u0644 \u0643\u0627\u0645\u0644 \u{1F602}",
      slug: "/articles/geel-kamel",
      img: "/images/12.webp"
    },
    {
      title: "\u0627\u0644\u0646\u0643\u062A: \u0627\u0644\u0639\u0644\u0627\u062C \u0627\u0644\u0637\u0628\u064A\u0639\u064A \u0644\u0644\u0631\u0648\u062D \u{1F604}",
      slug: "/articles/\u0627\u0644\u0646\u0643\u062A:-\u0627\u0644\u0639\u0644\u0627\u062C-\u0627\u0644\u0637\u0628\u064A\u0639\u064A-\u0644\u0644\u0631\u0648\u062D",
      img: "/images/21.webp"
    },
    {
      title: "\u0623\u063A\u0631\u0628 \u0637\u0631\u0642 \u0627\u0644\u0646\u0627\u0633 \u0644\u0643\u0633\u0628 \u0627\u0644\u0641\u0644\u0648\u0633 \u0645\u0646 \u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A (\u0627\u0644\u0637\u0631\u064A\u0642\u0629 \u0631\u0642\u0645 3 \u0647\u062A\u0636\u062D\u0643\u0643 \u{1F602})",
      slug: "/articles/tiktok-funny-money",
      img: "/images/tiktok-funny-money.webp"
    },
    {
      title: "\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u062F\u062E\u0644 \u0627\u0644\u0633\u0648\u0634\u064A\u0627\u0644 \u0645\u064A\u062F\u064A\u0627... \u0648\u0628\u062F\u0623 \u064A\u0642\u0644\u062F\u0646\u0627 \u{1F602}",
      slug: "/articles/ai-social-media-funny",
      img: "/images/ai-social-media-funny.webp"
    },
    {
      title: "\u0623\u0641\u0643\u0627\u0631 \u0645\u062D\u062A\u0648\u0649 \u0645\u062C\u0646\u0648\u0646\u0629 \u0644\u0644\u062A\u064A\u0643 \u062A\u0648\u0643 \u0647\u062A\u062E\u0644\u064A\u0643 \u062A\u0631\u064A\u0646\u062F \u0648\u0627\u0646\u062A \u0646\u0627\u064A\u0645 \u{1F60E}",
      slug: "/articles/tiktok-crazy-ideas",
      img: "/images/tiktok-crazy-ideas.webp"
    },
    {
      title: "\u0627\u0644\u0645\u0634\u0627\u0647\u064A\u0631 \u0627\u0644\u0644\u064A \u0642\u0644\u0628\u0648\u0627 \u0627\u0644\u0633\u0648\u0634\u064A\u0627\u0644 \u0645\u064A\u062F\u064A\u0627 \u0645\u064A\u0645\u0632 \u0628\u062F\u0648\u0646 \u0642\u0635\u062F \u{1F602}",
      slug: "/articles/funny-celebs-ai",
      img: "/images/funny-celebs-ai.webp"
    },
    {
      title: "\u0646\u0643\u062A 2025: \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0628\u064A\u0647\u0632\u0631 \u0647\u0648 \u0643\u0645\u0627\u0646 \u{1F916}\u{1F602}",
      slug: "/articles/ai-jokes-2025",
      img: "/images/ai-jokes-2025.webp"
    }
  ];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": title, "description": description, "data-astro-cid-h5q2y2v6": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section style="text-align:center; padding: 20px;" data-astro-cid-h5q2y2v6> <h1 data-astro-cid-h5q2y2v6>📰 أحدث مقالات LOLME</h1> <p data-astro-cid-h5q2y2v6>اضحك وتعلم عن عالم الميمز والضحك بطريقة خفيفة ومجنونة 😎</p> </section> <main class="articles-grid" data-astro-cid-h5q2y2v6> ${articles.map((article) => renderTemplate`<a${addAttribute(article.slug, "href")} class="article-card" data-astro-cid-h5q2y2v6> <img${addAttribute(article.img, "src")}${addAttribute(article.title, "alt")} loading="lazy" data-astro-cid-h5q2y2v6> <div class="content" data-astro-cid-h5q2y2v6> <h3 data-astro-cid-h5q2y2v6>${article.title}</h3> </div> </a>`)} </main> ` })}  <!-- ---
// src/pages/articles/index.astro
export const prerender = false;
import Layout from "../../layouts/Layout.astro";
const title = "المقالات";
const description = "أحدث مقالات الميمز والترفيه";
---

<Layout {title} {description}>
    <ul class="articles-list">
      <li><a href="/articles/تاريخ-الميمز-وانتشارها">تاريخ الميمز وانتشارها</a></li>
      <li><a href="/articles/ثقافة-الميمز">ثقافة الميمز: ليه بقت لغة العالم الجديد؟</a></li>
      <li><a href="/articles/ليه-الميمز-بتخلي-يومك-أحسن؟">ليه الميمز بتخلي يومك أحسن؟</a></li>
      <li><a href="/articles/geel-kamel">الميمز: المرآة اللي بتعكس جيل كامل 😂</a></li>
      <li><a href="/articles/النكت:-العلاج-الطبيعي-للروح">النكت: العلاج الطبيعي للروح 😄</a></li>
      <li><a href="/articles/tiktok-funny-money">أغرب طرق الناس لكسب الفلوس من الإنترنت (الطريقة رقم 3 هتضحكك 😂)</a></li>
      <li><a href="/articles/ai-social-media-funny">الذكاء الاصطناعي دخل السوشيال ميديا... وبدأ يقلدنا 😂</a></li>
      <li><a href="/articles/tiktok-crazy-ideas">أفكار محتوى مجنونة للتيك توك هتخليك تريند وانت نايم 😎</a></li>
    </ul>
  </Layout> -->`;
}, "/Users/khaledarafa/lolme/src/pages/articles/index.astro", void 0);

const $$file = "/Users/khaledarafa/lolme/src/pages/articles/index.astro";
const $$url = "/articles";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
