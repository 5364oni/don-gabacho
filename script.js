const suits = ["♠", "♥", "♦", "♣"];

const START_SCORE = GAME_RULES.START_SCORE;
const BASE_RATE = GAME_RULES.BASE_RATE;
const MAX_ROUNDS = GAME_RULES.MAX_ROUNDS;

const DRAW_STATE = {
  NONE: "none",
  DRAW2: "draw2",
  DRAW4: "draw4",
  ASKIP: "askip"
};

let cpuLevel = "normal";
let autoCpuMode = false;
let cpuAutoTimer = null;

let currentRate = BASE_RATE;
let currentRound = 1;
let parentIndex = 0;
let roundFinished = false;
let gameFinished = false;

let deck = [];
let discardPile = [];
let players = [];

let currentCard = null;
let currentSuit = null;
let tableNumber = 0;
let tableHistory = [];

let selectedCards = [];
let pendingJCards = null;

let currentPlayerIndex = 0;
let direction = 1;

let drawPenalty = 0;
let drawState = DRAW_STATE.NONE;
let drawSuit = null;
let drawNumber = null;

let tableNumberOwnerIndex = null;
let donNumberActive = true;

const handArea = document.getElementById("hand");
const tableArea = document.getElementById("table-area");
const numberArea = document.getElementById("number-area");
const suitArea = document.getElementById("suit-area");
const turnArea = document.getElementById("turn-area");
const logArea = document.getElementById("log");
const scoreArea = document.getElementById("score-area");
const resultArea = document.getElementById("result-area");

const drawButton = document.getElementById("draw-button");
const playButton = document.getElementById("play-button");
const donButton = document.getElementById("don-button");
const nextButton = document.getElementById("next-button");
const newRoundButton = document.getElementById("new-round-button");

let newGameButton = document.getElementById("new-game-button");

if (!newGameButton) {
  newGameButton = document.createElement("button");
  newGameButton.textContent = "新しいゲーム開始";
  newGameButton.id = "new-game-button";
  newGameButton.classList.add("hidden");
  newRoundButton.parentNode.appendChild(newGameButton);
}

const cpuLevelSelect = document.getElementById("cpu-level");
const autoCpuCheckbox = document.getElementById("auto-cpu");

const suitSelectArea = document.getElementById("suit-select");
const suitButtons = document.querySelectorAll("#suit-select button");

startGame();

if (cpuLevelSelect) {
  cpuLevelSelect.addEventListener("change", () => {
    cpuLevel = cpuLevelSelect.value;

    if (cpuLevel === "easy") addLog("CPU強さ：弱い");
    if (cpuLevel === "normal") addLog("CPU強さ：普通");
    if (cpuLevel === "hard") addLog("CPU強さ：強い");

    updateAll();
    runAutoCpuIfNeeded();
  });
}

if (autoCpuCheckbox) {
  autoCpuCheckbox.addEventListener("change", () => {
    autoCpuMode = autoCpuCheckbox.checked;

    if (autoCpuMode) {
      addLog("CPU自動進行：ON");
      runAutoCpuIfNeeded();
    } else {
      addLog("CPU自動進行：OFF");
      clearCpuAutoTimer();
    }

    updateAll();
  });
}

playButton.addEventListener("click", () => {
  if (roundFinished || gameFinished) return;
  if (currentPlayerIndex !== 0) return;
  if (selectedCards.length === 0) return;

  const firstCard = selectedCards[0];

  if (!selectedCards.every(card => card.number === firstCard.number)) {
    alert("同じ数字しか出せません");
    return;
  }

  if (!canPlayCard(firstCard)) {
    alert("出せません");
    return;
  }

  const topCard = selectedCards[selectedCards.length - 1];

  if (topCard.number === 11) {
    pendingJCards = [...selectedCards];
    suitSelectArea.classList.remove("hidden");
    return;
  }

  playSelectedCards(null);
});

suitButtons.forEach(button => {
  button.addEventListener("click", () => {
    const selectedSuit = button.dataset.suit;

    suitSelectArea.classList.add("hidden");

    selectedCards = [...pendingJCards];
    pendingJCards = null;

    playSelectedCards(selectedSuit);
  });
});

drawButton.addEventListener("click", () => {
  if (roundFinished || gameFinished) return;
  if (currentPlayerIndex !== 0) return;

  executeDraw(players[0]);
});

donButton.addEventListener("click", () => {
  if (roundFinished || gameFinished) return;

  tryDon(0);
});

nextButton.addEventListener("click", () => {
  if (roundFinished || gameFinished) return;
  if (currentPlayerIndex === 0) return;

  cpuAction();
});

newRoundButton.addEventListener("click", () => {
  currentRound++;
  parentIndex = (parentIndex + 1) % players.length;

  roundFinished = false;
  resultArea.textContent = "";
  newRoundButton.classList.add("hidden");

  startRound();
});

newGameButton.addEventListener("click", () => {
  startGame();
});

function startGame() {
  clearCpuAutoTimer();

  currentRound = 1;
  parentIndex = 0;
  roundFinished = false;
  gameFinished = false;

  players = [
    { name: "あなた", hand: [], isCPU: false, score: START_SCORE },
    { name: "CPU1", hand: [], isCPU: true, score: START_SCORE },
    { name: "CPU2", hand: [], isCPU: true, score: START_SCORE },
    { name: "CPU3", hand: [], isCPU: true, score: START_SCORE }
  ];

  logArea.innerHTML = "";
  resultArea.textContent = "";

  newRoundButton.classList.add("hidden");
  newGameButton.classList.add("hidden");

  addLog("新ゲーム開始");

  startRound();
}

function startRound() {
  clearCpuAutoTimer();

  roundFinished = false;
  currentRate = BASE_RATE;

  deck = createDeck();
  discardPile = [];
  tableHistory = [];

  shuffle(deck);

  players.forEach(player => {
    player.hand = deck.splice(0, 5);
    sortHand(player.hand);
  });

  currentCard = deck.pop();

  while (isActionCard(currentCard)) {
    deck.unshift(currentCard);
    shuffle(deck);
    currentCard = deck.pop();
  }

  tableHistory.push(currentCard);

  currentSuit = currentCard.suit;
  tableNumber = currentCard.number;

  currentPlayerIndex = parentIndex;
  direction = 1;

  tableNumberOwnerIndex = null;
  donNumberActive = true;

  selectedCards = [];
  pendingJCards = null;

  resetDrawState();

  updateAll();

  addLog(currentRound + "回戦開始");
  addLog("親：" + players[parentIndex].name);
  addLog("最初の場札：" + cardText(currentCard));
  addLog("山札残り：" + deck.length + "枚");

  checkOpeningDon();
  runAutoCpuIfNeeded();
}

function createDeck() {
  const newDeck = [];

  for (let suit of suits) {
    for (let number = 1; number <= 13; number++) {
      newDeck.push({ suit, number, type: "normal" });
    }
  }

  newDeck.push({ suit: "Joker", number: 0, type: "joker" });
  newDeck.push({ suit: "Joker", number: 0, type: "joker" });

  return newDeck;
}

function isActionCard(card) {
  return (
    card.number === 1 ||
    card.number === 2 ||
    card.number === 7 ||
    card.number === 8 ||
    card.number === 11 ||
    card.type === "joker"
  );
}

function canPlayCard(card) {
  if (drawState === DRAW_STATE.NONE) {
    return (
      currentCard.type === "joker" ||
      card.suit === currentSuit ||
      card.number === currentCard.number ||
      card.number === 11 ||
      card.type === "joker"
    );
  }

  if (drawState === DRAW_STATE.DRAW2) {
    return (
      card.number === drawNumber ||
      card.type === "joker" ||
      (card.number === 1 && card.suit === drawSuit)
    );
  }

  if (drawState === DRAW_STATE.DRAW4) {
    return (
      card.number === 1 ||
      card.number === 2 ||
      card.number === 8 ||
      card.type === "joker"
    );
  }

  if (drawState === DRAW_STATE.ASKIP) {
    return card.number === 1 || card.type === "joker";
  }

  return false;
}

function playSelectedCards(selectedSuit) {
  const player = players[currentPlayerIndex];
  const playedCards = [...selectedCards];
  const topCard = playedCards[playedCards.length - 1];

  if (currentCard) {
    discardPile.push(currentCard);
  }

  playedCards.forEach(card => {
    if (card !== topCard) discardPile.push(card);
  });

  currentCard = topCard;
  tableHistory.push(topCard);

  if (tableHistory.length > 3) {
    tableHistory.shift();
  }

  if (topCard.number === 11) {
    currentSuit = selectedSuit;
  } else if (topCard.type === "joker") {
    currentSuit = "Joker";
  } else {
    currentSuit = topCard.suit;
  }

  tableNumber = playedCards.reduce((sum, card) => sum + card.number, 0);

  tableNumberOwnerIndex = currentPlayerIndex;
  donNumberActive = true;

  playedCards.forEach(card => {
    const index = player.hand.indexOf(card);
    if (index !== -1) player.hand.splice(index, 1);
  });

  sortHand(player.hand);

  addLog(player.name + " は " + cardsText(playedCards) + " を出した");

  if (typeof showCardFlyEffect === "function") {
    showCardFlyEffect(cardsText(playedCards));
  }

  if (
    player.isCPU &&
    typeof showCardPreviewEffect === "function"
  ) {
    showCardPreviewEffect(topCard);
  }

  addLog("場数字：" + tableNumber);
  addLog("山札残り：" + deck.length + "枚");

  applyEffects(playedCards);
    selectedCards = [];

  checkDonNotice();
  nextTurn();
}

function applyEffects(cards) {
  const first = cards[0];

  if (first.type === "joker") {
    if (typeof showJokerEffect === "function") {
      showJokerEffect();
    }

    drawPenalty += cards.length * 4;
    drawState = DRAW_STATE.DRAW4;
    drawSuit = null;
    drawNumber = 0;

    addLog("Joker ドロー4 累積：" + drawPenalty + "枚");
    return;
  }

  if (first.number === 1) {
    if (typeof showSkipEffect === "function") {
      showSkipEffect();
    }

    applySkipEffect(cards.length);

    if (drawPenalty > 0) {
      drawState = DRAW_STATE.ASKIP;
      drawSuit = first.suit;
      drawNumber = 1;

      addLog("Aスキップ返し：" + cards.length + "枚");
      return;
    }

    drawState = DRAW_STATE.ASKIP;
    drawSuit = first.suit;
    drawNumber = 1;

    addLog("Aスキップ：" + cards.length + "枚");
    return;
  }

  if (first.number === 7) {
    if (typeof showReverseEffect === "function") {
      showReverseEffect();
    }

    for (let i = 0; i < cards.length; i++) {
      direction *= -1;
    }

    addLog("7リバース：" + cards.length + "枚");
    return;
  }

  if (first.number === 2 || first.number === 8) {
    if (typeof showDraw2Effect === "function") {
      showDraw2Effect();
    }

    drawPenalty += cards.length * 2;
    drawState = DRAW_STATE.DRAW2;
    drawSuit = first.suit;
    drawNumber = first.number;

    addLog(numberText(first.number) + " ドロー2 累積：" + drawPenalty + "枚");
    return;
  }

  if (first.number === 11) {
    if (typeof showMarkChangeEffect === "function") {
      showMarkChangeEffect(currentSuit);
    }

    addLog("J マーク指定：" + currentSuit);
    return;
  }

  if (drawPenalty === 0) {
    resetDrawState();
  }
}

function applySkipEffect(cardCount) {
  const advanceBeforeNextTurn = cardCount * 2 - 1;

  for (let i = 0; i < advanceBeforeNextTurn; i++) {
    advanceTurn();
  }
}

function executeDraw(player) {
  const count = drawPenalty > 0 ? drawPenalty : 1;

  animateDeckDraw(currentPlayerIndex);

  for (let i = 0; i < count; i++) {
    drawCard(player);
  }

  sortHand(player.hand);

  addLog(player.name + " は" + count + "枚引いた");
  addLog("山札残り：" + deck.length + "枚");

  if (drawState !== DRAW_STATE.NONE) {
    resetDrawState();
    addLog("ドロー状態解除");
  }

  if (checkHikiDon(currentPlayerIndex)) return;

  nextTurn();
}

function drawCard(player) {
  if (deck.length === 0) {
    deck = [...discardPile];
    discardPile = [];
    shuffle(deck);

    addLog("山札を作り直しました");
  }

  if (deck.length === 0) return;

  player.hand.push(deck.pop());
  sortHand(player.hand);
}

function animateDeckDraw(playerIndex) {
  const deckCard = document.getElementById("deck-card");

  if (!deckCard) return;

  deckCard.classList.remove("deck-bounce");
  void deckCard.offsetWidth;
  deckCard.classList.add("deck-bounce");

  const fromRect = deckCard.getBoundingClientRect();

  let targetElement = handArea;

  if (playerIndex === 1) {
    targetElement = document.getElementById("cpu1-cards");
  }

  if (playerIndex === 2) {
    targetElement = document.getElementById("cpu2-cards");
  }

  if (playerIndex === 3) {
    targetElement = document.getElementById("cpu3-cards");
  }

  if (!targetElement) return;

  const toRect = targetElement.getBoundingClientRect();

  const flyCard = document.createElement("div");

  flyCard.style.position = "fixed";
  flyCard.style.left = fromRect.left + "px";
  flyCard.style.top = fromRect.top + "px";
  flyCard.style.width = fromRect.width + "px";
  flyCard.style.height = fromRect.height + "px";
  flyCard.style.borderRadius = "14px";
  flyCard.style.border = "4px solid #222";
  flyCard.style.background =
    "repeating-linear-gradient(45deg,#1746c8 0,#1746c8 5px,#fff 5px,#fff 8px)";
  flyCard.style.boxShadow = "0 8px 16px rgba(0,0,0,0.45)";
  flyCard.style.zIndex = "99999";
  flyCard.style.pointerEvents = "none";
  flyCard.style.transition =
    "left .65s ease-out, top .65s ease-out, transform .65s ease-out, opacity .65s ease-out";

  document.body.appendChild(flyCard);

  requestAnimationFrame(() => {
    flyCard.style.left =
      toRect.left + toRect.width / 2 - fromRect.width / 2 + "px";

    flyCard.style.top =
      toRect.top + toRect.height / 2 - fromRect.height / 2 + "px";

    flyCard.style.transform = "scale(.55) rotate(12deg)";
    flyCard.style.opacity = "0";
  });

  setTimeout(() => {
    flyCard.remove();
  }, 700);
}

function nextTurn() {
  advanceTurn();
  updateAll();
  runAutoCpuIfNeeded();
}

function advanceTurn() {
  currentPlayerIndex =
    (currentPlayerIndex + direction + players.length) %
    players.length;
}

function cpuAction() {
  if (roundFinished || gameFinished) return;
  if (currentPlayerIndex === 0) return;

  clearCpuAutoTimer();

  const player = players[currentPlayerIndex];

  if (canCpuDon(currentPlayerIndex)) {
    tryDon(currentPlayerIndex);
    return;
  }

  const playableCards =
    player.hand.filter(card => canPlayCard(card));

  if (playableCards.length === 0) {
    executeDraw(player);
    return;
  }

  selectedCards =
    chooseCpuCards(player, playableCards);

  const topCard =
    selectedCards[selectedCards.length - 1];

  if (topCard.number === 11) {
    playSelectedCards(chooseCpuSuit(player));
  } else {
    playSelectedCards(null);
  }
}

function tryDon(playerIndex) {
  clearCpuAutoTimer();

  if (!donNumberActive) return;
  if (playerIndex === tableNumberOwnerIndex) return;

  const total =
    getHandTotal(players[playerIndex].hand);

  if (total !== tableNumber) {
    if (playerIndex === 0) {
      alert("ドン失敗！");
    }
    return;
  }

  const donPlayers = getDonPlayers();

  resolveDonBattle(
    donPlayers,
    "ドン",
    GAME_RULES.DON_MULTIPLIER
  );
}
function checkOpeningDon() {
  if (roundFinished || gameFinished) return;

  const openingDonPlayers = [];

  players.forEach((player, index) => {
    if (getHandTotal(player.hand) === tableNumber) {
      openingDonPlayers.push(index);
    }
  });

  if (openingDonPlayers.length === 0) return;

  addLog(
    "開幕ドン成立：" +
    openingDonPlayers
      .map(index => players[index].name)
      .join("、")
  );

  const payerIndexes =
    players.map((player, index) => index);

  finishRound(
    openingDonPlayers,
    "開幕ドン",
    GAME_RULES.OPENING_DON_MULTIPLIER,
    payerIndexes
  );
}

function getDonPlayers() {
  const donPlayers = [];

  players.forEach((player, index) => {
    if (index === tableNumberOwnerIndex) return;

    if (getHandTotal(player.hand) === tableNumber) {
      donPlayers.push(index);
    }
  });

  return donPlayers;
}

function resolveDonBattle(donPlayers, winType, multiplier) {
  clearCpuAutoTimer();

  const canCounter =
    tableNumberOwnerIndex !== null &&
    getHandTotal(players[tableNumberOwnerIndex].hand) === tableNumber;

  if (canCounter) {
    finishRound(
      [tableNumberOwnerIndex],
      winType + "返し",
      GAME_RULES.DON_COUNTER_MULTIPLIER,
      donPlayers
    );
    return;
  }

  finishRound(
    donPlayers,
    winType,
    multiplier,
    [tableNumberOwnerIndex]
  );
}

function canCpuDon(playerIndex) {
  if (!donNumberActive) return false;
  if (playerIndex === tableNumberOwnerIndex) return false;

  return getHandTotal(players[playerIndex].hand) === tableNumber;
}

function checkHikiDon(playerIndex) {
  if (!donNumberActive) return false;
  if (playerIndex === tableNumberOwnerIndex) return false;

  if (getHandTotal(players[playerIndex].hand) === tableNumber) {
    const canCounter =
      tableNumberOwnerIndex !== null &&
      getHandTotal(players[tableNumberOwnerIndex].hand) === tableNumber;

    if (canCounter) {
      finishRound(
        [tableNumberOwnerIndex],
        "引きドン返し",
        GAME_RULES.HIKI_DON_COUNTER_MULTIPLIER,
        [playerIndex]
      );
    } else {
      finishRound(
        [playerIndex],
        "引きドン",
        GAME_RULES.HIKI_DON_MULTIPLIER,
        [tableNumberOwnerIndex]
      );
    }

    return true;
  }

  return false;
}

function finishRound(winnerIndexes, winType, baseMultiplier, payerIndexes) {
  clearCpuAutoTimer();

  roundFinished = true;
  donNumberActive = false;

  showDonEffect(winType);

  winnerIndexes.forEach(winnerIndex => {
    const winner = players[winnerIndex];

    const totalCards = players.reduce((sum, player, index) => {
      if (index === winnerIndex) return sum;
      return sum + player.hand.length;
    }, 0);

    let finalMultiplier = baseMultiplier;

    if (winnerIndex === parentIndex) {
      finalMultiplier *= GAME_RULES.PARENT_BONUS;
      addLog("親倍率：" + GAME_RULES.PARENT_BONUS + "倍");
    }

    const jokerCount =
      winner.hand.filter(card => card.type === "joker").length;

    if (jokerCount > 0) {
      const jokerMultiplier =
        Math.pow(GAME_RULES.JOKER_MULTIPLIER, jokerCount);

      finalMultiplier *= jokerMultiplier;

      addLog(
        "Joker保持：" +
        jokerCount +
        "枚 / " +
        jokerMultiplier +
        "倍"
      );
    }

    const pay =
      Math.floor(totalCards * currentRate * finalMultiplier);

    addLog(winner.name + " が " + winType);
    addLog("基本倍率：" + baseMultiplier + "倍");
    addLog("最終倍率：" + finalMultiplier + "倍");
    addLog("残り手札合計：" + totalCards + "枚");

    payerIndexes.forEach(payerIndex => {
      const payer = players[payerIndex];

      if (!payer) return;
      if (payerIndex === winnerIndex) return;

      payer.score -= pay;
      winner.score += pay;

      addLog(
        payer.name +
        " → " +
        winner.name +
        "：" +
        pay +
        "点"
      );
    });

    resultArea.textContent =
      winner.name + " の勝利！ +" + pay + "点";
  });

  updateAll();

  if (currentRound < MAX_ROUNDS) {
    newRoundButton.classList.remove("hidden");
  } else {
    finishGame();
  }

  newGameButton.classList.remove("hidden");
}

function finishGame() {
  gameFinished = true;

  const ranking =
    [...players].sort((a, b) => b.score - a.score);

  let rankingText = "最終順位\n";

  ranking.forEach((player, index) => {
    rankingText +=
      index + 1 + "位：" + player.name + " " + player.score + "点\n";
  });

  resultArea.textContent = rankingText;

  addLog("ゲーム終了");

  newGameButton.classList.remove("hidden");
}

function checkDonNotice() {
  const donPlayers = getDonPlayers();

  if (donPlayers.length > 0) {
    addLog(
      "ドン可能：" +
      donPlayers
        .map(index => players[index].name)
        .join("、")
    );
  }
}

function resetDrawState() {
  drawPenalty = 0;
  drawState = DRAW_STATE.NONE;
  drawSuit = null;
  drawNumber = null;
}

function canHumanDon() {
  if (!donNumberActive) return false;
  if (tableNumberOwnerIndex === 0) return false;

  return getHandTotal(players[0].hand) === tableNumber;
}

function updateAll() {
  updateTable();
  updateHand();
  updateCPU();
  updateScore();
  updateTurn();
  updateDonButton();
}

function updateTable() {
  tableArea.innerHTML = "";

  const zone = document.createElement("div");
  zone.id = "table-zone";

  const deckZone = document.createElement("div");
  deckZone.id = "deck-zone";

  const deckCard = document.createElement("div");
  deckCard.id = "deck-card";

  const deckCount = document.createElement("div");
  deckCount.id = "deck-count";
  deckCount.textContent = "山札：" + deck.length + "枚";

  deckZone.appendChild(deckCard);
  deckZone.appendChild(deckCount);

  const stack = document.createElement("div");
  stack.id = "table-stack";

  const visibleCards = tableHistory.slice(-3);

  visibleCards.forEach((card, index) => {
    const div = document.createElement("div");

    div.className = "table-card";

    if (index === 0 && visibleCards.length === 3) {
      div.classList.add("table-old-2");
    }

    if (
      (index === 0 && visibleCards.length === 2) ||
      (index === 1 && visibleCards.length === 3)
    ) {
      div.classList.add("table-old-1");
    }

    div.innerHTML = cardHtml(card);

    stack.appendChild(div);
  });

  zone.appendChild(deckZone);
  zone.appendChild(stack);

  tableArea.appendChild(zone);

  numberArea.textContent = "場数字：" + tableNumber;

  let stateText = "";

  if (drawState === DRAW_STATE.DRAW2) {
    stateText = " / ドロー2中";
  }

  if (drawState === DRAW_STATE.DRAW4) {
    stateText = " / Jokerドロー中";
  }

  if (drawState === DRAW_STATE.ASKIP) {
    stateText = " / Aスキップ中";
  }

  let penaltyText = "";

  if (drawPenalty > 0) {
    penaltyText = " / 累積：" + drawPenalty + "枚";
  }

  const directionText =
    direction === 1 ? "正順" : "逆順";

  suitArea.innerHTML =
    currentRound +
    "/" +
    MAX_ROUNDS +
    "回戦 / 親：" +
    players[parentIndex].name +
    " / 方向：" +
    directionText +
    " / 指定：" +
    currentSuit +
    " / 山札：" +
    deck.length +
    "枚" +
    stateText +
    penaltyText;
}

function updateHand() {
  handArea.innerHTML = "";

  sortHand(players[0].hand);

  players[0].hand.forEach((card, index) => {
    const button = document.createElement("button");

    button.className = "hand-card-button";
    button.innerHTML = cardHtml(card);
    button.style.zIndex = String(index + 1);

    if (selectedCards.includes(card)) {
      button.classList.add("selected");
      button.style.zIndex = "200";
    }

    button.addEventListener("click", () => {
      if (roundFinished || gameFinished) return;
      if (currentPlayerIndex !== 0) return;

      if (selectedCards.includes(card)) {
        selectedCards =
          selectedCards.filter(c => c !== card);
      } else {
        selectedCards.push(card);
      }

      updateHand();
    });

    handArea.appendChild(button);
  });
}

function updateCPU() {
  const cpuAreas = [
    { id: "cpu1-cards", hand: players[1].hand },
    { id: "cpu2-cards", hand: players[2].hand },
    { id: "cpu3-cards", hand: players[3].hand }
  ];

  cpuAreas.forEach(cpu => {
    const area = document.getElementById(cpu.id);

    if (!area) return;

    area.innerHTML = "";

    cpu.hand.forEach(() => {
      const back = document.createElement("div");
      back.className = "cpu-back-card";
      area.appendChild(back);
    });
  });
}

function updateScore() {
  scoreArea.innerHTML = "";

  players.forEach((player, index) => {
    const div = document.createElement("div");
    div.className = "score-box";

    const parentText =
      index === parentIndex ? "（親）" : "";

    div.textContent =
      player.name + parentText + "：" + player.score + "点";

    scoreArea.appendChild(div);
  });
}

function clearActiveTurnDisplay() {
  document
    .querySelectorAll(".active-turn")
    .forEach(element => {
      element.classList.remove("active-turn");
    });
}

function updateActiveTurnDisplay() {
  clearActiveTurnDisplay();

  if (roundFinished || gameFinished) return;

  if (currentPlayerIndex === 0) {
    const playerArea =
      document.getElementById("player-area");

    if (playerArea) {
      playerArea.classList.add("active-turn");
    }

    return;
  }

  const cpuName =
    document.getElementById("cpu" + currentPlayerIndex + "-name");

  if (cpuName) {
    cpuName.classList.add("active-turn");
  }
}

function updateTurn() {
  updateActiveTurnDisplay();

  if (gameFinished) {
    turnArea.textContent = "ゲーム終了";
    return;
  }

  if (roundFinished) {
    turnArea.textContent = "ラウンド終了";
    return;
  }

  if (canHumanDon() && currentPlayerIndex !== 0) {
    turnArea.textContent = "ドン可能！";
    return;
  }

  if (autoCpuMode && currentPlayerIndex !== 0) {
    turnArea.textContent =
      players[currentPlayerIndex].name + " 思考中...";
    return;
  }

  turnArea.textContent =
    "現在：" + players[currentPlayerIndex].name;
}

function updateDonButton() {
  if (canHumanDon()) {
    donButton.classList.add("don-ready");
  } else {
    donButton.classList.remove("don-ready");
  }
}

function addLog(text) {
  const div = document.createElement("div");
  div.className = "log-line";
  div.innerHTML = "・" + text;
  logArea.prepend(div);
}

function getHandTotal(hand) {
  return hand.reduce((sum, card) => sum + card.number, 0);
}

function sortHand(hand) {
  const suitOrder = {
    "♠": 1,
    "♥": 2,
    "♦": 3,
    "♣": 4,
    "Joker": 5
  };

  hand.sort((a, b) => {
    if (a.type === "joker") return 1;
    if (b.type === "joker") return -1;

    if (a.number !== b.number) {
      return a.number - b.number;
    }

    return suitOrder[a.suit] - suitOrder[b.suit];
  });
}

function cardText(card) {
  if (card.type === "joker") return "Joker";

  return card.suit + numberText(card.number);
}

function cardsText(cards) {
  return cards
    .map(card => cardText(card))
    .join("、");
}

function cardHtml(card) {
  if (card.type === "joker") {
    return `
      <div class="playing-card joker-card">
        <div class="joker-top">JOKER</div>
        <div class="joker-star">★</div>
        <div class="joker-bottom">JOKER</div>
      </div>
    `;
  }

  const colorClass =
    card.suit === "♥" || card.suit === "♦"
      ? "red"
      : "black";

  const number = numberText(card.number);

  if (
    card.number === 11 ||
    card.number === 12 ||
    card.number === 13
  ) {
    const faceClass =
      card.number === 11
        ? "face-j"
        : card.number === 12
          ? "face-q"
          : "face-k";

    const faceIcon =
      card.number === 11
        ? "♞"
        : card.number === 12
          ? "♛"
          : "♚";

    return `
      <div class="playing-card ${colorClass}">
        <div class="card-corner top">${number}<br>${card.suit}</div>

        <div class="card-face-mark ${faceClass}">
          <div class="face-icon">${faceIcon}</div>
          <div class="face-label">${number}</div>
          <div class="face-suit">${card.suit}</div>
        </div>

        <div class="card-corner bottom">${number}<br>${card.suit}</div>
      </div>
    `;
  }

  return `
    <div class="playing-card ${colorClass}">
      <div class="card-corner top">${number}<br>${card.suit}</div>
      <div class="card-center-symbol">${card.suit}</div>
      <div class="card-corner bottom">${number}<br>${card.suit}</div>
    </div>
  `;
}

function numberText(number) {
  if (number === 1) return "A";
  if (number === 11) return "J";
  if (number === 12) return "Q";
  if (number === 13) return "K";

  return String(number);
}

function getCardClass(card) {
  if (card.type === "joker") return "card-joker";

  if (card.suit === "♥" || card.suit === "♦") {
    return "card-red";
  }

  return "card-black";
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j =
      Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] =
      [array[j], array[i]];
  }
}
window.addEventListener("load", () => {
  alert(
    "読み込み確認\n" +
    "showJokerEffect: " + typeof showJokerEffect + "\n" +
    "showSkipEffect: " + typeof showSkipEffect + "\n" +
    "showDraw2Effect: " + typeof showDraw2Effect + "\n" +
    "showReverseEffect: " + typeof showReverseEffect
  );
});
