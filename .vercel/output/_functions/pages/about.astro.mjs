import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_tVLEeqaO.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CDAhgi8t.mjs';
export { renderers } from '../renderers.mjs';

const prerender = false;
const $$About = createComponent(($$result, $$props, $$slots) => {
  const pageTitle = "\u0639\u0646 LOLME";
  const pageDescription = "LOLME: \u0636\u062D\u0643\u060C \u0646\u0643\u062A\u060C \u0645\u064A\u0645\u0632\u060C \u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0645\u0636\u062D\u0643\u0629\u060C \u0648\u0643\u0644 \u062D\u0627\u062C\u0629 \u062A\u062E\u0644\u064A\u0643 \u0645\u0633\u062A\u0645\u062A\u0639 \u0628\u0627\u0644\u0648\u064A\u0628 \u0628\u0637\u0631\u064A\u0642\u0629 \u0643\u0648\u0645\u064A\u062F\u064A\u0629!";
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": pageTitle, "description": pageDescription }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section style="padding: 2rem 2rem .5rem 2rem; max-width: 900px; margin: auto; text-align: center;"> <h1>مرحبًا في LOLME! 😂</h1> <p style="font-size: 1.2rem; margin-top: 1rem;">
LOLME هو المكان الرسمي لكل حاجة تخليك تضحك 😎  
      ميمز، نكت، صور مضحكة، اختبارات كوميدية، وكل يوم فيه حاجة جديدة ترفع معنوياتك.
</p> <h2 style="margin-top: 2rem;">إيه اللي هتلاقيه عندنا؟</h2> <ul style="text-align: start; margin: 1rem auto; max-width: 700px; list-style-type: disc; padding-left: 1.5rem;"> <li>نكت مضحكة تخلي يومك أحسن 🤣</li> <li>صور وميمز خرافية تموت من الضحك 😹</li> <li>اختبارات مضحكة تعرفك إنت مين 😂</li> <li>روست أصحابك بس بطريقة كوميدية 🔥</li> <li>صفحات تحويل PDF لصور (لو بتحب تلعب شوية 🤯)</li> </ul> <h2 style="margin-top: 2rem;">مين ورا LOLME؟</h2> <p>
الموقع من تصميم وتشغيل <strong> فريق LOLME</strong>،
</p> <h2 style="margin-top: 2rem;">تواصل معانا</h2> <p>
عندك فكرة جديدة لميمز، نكت، أو اختبار مضحك؟ شاركنا برأيك 👇
<!-- <a href="mailto:contact@lolme.cc" style="color: var(--accent);">contact@lolme.cc</a> --> </p> <!-- <p style="margin-top: 3rem; font-size: 0.9rem; color: #aaa;">
      © 2025 LOLME. كل الحقوق محفوظة. ضحكك مسؤوليتنا 😎
    </p> --> </section> ` })}`;
}, "/Users/khaledarafa/lolme/src/pages/about.astro", void 0);

const $$file = "/Users/khaledarafa/lolme/src/pages/about.astro";
const $$url = "/about";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$About,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
