import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CaO2XoRP.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_sQaw-IYp.mjs';
export { renderers } from '../renderers.mjs';

const prerender = false;
const $$Privacy = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="text-container"> <h1>سياسة الخصوصية</h1> <p>نحن نحترم خصوصيتك وملتزمون بحماية أي معلومات تقوم بمشاركتها معنا. هذه السياسة تشرح لك كيفية جمع واستخدام وحماية البيانات على موقع LOLME.</p> <h2>جمع المعلومات</h2> <p>قد نجمع المعلومات التالية: بيانات التصفح، نوع الجهاز، المتصفح، وبيانات تفاعلك مع الموقع (مثل رفع الصور أو استخدام الميمز).</p> <h2>استخدام المعلومات</h2> <p>تُستخدم المعلومات لتحسين تجربة المستخدم، تحسين الخدمات، وتهيئة المحتوى الإعلاني المناسب لك.</p> <h2>مشاركة المعلومات</h2> <p>لن نشارك معلوماتك الشخصية مع أي طرف ثالث دون إذنك، باستثناء ما يطلبه القانون أو خدمات الإعلانات مثل جوجل أدسنس التي قد تستخدم ملفات تعريف الارتباط.</p> <h2>ملفات تعريف الارتباط (Cookies)</h2> <p>قد يستخدم الموقع ملفات تعريف الارتباط لتحليل استخدام الموقع وتقديم تجربة أفضل، ولعرض إعلانات مخصصة.</p> <h2>تغييرات على سياسة الخصوصية</h2> <p>نحتفظ بالحق في تعديل سياسة الخصوصية في أي وقت. سيتم نشر أي تغييرات على هذه الصفحة.</p> <h2>اتصل بنا</h2> <p>لأي استفسار أو اقتراح، استخدم الفورم في أسفل الصفحة لإرسال رسالتك.</p> </main> ` })}`;
}, "/Users/khaledarafa/lolme/src/pages/privacy.astro", void 0);

const $$file = "/Users/khaledarafa/lolme/src/pages/privacy.astro";
const $$url = "/privacy";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Privacy,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
