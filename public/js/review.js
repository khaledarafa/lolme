// public/js/review.js
import { db } from "/js/firebase.js";
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// const password = "lolo"; // غيرها براحتك

// const userPass = prompt("ادخل كلمة مرور الأدمن:");

// if (userPass !== password) {
//   document.body.innerHTML = "<h1>🚫 مش مسموح يا نجم</h1>";
//   throw new Error("Unauthorized");
// }
const box = document.getElementById("questions-box");

async function loadQuestions() {
    const q = query(
        collection(db, "questions"),
        where("approved", "==", false)
    );

    const snap = await getDocs(q);

    box.innerHTML = "";

    snap.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;

        const div = document.createElement("div");
        div.className = "question-card";

        div.style = `
      background:#111827;
      padding:15px;
      margin:10px;
      border-radius:10px;
    `;

let optionsHTML = "";

if (data.type === "choice" && data.options) {
  optionsHTML = `
    <div class="options-grid">
      <span>1️⃣ ${data.options[0] || ""}</span>
      <span>2️⃣ ${data.options[1] || ""}</span>
      <span>3️⃣ ${data.options[2] || ""}</span>
      <span>4️⃣ ${data.options[3] || ""}</span>
    </div>
  `;
}

div.innerHTML = `
  <h3>${data.text}</h3>

  <p>🧠 النوع: ${data.type === "choice" ? "اختيارات" : "كتابة"}</p>

  <p>📂 ${data.category}</p>

  ${optionsHTML}

  <p>✅ الصح: ${data.correct}</p>

  <button data-id="${id}" class="approve">✅ موافقة</button>
  <button data-id="${id}" class="delete">❌ حذف</button>
  <button data-id="${id}" class="edit">✏️ تعديل</button>
`;

        box.appendChild(div);
    });

    addEvents();
}

function addEvents() {
    document.querySelectorAll(".approve").forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;

            await updateDoc(doc(db, "questions", id), {
                approved: true
            });

            loadQuestions();
        };
    });

    document.querySelectorAll(".delete").forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;

            await deleteDoc(doc(db, "questions", id));

            loadQuestions();
        };
    });

    document.querySelectorAll(".edit").forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            const parent = btn.parentElement;

            // لو الفورم مفتوح
            const oldForm = parent.querySelector(".edit-form");
            if (oldForm) {
                oldForm.remove();
                return;
            }

            // نجيب من فايربيز
            const ref = doc(db, "questions", id);
            const snap = await getDoc(ref);
            const data = snap.data();

            const text = data.text;
            const options = data.options;
            const correct = data.correct;

            const form = document.createElement("div");
            form.className = "edit-form";

            form.innerHTML = `
<input class="edit-text" />

<input class="edit-opt" />
<input class="edit-opt" />
<input class="edit-opt" />
<input class="edit-opt" />

<input class="edit-correct" />

<button class="save-edit">💾 حفظ</button>
`;

form.querySelector(".edit-text").value = text;

const inputs = form.querySelectorAll(".edit-opt");

if (data.type === "choice" && options) {
  inputs[0].value = options[0] || "";
  inputs[1].value = options[1] || "";
  inputs[2].value = options[2] || "";
  inputs[3].value = options[3] || "";
} else {
  inputs.forEach(inp => inp.style.display = "none");
}

form.querySelector(".edit-correct").value = correct;
            parent.appendChild(form);

            form.querySelector(".save-edit").onclick = async () => {
                const newText = form.querySelector(".edit-text").value;

                const newOptions = Array.from(form.querySelectorAll(".edit-opt"))
                    .map(inp => inp.value);

                const newCorrect = form.querySelector(".edit-correct").value;

                await updateDoc(doc(db, "questions", id), {
                    text: newText,
                    options: newOptions,
                    correct: newCorrect,
                    approved: false
                });

                form.remove(); // 👈 مهم
                loadQuestions();
            };
        };
    });
}

loadQuestions();