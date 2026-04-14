// public/js/addq.js
import { db, storage } from "/js/firebase.js";
import { addDoc, collection, query, where, getDocs }
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { ref, uploadBytes, getDownloadURL }
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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
const fileInput = document.getElementById("new-cat-image");
const preview = document.getElementById("preview");

fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 👇 لو عندك compress استخدمه
    const compressed = await compressImage(file);

    preview.src = URL.createObjectURL(compressed);
    preview.style.display = "block";
});
const questionLabel = document.querySelector(".question-upload");
const categoryLabel = document.querySelector('label[for="new-cat-image"]');
fileInput.addEventListener("change", () => {
    categoryLabel.innerText = "✅ تم اختيار صورة للفئة";
});

const msg = document.getElementById("msg");
const qImageInput = document.getElementById("q-image");
qImageInput.addEventListener("change", () => {
    questionLabel.innerText = "✅ تم اختيار صورة للسؤال";
});
let selectedCategory = localStorage.getItem("selected_category") || "";
const qPreview = document.getElementById("q-preview");

qImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    qPreview.src = URL.createObjectURL(file);
    qPreview.style.display = "block";
});
// ده بتاع اختيار الفئة
btn.onclick = async () => {
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

// الخطوة 2: JS (رفع الصورة + حفظ الفئة)
const addCatBtn = document.getElementById("add-cat-btn");
const catMsg = document.getElementById("cat-msg");
// ده بتاع إضافة الفئة
addCatBtn.onclick = async () => {
    const name = document.getElementById("new-cat-name").value.trim();

    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF ]/g, "")
        .replace(/\s+/g, "-") || "cat-" + Date.now();

    const group = document.getElementById("new-cat-group").value;

    const file = document.getElementById("new-cat-image").files[0];

    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    // ✅ تحقق من الاسم
    if (!name) {
        catMsg.innerText = "❌ اكتب اسم الفئة";
        return;
    }

    // ✅ لو فيه صورة
    let imageUrl = null;

    if (file) {
        if (!allowedTypes.includes(file.type)) {
            catMsg.innerText = "❌ مسموح JPG أو PNG أو WEBP بس";
            return;
        }

        try {
            const compressed = await compressImage(file);

            if (compressed.size > maxSize) {
                catMsg.innerText = "❌ الصورة بعد الضغط لسه كبيرة";
                return;
            }

            const storageRef = ref(storage, "categories/" + slug);
            await uploadBytes(storageRef, compressed);

            imageUrl = await getDownloadURL(storageRef);

        } catch (err) {
            console.error(err);
            catMsg.innerText = "❌ مشكلة في رفع الصورة";
            return;
        }
    }

    try {
        // ✅ منع التكرار
        const q = query(
            collection(db, "categories"),
            where("slug", "==", slug)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
            catMsg.innerText = "❌ الفئة موجودة بالفعل";
            return;
        }

        // 💾 حفظ الفئة
        await addDoc(collection(db, "categories"), {
            name,
            slug,
            group,
            image: imageUrl,
            createdAt: Date.now()
        });

        catMsg.innerText = "✅ الفئة اتضافت بنجاح";
        catMsg.style.color = "green";

        // 🔄 إعادة تحميل الفئات
        if (typeof loadCategories === "function") {
            loadCategories();
        }

    } catch (err) {
        console.error(err);
        catMsg.innerText = "❌ حصل خطأ";
    }
};
document.getElementById("new-cat-name").value = "";
document.getElementById("new-cat-image").value = "";
preview.style.display = "none";
const catContainer = document.getElementById("category-buttons");

async function loadCategories() {
    const snap = await getDocs(collection(db, "categories"));

    catContainer.innerHTML = "";

    snap.forEach(doc => {
        const cat = doc.data();

        const btn = document.createElement("button");
        btn.className = "cat-btn";
        btn.dataset.cat = cat.slug;
        btn.innerText = cat.name;

        // ✅ لو دي الفئة المختارة رجعها active
        if (cat.slug === selectedCategory) {
            btn.classList.add("active");
        }

        btn.onclick = () => {
            selectedCategory = cat.slug;

            // ❌ نشيل active من الكل
            document.querySelectorAll(".cat-btn").forEach(b => {
                b.classList.remove("active");
            });

            // ✅ نضيفه للزرار ده
            btn.classList.add("active");

            const qImageInput = document.getElementById("q-image");
            const label = document.querySelector('label[for="q-image"]');
            qImageInput.disabled = false;
            label.style.opacity = "1";
            label.innerText = "📸 ممكن تضيف صورة (اختياري)";
            document.getElementById("q-image").value = "";
            qPreview.style.display = "none";
        };

        catContainer.appendChild(btn);
    });
}

document.getElementById("new-cat-image").addEventListener("change", (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById("preview");

    if (file) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    }
});

loadCategories();