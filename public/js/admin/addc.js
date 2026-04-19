// public/js/admin/addc.js
import { db, storage, addDoc, collection, query, where, getDocs, ref, uploadBytes, getDownloadURL, updateDoc, deleteDoc, doc } from "/js/firebase.js";
import { loadCategories } from "/js/categories.js";

window.initAddC = function () {
    const container = document.querySelector("#addc .category-buttons");

    loadCategories(container, { selectable: false, editable: true });
};

// عناصر
const addCatBtn = document.getElementById("add-cat-btn");
const catMsg = document.getElementById("cat-msg");
const fileInput = document.getElementById("new-cat-image");
const preview = document.getElementById("preview");

const toggle = document.getElementById("cat-visibility");
const visibilityText = document.getElementById("visibility-text");
const actionsBox = document.getElementById("cat-actions");
const editBtn = document.getElementById("edit-cat");
const deleteBtn = document.getElementById("delete-cat");
const cancelBtn = document.getElementById("cancel-cat");

let currentCatId = null;
let currentCatData = null;
toggle.addEventListener("change", () => {
    visibilityText.innerText = toggle.checked ? "🙈 مخفية" : "👁️ ظاهرة";
});

// ضغط الصورة
function compressImage(file) {
    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => img.src = e.target.result;

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const maxWidth = 400;
            const scale = maxWidth / img.width;

            canvas.width = maxWidth;
            canvas.height = img.height * scale;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                resolve(blob);
            }, "image/webp", 0.5);
        };

        reader.readAsDataURL(file);
    });
}

// preview
fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const compressed = await compressImage(file);
    preview.src = URL.createObjectURL(compressed);
    preview.style.display = "block";
});

function slugifyArabic(text) {
    return text
        .toLowerCase()
        .replace(/ع/g, "3")
        .replace(/ء|أ|إ|آ/g, "a")
        .replace(/ب/g, "b")
        .replace(/ت/g, "t")
        .replace(/ث/g, "th")
        .replace(/ج/g, "g")
        .replace(/ح/g, "7")
        .replace(/خ/g, "kh")
        .replace(/د/g, "d")
        .replace(/ذ/g, "z")
        .replace(/ر/g, "r")
        .replace(/ز/g, "z")
        .replace(/س/g, "s")
        .replace(/ش/g, "sh")
        .replace(/ص/g, "s")
        .replace(/ض/g, "d")
        .replace(/ط/g, "t")
        .replace(/ظ/g, "z")
        .replace(/غ/g, "gh")
        .replace(/ف/g, "f")
        .replace(/ق/g, "q")
        .replace(/ك/g, "k")
        .replace(/ل/g, "l")
        .replace(/م/g, "m")
        .replace(/ن/g, "n")
        .replace(/ه/g, "h")
        .replace(/و/g, "w")
        .replace(/ي/g, "y")
        .replace(/\s+/g, "-");
}

// إضافة الفئة
addCatBtn.onclick = async () => {
    addCatBtn.disabled = true;
    addCatBtn.innerText = "⏳ جاري الإضافة...";

    const name = document.getElementById("new-cat-name").value.trim();

    if (!name) {
        catMsg.innerText = "❌ اكتب اسم الفئة";
        return;
    }

    let slug = document.getElementById("new-cat-slug").value.trim().toLowerCase();

    if (!slug) {
        slug = slugifyArabic(name);
    }

    // تنظيف السلاج
    slug = slug
        .replace(/[^a-z0-9-]/g, "")
        .replace(/\s+/g, "-");

    const group = document.getElementById("new-cat-group").value;
    const hidden = document.getElementById("cat-visibility").checked;
    const file = fileInput.files[0];

    const roles = Array.from(document.querySelectorAll(".cat-role:checked"))
        .map(el => el.value);

    let imageUrl = null;

    if (file) {
        const compressed = await compressImage(file);
        const storageRef = ref(storage, "categories/" + slug);

        await uploadBytes(storageRef, compressed);
        imageUrl = await getDownloadURL(storageRef);
    }

    const q = query(collection(db, "categories"), where("slug", "==", slug));
    const snap = await getDocs(q);

    if (!snap.empty) {
        const docSnap = snap.docs[0];

        currentCatId = docSnap.id;
        currentCatData = docSnap.data();

        catMsg.innerText = "⚠️ الفئة موجودة بالفعل";
        catMsg.style.color = "#facc15";

        actionsBox.style.display = "flex";

        addCatBtn.disabled = false;
        addCatBtn.innerText = "➕ إضافة الفئة";

        return;
    }

    await addDoc(collection(db, "categories"), {
        name,
        slug,
        group,
        image: imageUrl,
        hidden,
        roles: roles.length ? roles : ["player", "admin", "host"],
        createdAt: Date.now()
    });

    catMsg.innerText = "✅ الفئة اتضافت";
    preview.style.display = "none";
    document.querySelectorAll(".cat-role").forEach(el => el.checked = true);
    // 🧹 reset
    document.getElementById("new-cat-name").value = "";
    document.getElementById("new-cat-slug").value = "";
    document.getElementById("cat-visibility").checked = false;
    fileInput.value = "";
    preview.style.display = "none";
    visibilityText.innerText = "👁️ ظاهرة";

    catMsg.style.color = "green";

    addCatBtn.disabled = false;
    addCatBtn.innerText = "➕ إضافة الفئة";
    // loadCategories({ selectable: false, editable: true });
};

toggle.addEventListener("change", () => {
    if (toggle.checked) {
        visibilityText.innerText = "🙈 مخفية";
        visibilityText.classList.add("hidden");
    } else {
        visibilityText.innerText = "👁️ ظاهرة";
        visibilityText.classList.remove("hidden");
    }
});
editBtn.onclick = async () => {
    const roles = Array.from(document.querySelectorAll(".cat-role:checked"))
        .map(el => el.value);

    await updateDoc(doc(db, "categories", currentCatId), {
        name: document.getElementById("new-cat-name").value.trim(),
        group: document.getElementById("new-cat-group").value,
        hidden: document.getElementById("cat-visibility").checked,
        roles: roles.length ? roles : ["player", "admin", "host"]
    });

    catMsg.innerText = "✏️ تم التعديل";
    catMsg.style.color = "#22c55e";

    actionsBox.style.display = "none";
};
deleteBtn.onclick = async () => {
    if (!confirm("متأكد تمسح الفئة؟ 😏")) return;

    await deleteDoc(doc(db, "categories", currentCatId));

    catMsg.innerText = "🗑️ تم الحذف";
    catMsg.style.color = "red";

    actionsBox.style.display = "none";
};
cancelBtn.onclick = () => {
    actionsBox.style.display = "none";
    catMsg.innerText = "❌ تم الإلغاء";
};
// document.addEventListener("DOMContentLoaded", () => {
//   loadCategories({ selectable: false, editable: true });
// });