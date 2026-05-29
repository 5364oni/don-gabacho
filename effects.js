function getEffectArea() {
  let effect = document.getElementById("don-effect");

  if (!effect) {
    effect = document.createElement("div");
    effect.id = "don-effect";
    effect.className = "hidden";
    document.body.appendChild(effect);
  }

  return effect;
}

function showBigEffect(text, effectClass) {
  const effect = getEffectArea();

  effect.className = "";
  effect.classList.add(effectClass);

  effect.textContent = text;
  effect.style.animation = "none";

  void effect.offsetWidth;

  effect.style.animation = "donPop 0.9s ease-out forwards";

  setTimeout(() => {
    effect.className = "hidden";
  }, 900);
}

function showSkipFlowEffect() {
  const skip = document.createElement("div");
  skip.className = "skip-flow-effect";
  skip.textContent = "SKIP!!";

  const wind = document.createElement("div");
  wind.className = "skip-wind-effect";

  document.body.appendChild(wind);
  document.body.appendChild(skip);

  setTimeout(() => {
    skip.remove();
    wind.remove();
  }, 1500);
}

function addTempClass(element, className, duration) {
  if (!element) return;

  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);

  setTimeout(() => {
    element.classList.remove(className);
  }, duration);
}

function shakeScreen() {
  addTempClass(document.body, "screen-shake", 450);
}

function flashScreen(className, duration) {
  const flash = document.createElement("div");

  flash.className = className;
  document.body.appendChild(flash);

  setTimeout(() => {
    flash.remove();
  }, duration);
}

function rotateTable() {
  const tableCenter = document.getElementById("table-center");

  addTempClass(tableCenter, "table-reverse-spin", 700);
}

function bounceDeck(times) {
  const deckCard = document.getElementById("deck-card");

  if (!deckCard) return;

  let count = 0;

  const runBounce = () => {
    deckCard.classList.remove("deck-bounce");
    void deckCard.offsetWidth;
    deckCard.classList.add("deck-bounce");

    count++;

    if (count < times) {
      setTimeout(runBounce, 260);
    }
  };

  runBounce();
}

function showSuitBurst(suit) {
  const burst = document.createElement("div");

  burst.className = "suit-burst";

  if (suit === "♥" || suit === "♦") {
    burst.classList.add("red-suit-burst");
  } else {
    burst.classList.add("black-suit-burst");
  }

  burst.textContent = suit || "★";

  document.body.appendChild(burst);

  setTimeout(() => {
    burst.remove();
  }, 900);
}

function showDonEffect(text) {
  if (text && text.includes("引きドン返し")) {
    shakeScreen();
    flashScreen("flash-draw-counter", 450);
    showBigEffect("DRAW COUNTER!!", "effect-draw-counter");
    return;
  }

  if (text && text.includes("引きドン")) {
    shakeScreen();
    flashScreen("flash-draw-don", 420);
    showBigEffect("DRAW DON!!", "effect-draw-don");
    return;
  }

  if (text && text.includes("返し")) {
    shakeScreen();
    flashScreen("flash-counter", 420);
    showBigEffect("COUNTER!!", "effect-counter");
    return;
  }

  shakeScreen();
  flashScreen("flash-don", 380);
  showBigEffect("DON!!", "effect-don");
}

function showJokerEffect() {
  flashScreen("flash-joker", 650);
  shakeScreen();
  showBigEffect("JOKER!!", "effect-joker");
}

function showSkipEffect() {
  showSkipFlowEffect();
}

function showDraw2Effect() {
  showBigEffect("DRAW 2!!", "effect-draw2");
  bounceDeck(2);
}

function showReverseEffect() {
  showBigEffect("REVERSE!!", "effect-reverse");
  rotateTable();
}

function showMarkChangeEffect(suit) {
  showBigEffect("MARK CHANGE!!", "effect-mark");

  if (suit) {
    showSuitBurst(suit);
  }
}

function showCardFlyEffect(cardsText) {
  const flyCard = document.createElement("div");

  flyCard.className = "card-fly-effect";
  flyCard.textContent = cardsText;

  document.body.appendChild(flyCard);

  setTimeout(() => {
    flyCard.classList.add("card-fly-start");
  }, 10);

  setTimeout(() => {
    flyCard.remove();
  }, 750);
}

function showCardPreviewEffect(card) {
  if (typeof cardHtml !== "function") return;
  if (!card) return;

  const preview = document.createElement("div");

  preview.className = "cpu-preview-card";
  preview.innerHTML = cardHtml(card);

  document.body.appendChild(preview);

  requestAnimationFrame(() => {
    preview.classList.add("show");
  });

  setTimeout(() => {
    preview.classList.remove("show");

    setTimeout(() => {
      preview.remove();
    }, 300);
  }, 700);
}
