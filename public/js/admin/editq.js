import { db, collection, getDocs, query, orderBy, limit, startAfter, updateDoc, doc, deleteDoc } from "/js/firebase.js";

let lastDoc = null;
let allQuestions = [];
let isSearching = false;

const container = document.getElementById("editq");

// 🔥 رسم كارت السؤال (المصدر الوحيد)
function createQuestionCard(data) {
    const id = data.id;

    const div = document.createElement("div");
    div.className = "add-q-box";

    div.innerHTML = `
        <h3>✏️ تعديل سؤال</h3>

        <select class="q-type">
            <option value="choice" ${data.type === "choice" ? "selected" : ""}>اختيارات</option>
            <option value="text" ${data.type === "text" ? "selected" : ""}>إجابة كتابة</option>
        </select>

        <input class="q-text" value="${data.text || ""}" />

        <div class="options-box" style="${data.type === "text" ? "display:none" : ""}">
            <input class="opt1" value="${data.options?.[0] || ""}" />
            <input class="opt2" value="${data.options?.[1] || ""}" />
            <input class="opt3" value="${data.options?.[2] || ""}" />
            <input class="opt4" value="${data.options?.[3] || ""}" />
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

    // 🔥 لو مفيش hint → لون أحمر
    if (!data.hint) {
        div.style.border = "2px solid red";
    }

    const saveBtn = div.querySelector(".save");
    const msg = div.querySelector(".save-msg");

    saveBtn.onclick = async () => {
        const newData = {
            text: div.querySelector(".q-text").value.trim(),
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
            limit(10)
        );
    } else {
        q = query(
            collection(db, "questions"),
            orderBy("createdAt", "desc"),
            limit(10)
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

    if (!val) {
        isSearching = false;
        renderQuestions(allQuestions);
        return;
    }

    isSearching = true;

    const filtered = allQuestions.filter(q =>
        q.text?.toLowerCase().includes(val)
    );

    renderQuestions(filtered);
});

// 🔽 تحميل المزيد
document.getElementById("load-more")?.addEventListener("click", () => {
    loadQuestionsBatch();
});

// 🌍 global
window.loadQuestionsBatch = loadQuestionsBatch;