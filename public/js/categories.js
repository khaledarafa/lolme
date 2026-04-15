import { db, collection, getDocs } from "/js/firebase.js";

const catContainer = document.getElementById("category-buttons");

let selectedCategory = localStorage.getItem("selected_category") || "";

// export async function loadCategories() {
//     const snap = await getDocs(collection(db, "categories"));

//     catContainer.innerHTML = "";

//     snap.forEach(doc => {
//         const cat = doc.data();

//         const btn = document.createElement("button");
//         btn.className = "cat-btn";
//         btn.dataset.cat = cat.slug;
//         btn.innerText = cat.name;

//         if (cat.slug === selectedCategory) {
//             btn.classList.add("active");
//         }

//         btn.onclick = () => {
//             selectedCategory = cat.slug;
//             localStorage.setItem("selected_category", cat.slug);

//             document.querySelectorAll(".cat-btn").forEach(b => {
//                 b.classList.remove("active");
//             });

//             btn.classList.add("active");
//         };

//         catContainer.appendChild(btn);
//     });
// }
export async function loadCategories({ selectable = true } = {}) {
    const snap = await getDocs(collection(db, "categories"));

    catContainer.innerHTML = "";

    snap.forEach(doc => {
        const cat = doc.data();

        const btn = document.createElement("button");
        btn.className = "cat-btn";
        btn.innerText = cat.name;

        // 👇 لو selectable = true → يبقى زي ما هو
        if (selectable) {
            btn.onclick = () => {
                selectedCategory = cat.slug;
                localStorage.setItem("selected_category", cat.slug);

                document.querySelectorAll(".cat-btn").forEach(b => {
                    b.classList.remove("active");
                });

                btn.classList.add("active");
            };
        } else {
            // 👇 display فقط
            btn.style.cursor = "default";
            btn.style.opacity = "0.7";
        }

        catContainer.appendChild(btn);
    });
}