// scripts/generate-quiz.js
// npm run gen:quiz
// npm run gen:quiz
import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const outputDir = path.resolve("src/data/quizzes");
const indexPath = path.resolve("src/data/quizzes/index.js");

/* ===============================
   Arabic → English transliteration
================================ */
function transliterateArabic(text) {
  const map = {
    ا: "a", أ: "a", إ: "e", آ: "a",
    ب: "b", ت: "t", ث: "th",
    ج: "g", ح: "h", خ: "kh",
    د: "d", ذ: "z",
    ر: "r", ز: "z",
    س: "s", ش: "sh",
    ص: "s", ض: "d",
    ط: "t", ظ: "z",
    ع: "a", غ: "gh",
    ف: "f", ق: "q",
    ك: "k", ل: "l",
    م: "m", ن: "n",
    ه: "h", و: "w",
    ي: "y", ة: "a", ى: "a",
    ء: "", "ً": "", "ٌ": "", "ٍ": "",
    "َ": "", "ُ": "", "ِ": "", "ّ": "", "ْ": ""
  };

  return text
    .split("")
    .map(c => map[c] ?? c)
    .join("");
}

/* ===============================
   Slug generation (no random)
================================ */
function generateBaseSlug(title) {
  return transliterateArabic(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

/* ===============================
   Ensure unique slug: -2, -3 …
================================ */
function ensureUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 2;

  while (fs.existsSync(path.join(outputDir, `${slug}.json`))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/* ===============================
   Main generator
================================ */
const MAX_RETRIES = 3;

async function generateQuiz(retry = 1) {
  console.log(`🧠 Generating quiz (try ${retry})...`);

  const prompt = `
انت كاتب اختبارات ذكية لموقع اسمه LOLME.
الاختبارات ممتعة وخفيفة دم، لكنها بتكشف جوانب حقيقية من شخصية المستخدم
(تفكير – قرارات – علاقات – طموح – هروب – مواجهة).

⚠️ عقد صارم:
- ممنوع تغيير شكل JSON
- ممنوع تقليل عدد الأسئلة
- ممنوع شرح خارج JSON

الأسلوب:
- مصري خفيف دم من غير تهريج زيادة
- ذكي وملاحظ
- أحيانًا ساخر، أحيانًا عميق
- مليان إيموجي 😎🔥😂

شروط إجبارية:
- title جذاب + إيموجي
- desc إجباري لا يقل عن 25 كلمة
- 4 أو 5 أسئلة
- كل سؤال يبدأ بإيموجي
- كل اختيار فيه إيموجي
- value = A | B | C | D فقط
- كل سؤال لازم يعكس موقف من الحياة الحقيقية
- ممنوع الأسئلة السطحية أو المتوقعة
- على الأقل سؤال واحد يكون نفسي أو داخلي
- النتائج لازم تخلي المستخدم يقول: "ده أنا!"

النتائج:
- A / B / C / D
- كل نتيجة فيها:
  - titles: 3 عناوين
  - descs: 3 جمل حقيقية

رجّع JSON فقط بالشكل ده:

{
  "title": "",
  "desc": "",
  "questions": [
    {
      "question": "",
      "options": [
        { "text": "", "value": "A" },
        { "text": "", "value": "B" },
        { "text": "", "value": "C" },
        { "text": "", "value": "D" }
      ]
    }
  ],
  "results": {
    "A": { "titles": [], "descs": [] },
    "B": { "titles": [], "descs": [] },
    "C": { "titles": [], "descs": [] },
    "D": { "titles": [], "descs": [] }
  }
}
`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9,
  });

  // تنظيف ```json
  let raw = res.choices[0].message.content.trim();
  raw = raw.replace(/^```json/i, "").replace(/```$/, "").trim();

  const quizData = JSON.parse(raw);

  if (!quizData.desc || quizData.desc.length < 120) {
    if (retry < MAX_RETRIES) {
      console.log("🔁 الوصف ضعيف… بنحاول تاني");
      return generateQuiz(retry + 1);
    }
    throw new Error("❌ فشل بعد 3 محاولات: الوصف ضعيف");
  }

  // slug
  const baseSlug = generateBaseSlug(quizData.title);
  const slug = ensureUniqueSlug(baseSlug);

  // image
  quizData.img = `/images/${slug}.webp`;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // save quiz file
  const quizFile = path.join(outputDir, `${slug}.json`);
  fs.writeFileSync(quizFile, JSON.stringify(quizData, null, 2), "utf8");

  // update index.js
  let indexContent = fs.readFileSync(indexPath, "utf8");

  const newItem = `
  {
    slug: "${slug}",
    title: "${quizData.title}",
    desc: "${quizData.desc}",
    img: "/images/${slug}-350.webp",
  },
`;

  indexContent = indexContent.replace(/];\s*$/, `${newItem}\n];`);
  fs.writeFileSync(indexPath, indexContent, "utf8");

  console.log("✅ Quiz generated:", slug);
}

generateQuiz().catch(console.error);

// import "dotenv/config";
// import fs from "fs";
// import path from "path";
// import OpenAI from "openai";

// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const outputDir = path.resolve("src/data/quizzes");
// const indexPath = path.resolve("src/data/quizzes/index.js");

// /* ================= helpers ================= */

// function slugify(text) {
//   return text
//     .toLowerCase()
//     .replace(/[^\w\s-]/g, "")
//     .trim()
//     .replace(/\s+/g, "-")
//     .slice(0, 40);
// }

// function generateUniqueSlug(title) {
//   const base = slugify(title) || "lolme-quiz";
//   const unique = Date.now().toString(36).slice(-4);
//   return `${base}-${unique}`;
// }

// function cleanJson(raw) {
//   let txt = raw.trim();
//   if (txt.startsWith("```")) {
//     txt = txt.replace(/^```json\s*/i, "");
//     txt = txt.replace(/^```\s*/i, "");
//     txt = txt.replace(/```$/, "").trim();
//   }
//   return txt;
// }

// /* ================= main ================= */

// async function generateQuiz() {
//   const prompt = `
// انت كاتب اختبارات كوميدية لموقع اسمه LOLME.

// ⚠️ عقد صارم:
// - ممنوع تغيير شكل JSON
// - ممنوع تغيير أسماء المفاتيح
// - ممنوع ربط الاختبار بموضوع واحد ثابت
// - أي مخالفة = الاختبار مرفوض

// الأسلوب:
// - مصري خفيف دم
// - نفسي / اجتماعي / شخصيات
// - تسويقي
// - مليان إيموجي 😎🔥😂

// المطلوب:

// 1️⃣ title
// - عربي
// - جذاب
// - 2–3 إيموجي
// - **غير مرتبط بالمشروبات**

// 2️⃣ desc (إجباري)
// - لا يقل عن 25 كلمة
// - يشرح فكرة الاختبار
// - نفسي / كوميدي / شخصيات
// - مليان إيموجي

// 3️⃣ questions
// - عددها 4 أو 5
// - كل سؤال:
//   - question (string + emoji)
//   - options (Array)
// - كل option:
//   - text (string + emoji)
//   - value = A | B | C | D

// 4️⃣ results
// - المفاتيح بالظبط:
//   A
//   B
//   C
//   D

// - كل نتيجة:
//   - titles: Array (3 عناوين مختلفة)
//   - descs: Array (3 جمل تحليل حقيقي للشخصية)

// ❌ ممنوع:
// - مشروبات
// - أكل
// - موضوع واحد متكرر
// - choices
// - أرقام
// - desc قصيرة

// رجّع JSON فقط بالشكل ده:

// {
//   "title": "",
//   "desc": "",
//   "questions": [
//     {
//       "question": "",
//       "options": [
//         { "text": "", "value": "A" },
//         { "text": "", "value": "B" },
//         { "text": "", "value": "C" },
//         { "text": "", "value": "D" }
//       ]
//     }
//   ],
//   "results": {
//     "A": { "titles": [], "descs": [] },
//     "B": { "titles": [], "descs": [] },
//     "C": { "titles": [], "descs": [] },
//     "D": { "titles": [], "descs": [] }
//   }
// }

// `;

//   const res = await client.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [{ role: "user", content: prompt }],
//     temperature: 0.9,
//   });

//   const raw = cleanJson(res.choices[0].message.content);
//   const quizData = JSON.parse(raw);

//   /* ===== validations ===== */
//   if (!quizData.title) throw new Error("❌ title missing");
//   if (!quizData.desc || quizData.desc.length < 40)
//     throw new Error("❌ desc missing or too short");
//   if (!Array.isArray(quizData.questions) || quizData.questions.length < 4)
//     throw new Error("❌ questions invalid");

//   const slug = generateUniqueSlug(quizData.title);

//   quizData.img = `/images/${slug}.webp`;

//   if (!fs.existsSync(outputDir)) {
//     fs.mkdirSync(outputDir, { recursive: true });
//   }

//   const outputFile = path.join(outputDir, `${slug}.json`);
//   fs.writeFileSync(outputFile, JSON.stringify(quizData, null, 2), "utf8");

//   /* ===== add to index.js ===== */
//   let indexContent = fs.readFileSync(indexPath, "utf8");

//   const newItem = `
//   {
//     slug: "${slug}",
//     title: "${quizData.title.replace(/"/g, "'")}",
//     desc: "${quizData.desc.replace(/"/g, "'")}",
//     img: "/images/${slug}-350.webp",
//   },
// `;

//   indexContent = indexContent.replace(/];\s*$/, `${newItem}\n];`);
//   fs.writeFileSync(indexPath, indexContent, "utf8");

//   console.log("✅ Quiz generated:", outputFile);
//   console.log("➕ Added to index.js");
// }

// generateQuiz().catch(err => {
//   console.error("🔥 ERROR:", err.message);
// });
