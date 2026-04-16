// public/js/admin/addc.js
import { db, storage, addDoc, collection, query, where, getDocs, ref, uploadBytes, getDownloadURL } from "/js/firebase.js";
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


// إضافة الفئة
addCatBtn.onclick = async () => {
    addCatBtn.disabled = true;
    addCatBtn.innerText = "⏳ جاري الإضافة...";

    const name = document.getElementById("new-cat-name").value.trim();

    if (!name) {
        catMsg.innerText = "❌ اكتب اسم الفئة";
        return;
    }

    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF ]/g, "")
        .replace(/\s+/g, "-");

    const group = document.getElementById("new-cat-group").value;
    const hidden = document.getElementById("cat-visibility").checked;
    const file = fileInput.files[0];

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
        catMsg.innerText = "❌ الفئة موجودة بالفعل";
        return;
    }

    await addDoc(collection(db, "categories"), {
        name,
        slug,
        group,
        image: imageUrl,
        hidden,
        createdAt: Date.now()
    });

    catMsg.innerText = "✅ الفئة اتضافت";

    // 🧹 reset
    document.getElementById("new-cat-name").value = "";
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

// document.addEventListener("DOMContentLoaded", () => {
//   loadCategories({ selectable: false, editable: true });
// });