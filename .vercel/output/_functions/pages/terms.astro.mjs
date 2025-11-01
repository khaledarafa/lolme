import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CaO2XoRP.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_sQaw-IYp.mjs';
export { renderers } from '../renderers.mjs';

const prerender = false;
const $$Terms = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="text-container"> <h1>الشروط والأحكام</h1> <p>باستخدامك لموقع LOLME، فإنك توافق على الالتزام بالشروط والأحكام التالية. إذا لم توافق عليها، يرجى عدم استخدام الموقع.</p> <h2>استخدام الموقع</h2> <p>يُسمح لك باستخدام الموقع للأغراض الشخصية والترفيهية فقط. يُمنع استخدام الموقع لأي أغراض غير قانونية أو مضرة بالآخرين.</p> <h2>المحتوى المقدم من المستخدمين</h2> <p>أنت مسؤول عن أي محتوى تقوم بتحميله أو مشاركته على الموقع. لا يجوز نشر محتوى ينتهك حقوق الآخرين أو يحتوي على إساءة أو تحريض.</p> <h2>حقوق الملكية الفكرية</h2> <p>جميع الصور، النصوص، والبرمجيات الموجودة على الموقع محمية بموجب حقوق الملكية الفكرية. لا يُسمح بنسخ أو إعادة نشر أي محتوى بدون إذن.</p> <h2>إخلاء المسؤولية</h2> <p>الموقع يُقدم "كما هو" دون أي ضمانات. نحن غير مسؤولين عن أي أضرار تنتج عن استخدام الموقع.</p> <h2>تغييرات على الشروط</h2> <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم نشر أي تغييرات على هذه الصفحة.</p> <h2>اتصل بنا</h2> <p>لأي استفسار أو اقتراح، استخدم الفورم في أسفل الصفحة لإرسال رسالتك.</p> </main> ` })}`;
}, "/Users/khaledarafa/lolme/src/pages/terms.astro", void 0);

const $$file = "/Users/khaledarafa/lolme/src/pages/terms.astro";
const $$url = "/terms";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Terms,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
