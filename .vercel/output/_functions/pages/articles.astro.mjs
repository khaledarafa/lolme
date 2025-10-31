import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_tVLEeqaO.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CDAhgi8t.mjs';
export { renderers } from '../renderers.mjs';

const prerender = false;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const title = "\u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062A";
  const description = "\u0623\u062D\u062F\u062B \u0645\u0642\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u064A\u0645\u0632 \u0648\u0627\u0644\u062A\u0631\u0641\u064A\u0647";
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": title, "description": description }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<ul class="articles-list"> <li><a href="/articles/تاريخ-الميمز-وانتشارها">تاريخ الميمز وانتشارها</a></li> <li><a href="/articles/ثقافة-الميمز">ثقافة الميمز: ليه بقت لغة العالم الجديد؟</a></li> <li><a href="/articles/ليه-الميمز-بتخلي-يومك-أحسن؟">ليه الميمز بتخلي يومك أحسن؟</a></li> <li><a href="/articles/geel-kamel">الميمز: المرآة اللي بتعكس جيل كامل 😂</a></li> <li><a href="/articles/النكت:-العلاج-الطبيعي-للروح">النكت: العلاج الطبيعي للروح 😄</a></li> </ul> ` })} <!-- <style>
    .articles-list {
      list-style: none;
      padding: 2rem;   
      margin: 0 auto;
      max-width: 720px; 
      display: flex;
      flex-direction: column;
      gap: 1rem;       
    }
    
    .articles-list li a {
      display: block;
      padding: 1rem 1.5rem;  
      background: var(--card-bg);
      border-radius: 10px;
      box-shadow: 0 3px 8px rgba(0,0,0,0.05);
      text-decoration: none;
      color: #1f8ef1;
      font-weight: bold;
      transition: transform 0.1s ease, box-shadow 0.1s ease;
    }
    
    .articles-list li a:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    </style> -->`;
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
