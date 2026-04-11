// public/js/codes.js

import { db } from "/js/firebase.js";
import { doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.addEventListener("DOMContentLoaded", () => {

  const startBtn = document.getElementById("host-start");
  const joinBtn = document.getElementById("join-game");
  const codeInput = document.getElementById("room-code");

  function generateCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // function getPlayerName() {
  //   let name = localStorage.getItem("player_name");

  //   if (!name) {
  //     name = document.getElementById("player-name")?.value || "لاعب 😂";
  //     localStorage.setItem("player_name", name);
  //   }

  //   return name;
  // }
function getPlayerName() {
  const inputName = document.getElementById("player-name")?.value.trim();

  if (inputName) {
    localStorage.setItem("player_name", inputName);
    return inputName;
  }

  return localStorage.getItem("player_name") || "ادمن 😂";
}
  // 🎯 نجيب playerId ثابت لكل روم
  function getPlayerId(code) {
    let playerId = localStorage.getItem("player_" + code);

    if (!playerId) {
      playerId = "player_" + Date.now();
      localStorage.setItem("player_" + code, playerId);
    }

    return playerId;
  }

  startBtn?.addEventListener("click", async (e) => {
    // const password = prompt("🔒 اكتب كلمة السر:");

    // if (password !== "123456") {
    //   alert("❌ كلمة السر غلط يا نجم 😏");
    //   return;
    // }

    e.preventDefault(); // 🔥 مهم
    let roomCode;
    let roomRef;
    let snap;

    do {
      roomCode = generateCode();
      roomRef = doc(db, "rooms", roomCode);
      snap = await getDoc(roomRef);
    } while (snap.exists());

    const playerId = getPlayerId(roomCode);

    await setDoc(roomRef, {
      hostId: playerId,
      status: "waiting",
      players: {
        [playerId]: {
          name: getPlayerName(),
          score: 0
        }
      },
      currentQuestion: 0,
      createdAt: Date.now()
    });

    window.location.href = `/room/${roomCode}`;
  });
  // 🚪 JOIN ROOM
  joinBtn?.addEventListener("click", async () => {

    const code = codeInput.value.trim();

    console.log("🔥 محاولة دخول:", code);

    if (code.length !== 4) {
      // alert("اكتب الكود اللي صاحبك بعتهولك  😏");
      alert("اكتب الكود اللي صاحبك بعتهولك او ابدا لعبه جديده وابعت الكود لاصحابك 😏");
      return;
    }

    const roomRef = doc(db, "rooms", code);
    const snap = await getDoc(roomRef);

    // ❌ الروم مش موجودة
    if (!snap.exists()) {
      alert("الروم دي مش موجودة 😅");
      return;
    }

    const playerId = getPlayerId(code);

    // ✅ نضيفه أو نحدثه (مش duplicate)
    await updateDoc(roomRef, {
      [`players.${playerId}`]: {
        name: getPlayerName(),
        score: 0
      }
    });

    console.log("✅ دخل الروم:", playerId);

    window.location.href = `/room/${code}/player`;
  });

});
