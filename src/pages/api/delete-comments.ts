import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("src/data/comments");

export async function POST({ request }: { request: Request }) {
  const { slug, key } = await request.json();

  if (key !== "lolme_secret_123") {
    return new Response("Unauthorized", { status: 403 });
  }

  const file = path.join(DATA_DIR, `${slug.replace(/[^a-z0-9-_]/gi, "_")}.json`);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    return new Response(JSON.stringify({ ok: true, msg: `تم حذف التعليقات الخاصة بـ ${slug}` }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: false, msg: "مفيش تعليقات لهذا المقال" }), {
    headers: { "Content-Type": "application/json" },
  });
}
