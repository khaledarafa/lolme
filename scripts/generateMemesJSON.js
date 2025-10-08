// scripts/generateMemesJSON.js
import fs from "fs";
import path from "path";

const memesFolder = path.join("./public/memes");

// اقرأ كل المجلدات الفرعية
const categories = fs.readdirSync(memesFolder).filter((f) => {
  return fs.statSync(path.join(memesFolder, f)).isDirectory();
});

const memesJSON = {};

categories.forEach((category) => {
  const folderPath = path.join(memesFolder, category);
  const files = fs.readdirSync(folderPath).filter(f => /\.(jpe?g|png|webp)$/i.test(f));

  memesJSON[category] = files.map((file, index) => ({
    number: index + 1,             // هنا رقم الصورة في الفئة
    src: `/memes/${category}/${file}`,
    caption: ""
  }));
});

// اكتب JSON في الملف
fs.writeFileSync(
  "./src/data/memes-captions.json",
  JSON.stringify(memesJSON, null, 2),
  "utf-8"
);

console.log("تم إنشاء ملف JSON لكل فئة مع أرقام الصور!");
