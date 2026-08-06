/* =========================================
   EDIT YOUR ACTIVITIES HERE
========================================= */

/*
  To add an activity:
  Add another line inside the correct category.

  Example:
  { name: "Water fight", emoji: "💦" },

  To remove an activity:
  Delete its whole line.

  To add a new category:
  Copy one complete category block and change:
  - label
  - emoji
  - activities
*/

const activityCategories = {
  all: {
    label: "All",
    emoji: "✨",
    activities: []
  },

  indoor: {
    label: "Indoor",
    emoji: "🏠",
    activities: [
      { name: "Board games", emoji: "🎲" },
      { name: "Charades", emoji: "🎭" },
      { name: "Movie night", emoji: "🎬" },
      { name: "Family quiz", emoji: "🧠" },
      { name: "Card games", emoji: "🃏" }
    ]
  },

  outdoor: {
    label: "Outdoor",
    emoji: "🌿",
    activities: [
      { name: "Family walk", emoji: "🥾" },
      { name: "Garden games", emoji: "🏏" },
      { name: "Football", emoji: "⚽" },
      { name: "Picnic", emoji: "🧺" },
      { name: "Nature scavenger hunt", emoji: "🔎" }
    ]
  },

  children: {
    label: "Children",
    emoji: "🧸",
    activities: [
      { name: "Treasure hunt", emoji: "🗺️" },
      { name: "Colouring competition", emoji: "🎨" },
      { name: "Musical statues", emoji: "🎵" },
      { name: "Bubble games", emoji: "🫧" },
      { name: "Story time", emoji: "📚" }
    ]
  },

  evening: {
    label: "Evening",
    emoji: "🌙",
    activities: [
      { name: "Hot chocolate and film", emoji: "☕" },
      { name: "Family quiz night", emoji: "❓" },
      { name: "Late-night board games", emoji: "🎲" },
      { name: "Stargazing", emoji: "⭐" },
      { name: "Family storytelling", emoji: "💬" }
    ]
  }
};


/* =========================================
   SETTINGS
========================================= */

const wheelColours = [
  "#61745e",
  "#b08b55",
  "#8ea087",
  "#c8ad7f",
  "#758a70",
  "#d4c2a2",
  "#52684f",
  "#b99b6b"
];

const spinDuration = 5800;
const minimumTurns = 5;
const maximumExtraTurns = 3;

const STORAGE_KEYS = {
  currentActivity: "wiltshireSpinnerCurrentActivityV1",
  lastActivity: "wiltshireSpinnerLastActivityV1"
};


/* =========================================
   ELEMENTS
========================================= */

const canvas =
  document.getElementById("activity-wheel");

const context =
  canvas.getContext("2d");

const categoryButtonsContainer =
  document.getElementById("category-buttons");

const spinButton =
  document.getElementById("spin-button");

const resetButton =
  document.getElementById("reset-button");

const resultEmoji =
  document.getElementById("result-emoji");

const resultText =
  document.getElementById("result-text");

const remainingMessage =
  document.getElementById("remaining-message");

const lastPicked =
  document.getElementById("last-picked");

const lastPickedValue =
  document.getElementById("last-picked-value");


/* =========================================
   STATE
========================================= */

let activeCategory = "all";
let availableActivities = [];
let usedActivityKeys = new Set();

let currentRotation = 0;
let isSpinning = false;

let currentActivity = null;
let lastActivity = null;


/* =========================================
   PREPARE ALL CATEGORY
========================================= */

function buildAllActivities() {
  const combinedActivities = [];

  Object.entries(activityCategories).forEach(
    ([categoryKey, category]) => {
      if (categoryKey === "all") {
        return;
      }

      category.activities.forEach((activity) => {
        combinedActivities.push({
          ...activity,
          category: categoryKey
        });
      });
    }
  );

  activityCategories.all.activities =
    combinedActivities;
}


/* =========================================
   ACTIVITY HELPERS
========================================= */

function makeActivityKey(activity) {
  return `${activity.category || activeCategory}::${activity.name}`;
}

function getCategoryActivities(categoryKey) {
  const category =
    activityCategories[categoryKey];

  if (!category) {
    return [];
  }

  return category.activities.map((activity) => ({
    ...activity,
    category:
      activity.category || categoryKey
  }));
}

function refreshAvailableActivities() {
  const categoryActivities =
    getCategoryActivities(activeCategory);

  availableActivities =
    categoryActivities.filter((activity) => {
      return !usedActivityKeys.has(
        makeActivityKey(activity)
      );
    });
}


/* =========================================
   SAVED RESULT HISTORY
========================================= */

function readStoredActivity(key) {
  try {
    const stored =
      localStorage.getItem(key);

    return stored
      ? JSON.parse(stored)
      : null;
  } catch (error) {
    console.warn(
      "Could not read saved spinner activity.",
      error
    );

    return null;
  }
}

function saveResultHistory() {
  try {
    if (currentActivity) {
      localStorage.setItem(
        STORAGE_KEYS.currentActivity,
        JSON.stringify(currentActivity)
      );
    } else {
      localStorage.removeItem(
        STORAGE_KEYS.currentActivity
      );
    }

    if (lastActivity) {
      localStorage.setItem(
        STORAGE_KEYS.lastActivity,
        JSON.stringify(lastActivity)
      );
    } else {
      localStorage.removeItem(
        STORAGE_KEYS.lastActivity
      );
    }
  } catch (error) {
    console.warn(
      "Could not save spinner activity.",
      error
    );
  }
}

function renderResultHistory() {
  if (currentActivity) {
    resultEmoji.textContent =
      currentActivity.emoji;

    resultText.textContent =
      currentActivity.name;
  } else {
    resultEmoji.textContent = "✨";

    resultText.textContent =
      "Spin the wheel to choose";
  }

  if (
    lastActivity &&
    lastPicked &&
    lastPickedValue
  ) {
    lastPicked.hidden = false;

    lastPickedValue.textContent =
      `${lastActivity.emoji} ${lastActivity.name}`;
  } else if (
    lastPicked &&
    lastPickedValue
  ) {
    lastPicked.hidden = true;
    lastPickedValue.textContent = "";
  }
}

function resetResult() {
  currentActivity = null;
  lastActivity = null;

  saveResultHistory();
  renderResultHistory();
}


/* =========================================
   INTERACTION LOCK
========================================= */

function setInterfaceLocked(locked) {
  spinButton.disabled =
    locked ||
    availableActivities.length === 0;

  resetButton.disabled = locked;

  document
    .querySelectorAll(".category-button")
    .forEach((button) => {
      button.disabled = locked;
    });

  categoryButtonsContainer.classList.toggle(
    "is-locked",
    locked
  );
}


/* =========================================
   CATEGORY BUTTONS
========================================= */

function createCategoryButtons() {
  categoryButtonsContainer.innerHTML = "";

  Object.entries(activityCategories).forEach(
    ([categoryKey, category]) => {
      const button =
        document.createElement("button");

      button.type = "button";
      button.className = "category-button";
      button.dataset.category = categoryKey;

      button.innerHTML = `
        <span
          class="category-emoji"
          aria-hidden="true"
        >
          ${category.emoji}
        </span>

        <span class="category-name">
          ${category.label}
        </span>
      `;

      if (categoryKey === activeCategory) {
        button.classList.add("is-active");
      }

      button.addEventListener("click", () => {
        selectCategory(categoryKey);
      });

      categoryButtonsContainer.appendChild(
        button
      );
    }
  );
}

function selectCategory(categoryKey) {
  if (isSpinning) {
    return;
  }

  activeCategory = categoryKey;

  document
    .querySelectorAll(".category-button")
    .forEach((button) => {
      button.classList.toggle(
        "is-active",
        button.dataset.category === categoryKey
      );
    });

  refreshAvailableActivities();
  resetWheelRotation();
  drawWheel();
  updateRemainingMessage();

  /*
    The current result stays visible until
    the next spin has completely finished.
  */
}


/* =========================================
   WHEEL DRAWING
========================================= */

function drawWheel() {
  const activities = availableActivities;

  const width = canvas.width;
  const height = canvas.height;

  const centreX = width / 2;
  const centreY = height / 2;

  const radius =
    Math.min(width, height) / 2;

  context.clearRect(
    0,
    0,
    width,
    height
  );

  if (activities.length === 0) {
    drawEmptyWheel(
      centreX,
      centreY,
      radius
    );

    return;
  }

  const segmentAngle =
    (Math.PI * 2) /
    activities.length;

  activities.forEach(
    (activity, index) => {
      const startAngle =
        index * segmentAngle -
        Math.PI / 2;

      const endAngle =
        startAngle + segmentAngle;

      drawSegment(
        activity,
        index,
        startAngle,
        endAngle,
        centreX,
        centreY,
        radius
      );
    }
  );

  drawWheelBorder(
    centreX,
    centreY,
    radius
  );
}

function drawSegment(
  activity,
  index,
  startAngle,
  endAngle,
  centreX,
  centreY,
  radius
) {
  context.beginPath();

  context.moveTo(
    centreX,
    centreY
  );

  context.arc(
    centreX,
    centreY,
    radius - 3,
    startAngle,
    endAngle
  );

  context.closePath();

  context.fillStyle =
    wheelColours[
      index % wheelColours.length
    ];

  context.fill();

  context.strokeStyle =
    "rgba(255, 255, 255, 0.5)";

  context.lineWidth = 3;
  context.stroke();

  drawSegmentLabel(
    activity,
    startAngle,
    endAngle,
    centreX,
    centreY,
    radius,
    endAngle - startAngle
  );
}

function drawSegmentLabel(
  activity,
  startAngle,
  endAngle,
  centreX,
  centreY,
  radius,
  segmentAngle
) {
  const middleAngle =
    (startAngle + endAngle) / 2;

  context.save();

  context.translate(
    centreX,
    centreY
  );

  context.rotate(middleAngle);

  const activityCount =
    availableActivities.length;

  let fontSize = 25;

  if (activityCount >= 10) {
    fontSize = 20;
  }

  if (activityCount >= 14) {
    fontSize = 16;
  }

  if (activityCount >= 20) {
    fontSize = 13;
  }

  context.fillStyle = "#fffdf8";
  context.textAlign = "right";
  context.textBaseline = "middle";

  context.font =
    `700 ${fontSize}px "DM Sans", sans-serif`;

  const maximumWidth =
    radius * 0.55;

  const label =
    `${activity.emoji} ${activity.name}`;

  const fittedLabel =
    fitText(
      label,
      maximumWidth
    );

  const textPosition =
    radius * 0.87;

  context.fillText(
    fittedLabel,
    textPosition,
    0,
    maximumWidth
  );

  context.restore();
}

function fitText(text, maximumWidth) {
  if (
    context.measureText(text).width <=
    maximumWidth
  ) {
    return text;
  }

  let shortenedText = text;

  while (
    shortenedText.length > 4 &&
    context.measureText(
      `${shortenedText}…`
    ).width > maximumWidth
  ) {
    shortenedText =
      shortenedText.slice(0, -1);
  }

  return `${shortenedText}…`;
}

function drawWheelBorder(
  centreX,
  centreY,
  radius
) {
  context.beginPath();

  context.arc(
    centreX,
    centreY,
    radius - 4,
    0,
    Math.PI * 2
  );

  context.strokeStyle =
    "rgba(255, 253, 248, 0.92)";

  context.lineWidth = 8;
  context.stroke();
}

function drawEmptyWheel(
  centreX,
  centreY,
  radius
) {
  context.beginPath();

  context.arc(
    centreX,
    centreY,
    radius - 4,
    0,
    Math.PI * 2
  );

  context.fillStyle = "#dce6d9";
  context.fill();

  context.strokeStyle = "#fffdf8";
  context.lineWidth = 8;
  context.stroke();

  context.fillStyle = "#435641";
  context.textAlign = "center";
  context.textBaseline = "middle";

  context.font =
    '700 27px "DM Sans", sans-serif';

  context.fillText(
    "All activities used",
    centreX,
    centreY - 20
  );

  context.fillStyle = "#697268";

  context.font =
    '500 20px "DM Sans", sans-serif';

  context.fillText(
    "Tap reset to play again",
    centreX,
    centreY + 22
  );
}


/* =========================================
   SPINNING
========================================= */

function spinWheel() {
  if (
    isSpinning ||
    availableActivities.length === 0
  ) {
    return;
  }

  isSpinning = true;
  setInterfaceLocked(true);

  const selectedIndex =
    Math.floor(
      Math.random() *
      availableActivities.length
    );

  const segmentDegrees =
    360 / availableActivities.length;

  const selectedSegmentCentre =
    selectedIndex * segmentDegrees +
    segmentDegrees / 2;

  const randomTurns =
    minimumTurns +
    Math.floor(
      Math.random() *
      (maximumExtraTurns + 1)
    );

  const targetWithinCircle =
    360 - selectedSegmentCentre;

  const currentNormalised =
    (
      (currentRotation % 360) +
      360
    ) % 360;

  let extraRotation =
    targetWithinCircle -
    currentNormalised;

  if (extraRotation < 0) {
    extraRotation += 360;
  }

  const targetRotation =
    currentRotation +
    randomTurns * 360 +
    extraRotation;

  currentRotation =
    targetRotation;

  canvas.style.transform =
    `rotate(${currentRotation}deg)`;

  window.setTimeout(() => {
    finishSpin(selectedIndex);
  }, spinDuration);
}

function finishSpin(selectedIndex) {
  const selectedActivity =
    availableActivities[selectedIndex];

  if (!selectedActivity) {
    isSpinning = false;
    setInterfaceLocked(false);
    updateRemainingMessage();

    return;
  }

  lastActivity =
    currentActivity
      ? { ...currentActivity }
      : null;

  currentActivity = {
    name: selectedActivity.name,
    emoji: selectedActivity.emoji,
    category: selectedActivity.category
  };

  saveResultHistory();
  renderResultHistory();

  usedActivityKeys.add(
    makeActivityKey(selectedActivity)
  );

  /*
    Keep the controls locked until the chosen
    activity has been removed from the wheel.
    This prevents hidden duplicate selections.
  */

  window.setTimeout(() => {
    refreshAvailableActivities();
    resetWheelRotation();
    drawWheel();
    updateRemainingMessage();

    isSpinning = false;
    setInterfaceLocked(false);
    updateRemainingMessage();
  }, 900);
}


/* =========================================
   RESET
========================================= */

function resetActivities() {
  if (isSpinning) {
    return;
  }

  usedActivityKeys.clear();

  refreshAvailableActivities();
  resetResult();
  resetWheelRotation();
  drawWheel();
  updateRemainingMessage();
}

function resetWheelRotation() {
  canvas.style.transition = "none";

  currentRotation = 0;

  canvas.style.transform =
    "rotate(0deg)";

  /*
    Force the browser to apply the reset
    before restoring the spin animation.
  */

  void canvas.offsetWidth;

  canvas.style.transition =
    `transform ${spinDuration}ms cubic-bezier(0.12, 0.68, 0.12, 1)`;
}


/* =========================================
   REMAINING MESSAGE
========================================= */

function updateRemainingMessage() {
  const total =
    getCategoryActivities(
      activeCategory
    ).length;

  const remaining =
    availableActivities.length;

  if (total === 0) {
    remainingMessage.textContent =
      "There are no activities in this category.";

    if (!isSpinning) {
      spinButton.disabled = true;
    }

    return;
  }

  if (remaining === 0) {
    remainingMessage.textContent =
      "Every activity in this category has been chosen.";

    if (!isSpinning) {
      spinButton.disabled = true;
    }

    return;
  }

  if (!isSpinning) {
    spinButton.disabled = false;
  }

  if (remaining === total) {
    remainingMessage.textContent =
      `${total} activities ready to choose from`;

    return;
  }

  remainingMessage.textContent =
    `${remaining} of ${total} activities remaining`;
}


/* =========================================
   EVENTS
========================================= */

spinButton.addEventListener(
  "click",
  spinWheel
);

resetButton.addEventListener(
  "click",
  resetActivities
);

window.addEventListener(
  "resize",
  drawWheel
);


/* =========================================
   AUTO RESIZE IFRAME
========================================= */

function sendHeight() {
  const height =
    document.documentElement.scrollHeight;

  window.parent.postMessage(
    {
      type: "activity-spinner-height",
      height: height
    },
    "*"
  );
}

window.addEventListener(
  "load",
  sendHeight
);

window.addEventListener(
  "resize",
  sendHeight
);

new ResizeObserver(
  sendHeight
).observe(document.body);


/* =========================================
   INITIALISE
========================================= */

function initialiseSpinner() {
  buildAllActivities();

  currentActivity =
    readStoredActivity(
      STORAGE_KEYS.currentActivity
    );

  lastActivity =
    readStoredActivity(
      STORAGE_KEYS.lastActivity
    );

  createCategoryButtons();
  refreshAvailableActivities();
  resetWheelRotation();
  drawWheel();
  renderResultHistory();
  setInterfaceLocked(false);
  updateRemainingMessage();
}

initialiseSpinner();
