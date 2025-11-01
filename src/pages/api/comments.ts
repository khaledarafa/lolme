// src/pages/api/comments.ts
import fs from "fs";
import path from "path";

type Comment = { name: string; text: string; date: string };
const DATA_DIR = path.resolve("src/data/comments");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function getFile(slug: string) {
  return path.join(DATA_DIR, `${slug.replace(/[^a-z0-9-_]/gi, "_")}.json`);
}

export async function get({ request }: { request: Request }) {
  const slug = new URL(request.url).searchParams.get("slug") || "index";
  const file = getFile(slug);
  let comments: Comment[] = [];
  if (fs.existsSync(file)) comments = JSON.parse(fs.readFileSync(file, "utf-8"));
  return new Response(JSON.stringify({ comments }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function post({ request }: { request: Request }) {
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
