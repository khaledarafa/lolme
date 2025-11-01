// public/js/comments.js
document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector("#comments-section");
  if (!section) return;

  const slug =
    section.dataset.slug ||
    location.pathname.split("/").filter(Boolean).pop() ||
    "index";
  const listEl = document.querySelector("#comment-list");
  const form = document.querySelector("#comment-form");

  async function loadComments() {
    try {
      listEl.innerHTML = "جاري تحميل التعليقات...";
      const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`);

      // ✅ تأكد إن السيرفر فعلاً بيرجع JSON
      const text = await res.text();
      console.log("🔍 رد السيرفر:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("❌ مشكلة في JSON:", err);
        listEl.innerHTML = "⚠️ خطأ في قراءة الرد من السيرفر.";
        return;
      }

      const comments = Array.isArray(data) ? data : data.comments || [];

      if (comments.length === 0) {
        listEl.innerHTML = `<p style="opacity:0.7;">لا توجد تعليقات بعد 😅 كن أول من يعلّق!</p>`;
        return;
      }

      const isAdmin = location.search.includes("key=lolme_admin");

      listEl.innerHTML = comments
        .map(
          (c) => `
        <div class="comment">
          <strong>${escapeHtml(c.name)}</strong>
          <small> · ${new Date(c.date).toLocaleDateString("ar-EG")}</small>
          <p>${escapeHtml(c.text)}</p>
          ${isAdmin ? `<button class="delete-comment" data-date="${c.date}">🗑️</button>` : ""}
        </div>`
        )
        .join("");
      
      // ✅ التعامل مع زر الحذف
      if (isAdmin) {
        listEl.querySelectorAll(".delete-comment").forEach((btn) => {
          btn.addEventListener("click", async () => {
            if (!confirm("تحب تمسح التعليق ده؟ 😢")) return;
            const date = btn.dataset.date;
            const res = await fetch("/api/comments", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug, date, key: "lolme_secret_123" }),
            });
            const data = await res.json();
            alert(data.msg || "تم حذف التعليق");
            await loadComments();
          });
        });
      }
      
    } catch (e) {
      listEl.innerHTML = "حدث خطأ أثناء تحميل التعليقات 😔";
      console.error(e);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = fd.get("name") || "زائر";
    const text = fd.get("text")?.toString().trim();

    if (!text) return alert("اكتب تعليق قبل الإرسال 😄");

    const btn = form.querySelector("button");
    btn.disabled = true;
    btn.textContent = "جارٍ الإرسال...";

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, text }),
      });
      const resultText = await res.text();
      console.log("📤 رد POST:", resultText);
      const data = JSON.parse(resultText);
      if (data.ok) {
        form.reset();
        await loadComments();
      } else {
        alert("حصل خطأ، جرّب تاني 🙏");
      }
    } catch (e) {
      alert("مشكلة في الاتصال 😔");
      console.error(e);
    }

    btn.disabled = false;
    btn.textContent = "أضف تعليق";
  });

  loadComments();
});

// 🧨 زر حذف التعليقات (للأدمن فقط)
const delBtn = document.querySelector("#delete-comments");
if (delBtn) {
  delBtn.addEventListener("click", async () => {
    if (!confirm("أكيد عايز تحذف كل التعليقات؟ 😢")) return;
    const res = await fetch("/api/delete-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, key: "lolmedel" }),
    });
    const data = await res.json();
    alert(data.msg || "تم حذف التعليقات");
    await loadComments();
  });
}
