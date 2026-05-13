const appData = {
  wrongAnswerMedia: [
    {
      type: "image",
      src: "Images/wrong-answer-better-luck-nxt-time-img.jpg",
      alt: "A playful better luck next time memory"
    },
    {
      type: "image",
      src: "Images/wrong-answer-sad-img.jpg",
      alt: "A playful sad face after missing a reward"
    }
  ],
  introNoLabels: ["No", "Nope", "Only if there are snacks", "Fine, but I am judging", "Maybe after ice cream"],
  negotiatedDeal: "Negotiated deal unlocked: maybe after ice cream.",
  finalPlan: "Lovely dinner date",
  finalNote: "Trephy baby, thank you for being my favorite part of every ordinary day.",
  checkpoints: [
    {
      prompt: "Where did we take our first silly selfie?",
      options: ["At the cafe", "Parking lot", "At home", "In the mall"],
      answerIndex: 3,
      rewardTitle: "The first couple selfie",
      rewardText: "This awkward first private meet with cute goofy selfies is still me favourite.",
      coupon: "Coupon: You pick the desert tonight",
      media: {
        type: "image",
        src: "Images/first-selfie-img.jpg",
        alt: "Our first silly selfie together"
      }
    },
    {
      prompt: "What was our first proper date vibe?",
      options: ["Fancy dinner", "Street food + long talk", "Window-shopping + cozy lunch", "Quick lunch"],
      answerIndex: 2,
      rewardTitle: "First date vibe.",
      rewardText: "Good food, better conversation, best company.",
      coupon: "Coupon: Redeem one long hug on demand, no expiration.",
      media: {
        type: "image",
        src: "Images/first-date-vibe-img.jpg",
        alt: "A memory from our first proper date vibe"
      }
    },
    {
      prompt: "Where did we have our first lunch date?",
      options: ["Truffles", "Empire Restaurant", "Brik Oven", "Meghana Foods"],
      answerIndex: 2,
      rewardTitle: "Memory unlocked: First lunch date",
      rewardText: "That lunch date is still one of my favorite memories with you.",
      coupon: "Coupon: Redeem 10 kisses on demand, no expiration",
      media: {
        type: "video",
        src: "Images/first-date-lunch-vid.mp4",
        alt: "A video memory from our first lunch date"
      }
    },
    {
      prompt: "What is my favorite thing about you?",
      options: ["Your calm", "Your smile", "Your kindness", "All of the above"],
      answerIndex: 3,
      rewardTitle: "Memory unlocked: The obvious truth",
      rewardText: "It is impossible to choose just one thing.",
      coupon: "Coupon: Pick your favourite cousine for dinner tonight",
      media: {
        type: "image",
        src: "Images/favourite-things-img.jpg",
        alt: "Trephy and all my favourite things about her"
      }
    }
  ]
};

const stages = {
  intro: document.getElementById("stageIntro"),
  bridge: document.getElementById("stageBridge"),
  quiz: document.getElementById("stageQuiz"),
  reward: document.getElementById("stageReward"),
  final: document.getElementById("stageFinal")
};

const progressLabel = document.getElementById("progressLabel");
const questionCounter = document.getElementById("questionCounter");
const questionPrompt = document.getElementById("questionPrompt");
const optionGrid = document.getElementById("optionGrid");
const feedbackBox = document.getElementById("feedbackBox");
const revealBtn = document.getElementById("revealBtn");
const rewardTitle = document.getElementById("rewardTitle");
const rewardText = document.getElementById("rewardText");
const rewardCoupon = document.getElementById("rewardCoupon");
const rewardMediaFrame = document.getElementById("rewardMediaFrame");
const rewardImage = document.getElementById("rewardImage");
const rewardVideo = document.getElementById("rewardVideo");
const rewardVideoSource = document.getElementById("rewardVideoSource");
const finalPlan = document.getElementById("finalPlan");
const finalDeal = document.getElementById("finalDeal");
const finalNote = document.getElementById("finalNote");
const earnedCouponList = document.getElementById("earnedCouponList");
const lostCouponList = document.getElementById("lostCouponList");
const finalCouponMessage = document.getElementById("finalCouponMessage");
const shareImageContainer = document.getElementById("shareImageContainer");
const anniversaryInfo = document.getElementById("anniversaryInfo");

const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const startQuestBtn = document.getElementById("startQuestBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const shareBtn = document.getElementById("shareBtn");
const confettiBtn = document.getElementById("confettiBtn");
const darkModeToggle = document.getElementById("darkModeToggle");
const soundToggle = document.getElementById("soundToggle");
const quizMeta = document.getElementById("quizMeta");
const streakCountEl = document.getElementById("streakCount");
const timerDisplay = document.getElementById("timerDisplay");
const srAnnounce = document.getElementById("srAnnounce");

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
    // Storage quota exceeded; in-memory cache still works
  }
}

function announce(text) {
  if (!srAnnounce) {
    return;
  }
  srAnnounce.textContent = "";
  window.setTimeout(() => {
    srAnnounce.textContent = text;
  }, 50);
}

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

const wrongAttemptMessages = [
  "Nooope 😄 Almost there, baby. Try one more time.",
  "Second miss detected 😅 You are adorable, but that answer is still illegal.",
  "Third miss! 🚨 Reveal mode unlocked."
];

const audioSystem = {
  ctx: null,
  enabled: true,
  init() {
    if (this.ctx) {
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }
    this.ctx = new AudioCtx();
  },
  play(type) {
    if (!this.enabled) {
      return;
    }
    this.init();
    if (!this.ctx) {
      return;
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

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

function ensureConfettiCanvas() {
  let canvas = document.getElementById("confettiCanvas");
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
  burst(count = 150) {
    this.resize();
    for (let i = 0; i < count; i += 1) {
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
    if (!this.running) {
      this.running = true;
      this.animate();
    }
  },
  animate() {
    if (!this.ctx) {
      return;
    }
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

function showStage(target) {
  stopQuestionTimer();
  Object.values(stages).forEach((section) => {
    section.classList.remove("is-active");
  });
  target.classList.add("is-active");

  window.setTimeout(() => {
    const focusTarget = target.querySelector("h1, h2") || target;
    if (!focusTarget.hasAttribute("tabindex")) {
      focusTarget.setAttribute("tabindex", "-1");
    }
    focusTarget.focus({ preventScroll: false });
  }, 50);

  if (quizMeta) {
    quizMeta.hidden = target !== stages.quiz;
  }

  if (target === stages.quiz) {
    startQuestionTimer();
  }
}

function resetRewardMedia() {
  rewardMediaFrame.hidden = true;
  rewardImage.hidden = true;
  rewardImage.removeAttribute("src");
  rewardImage.alt = "";
  rewardVideo.hidden = true;
  rewardVideo.pause();
  rewardVideo.removeAttribute("aria-label");
  rewardVideo.removeAttribute("poster");
  rewardVideoSource.src = "";
  rewardVideo.load();
}

function renderRewardMedia(media) {
  resetRewardMedia();

  if (!media) {
    return;
  }

  rewardMediaFrame.hidden = false;

  if (media.type === "video") {
    rewardVideoSource.src = media.src;
    rewardVideo.setAttribute("aria-label", media.alt || "Unlocked video memory");
    rewardVideo.hidden = false;
    rewardVideo.load();
    applyVideoPoster(rewardVideo, media.src);
    return;
  }

  rewardImage.src = media.src;
  rewardImage.alt = media.alt || "Unlocked memory";
  rewardImage.hidden = false;
}

function pickWrongAnswerMedia() {
  const index = Math.floor(Math.random() * appData.wrongAnswerMedia.length);
  return appData.wrongAnswerMedia[index];
}

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

  captureVideo.addEventListener(
    "loadeddata",
    () => {
      const canvas = document.createElement("canvas");
      canvas.width = captureVideo.videoWidth;
      canvas.height = captureVideo.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        cleanup();
        return;
      }

      context.drawImage(captureVideo, 0, 0, canvas.width, canvas.height);
      const posterDataUrl = canvas.toDataURL("image/jpeg", 0.86);
      videoPosterCache.set(src, posterDataUrl);
      savePosterToStorage(src, posterDataUrl);
      videoElement.poster = posterDataUrl;
      cleanup();
    },
    { once: true }
  );

  captureVideo.addEventListener(
    "error",
    () => {
      cleanup();
    },
    { once: true }
  );
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

function updateStreakDisplay() {
  if (streakCountEl) {
    streakCountEl.textContent = String(streakCount);
  }

  const streakDisplay = document.getElementById("streakDisplay");
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

function updateTimerDisplay() {
  if (!timerDisplay) {
    return;
  }
  timerDisplay.textContent = `⏱️ ${timerSecondsLeft}s`;
  timerDisplay.classList.toggle("warning", timerSecondsLeft <= 5 && timerSecondsLeft > 0);
}

function stopQuestionTimer() {
  if (timerInterval) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

function handleQuestionTimeout() {
  if (quizLocked) {
    return;
  }
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
    }

    if (timerSecondsLeft <= 5 && timerSecondsLeft > 0) {
      audioSystem.play("countdown");
    }

    if (timerSecondsLeft <= 0) {
      stopQuestionTimer();
      announce("Time is up!");
      handleQuestionTimeout();
    }
  }, 1000);
}

function moveNoButton() {
  const shouldDodge = noClickCount < 3;

  if (shouldDodge && !isCoarsePointer) {
    const maxX = 220;
    const maxY = 90;
    const x = Math.round(Math.random() * maxX);
    const y = Math.round(Math.random() * maxY);
    noBtn.style.transform = `translate(${-x}px, ${y}px)`;
  }

  if (shouldDodge && isCoarsePointer) {
    noBtn.style.transform = "translate(0, 0)";
  }

  noClickCount += 1;
  const labelIndex = Math.min(noClickCount, appData.introNoLabels.length - 1);
  noBtn.textContent = appData.introNoLabels[labelIndex];

  if (!shouldDodge) {
    noBtn.style.transform = "translate(0, 0)";
    userNegotiated = true;
    progressLabel.textContent = "Negotiation successful";
    showStage(stages.bridge);
  }
}

function renderQuestion() {
  const total = appData.checkpoints.length;
  const item = appData.checkpoints[currentQuestion];

  questionCounter.textContent = `Checkpoint ${currentQuestion + 1} of ${total}`;
  questionPrompt.textContent = item.prompt;
  optionGrid.innerHTML = "";

  item.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option";
    button.textContent = option;
    button.addEventListener("click", () => onOptionSelect(index));
    optionGrid.appendChild(button);
  });

  feedbackBox.hidden = true;
  feedbackBox.textContent = "";
  feedbackBox.className = "feedback";
  revealBtn.hidden = true;
  quizLocked = false;
  pendingReveal = null;
  resetRewardMedia();
}

function renderCouponList(target, values, emptyText) {
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

function renderShareCard() {
  if (!shareImageContainer) {
    return;
  }
  shareImageContainer.innerHTML = "";

  const total = appData.checkpoints.length;
  const score = earnedCoupons.length;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#fff7ea");
  gradient.addColorStop(1, "#ffd7b3");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#2f243a";
  ctx.font = "bold 64px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Our Story Quest", canvas.width / 2, 130);

  ctx.font = "48px Outfit, sans-serif";
  ctx.fillText(`Score: ${score}/${total}`, canvas.width / 2, 230);

  ctx.font = "36px Outfit, sans-serif";
  ctx.fillStyle = "#6d5b79";
  ctx.fillText(`Max Streak: ${maxStreak}`, canvas.width / 2, 300);

  ctx.fillStyle = "#2e7d78";
  ctx.font = "32px Outfit, sans-serif";
  ctx.fillText("Made with love for Trephy", canvas.width / 2, 390);

  const img = document.createElement("img");
  img.alt = "Story quest score card";
  img.src = canvas.toDataURL("image/png");
  shareImageContainer.appendChild(img);
}

function renderAnniversaryInfo() {
  if (!anniversaryInfo) {
    return;
  }

  const storedDate = window.localStorage.getItem("anniversaryDate");
  if (!storedDate) {
    anniversaryInfo.textContent = "Tip: set localStorage key 'anniversaryDate' (YYYY-MM-DD) to show your countdown here.";
    return;
  }

  const date = new Date(storedDate);
  if (Number.isNaN(date.getTime())) {
    anniversaryInfo.textContent = "Anniversary date format looks invalid. Use YYYY-MM-DD.";
    return;
  }

  const now = new Date();
  const next = new Date(now.getFullYear(), date.getMonth(), date.getDate());
  if (next < now) {
    next.setFullYear(next.getFullYear() + 1);
  }
  const daysLeft = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  anniversaryInfo.textContent = daysLeft <= 0 ? "Happy anniversary! 🎉" : `Anniversary in ${daysLeft} day${daysLeft === 1 ? "" : "s"} 💕`;
}

function showFinalCouponSummary() {
  renderCouponList(earnedCouponList, earnedCoupons, "No coupons earned yet.");
  renderCouponList(lostCouponList, lostCoupons, "No coupons missed.");
  renderShareCard();
  renderAnniversaryInfo();

  if (lostCoupons.length > 0) {
    finalCouponMessage.textContent = "Plot twist 😎 Even the missed coupons are yours now. You have got all the coupons.";
    return;
  }

  finalCouponMessage.textContent = "Perfect score energy ✨ You earned every single coupon.";
}

function handleWrongAttempt(fromTimeout) {
  const item = appData.checkpoints[currentQuestion];
  const correctAnswer = item.options[item.answerIndex];
  questionWrongAttempts[currentQuestion] += 1;
  const wrongAttempt = questionWrongAttempts[currentQuestion];

  if (wrongAttempt < 3) {
    onWrongAnswer();
    feedbackBox.hidden = false;
    feedbackBox.className = "feedback error";
    feedbackBox.textContent = fromTimeout
      ? `⏰ Time is up. ${wrongAttemptMessages[wrongAttempt - 1]}`
      : wrongAttemptMessages[wrongAttempt - 1];
    startQuestionTimer();
    return;
  }

  onWrongAnswer();
  lostCoupons.push(item.coupon);
  feedbackBox.hidden = false;
  feedbackBox.className = "feedback error";
  feedbackBox.textContent = `${fromTimeout ? "⏰ Time is up. " : ""}${wrongAttemptMessages[2]} Correct answer: ${correctAnswer}`;
  pendingReveal = {
    correctAnswer,
    coupon: item.coupon,
    media: pickWrongAnswerMedia()
  };
  quizLocked = true;
  revealBtn.hidden = false;
}

function onOptionSelect(selectedIndex) {
  if (quizLocked) {
    return;
  }

  const item = appData.checkpoints[currentQuestion];
  stopQuestionTimer();

  if (selectedIndex !== item.answerIndex) {
    handleWrongAttempt(false);
    return;
  }

  onCorrectAnswer();
  earnedCoupons.push(item.coupon);
  feedbackBox.hidden = false;
  feedbackBox.className = "feedback ok";
  feedbackBox.textContent = "Correct. Unlocking memory...";

  window.setTimeout(() => {
    if (rewardTitle) rewardTitle.textContent = item.rewardTitle;
    if (rewardText) rewardText.textContent = item.rewardText;
    if (rewardCoupon) rewardCoupon.textContent = item.coupon;
    renderRewardMedia(item.media);
    progressLabel.textContent = `Checkpoint ${currentQuestion + 1} cleared`;

    nextBtn.textContent =
      currentQuestion === appData.checkpoints.length - 1 ? "See final surprise" : "Next checkpoint";

    showStage(stages.reward);
  }, 420);
}

function showMissedReveal() {
  if (!pendingReveal) {
    return;
  }

  if (rewardTitle) rewardTitle.textContent = `Checkpoint ${currentQuestion + 1}: reveal`;
  if (rewardText) rewardText.textContent = `Correct answer was: ${pendingReveal.correctAnswer}. You missed this coupon this round.`;
  if (rewardCoupon) rewardCoupon.textContent = `Missed coupon: ${pendingReveal.coupon}`;
  renderRewardMedia(pendingReveal.media);
  progressLabel.textContent = `Checkpoint ${currentQuestion + 1} revealed`;

  nextBtn.textContent =
    currentQuestion === appData.checkpoints.length - 1 ? "See final surprise" : "Next checkpoint";

  revealBtn.hidden = true;
  showStage(stages.reward);
}

function goToNextStep() {
  if (currentQuestion === appData.checkpoints.length - 1) {
    if (finalPlan) finalPlan.textContent = appData.finalPlan;
    if (finalDeal) {
      finalDeal.hidden = !userNegotiated;
      finalDeal.textContent = userNegotiated ? appData.negotiatedDeal : "";
    }
    if (finalNote) finalNote.textContent = `${appData.finalNote} 🔥 Max streak: ${maxStreak}`;
    showFinalCouponSummary();
    progressLabel.textContent = "Quest complete";
    showStage(stages.final);
    confetti.burst(170);
    audioSystem.play("celebrate");
    return;
  }

  currentQuestion += 1;
  progressLabel.textContent = `Checkpoint ${currentQuestion + 1}`;
  renderQuestion();
  showStage(stages.quiz);
}

function startQuest() {
  currentQuestion = 0;
  questionWrongAttempts = appData.checkpoints.map(() => 0);
  earnedCoupons = [];
  lostCoupons = [];
  resetStreak();
  maxStreak = 0;
  progressLabel.textContent = "Checkpoint 1";
  renderQuestion();
  showStage(stages.quiz);
}

function resetExperience() {
  userNegotiated = false;
  noClickCount = 0;
  currentQuestion = 0;
  noBtn.style.transform = "translate(0, 0)";
  noBtn.textContent = appData.introNoLabels[0];
  progressLabel.textContent = "A tiny adventure for my baby";
  resetRewardMedia();
  resetStreak();
  maxStreak = 0;
  if (timerDisplay) {
    timerDisplay.textContent = "";
    timerDisplay.classList.remove("warning");
  }
  showStage(stages.intro);
}

function buildShareText() {
  const score = `${earnedCoupons.length}/${appData.checkpoints.length}`;
  const message = `Try our tiny adventure and memory quest. We scored ${score} with max streak ${maxStreak}!`;
  return `${message} ${window.location.href}`;
}

function openInNewTab(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function shareOnWhatsApp() {
  const shareText = buildShareText();
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  if (navigator.share) {
    navigator
      .share({ title: "Our Story Quest", text: shareText, url: window.location.href })
      .catch(() => openInNewTab(waUrl));
    return;
  }

  openInNewTab(waUrl);
}

function applyDarkModePreference() {
  const enabled = window.localStorage.getItem("darkMode") === "true";
  document.body.classList.toggle("dark-mode", enabled);
  if (darkModeToggle) {
    darkModeToggle.textContent = enabled ? "☀️ Light Mode" : "🌙 Dark Mode";
  }
}

function toggleDarkMode() {
  const enabled = !document.body.classList.contains("dark-mode");
  document.body.classList.toggle("dark-mode", enabled);
  window.localStorage.setItem("darkMode", String(enabled));
  if (darkModeToggle) {
    darkModeToggle.textContent = enabled ? "☀️ Light Mode" : "🌙 Dark Mode";
  }
}

function syncSoundButton() {
  if (!soundToggle) {
    return;
  }
  const on = audioSystem.enabled;
  soundToggle.textContent = on ? "🔊 Sound On" : "🔇 Sound Off";
  soundToggle.classList.toggle("sound-on", on);
  soundToggle.classList.toggle("sound-off", !on);
}

function toggleSound() {
  audioSystem.toggle();
  syncSoundButton();
}

noBtn.addEventListener("click", moveNoButton);

yesBtn.addEventListener("click", () => {
  userNegotiated = false;
  progressLabel.textContent = "Yay, starting our quest";
  startQuest();
});

startQuestBtn.addEventListener("click", startQuest);
nextBtn.addEventListener("click", goToNextStep);
restartBtn.addEventListener("click", resetExperience);
revealBtn.addEventListener("click", showMissedReveal);
shareBtn.addEventListener("click", shareOnWhatsApp);

if (confettiBtn) {
  confettiBtn.addEventListener("click", () => {
    confetti.burst(170);
    audioSystem.play("celebrate");
  });
}

if (darkModeToggle) {
  darkModeToggle.addEventListener("click", toggleDarkMode);
}

if (soundToggle) {
  soundToggle.addEventListener("click", toggleSound);
}

document.addEventListener(
  "click",
  () => {
    audioSystem.init();
  },
  { once: true }
);

if (!window.localStorage.getItem("anniversaryDate")) {
  window.localStorage.setItem("anniversaryDate", "2025-02-15");
}

confetti.init();
applyDarkModePreference();
syncSoundButton();
resetExperience();