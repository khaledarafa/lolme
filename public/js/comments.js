// public/js/comments.js
document.addEventListener("DOMContentLoaded", () => {
    const section = document.querySelector("#comments-section");
    if (!section) return;
  
    const slug = section.dataset.slug || location.pathname.replace(/^\/+|\/+$/g, "");
    const listEl = document.querySelector("#comment-list");
    const form = document.querySelector("#comment-form");
  
    async function loadComments() {
      try {
        listEl.innerHTML = "جاري التحميل...";
        const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        const comments = data.comments || [];
        if (comments.length === 0) {
          listEl.innerHTML = `<p style="opacity:0.7;">لا توجد تعليقات بعد 😅 كن أول من يعلّق!</p>`;
          return;
        }
        listEl.innerHTML = comments
          .map(
            (c) => `
          <div class="comment">
            <strong>${escapeHtml(c.name)}</strong>
            <small> · ${new Date(c.date).toLocaleDateString("ar-EG")}</small>
            <p>${escapeHtml(c.text)}</p>
          </div>`
          )
          .join("");
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
        const data = await res.json();
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
  