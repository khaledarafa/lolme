
import {
  db,
  collection,
  query,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  deleteDoc
} from "/js/firebase.js";

const box = document.getElementById("feedback-admin-list");
const statusBox = document.getElementById("feedback-admin-status");

if (box && statusBox) {
  loadFeedback();
}

async function loadFeedback() {
  box.replaceChildren();
  statusBox.textContent = "جاري تحميل الاقتراحات...";

  try {
    const q = query(
      collection(db, "feedback"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    statusBox.textContent = `عدد الاقتراحات: ${snapshot.size}`;

    if (snapshot.empty) {
      statusBox.textContent = "لا توجد اقتراحات حتى الآن.";
      return;
    }

    snapshot.forEach((item) => {
      const data = item.data();

      const card = document.createElement("article");
      card.className = "feedback-admin-card";

      const message = document.createElement("p");
      message.className = "feedback-admin-message";
      message.textContent = data.message || "";

      const meta = document.createElement("p");
      meta.className = "feedback-admin-meta";
      meta.textContent =
        `الحالة: ${data.status === "published" ? "منشور" : "خاص — بانتظار المراجعة"}`;

      const actions = document.createElement("div");
      actions.className = "feedback-admin-actions";

      const publishBtn = document.createElement("button");
      publishBtn.type = "button";
      publishBtn.textContent =
        data.status === "published" ? "🔒 إخفاء" : "🌍 نشر";

      publishBtn.addEventListener("click", async () => {
        await runAction(publishBtn, async () => {
          await updateDoc(doc(db, "feedback", item.id), {
            status: data.status === "published" ? "pending" : "published"
          });

          await loadFeedback();
        });
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "🗑️ حذف";

      deleteBtn.addEventListener("click", async () => {
        if (!confirm("هل تريد حذف الاقتراح نهائيًا؟")) return;

        await runAction(deleteBtn, async () => {
          await deleteDoc(doc(db, "feedback", item.id));
          await loadFeedback();
        });
      });

      actions.append(publishBtn, deleteBtn);
      card.append(message, meta, actions);
      box.appendChild(card);
    });
  } catch (error) {
    console.error("Admin feedback error:", error);
    statusBox.textContent =
      "تعذر تحميل الاقتراحات. تحقق من تسجيل المشرف وصلاحيات Firestore.";
  }
}

async function runAction(button, action) {
  button.disabled = true;

  try {
    await action();
  } catch (error) {
    console.error(error);
    alert("فشلت العملية. تحقق من صلاحيات Firestore.");
  } finally {
    button.disabled = false;
  }
}
