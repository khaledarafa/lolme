// public/js/addq.js
import { db } from "/js/firebase.js";
import { addDoc, collection, query, where, getDocs  } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const btn = document.getElementById("add-q-btn");
const msg = document.getElementById("msg");
let selectedCategory = localStorage.getItem("selected_category") || "";

btn.onclick = async () => {
    const text = document.getElementById("q-text").value.trim();

    const options = [
        document.getElementById("opt1").value.trim(),
        document.getElementById("opt2").value.trim(),
        document.getElementById("opt3").value.trim(),
        document.getElementById("opt4").value.trim()
    ];

    const correct = document.getElementById("correct").value.trim();

    // ✅ validation بسيط
    if (!text || options.some(o => !o) || !correct || !selectedCategory) {
        msg.innerText = "❌ املى كل الحقول يا نجم";
        msg.style.color = "red";
        return;
    }

    if (!options.includes(correct)) {
        msg.innerText = "❌ الإجابة الصح لازم تكون من الاختيارات";
        msg.style.color = "red";
        return;
    }

    if (!selectedCategory) {
        msg.innerText = "❌ اختار فئة الأول يا نجم 😏";
        msg.style.color = "red";
        return;
    }

const qCheck = query(
  collection(db, "questions"),
  where("text", "==", text)
);

const snapCheck = await getDocs(qCheck);

if (!snapCheck.empty) {
  msg.innerText = "⚠️ السؤال ده موجود قبل كده يا نجم 😏";
  msg.style.color = "orange";
  return;
}
    try {
await addDoc(collection(db, "questions"), {
  text,
  options,
  correct,
  category: selectedCategory,
  approved: false,
  createdAt: Date.now(),
  createdBy: localStorage.getItem("player_name") || "unknown" // 🔥 دي مهمة
});
        msg.innerText = "✅ السؤال اتضاف وهيتراجع";
        msg.style.color = "#22c55e";
window.scrollTo({ top: 0, behavior: "smooth" });
        // reset
        document.getElementById("q-text").value = "";
        document.getElementById("opt1").value = "";
        document.getElementById("opt2").value = "";
        document.getElementById("opt3").value = "";
        document.getElementById("opt4").value = "";
        document.getElementById("correct").value = "";

    } catch (err) {
        console.error(err);
        msg.innerText = "❌ حصل خطأ";
        msg.style.color = "red";
    }
};

const catButtons = document.querySelectorAll(".cat-btn");

// لما يفتح الصفحة يرجع الاختيار القديم
if (selectedCategory) {
    catButtons.forEach(btn => {
        if (btn.dataset.cat === selectedCategory) {
            btn.classList.add("active");
        }
    });
}

// لما يدوس على زرار
catButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        selectedCategory = btn.dataset.cat;

        localStorage.setItem("selected_category", selectedCategory);

        catButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});