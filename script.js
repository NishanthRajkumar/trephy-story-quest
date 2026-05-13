/* quiz data lives in config.js — loaded before this script */
const appData = window.StoryQuestConfig;

/* ── safe DOM query with try-catch guard ── */
function qs(id) {
  try {
    return document.getElementById(id);
  } catch {
    return null;
  }
}

const stages = {
  intro: qs("stageIntro"),
  bridge: qs("stageBridge"),
  quiz: qs("stageQuiz"),
  reward: qs("stageReward"),
  final: qs("stageFinal")
};

const progressLabel       = qs("progressLabel");
const questionCounter     = qs("questionCounter");
const questionPrompt      = qs("questionPrompt");
const optionGrid          = qs("optionGrid");
const feedbackBox         = qs("feedbackBox");
const revealBtn           = qs("revealBtn");
const rewardTitle         = qs("rewardTitle");
const rewardText          = qs("rewardText");
const rewardCoupon        = qs("rewardCoupon");
const rewardMediaFrame    = qs("rewardMediaFrame");
const rewardImage         = qs("rewardImage");
const rewardVideo         = qs("rewardVideo");
const rewardVideoSource   = qs("rewardVideoSource");
const finalPlan           = qs("finalPlan");
const finalDeal           = qs("finalDeal");
const finalNote           = qs("finalNote");
const earnedCouponList    = qs("earnedCouponList");
const lostCouponList      = qs("lostCouponList");
const finalCouponMessage  = qs("finalCouponMessage");
const shareImageContainer = qs("shareImageContainer");
const anniversaryInfo     = qs("anniversaryInfo");

const yesBtn        = qs("yesBtn");
const noBtn         = qs("noBtn");
const startQuestBtn = qs("startQuestBtn");
const nextBtn       = qs("nextBtn");
const restartBtn    = qs("restartBtn");
const shareBtn      = qs("shareBtn");
const confettiBtn   = qs("confettiBtn");
const darkModeToggle = qs("darkModeToggle");
const soundToggle   = qs("soundToggle");
const quizMeta      = qs("quizMeta");
const streakCountEl = qs("streakCount");
const timerDisplay  = qs("timerDisplay");
const srAnnounce    = qs("srAnnounce");

const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
const videoPosterCache = new Map();
const POSTER_STORAGE_PREFIX = "storyquest:poster:";

function getStoredPoster(src) {
  try {
    return window.localStorage.getItem(POSTER_STORAGE_PREFIX + src);
  } catch {
    return null;
  }
}

function savePosterToStorage(src, dataUrl) {
  try {
    window.localStorage.setItem(POSTER_STORAGE_PREFIX + src, dataUrl);
  } catch {
    // storage quota exceeded; in-memory cache still works
  }
}

function announce(text) {
  if (!srAnnounce) return;
  srAnnounce.textContent = "";
  window.setTimeout(() => {
    srAnnounce.textContent = text;
  }, 50);
}

/* ── State ── */
let noClickCount = 0;
let currentQuestion = 0;
let questionWrongAttempts = [];
let earnedCoupons = [];
let lostCoupons = [];
let quizLocked = false;
let pendingReveal = null;
let userNegotiated = false;
let streakCount = 0;
let maxStreak = 0;
let timerSecondsLeft = 0;
let timerInterval = null;

/* Randomised teasing message pools */
const wrongAttemptMessagePools = [
  [
    "Nooope 😄 Almost there, baby. Try one more time!",
    "Oops! Not quite right 💕 One more shot!",
    "Hmm, that memory seems a bit fuzzy? Try again!",
    "So close! But that is not it 🙈 Give it another go!"
  ],
  [
    "Second miss detected 😅 You are adorable, but that answer is still illegal.",
    "Still nope! Your confidence is cute though 😂 Last try before I help!",
    "Two misses! The right answer is playing hide and seek 🙈",
    "Hmm, the answer is hiding 🤭 One last chance — I believe in you!"
  ],
  [
    "Third miss! 🚨 Reveal mode unlocked.",
    "Okay okay, I will help you out 😜 Here comes the reveal!",
    "Three strikes! Time to peek at the answer 👀",
    "The answer has escaped! Time for the big reveal 🎪"
  ]
];

let playerStats = { questionStartTimes: [], questionDurations: [], hesitated: [] };
let easterEggClickCount = 0;

/* ── Utility helpers ── */
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function haptic(pattern) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern || [10]); } catch { /* not supported */ }
  }
}

function showToast(text, duration) {
  const container = qs("toastContainer");
  if (!container) return;
  const ms = duration || 3500;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = text;
  container.appendChild(toast);
  const dismiss = () => {
    if (!toast.parentNode) return;
    toast.classList.add("dismissing");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  };
  window.setTimeout(dismiss, ms);
  toast.addEventListener("click", dismiss);
}

function triggerEasterEgg() {
  const messages = [
    "🥚 Secret found! You are absolutely irresistible 💕",
    "🌟 Easter egg unlocked! Trephy has a superpower: making everything better.",
    "🎊 You found it! This app was made with 100% pure love for you.",
    "💝 Secret discovered! Every click makes me fall more in love."
  ];
  confetti.burst(200);
  audioSystem.play("celebrate");
  showToast(randomFrom(messages), 5000);
  haptic([20, 100, 20, 100, 20]);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

/* ── Audio ── */
const audioSystem = {
  ctx: null,
  enabled: true,
  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
  },
  play(type) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    const notesByType = {
      correct: [523.25, 659.25, 783.99],
      incorrect: [220],
      streak: [523.25, 659.25, 783.99, 1046.5],
      countdown: [880],
      celebrate: [523.25, 587.33, 659.25, 783.99, 880]
    };
    const notes = notesByType[type] || notesByType.correct;
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type === "incorrect" ? "square" : "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.14, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.25);
    });
  },
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
};

/* ── Confetti ── */
function ensureConfettiCanvas() {
  let canvas = qs("confettiCanvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "confettiCanvas";
    document.body.appendChild(canvas);
  }
  return canvas;
}

const confetti = {
  canvas: ensureConfettiCanvas(),
  ctx: null,
  particles: [],
  running: false,
  init() {
    this.ctx = this.canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
  },
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },
  burst(count) {
    const n = count || 150;
    this.resize();
    for (let i = 0; i < n; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x: this.canvas.width / 2,
        y: this.canvas.height * 0.35,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 3 + Math.random() * 5,
        color: ["#ff6f4a", "#ff9f7a", "#56b3ad", "#ffd166", "#f06292"][Math.floor(Math.random() * 5)],
        alpha: 1
      });
    }
    if (!this.running) { this.running = true; this.animate(); }
  },
  burstAt(x, y, count, colors) {
    const n = count || 25;
    const palette = colors || ["#ff6f4a", "#ff9f7a", "#56b3ad", "#ffd166", "#f06292"];
    this.resize();
    for (let i = 0; i < n; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 2 + Math.random() * 4,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1
      });
    }
    if (!this.running) { this.running = true; this.animate(); }
  },
  animate() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles = this.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.vx *= 0.99;
      p.alpha *= 0.992;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
      return p.alpha > 0.05 && p.y < this.canvas.height + 20;
    });
    this.ctx.globalAlpha = 1;
    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.animate());
    } else {
      this.running = false;
    }
  }
};

/* ── Stage navigation ── */
function showStage(target, animType) {
  stopQuestionTimer();
  Object.values(stages).forEach((section) => {
    if (section) section.classList.remove("is-active", "anim-slide-right", "anim-slide-left", "anim-scale-in");
  });
  if (!target) return;
  target.classList.add("is-active");
  if (animType && animType !== "default") {
    target.classList.add("anim-" + animType);
    target.addEventListener("animationend", () => {
      target.classList.remove("anim-" + animType);
    }, { once: true });
  }
  window.setTimeout(() => {
    const focusTarget = target.querySelector("h1, h2") || target;
    if (!focusTarget.hasAttribute("tabindex")) {
      focusTarget.setAttribute("tabindex", "-1");
    }
    focusTarget.focus({ preventScroll: false });
  }, 50);
  if (quizMeta) quizMeta.hidden = target !== stages.quiz;
  if (target === stages.quiz) startQuestionTimer();
}

/* ── Reward media ── */
function resetRewardMedia() {
  if (rewardMediaFrame) rewardMediaFrame.hidden = true;
  if (rewardImage) {
    rewardImage.hidden = true;
    rewardImage.removeAttribute("src");
    rewardImage.alt = "";
  }
  if (rewardVideo) {
    rewardVideo.hidden = true;
    rewardVideo.pause();
    rewardVideo.removeAttribute("aria-label");
    rewardVideo.removeAttribute("poster");
  }
  if (rewardVideoSource) rewardVideoSource.src = "";
  if (rewardVideo) rewardVideo.load();
}

function renderRewardMedia(media) {
  resetRewardMedia();
  if (!media) return;
  if (rewardMediaFrame) rewardMediaFrame.hidden = false;
  if (media.type === "video") {
    if (rewardVideoSource) rewardVideoSource.src = media.src;
    if (rewardVideo) {
      rewardVideo.setAttribute("aria-label", media.alt || "Unlocked video memory");
      rewardVideo.hidden = false;
      rewardVideo.load();
      applyVideoPoster(rewardVideo, media.src);
    }
    return;
  }
  if (rewardImage) {
    rewardImage.src = media.src;
    rewardImage.alt = media.alt || "Unlocked memory";
    rewardImage.hidden = false;
  }
}

function pickWrongAnswerMedia() {
  const index = Math.floor(Math.random() * appData.wrongAnswerMedia.length);
  return appData.wrongAnswerMedia[index];
}

/* ── Video poster ── */
function generateVideoPoster(videoElement, src) {
  if (videoPosterCache.has(src)) {
    videoElement.poster = videoPosterCache.get(src);
    return;
  }
  const captureVideo = document.createElement("video");
  captureVideo.muted = true;
  captureVideo.playsInline = true;
  captureVideo.preload = "auto";
  captureVideo.src = src;
  const cleanup = () => {
    captureVideo.pause();
    captureVideo.removeAttribute("src");
    captureVideo.load();
  };
  captureVideo.addEventListener("loadeddata", () => {
    const canvas = document.createElement("canvas");
    canvas.width = captureVideo.videoWidth;
    canvas.height = captureVideo.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) { cleanup(); return; }
    context.drawImage(captureVideo, 0, 0, canvas.width, canvas.height);
    const posterDataUrl = canvas.toDataURL("image/jpeg", 0.86);
    videoPosterCache.set(src, posterDataUrl);
    savePosterToStorage(src, posterDataUrl);
    videoElement.poster = posterDataUrl;
    cleanup();
  }, { once: true });
  captureVideo.addEventListener("error", () => { cleanup(); }, { once: true });
}

function applyVideoPoster(videoElement, src) {
  if (videoPosterCache.has(src)) {
    videoElement.poster = videoPosterCache.get(src);
    return;
  }
  const stored = getStoredPoster(src);
  if (stored) {
    videoPosterCache.set(src, stored);
    videoElement.poster = stored;
    return;
  }
  videoElement.removeAttribute("poster");
  generateVideoPoster(videoElement, src);
}

/* ── Streak ── */
function updateStreakDisplay() {
  if (streakCountEl) streakCountEl.textContent = String(streakCount);
  const streakDisplay = qs("streakDisplay");
  if (streakDisplay) {
    streakDisplay.classList.remove("pulse");
    void streakDisplay.offsetWidth;
    streakDisplay.classList.add("pulse");
  }
}

function resetStreak() {
  streakCount = 0;
  updateStreakDisplay();
}

function onCorrectAnswer() {
  streakCount += 1;
  maxStreak = Math.max(maxStreak, streakCount);
  updateStreakDisplay();
  if (streakCount > 0 && streakCount % 3 === 0) {
    audioSystem.play("streak");
    confetti.burst(80);
  } else {
    audioSystem.play("correct");
  }
}

function onWrongAnswer() {
  resetStreak();
  audioSystem.play("incorrect");
}

/* ── Timer ── */
function updateTimerDisplay() {
  if (!timerDisplay) return;
  timerDisplay.textContent = "⏱️ " + timerSecondsLeft + "s";
  timerDisplay.classList.toggle("warning", timerSecondsLeft <= 5 && timerSecondsLeft > 0);
}

function stopQuestionTimer() {
  if (timerInterval) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

function handleQuestionTimeout() {
  if (quizLocked) return;
  handleWrongAttempt(true);
}

function startQuestionTimer() {
  stopQuestionTimer();
  timerSecondsLeft = 20;
  updateTimerDisplay();
  timerInterval = window.setInterval(() => {
    timerSecondsLeft -= 1;
    updateTimerDisplay();
    if (timerSecondsLeft === 10) {
      announce("10 seconds remaining");
    } else if (timerSecondsLeft === 5) {
      announce("5 seconds remaining, hurry!");
      playerStats.hesitated[currentQuestion] = true;
    }
    if (timerSecondsLeft <= 5 && timerSecondsLeft > 0) audioSystem.play("countdown");
    if (timerSecondsLeft <= 0) {
      stopQuestionTimer();
      announce("Time is up!");
      handleQuestionTimeout();
    }
  }, 1000);
}

/* ── Intro "No" button ── */
function moveNoButton() {
  const shouldDodge = noClickCount < 3;
  if (shouldDodge && !isCoarsePointer) {
    const x = Math.round(Math.random() * 220);
    const y = Math.round(Math.random() * 90);
    if (noBtn) noBtn.style.transform = "translate(" + (-x) + "px, " + y + "px)";
  }
  if (shouldDodge && isCoarsePointer) {
    if (noBtn) noBtn.style.transform = "translate(0, 0)";
  }
  noClickCount += 1;
  const labelIndex = Math.min(noClickCount, appData.introNoLabels.length - 1);
  if (noBtn) noBtn.textContent = appData.introNoLabels[labelIndex];
  if (!shouldDodge) {
    if (noBtn) noBtn.style.transform = "translate(0, 0)";
    userNegotiated = true;
    if (progressLabel) progressLabel.textContent = "Negotiation successful";
    showStage(stages.bridge, "slide-right");
  }
}

/* ── Quiz rendering ── */
function renderQuestion() {
  const total = appData.checkpoints.length;
  const item = appData.checkpoints[currentQuestion];
  if (questionCounter) questionCounter.textContent = "Checkpoint " + (currentQuestion + 1) + " of " + total;
  if (questionPrompt) questionPrompt.textContent = item.prompt;
  if (optionGrid) {
    optionGrid.innerHTML = "";
    item.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option";
      button.textContent = option;
      button.addEventListener("click", (e) => onOptionSelect(index, e));
      optionGrid.appendChild(button);
    });
  }
  if (feedbackBox) {
    feedbackBox.hidden = true;
    feedbackBox.textContent = "";
    feedbackBox.className = "feedback";
  }
  if (revealBtn) revealBtn.hidden = true;
  quizLocked = false;
  pendingReveal = null;
  resetRewardMedia();
  playerStats.questionStartTimes[currentQuestion] = Date.now();
}

function renderCouponList(target, values, emptyText) {
  if (!target) return;
  target.innerHTML = "";
  if (values.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = emptyText;
    target.appendChild(emptyItem);
    return;
  }
  values.forEach((coupon) => {
    const item = document.createElement("li");
    item.textContent = coupon;
    target.appendChild(item);
  });
}

/* ── Enhanced share card ── */
function renderShareCard() {
  if (!shareImageContainer) return;
  shareImageContainer.innerHTML = "";
  const total = appData.checkpoints.length;
  const score = earnedCoupons.length;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 680;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, "#fff7ea");
  bg.addColorStop(0.45, "#ffe0c8");
  bg.addColorStop(1, "#ffd7b3");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const dotColors = ["#ff6f4a", "#ff9f7a", "#56b3ad", "#ffd166", "#f06292", "#a78bfa"];
  for (let i = 0; i < 90; i++) {
    ctx.globalAlpha = 0.18 + Math.random() * 0.28;
    ctx.fillStyle = dotColors[Math.floor(Math.random() * dotColors.length)];
    const dx = Math.random() * canvas.width;
    const dy = Math.random() * canvas.height;
    const dw = 5 + Math.random() * 12;
    const dh = 4 + Math.random() * 6;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(Math.random() * Math.PI * 2);
    ctx.fillRect(-dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
  roundRect(ctx, 50, 44, canvas.width - 100, canvas.height - 88, 36);
  ctx.fill();

  ctx.fillStyle = "#2f243a";
  ctx.font = "bold 58px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Our Story Quest", canvas.width / 2, 132);

  ctx.strokeStyle = "rgba(255, 111, 74, 0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(180, 158);
  ctx.lineTo(canvas.width - 180, 158);
  ctx.stroke();

  ctx.font = "50px sans-serif";
  var heartStr = "";
  for (var hi = 0; hi < total; hi++) {
    heartStr += (hi < score ? "\u2764\uFE0F" : "\uD83E\uDD0D");
    if (hi < total - 1) heartStr += "  ";
  }
  ctx.fillText(heartStr, canvas.width / 2, 234);

  ctx.fillStyle = "#ff6f4a";
  ctx.font = "bold 44px Outfit, sans-serif";
  ctx.fillText(score + " of " + total + " memories unlocked", canvas.width / 2, 310);

  ctx.fillStyle = "#2e7d78";
  ctx.font = "32px Outfit, sans-serif";
  ctx.fillText("\uD83D\uDD25 Best streak: " + maxStreak, canvas.width / 2, 374);

  ctx.font = "italic 24px Georgia, serif";
  ctx.fillStyle = "#6d5b79";
  ctx.fillText("Made with love \u2665  Nish", canvas.width / 2, 438);

  const img = document.createElement("img");
  img.alt = "Story quest score card";
  img.src = canvas.toDataURL("image/png");
  shareImageContainer.appendChild(img);
}

function renderAnniversaryInfo() {
  if (!anniversaryInfo) return;
  const storedDate = window.localStorage.getItem("anniversaryDate");
  if (!storedDate) return;
  const date = new Date(storedDate);
  if (Number.isNaN(date.getTime())) {
    anniversaryInfo.textContent = "Anniversary date format looks invalid. Use YYYY-MM-DD.";
    return;
  }
  const now = new Date();
  const next = new Date(now.getFullYear(), date.getMonth(), date.getDate());
  if (next < now) next.setFullYear(next.getFullYear() + 1);
  const daysLeft = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  anniversaryInfo.textContent =
    daysLeft <= 0
      ? "Happy anniversary! \uD83C\uDF89"
      : "Anniversary in " + daysLeft + " day" + (daysLeft === 1 ? "" : "s") + " \uD83D\uDC95";
}

/* ── Player analysis ── */
function renderPlayerAnalysis() {
  const el = qs("playerAnalysis");
  if (!el) return;
  const total = appData.checkpoints.length;
  const insights = [];

  const durations = playerStats.questionDurations;
  const validDurations = durations.filter((d) => d > 0);
  if (validDurations.length > 0) {
    const minDuration = Math.min.apply(null, validDurations);
    const fastIdx = durations.indexOf(minDuration);
    if (minDuration <= 8) {
      insights.push("\u26A1 Lightning reflexes on question " + (fastIdx + 1) + " — answered in just " + minDuration + "s!");
    }
  }

  const hesitatedQs = playerStats.hesitated.reduce((acc, h, i) => (h ? acc.concat([i + 1]) : acc), []);
  if (hesitatedQs.length > 0) {
    insights.push(
      "\u23F0 The clock was ticking on question" + (hesitatedQs.length > 1 ? "s" : "") + " " + hesitatedQs.join(" & ") + " — cutting it close! \uD83D\uDE05"
    );
  }

  const hardQs = questionWrongAttempts.reduce((acc, w, i) => (w >= 2 ? acc.concat([i + 1]) : acc), []);
  if (hardQs.length > 0) {
    const totalWrong = hardQs.reduce((sum, q) => sum + questionWrongAttempts[q - 1], 0);
    insights.push(
      "\uD83E\uDD14 Question" + (hardQs.length > 1 ? "s" : "") + " " + hardQs.join(" & ") +
      " put up a fight with " + totalWrong + " wrong guess" + (totalWrong > 1 ? "es" : "") + " total."
    );
  }

  if (earnedCoupons.length === total && questionWrongAttempts.every((a) => a === 0)) {
    insights.push("\uD83C\uDFC6 Flawless! First-try correct on every checkpoint. Absolute memory queen!");
  } else if (earnedCoupons.length === total) {
    insights.push("\uD83D\uDCAF All coupons earned! Memory on point.");
  }

  if (maxStreak >= 3) {
    insights.push("\uD83D\uDD25 You built a streak of " + maxStreak + " in a row — impressive!");
  }

  if (insights.length === 0) {
    insights.push("\uD83D\uDCCA You played it steady — cool, calm, and collected throughout.");
  }

  el.innerHTML =
    "<p class=\"analysis-title\">Your Player Analysis \uD83D\uDD0D</p>" +
    insights.map((ins) => "<p class=\"analysis-item\">" + ins + "</p>").join("");
}

/* ── Final summary ── */
function showFinalCouponSummary() {
  if (earnedCouponList) renderCouponList(earnedCouponList, earnedCoupons, "No coupons earned yet.");
  if (lostCouponList) renderCouponList(lostCouponList, lostCoupons, "No coupons missed.");
  renderShareCard();
  renderAnniversaryInfo();
  renderPlayerAnalysis();
  if (finalCouponMessage) {
    if (lostCoupons.length > 0) {
      finalCouponMessage.textContent = "Plot twist \uD83D\uDE0E Even the missed coupons are yours now. You have got all the coupons.";
    } else {
      finalCouponMessage.textContent = "Perfect score energy \u2728 You earned every single coupon.";
    }
  }
}

/* ── Wrong attempt handler ── */
function handleWrongAttempt(fromTimeout) {
  const item = appData.checkpoints[currentQuestion];
  const correctAnswer = item.options[item.answerIndex];
  questionWrongAttempts[currentQuestion] += 1;
  const wrongAttempt = questionWrongAttempts[currentQuestion];

  if (fromTimeout) {
    haptic([80]);
    playerStats.hesitated[currentQuestion] = true;
  }

  if (wrongAttempt < 3) {
    onWrongAnswer();
    if (feedbackBox) {
      feedbackBox.hidden = false;
      feedbackBox.className = "feedback error";
      const pool = wrongAttemptMessagePools[wrongAttempt - 1] || wrongAttemptMessagePools[0];
      feedbackBox.textContent = fromTimeout ? "\u23F0 Time is up. " + randomFrom(pool) : randomFrom(pool);
    }
    startQuestionTimer();
    return;
  }

  onWrongAnswer();
  lostCoupons.push(item.coupon);
  if (feedbackBox) {
    feedbackBox.hidden = false;
    feedbackBox.className = "feedback error";
    feedbackBox.textContent =
      (fromTimeout ? "\u23F0 Time is up. " : "") +
      randomFrom(wrongAttemptMessagePools[2]) +
      " Correct answer: " + correctAnswer;
  }
  pendingReveal = { correctAnswer, coupon: item.coupon, media: pickWrongAnswerMedia() };
  quizLocked = true;
  if (revealBtn) revealBtn.hidden = false;
}

/* ── Option selection ── */
function onOptionSelect(selectedIndex, event) {
  if (quizLocked) return;
  const item = appData.checkpoints[currentQuestion];
  stopQuestionTimer();

  if (playerStats.questionStartTimes[currentQuestion]) {
    playerStats.questionDurations[currentQuestion] = Math.round(
      (Date.now() - playerStats.questionStartTimes[currentQuestion]) / 1000
    );
  }

  const correct = selectedIndex === item.answerIndex;

  if (event && event.currentTarget) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = rect.left + rect.width / 2;
    const py = rect.top + rect.height / 2;
    if (correct) {
      confetti.burstAt(px, py, 22, ["#56b3ad", "#4db6ac", "#80cbc4", "#ffd166"]);
    } else {
      confetti.burstAt(px, py, 12, ["#ff6f4a", "#ff9f7a", "#e57373"]);
    }
  }

  if (!correct) {
    haptic([80]);
    handleWrongAttempt(false);
    return;
  }

  haptic([10, 40, 10]);
  onCorrectAnswer();
  earnedCoupons.push(item.coupon);
  if (feedbackBox) {
    feedbackBox.hidden = false;
    feedbackBox.className = "feedback ok";
    feedbackBox.textContent = "Correct. Unlocking memory...";
  }

  window.setTimeout(() => {
    if (rewardTitle) rewardTitle.textContent = item.rewardTitle;
    if (rewardText) rewardText.textContent = item.rewardText;
    if (rewardCoupon) rewardCoupon.textContent = item.coupon;
    renderRewardMedia(item.media);
    if (progressLabel) progressLabel.textContent = "Checkpoint " + (currentQuestion + 1) + " cleared";
    if (nextBtn) {
      nextBtn.textContent =
        currentQuestion === appData.checkpoints.length - 1 ? "See final surprise" : "Next checkpoint";
    }
    showStage(stages.reward, "scale-in");
  }, 420);
}

/* ── Missed reveal ── */
function showMissedReveal() {
  if (!pendingReveal) return;
  if (playerStats.questionStartTimes[currentQuestion] && !playerStats.questionDurations[currentQuestion]) {
    playerStats.questionDurations[currentQuestion] = Math.round(
      (Date.now() - playerStats.questionStartTimes[currentQuestion]) / 1000
    );
  }
  if (rewardTitle) rewardTitle.textContent = "Checkpoint " + (currentQuestion + 1) + ": reveal";
  if (rewardText) rewardText.textContent = "Correct answer was: " + pendingReveal.correctAnswer + ". You missed this coupon this round.";
  if (rewardCoupon) rewardCoupon.textContent = "Missed coupon: " + pendingReveal.coupon;
  renderRewardMedia(pendingReveal.media);
  if (progressLabel) progressLabel.textContent = "Checkpoint " + (currentQuestion + 1) + " revealed";
  if (nextBtn) {
    nextBtn.textContent =
      currentQuestion === appData.checkpoints.length - 1 ? "See final surprise" : "Next checkpoint";
  }
  if (revealBtn) revealBtn.hidden = true;
  showStage(stages.reward, "scale-in");
}

/* ── Navigation ── */
function goToNextStep() {
  if (currentQuestion === appData.checkpoints.length - 1) {
    if (finalPlan) finalPlan.textContent = appData.finalPlan;
    if (finalDeal) {
      finalDeal.hidden = !userNegotiated;
      finalDeal.textContent = userNegotiated ? appData.negotiatedDeal : "";
    }
    if (finalNote) finalNote.textContent = appData.finalNote + " \uD83D\uDD25 Max streak: " + maxStreak;
    showFinalCouponSummary();
    if (progressLabel) progressLabel.textContent = "Quest complete";
    showStage(stages.final, "scale-in");
    confetti.burst(170);
    audioSystem.play("celebrate");
    return;
  }
  currentQuestion += 1;
  if (progressLabel) progressLabel.textContent = "Checkpoint " + (currentQuestion + 1);
  renderQuestion();
  showStage(stages.quiz, "slide-right");
}

function startQuest() {
  currentQuestion = 0;
  questionWrongAttempts = appData.checkpoints.map(() => 0);
  earnedCoupons = [];
  lostCoupons = [];
  playerStats = {
    questionStartTimes: [],
    questionDurations: [],
    hesitated: new Array(appData.checkpoints.length).fill(false)
  };
  resetStreak();
  maxStreak = 0;
  if (progressLabel) progressLabel.textContent = "Checkpoint 1";
  renderQuestion();
  showStage(stages.quiz, "slide-right");
}

function resetExperience() {
  userNegotiated = false;
  noClickCount = 0;
  currentQuestion = 0;
  easterEggClickCount = 0;
  if (noBtn) {
    noBtn.style.transform = "translate(0, 0)";
    noBtn.textContent = appData.introNoLabels[0];
  }
  if (progressLabel) progressLabel.textContent = "A tiny adventure for my baby";
  resetRewardMedia();
  resetStreak();
  maxStreak = 0;
  if (timerDisplay) {
    timerDisplay.textContent = "";
    timerDisplay.classList.remove("warning");
  }
  showStage(stages.intro, "slide-left");
}

/* ── Share ── */
function buildShareText() {
  const score = earnedCoupons.length + "/" + appData.checkpoints.length;
  return "Try our tiny adventure and memory quest. We scored " + score + " with max streak " + maxStreak + "! " + window.location.href;
}

function openInNewTab(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function shareOnWhatsApp() {
  const shareText = buildShareText();
  const waUrl = "https://wa.me/?text=" + encodeURIComponent(shareText);
  if (navigator.share) {
    navigator.share({ title: "Our Story Quest", text: shareText, url: window.location.href })
      .catch(() => openInNewTab(waUrl));
    return;
  }
  openInNewTab(waUrl);
}

/* ── Dark mode & sound ── */
function applyDarkModePreference() {
  const enabled = window.localStorage.getItem("darkMode") === "true";
  document.body.classList.toggle("dark-mode", enabled);
  if (darkModeToggle) {
    darkModeToggle.textContent = enabled ? "\u2600\uFE0F Light Mode" : "\uD83C\uDF19 Dark Mode";
  }
}

function toggleDarkMode() {
  const enabled = !document.body.classList.contains("dark-mode");
  document.body.classList.toggle("dark-mode", enabled);
  window.localStorage.setItem("darkMode", String(enabled));
  if (darkModeToggle) {
    darkModeToggle.textContent = enabled ? "\u2600\uFE0F Light Mode" : "\uD83C\uDF19 Dark Mode";
  }
}

function syncSoundButton() {
  if (!soundToggle) return;
  const on = audioSystem.enabled;
  soundToggle.textContent = on ? "\uD83D\uDD0A Sound On" : "\uD83D\uDD07 Sound Off";
  soundToggle.classList.toggle("sound-on", on);
  soundToggle.classList.toggle("sound-off", !on);
}

function toggleSound() {
  audioSystem.toggle();
  syncSoundButton();
}

/* ── Event listeners ── */
if (noBtn) noBtn.addEventListener("click", moveNoButton);

if (yesBtn) {
  yesBtn.addEventListener("click", () => {
    haptic([10]);
    userNegotiated = false;
    if (progressLabel) progressLabel.textContent = "Yay, starting our quest";
    startQuest();
  });
}

if (startQuestBtn) startQuestBtn.addEventListener("click", () => { haptic([10]); startQuest(); });
if (nextBtn) nextBtn.addEventListener("click", () => { haptic([10]); goToNextStep(); });
if (restartBtn) restartBtn.addEventListener("click", () => { haptic([10]); resetExperience(); });
if (revealBtn) revealBtn.addEventListener("click", showMissedReveal);
if (shareBtn) shareBtn.addEventListener("click", shareOnWhatsApp);

if (confettiBtn) {
  confettiBtn.addEventListener("click", () => {
    confetti.burst(170);
    audioSystem.play("celebrate");
  });
}

if (darkModeToggle) darkModeToggle.addEventListener("click", toggleDarkMode);
if (soundToggle) soundToggle.addEventListener("click", toggleSound);

if (progressLabel) {
  progressLabel.addEventListener("click", () => {
    easterEggClickCount += 1;
    if (easterEggClickCount >= 5) {
      easterEggClickCount = 0;
      triggerEasterEgg();
    }
  });
}

document.addEventListener("click", () => { audioSystem.init(); }, { once: true });

/* ── Init ── */
if (!window.localStorage.getItem("anniversaryDate")) {
  window.localStorage.setItem("anniversaryDate", "2025-02-15");
}

confetti.init();
applyDarkModePreference();
syncSoundButton();
resetExperience();