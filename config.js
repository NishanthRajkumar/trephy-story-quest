/* ---------------------------------------------------------------
   Story Quest — quiz data & app copy
   Edit this file to customise the experience without touching script.js
--------------------------------------------------------------- */

window.StoryQuestConfig = {
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
