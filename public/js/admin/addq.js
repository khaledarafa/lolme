// public/js/addq.js
import { db, storage, addDoc, collection, query, where, getDocs, ref, uploadBytes, getDownloadURL } from "/js/firebase.js";
import { loadCategories } from "/js/categories.js";

window.initAddQ = function () {
  const container = document.querySelector("#addq .category-buttons");

  loadCategories(container, { selectable: true });
};

const btn = document.getElementById("add-q-btn");
const typeSelect = document.getElementById("q-type");
const optionsBox = document.getElementById("options-box");

function compressImage(file) {
    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

        img.onload = () => {
            const canvas = document.createElement("canvas");

            const maxWidth = 400; // 👈 صغرنا الحجم
            const scale = maxWidth / img.width;

            canvas.width = maxWidth;
            canvas.height = img.height * scale;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // 👇 الجودة هنا السر
            canvas.toBlob((blob) => {
                resolve(blob);
            }, "image/webp", 0.5); // 👈 قللنا الجودة
        };

        reader.readAsDataURL(file);
    });
}

typeSelect.addEventListener("change", () => {
    if (typeSelect.value === "text") {
        optionsBox.style.display = "none";
    } else {
        optionsBox.style.display = "block";
    }
});

const questionLabel = document.querySelector(".question-upload");

const msg = document.getElementById("msg");
const qImageInput = document.getElementById("q-image");

qImageInput.addEventListener("change", () => {
    questionLabel.innerText = "✅ تم اختيار صورة للسؤال";
});

// let selectedCategory = localStorage.getItem("selected_category") || "";
const qPreview = document.getElementById("q-preview");

qImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    qPreview.src = URL.createObjectURL(file);
    qPreview.style.display = "block";
});

// ده بتاع اختيار الفئة
btn.onclick = async () => {
    const hint = document.getElementById("q-hint").value.trim();
    const type = document.getElementById("q-type").value;
    let imageUrl = null;

    const file = document.getElementById("q-image").files[0];

    if (file) {
        const compressed = await compressImage(file);
        const storageRef = ref(storage, "questions/" + Date.now());
        await uploadBytes(storageRef, compressed);
        imageUrl = await getDownloadURL(storageRef);
    }

    const text = document.getElementById("q-text").value.trim();

    const options = [
        document.getElementById("opt1").value.trim(),
        document.getElementById("opt2").value.trim(),
        document.getElementById("opt3").value.trim(),
        document.getElementById("opt4").value.trim()
    ];

    const correct = document.getElementById("correct").value.trim();

    // ✅ validation بسيط
    if (!text) {
        msg.innerText = "❌ اكتب السؤال";
        return;
    }

    if (!correct) {
        msg.innerText = "❌ اكتب الإجابة الصح";
        return;
    }

    if (type === "choice" && options.some(o => !o)) {
        msg.innerText = "❌ لازم تملى كل الاختيارات";
        msg.style.color = "red";
        return;
    }

    if (type === "choice" && !options.includes(correct)) {
        msg.innerText = "❌ الإجابة لازم تكون من الاختيارات";
        msg.style.color = "red";
        return;
    }

const selectedCategory = localStorage.getItem("selected_category");

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
            options: type === "choice" ? options : null,
            correct,
            image: imageUrl,
            type,
            category: selectedCategory,
            hint,
            approved: false,
            createdAt: Date.now(),
            createdBy: localStorage.getItem("player_name") || "unknown"
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
        document.getElementById("q-hint").value = "";
        // 🧹 reset الصورة
        document.getElementById("q-image").value = "";
        qPreview.style.display = "none";
        questionLabel.innerText = "📸 صورة السؤال (اختياري)";
    } catch (err) {
        console.error(err);
        msg.innerText = "❌ حصل خطأ";
        msg.style.color = "red";
    }
};
