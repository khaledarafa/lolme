import { db, collection, getDocs, query, orderBy, limit, startAfter, updateDoc, doc, deleteDoc } from "/js/firebase.js";

let lastDoc = null;
let allQuestions = [];
let isSearching = false;

const container = document.getElementById("editq");
const filterSelect = document.getElementById("filter-category");

getDocs(collection(db, "categories")).then((snap) => {
    snap.forEach((docSnap) => {
        const cat = docSnap.data();

        const opt = document.createElement("option");
        opt.value = cat.slug;
        opt.textContent = cat.name;

        filterSelect.appendChild(opt);
    });
});
function normalizeArabic(text = "") {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F]/g, "") // التشكيل
    .replace(/[أإآ]/g, "ا")          // الألف
    .replace(/ى/g, "ي")             // ألف مقصورة
    .replace(/ة/g, "ه")             // تاء مربوطة
    .replace(/ؤ/g, "و")             // واو مهموزة
    .replace(/ئ/g, "ي")             // ياء مهموزة
    .replace(/ـ/g, "");             // التطويل
}
// 🔥 رسم كارت السؤال (المصدر الوحيد)
function createQuestionCard(data) {
    const id = data.id;

    const div = document.createElement("div");
    div.className = "add-q-box";

    div.innerHTML = `
        <h3>✏️ تعديل سؤال</h3>

        ${data.image ? `
            <img src="${data.image}" class="q-image-preview" />
        ` : ""}

        <select class="q-type">
            <option value="choice" ${data.type === "choice" ? "selected" : ""}>اختيارات</option>
            <option value="text" ${data.type === "text" ? "selected" : ""}>إجابة كتابة</option>
        </select>
<select class="q-category"></select>
<div class="cat-slug-view" style="font-size:12px;color:#aaa;"></div>
        <input class="q-text" />

        <div class="options-box" style="${data.type === "text" ? "display:none" : ""}">
            <input class="opt1" />
            <input class="opt2" />
            <input class="opt3" />
            <input class="opt4" />
        </div>

        <input class="correct" value="${data.correct || ""}" />

        <textarea class="hint" placeholder="💡 تلميح بسيط يقرب للإجابة">${data.hint || ""}</textarea>

        <select class="approved">
            <option value="true" ${data.approved ? "selected" : ""}>✔️ موافق</option>
            <option value="false" ${!data.approved ? "selected" : ""}>❌ مرفوض</option>
        </select>

        <button class="save">💾 حفظ</button>
        <button class="delete">🗑️ حذف</button>

        <div class="save-msg"></div>  <!-- 👈 دي كانت ناقصة -->
        `;
    const catSelect = div.querySelector(".q-category");
const slugView = div.querySelector(".cat-slug-view");
catSelect.addEventListener("change", () => {
    slugView.innerText = "slug: " + catSelect.value;
});
    getDocs(collection(db, "categories")).then((snap) => {
        snap.forEach((docSnap) => {
            const cat = docSnap.data();

            const opt = document.createElement("option");
            opt.value = cat.slug;
            opt.textContent = cat.name;

            if (data.category === cat.slug || data.category === cat.name) {
                opt.selected = true;
            }

            catSelect.appendChild(opt);
        });
        slugView.innerText = "slug: " + catSelect.value;
    });
    // 👇 هنا بالظبط
    div.querySelector(".q-text").value = data.text || "";
    div.querySelector(".opt1").value = data.options?.[0] || "";
    div.querySelector(".opt2").value = data.options?.[1] || "";
    div.querySelector(".opt3").value = data.options?.[2] || "";
    div.querySelector(".opt4").value = data.options?.[3] || "";
    // 🔥 لو مفيش hint → لون أحمر
    if (!data.hint) {
        div.style.border = "2px solid red";
    }

    const saveBtn = div.querySelector(".save");
    const msg = div.querySelector(".save-msg");

    saveBtn.onclick = async () => {
        const newData = {
            text: div.querySelector(".q-text").value.trim(),
            category: div.querySelector(".q-category").value,
            type: div.querySelector(".q-type").value,
            correct: div.querySelector(".correct").value.trim(),
            hint: div.querySelector(".hint").value.trim(),
            approved: div.querySelector(".approved").value === "true"
        };

        if (newData.type === "choice") {
            newData.options = [
                div.querySelector(".opt1").value.trim(),
                div.querySelector(".opt2").value.trim(),
                div.querySelector(".opt3").value.trim(),
                div.querySelector(".opt4").value.trim()
            ];
        } else {
            newData.options = null;
        }

        // 🔥 UI قبل الحفظ
        saveBtn.disabled = true;
        saveBtn.innerText = "⏳";
        msg.innerText = "جاري الحفظ...";

        try {
            await updateDoc(doc(db, "questions", id), newData);

            msg.innerText = "✅ تم الحفظ";
            msg.style.color = "#22c55e";

            div.style.border = "2px solid #22c55e";
            setTimeout(() => {
                msg.innerText = "";
                div.style.border = "1px solid var(--border-color)";
            }, 2000);

        } catch (err) {
            msg.innerText = "❌ حصل خطأ";
            msg.style.color = "red";
        }

        // 🔥 رجع الزرار
        saveBtn.disabled = false;
        saveBtn.innerText = "💾 حفظ";
    };

    const deleteBtn = div.querySelector(".delete");

    deleteBtn.onclick = async () => {
        if (!confirm("هتمسح السؤال ده يا وحش؟ 😏")) return;

        msg.innerText = "⏳ جاري الحذف...";
        msg.style.color = "#facc15";

        try {
            await deleteDoc(doc(db, "questions", id));

            // 🔥 شيل من الليست كمان
            allQuestions = allQuestions.filter(q => q.id !== id);

            msg.innerText = "🗑️ تم الحذف";
            msg.style.color = "red";

            div.style.opacity = "0.3";

            setTimeout(() => {
                div.remove();
            }, 300);

        } catch (err) {
            msg.innerText = "❌ حصل خطأ";
            msg.style.color = "red";
        }
    };
    return div;
}

// 🔥 رسم ليست (search / reset)
function renderQuestions(list) {
    container.innerHTML = "";

    list.forEach(data => {
        container.appendChild(createQuestionCard(data));
    });
}

// 🔥 تحميل 10/10
export async function loadQuestionsBatch() {
    let q;

    if (lastDoc) {
        q = query(
            collection(db, "questions"),
            orderBy("createdAt", "desc"),
            startAfter(lastDoc),
            // limit(50)
        );
    } else {
        q = query(
            collection(db, "questions"),
            orderBy("createdAt", "desc"),
            // limit(50)
        );
    }

    const snap = await getDocs(q);

    if (snap.empty) return;

    lastDoc = snap.docs[snap.docs.length - 1];

    snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const id = docSnap.id;

        const item = { ...data, id };

        allQuestions.push(item);

        if (!isSearching) {
            container.appendChild(createQuestionCard(item));
        }
    });
}

// 🔍 البحث
document.getElementById("search-q")?.addEventListener("input", (e) => {
const val = e.target.value.toLowerCase();
const selectedCat = filterSelect.value;

const filtered = allQuestions.filter(q => {
const searchText = normalizeArabic(val);

const target = normalizeArabic(`
  ${q.text || ""}
  ${q.correct || ""}
  ${q.hint || ""}
`);

const matchText = target.includes(searchText);
    const matchCat = selectedCat ? q.category === selectedCat : true;
    return matchText && matchCat;
});

renderQuestions(filtered);
});
filterSelect?.addEventListener("change", () => {
    const val = filterSelect.value;

    if (!val) {
        renderQuestions(allQuestions);
        return;
    }

    const filtered = allQuestions.filter(q =>
        q.category === val
    );

    renderQuestions(filtered);
});
// 🔽 تحميل المزيد
document.getElementById("load-more")?.addEventListener("click", () => {
    loadQuestionsBatch();
});

// 🌍 global
window.loadQuestionsBatch = loadQuestionsBatch;