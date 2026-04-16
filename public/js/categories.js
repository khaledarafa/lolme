// public/js/categories.js
import { db, collection, getDocs, doc, updateDoc } from "/js/firebase.js";

const catContainer = document.getElementById("category-buttons");


export async function loadCategories(container, { selectable = true, editable = false } = {}) {
    if (!container) return;

    const snap = await getDocs(collection(db, "categories"));

    container.innerHTML = "";

    snap.forEach(docSnap => {
        const cat = docSnap.data();

        const wrapper = document.createElement("div");
        wrapper.className = "cat-item";

        const btn = document.createElement("button");
        btn.className = "cat-btn";

        const text = document.createElement("span");
        text.innerText = cat.name;

        btn.appendChild(text);

        // ✅ اختيار الفئة
        if (selectable) {
            btn.onclick = () => {
                localStorage.setItem("selected_category", cat.slug);

                container.querySelectorAll(".cat-btn").forEach(b => {
                    b.classList.remove("active");
                });

                btn.classList.add("active");
            };

            // 👇 يرجع الاختيار القديم
            const saved = localStorage.getItem("selected_category");
            if (saved === cat.slug) {
                btn.classList.add("active");
            }
        }

        // 👁️ toggle
        if (editable) {
            const toggle = document.createElement("span");
            toggle.innerText = cat.hidden ? "🙈" : "👁️";
            toggle.className = "cat-toggle";

            toggle.onclick = async (e) => {
                e.stopPropagation();

                await updateDoc(doc(db, "categories", docSnap.id), {
                    hidden: !cat.hidden
                });

                loadCategories(container, { selectable, editable: true });
            };

            if (cat.hidden) {
                btn.style.opacity = "0.4";
            }

            wrapper.appendChild(btn);
            wrapper.appendChild(toggle);
        } else {
            wrapper.appendChild(btn);
        }

        container.appendChild(wrapper);
    });
}
// قبل المكون⃁
// export async function loadCategories({ selectable = true, editable = false } = {}) {
//     const snap = await getDocs(collection(db, "categories"));

//     catContainer.innerHTML = "";

//     snap.forEach(docSnap => {
//         const cat = docSnap.data();

//         // 👇 wrapper (ده أهم تعديل)
//         const wrapper = document.createElement("div");
//         wrapper.className = "cat-item";

//         // 👇 الزرار (عرض أو اختيار)
//         const btn = document.createElement("button");
//         btn.className = "cat-btn";

//         const text = document.createElement("span");
//         text.innerText = cat.name;

//         btn.appendChild(text);

//         // ✅ اختيار الفئة (في addq)
//         if (selectable) {
//             btn.onclick = () => {
//                 selectedCategory = cat.slug;
//                 localStorage.setItem("selected_category", cat.slug);

//                 document.querySelectorAll(".cat-btn").forEach(b => {
//                     b.classList.remove("active");
//                 });

//                 btn.classList.add("active");
//             };
//         } else {
//             btn.style.cursor = "default";
//         }

//         // 👁️ toggle (برا الزرار)
//         if (editable) {
//             const toggle = document.createElement("span");
//             toggle.innerText = cat.hidden ? "🙈" : "👁️";
//             toggle.className = "cat-toggle";

//             toggle.onclick = async (e) => {
//                 e.stopPropagation();

//                 await updateDoc(doc(db, "categories", docSnap.id), {
//                     hidden: !cat.hidden
//                 });

//                 loadCategories({ selectable, editable: true });
//             };

//             // 👇 شكل الفئة لو مخفية
//             if (cat.hidden) {
//                 btn.style.opacity = "0.4";
//             }

//             wrapper.appendChild(btn);
//             wrapper.appendChild(toggle);
//         } else {
//             wrapper.appendChild(btn);
//         }

//         catContainer.appendChild(wrapper);
//     });
// }