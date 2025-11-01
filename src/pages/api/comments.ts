import fs from "fs";
import path from "path";

type Comment = { name: string; text: string; date: string };
const DATA_DIR = path.resolve("src/data/comments");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function getFile(slug: string) {
  return path.join(DATA_DIR, `${slug.replace(/[^a-z0-9-_]/gi, "_")}.json`);
}

export async function GET({ request }: { request: Request }) {
  const slug = new URL(request.url).searchParams.get("slug") || "index";
  const file = getFile(slug);
  let comments: Comment[] = [];
  if (fs.existsSync(file)) comments = JSON.parse(fs.readFileSync(file, "utf-8"));
  return new Response(JSON.stringify({ comments }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST({ request }: { request: Request }) {
  const body = await request.json();
  const slug = body.slug || "index";
  const name = body.name || "زائر";
  const text = body.text || "";

  if (!text) return new Response("Invalid", { status: 400 });

  const file = getFile(slug);
  let comments: Comment[] = [];
  if (fs.existsSync(file)) comments = JSON.parse(fs.readFileSync(file, "utf-8"));

  comments.push({ name, text, date: new Date().toISOString() });
  fs.writeFileSync(file, JSON.stringify(comments, null, 2));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

// ✅ جديد: حذف تعليق محدد
export async function DELETE({ request }: { request: Request }) {
  const { slug, date, key } = await request.json();
  if (key !== "lolme_secret_123") {
    return new Response("Unauthorized", { status: 403 });
  }

  const file = getFile(slug);
  if (!fs.existsSync(file)) {
    return new Response(JSON.stringify({ ok: false, msg: "No comments found" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let comments: Comment[] = JSON.parse(fs.readFileSync(file, "utf-8"));
  const newComments = comments.filter((c) => c.date !== date);
  fs.writeFileSync(file, JSON.stringify(newComments, null, 2));

  return new Response(JSON.stringify({ ok: true, msg: "Deleted comment" }), {
    headers: { "Content-Type": "application/json" },
  });
}



// // src/pages/api/comments.ts
// import fs from "fs";
// import path from "path";

// type Comment = { name: string; text: string; date: string };
// const DATA_DIR = path.resolve("src/data/comments");
// if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// function getFile(slug: string) {
//   return path.join(DATA_DIR, `${slug.replace(/[^a-z0-9-_]/gi, "_")}.json`);
// }

// // ✅ لازم تكون GET مش get
// export async function GET({ request }: { request: Request }) {
//   const slug = new URL(request.url).searchParams.get("slug") || "index";
//   const file = getFile(slug);
//   let comments: Comment[] = [];
//   if (fs.existsSync(file)) comments = JSON.parse(fs.readFileSync(file, "utf-8"));
//   return new Response(JSON.stringify({ comments }), {
//     headers: { "Content-Type": "application/json" },
//   });
// }

// // ✅ لازم تكون POST مش post
// export async function POST({ request }: { request: Request }) {
//   const body = await request.json();
//   const slug = body.slug || "index";
//   const name = body.name || "زائر";
//   const text = body.text || "";

//   if (!text) return new Response("Invalid", { status: 400 });

//   const file = getFile(slug);
//   let comments: Comment[] = [];
//   if (fs.existsSync(file)) comments = JSON.parse(fs.readFileSync(file, "utf-8"));

//   comments.push({ name, text, date: new Date().toISOString() });
//   fs.writeFileSync(file, JSON.stringify(comments, null, 2));

//   return new Response(JSON.stringify({ ok: true }), {
//     headers: { "Content-Type": "application/json" },
//   });
// }
