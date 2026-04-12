// public/js/addq.js
import { db, storage } from "/js/firebase.js";
import { addDoc, collection, query, where, getDocs }
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { ref, uploadBytes, getDownloadURL }
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const btn = document.getElementById("add-q-btn");
const typeSelect = document.getElementById("q-type");
const optionsBox = document.getElementById("options-box");

typeSelect.addEventListener("change", () => {
    if (typeSelect.value === "text") {
        optionsBox.style.display = "none";
    } else {
        optionsBox.style.display = "block";
    }
});

const msg = document.getElementById("msg");
let selectedCategory = localStorage.getItem("selected_category") || "";

btn.onclick = async () => {
    const type = document.getElementById("q-type").value;
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

    if (!selectedCategory) {
        msg.innerText = "❌ اختار فئة الأول 👆";
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
            options: type === "choice" ? options : [],
            correct,
            type, // 👈 الجديد
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

    } catch (err) {
        console.error(err);
        msg.innerText = "❌ حصل خطأ";
        msg.style.color = "red";
    }
};

// الخطوة 2: JS (رفع الصورة + حفظ الفئة)
const addCatBtn = document.getElementById("add-cat-btn");
const catMsg = document.getElementById("cat-msg");

addCatBtn.onclick = async () => {

    const name = document.getElementById("new-cat-name").value.trim();
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF ]/g, "")
        .replace(/\s+/g, "-") || "cat-" + Date.now();

    const group = document.getElementById("new-cat-group").value;
    const file = document.getElementById("new-cat-image").files[0];

    if (!name || !file) {
        catMsg.innerText = "❌ املى كل البيانات";
        return;
    }

    try {
        // 📸 رفع الصورة
        const storageRef = ref(storage, "categories/" + slug);
        await uploadBytes(storageRef, file);

        const imageUrl = await getDownloadURL(storageRef);

        const q = query(
            collection(db, "categories"),
            where("slug", "==", slug)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
            catMsg.innerText = "❌ الفئة موجودة بالفعل";
            return;
        }

        // 💾 حفظ في فايرستور
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
    console.log("clicked", cat.slug);
            selectedCategory = cat.slug;
            localStorage.setItem("selected_category", selectedCategory);

            document.querySelectorAll(".cat-btn").forEach(b => {
                b.classList.remove("active");
            });

            btn.classList.add("active");
        };

        catContainer.appendChild(btn);
    });
}

loadCategories();