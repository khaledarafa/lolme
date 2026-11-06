
import { functions, httpsCallable } from "/js/firebase.js";
import { jokesAuthReady } from "/js/jokes-auth.js";

const REACTIONS = [
  { type: "laugh", emoji: "😂", label: "ضحكتني" },
  { type: "love", emoji: "❤️", label: "عجبتني" },
  { type: "notFunny", emoji: "😐", label: "مش مضحكة" },
];

const setJokeReaction = httpsCallable(functions, "setJokeReaction");
const getMyJokeReactions = httpsCallable(functions, "getMyJokeReactions");

const statsByJoke = new Map();
const myReactions = new Map();

// طابور مستقل لكل نكتة.
const reactionQueues = new Map();
const processingJokes = new Set();

const numberFormat = new Intl.NumberFormat("ar-EG");

function emptyStats() {
  return {
    laugh: 0,
    love: 0,
    notFunny: 0,
  };
}

function emptySelection() {
  return {
    laugh: false,
    love: false,
    notFunny: false,
  };
}

function normalizeSelection(selection) {
  if (typeof selection === "string") {
    const normalized = emptySelection();

    if (REACTIONS.some((item) => item.type === selection)) {
      normalized[selection] = true;
    }

    return normalized;
  }

  return {
    ...emptySelection(),
    ...(selection || {}),
  };
}

function getStats(jokeId) {
  return {
    ...emptyStats(),
    ...(statsByJoke.get(jokeId) || {}),
  };
}

function renderReactionMount(mount) {
  const jokeId = mount.dataset.reactionsFor;
  if (!jokeId) return;

  const stats = getStats(jokeId);
  const selected = normalizeSelection(myReactions.get(jokeId));

  mount.classList.add("joke-reactions");
  mount.replaceChildren();

  for (const reaction of REACTIONS) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = `joke-reaction${
      selected[reaction.type] ? " is-selected" : ""
    }`;

    button.dataset.reactionType = reaction.type;
    button.dataset.jokeId = jokeId;

    // لا نعطل الأزرار أثناء إرسال الطلبات.
    button.disabled = false;

    button.setAttribute(
      "aria-pressed",
      String(selected[reaction.type]),
    );

    button.setAttribute(
      "aria-label",
      `${reaction.label}: ${stats[reaction.type] || 0}`,
    );

    const label = document.createElement("span");
    label.textContent = `${reaction.emoji} ${reaction.label}`;

    const count = document.createElement("span");
    count.className = "joke-reaction-count";
    count.textContent = numberFormat.format(stats[reaction.type] || 0);

    button.append(label, count);
    mount.append(button);
  }
}

function renderAllReactionMounts() {
  document
    .querySelectorAll("[data-reactions-for]")
    .forEach(renderReactionMount);
}

function playReactionAnimation(jokeId, reactionType) {
  const effects = {
    laugh: ["😂", "🤣", "💀", "😂"],
    love: ["❤️", "💖", "💕", "✨"],
    notFunny: ["😐", "🙄", "💀"],
  };

  const buttons = document.querySelectorAll(
    `button[data-joke-id="${CSS.escape(jokeId)}"][data-reaction-type="${reactionType}"]`,
  );

  buttons.forEach((button) => {
    const emoji = button.querySelector("span:first-child");
    if (!emoji) return;

    emoji.classList.remove("reaction-emoji-animate");

    void emoji.offsetWidth;

    emoji.classList.add("reaction-emoji-animate");

    const burst = document.createElement("span");
    burst.className = "reaction-burst";
    burst.textContent = effects[reactionType].join(" ");

    button.appendChild(burst);

    burst.addEventListener(
      "animationend",
      () => burst.remove(),
      { once: true },
    );

    emoji.addEventListener(
      "animationend",
      () => emoji.classList.remove("reaction-emoji-animate"),
      { once: true },
    );
  });
}

async function loadReactionStats() {
  const mine = await getMyJokeReactions();
  const data = mine.data || {};

  statsByJoke.clear();
  myReactions.clear();

  Object.entries(data.stats || {}).forEach(([jokeId, stats]) => {
    statsByJoke.set(jokeId, {
      laugh: Number(stats.laugh || 0),
      love: Number(stats.love || 0),
      notFunny: Number(stats.notFunny || 0),
    });
  });

  Object.entries(data.reactions || {}).forEach(([jokeId, selection]) => {
    const normalized = normalizeSelection(selection);

    if (Object.values(normalized).some(Boolean)) {
      myReactions.set(jokeId, normalized);
    }
  });

  renderAllReactionMounts();
}

// تطبيق التفاعل فورًا على الواجهة.
function applyOptimisticReaction(jokeId, reactionType) {
  const previousSelection = normalizeSelection(
    myReactions.get(jokeId),
  );

  const nextSelection = { ...previousSelection };

  // الضغط على التفاعل نفسه يلغي اختياره.
  if (nextSelection[reactionType]) {
    nextSelection[reactionType] = false;
  } else {
    nextSelection[reactionType] = true;

    // الضحك ومش مضحكة متعارضان فقط.
    if (reactionType === "laugh") {
      nextSelection.notFunny = false;
    }

    if (reactionType === "notFunny") {
      nextSelection.laugh = false;
    }
  }

  const nextStats = getStats(jokeId);

  for (const type of REACTIONS.map((item) => item.type)) {
    if (previousSelection[type] !== nextSelection[type]) {
      nextStats[type] = Math.max(
        0,
        nextStats[type] + (nextSelection[type] ? 1 : -1),
      );
    }
  }

  statsByJoke.set(jokeId, nextStats);

  if (Object.values(nextSelection).some(Boolean)) {
    myReactions.set(jokeId, nextSelection);
  } else {
    myReactions.delete(jokeId);
  }
}

// اعتماد النتيجة النهائية القادمة من السيرفر.
function applyServerResult(jokeId, payload) {
  if (payload.stats) {
    statsByJoke.set(jokeId, {
      laugh: Number(payload.stats.laugh || 0),
      love: Number(payload.stats.love || 0),
      notFunny: Number(payload.stats.notFunny || 0),
    });
  }

  if (payload.selectedReactions) {
    const selection = normalizeSelection(payload.selectedReactions);

    if (Object.values(selection).some(Boolean)) {
      myReactions.set(jokeId, selection);
    } else {
      myReactions.delete(jokeId);
    }
  }
}

// إرسال طلبات النكتة الواحدة بالترتيب.
async function processReactionQueue(jokeId) {
  if (processingJokes.has(jokeId)) return;

  processingJokes.add(jokeId);

  try {
    await jokesAuthReady;

    const queue = reactionQueues.get(jokeId);
    if (!queue) return;

    while (queue.length > 0) {
      // نأخذ أول طلب في الطابور.
      const reactionType = queue.shift();

      try {
        const result = await setJokeReaction({
          jokeId,
          reactionType,
        });

        const payload = result.data || {};

        // لا نستبدل الحالة المؤقتة بنتيجة قديمة
        // إذا كانت هناك طلبات أخرى تنتظر.
        if (queue.length === 0) {
          applyServerResult(jokeId, payload);
        }
      } catch (error) {
        console.error(
          "[LOLME Jokes] Reaction failed:",
          error,
        );

        // نعيد تحميل الحالة الحقيقية من السيرفر.
        // الطلب الذي فشل قد يكون وصل للسيرفر بالفعل،
        // لذلك لا نعيد إرساله مرة أخرى.
        try {
          await loadReactionStats();
        } catch (reloadError) {
          console.error(
            "[LOLME Jokes] Could not restore reactions:",
            reloadError,
          );
        }

        // نعيد تطبيق الطلبات التي لم تُرسل بعد
        // فوق الحالة الحقيقية الجديدة.
        for (const queuedType of queue) {
          applyOptimisticReaction(jokeId, queuedType);
        }

        renderAllReactionMounts();

        alert(
          "حصلت مشكلة أثناء تسجيل أحد التفاعلات. تم تحديث الحالة من السيرفر، حاول مرة أخرى.",
        );
      }

      renderAllReactionMounts();
    }
  } finally {
    processingJokes.delete(jokeId);

    const queue = reactionQueues.get(jokeId);

    if (queue && queue.length === 0) {
      reactionQueues.delete(jokeId);
    } else if (queue && queue.length > 0) {
      // لو وصل ضغط جديد أثناء انتهاء المعالجة.
      processReactionQueue(jokeId);
    }

    renderAllReactionMounts();
  }
}

function handleReactionClick(event) {
  const button = event.target.closest(
    "button[data-reaction-type][data-joke-id]",
  );

  if (!button) return;

  const jokeId = button.dataset.jokeId;
  const reactionType = button.dataset.reactionType;

  if (
    !jokeId ||
    !REACTIONS.some((item) => item.type === reactionType)
  ) {
    return;
  }

  // تحديث الواجهة فور الضغط.
  applyOptimisticReaction(jokeId, reactionType);

  // إضافة الطلب إلى طابور النكتة.
  if (!reactionQueues.has(jokeId)) {
    reactionQueues.set(jokeId, []);
  }

  reactionQueues.get(jokeId).push(reactionType);

  renderAllReactionMounts();

  playReactionAnimation(jokeId, reactionType);

  // تشغيل الطابور إذا لم تكن هناك معالجة جارية.
  processReactionQueue(jokeId);
}

// الاستماع لضغط أزرار التفاعل.
document.addEventListener("click", handleReactionClick);

// تحميل التفاعلات عند جاهزية هوية الزائر.
jokesAuthReady.then(loadReactionStats).catch((error) => {
  console.error(
    "[LOLME Jokes] Could not load reactions:",
    error,
  );
});
