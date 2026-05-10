const appData = {
  introNoLabels: [
    "No",
    "Nope",
    "Only if there are snacks",
    "Fine, but I am judging",
    "Maybe after ice cream"
  ],
  finalPlan: "Ice cream + stargazing drive",
  finalNote: "Trephy baby, thank you for being my favorite part of every ordinary day.",
  checkpoints: [
    {
      prompt: "Where did we take our first silly selfie?",
      options: ["At the cafe", "Parking lot", "At home", "In the mall"],
      answerIndex: 3,
      rewardTitle: "The first couple selfie",
      rewardText: "This awkward first private meet with cute goofy selfies is still me favourite.",
      coupon: "Coupon: You pick the desert tonight"
    },
    {
      prompt: "What was our first proper date vibe?",
      options: ["Fancy dinner", "Street food + long talk", "Window-shopping + cozy lunch", "Quick lunch"],
      answerIndex: 2,
      rewardTitle: "First date vibe.",
      rewardText: "Good food, better conversation, best company.",
      coupon: "Coupon: Redeem one long hug on demand, no expiration."
    },
    {
      prompt: "Where did we have our first lunch date?",
      options: ["Truffles", "Empire Restaurant", "Brik Oven", "Meghana Foods"],
      answerIndex: 2,
      rewardTitle: "Memory unlocked: First lunch date",
      rewardText: "That lunch date is still one of my favorite memories with you.",
      coupon: "Coupon: Redeem 10 kisses on demand, no expiration"
    },
    {
      prompt: "What is my favorite thing about you?",
      options: ["Your calm", "Your smile", "Your kindness", "All of the above"],
      answerIndex: 3,
      rewardTitle: "Memory unlocked: The obvious truth",
      rewardText: "It is impossible to choose just one thing.",
      coupon: "Coupon: Pick your favourite cousine for dinner tonight"
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
const finalPlan = document.getElementById("finalPlan");
const finalNote = document.getElementById("finalNote");
const earnedCouponList = document.getElementById("earnedCouponList");
const lostCouponList = document.getElementById("lostCouponList");
const finalCouponMessage = document.getElementById("finalCouponMessage");

const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const startQuestBtn = document.getElementById("startQuestBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const shareBtn = document.getElementById("shareBtn");

const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

let noClickCount = 0;
let currentQuestion = 0;
let questionWrongAttempts = [];
let earnedCoupons = [];
let lostCoupons = [];
let quizLocked = false;
let pendingReveal = null;

const wrongAttemptMessages = [
  "Nooope 😄 Almost there, baby. Try one more time.",
  "Second miss detected 😅 You are adorable, but that answer is still illegal.",
  "Third miss! 🚨 Reveal mode unlocked."
];

function showStage(target) {
  Object.values(stages).forEach((section) => {
    section.classList.remove("is-active");
  });
  target.classList.add("is-active");
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
    // Keep touch interaction friendly by avoiding hard-to-tap motion on phones.
    noBtn.style.transform = "translate(0, 0)";
  }

  noClickCount += 1;
  const labelIndex = Math.min(noClickCount, appData.introNoLabels.length - 1);
  noBtn.textContent = appData.introNoLabels[labelIndex];

  if (!shouldDodge) {
    noBtn.style.transform = "translate(0, 0)";
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

function showFinalCouponSummary() {
  renderCouponList(earnedCouponList, earnedCoupons, "No coupons earned yet.");
  renderCouponList(lostCouponList, lostCoupons, "No coupons missed.");

  if (lostCoupons.length > 0) {
    finalCouponMessage.textContent =
      "Plot twist 😎 Even the missed coupons are yours now. You have got all the coupons.";
    return;
  }

  finalCouponMessage.textContent = "Perfect score energy ✨ You earned every single coupon.";
}

function onOptionSelect(selectedIndex) {
  if (quizLocked) {
    return;
  }

  const item = appData.checkpoints[currentQuestion];
  const correctAnswer = item.options[item.answerIndex];

  if (selectedIndex !== item.answerIndex) {
    questionWrongAttempts[currentQuestion] += 1;
    const wrongAttempt = questionWrongAttempts[currentQuestion];

    if (wrongAttempt < 3) {
      feedbackBox.hidden = false;
      feedbackBox.className = "feedback error";
      feedbackBox.textContent = wrongAttemptMessages[wrongAttempt - 1];
      return;
    }

    lostCoupons.push(item.coupon);
    feedbackBox.hidden = false;
    feedbackBox.className = "feedback error";
    feedbackBox.textContent = `${wrongAttemptMessages[2]} Correct answer: ${correctAnswer}`;
    pendingReveal = {
      correctAnswer,
      coupon: item.coupon
    };
    quizLocked = true;
    revealBtn.hidden = false;
    return;
  }

  earnedCoupons.push(item.coupon);
  feedbackBox.hidden = false;
  feedbackBox.className = "feedback ok";
  feedbackBox.textContent = "Correct. Unlocking memory...";

  window.setTimeout(() => {
    rewardTitle.textContent = item.rewardTitle;
    rewardText.textContent = item.rewardText;
    rewardCoupon.textContent = item.coupon;
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

  rewardTitle.textContent = `Checkpoint ${currentQuestion + 1}: reveal`;
  rewardText.textContent = `Correct answer was: ${pendingReveal.correctAnswer}. You missed this coupon this round.`;
  rewardCoupon.textContent = `Missed coupon: ${pendingReveal.coupon}`;
  progressLabel.textContent = `Checkpoint ${currentQuestion + 1} revealed`;

  nextBtn.textContent =
    currentQuestion === appData.checkpoints.length - 1 ? "See final surprise" : "Next checkpoint";

  revealBtn.hidden = true;
  showStage(stages.reward);
}

function goToNextStep() {
  if (currentQuestion === appData.checkpoints.length - 1) {
    finalPlan.textContent = appData.finalPlan;
    finalNote.textContent = appData.finalNote;
    showFinalCouponSummary();
    progressLabel.textContent = "Quest complete";
    showStage(stages.final);
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
  progressLabel.textContent = "Checkpoint 1";
  renderQuestion();
  showStage(stages.quiz);
}

function resetExperience() {
  noClickCount = 0;
  currentQuestion = 0;
  noBtn.style.transform = "translate(0, 0)";
  noBtn.textContent = appData.introNoLabels[0];
  progressLabel.textContent = "A tiny adventure for my baby";
  showStage(stages.intro);
}

function buildShareText() {
  const message = "Try our tiny adventure and memory quest";
  return `${message} ${window.location.href}`;
}

function shareOnWhatsApp() {
  const shareText = buildShareText();

  if (navigator.share) {
    navigator
      .share({
        title: "Our Story Quest",
        text: shareText,
        url: window.location.href
      })
      .catch(() => {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(waUrl, "_blank", "noopener,noreferrer");
      });
    return;
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  window.open(waUrl, "_blank", "noopener,noreferrer");
}

noBtn.addEventListener("click", moveNoButton);

yesBtn.addEventListener("click", () => {
  progressLabel.textContent = "Yay, starting our quest";
  startQuest();
});

startQuestBtn.addEventListener("click", startQuest);
nextBtn.addEventListener("click", goToNextStep);
restartBtn.addEventListener("click", resetExperience);
revealBtn.addEventListener("click", showMissedReveal);
shareBtn.addEventListener("click", shareOnWhatsApp);

resetExperience();
