const suits = ["♠", "♥", "♦", "♣"];

const START_SCORE = 3000;
const BASE_RATE = 10;
const MAX_ROUNDS = 4;

const DRAW_STATE = {
  NONE: "none",
  DRAW2: "draw2",
  DRAW4: "draw4",
  ASKIP: "askip"
};

let cpuLevel = "normal";

let currentRate = BASE_RATE;
let deckLoop = 1;

let deck = [];
let discardPile = [];
let players = [];

let currentCard = null;
let currentSuit = null;
let tableNumber = 0;

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

let roundFinished = false;
let currentRound = 1;
let parentIndex = 0;

const handArea = document.getElementById("hand");
const tableArea = document.getElementById("table-area");
const numberArea = document.getElementById("number-area");
const suitArea = document.getElementById("suit-area");
const turnArea = document.getElementById("turn-area");
const logArea = document.getElementById("log");
const scoreArea = document.getElementById("score-area");
const resultArea = document.getElementById("result-area");
const donEffectArea = document.getElementById("don-effect");

const drawButton = document.getElementById("draw-button");
const playButton = document.getElementById("play-button");
const donButton = document.getElementById("don-button");
const nextButton = document.getElementById("next-button");
const newRoundButton = document.getElementById("new-round-button");

const cpuLevelSelect = document.getElementById("cpu-level");

const suitSelectArea = document.getElementById("suit-select");
const suitButtons = document.querySelectorAll("#suit-select button");

const newGameButton = document.createElement("button");
newGameButton.textContent = "新しくゲーム開始";
newGameButton.id = "new-game-button";
newGameButton.classList.add("hidden");
newRoundButton.parentNode.appendChild(newGameButton);

startGame();

cpuLevelSelect.addEventListener("change", () => {
  cpuLevel = cpuLevelSelect.value;

  if (cpuLevel === "easy") addLog("CPU強さ：弱い");
  if (cpuLevel === "normal") addLog("CPU強さ：普通");
  if (cpuLevel === "hard") addLog("CPU強さ：強い");
});

playButton.addEventListener("click", () => {
  if (roundFinished) return;

  if (currentPlayerIndex !== 0) {
    alert("あなたの番ではありません");
    return;
  }

  if (selectedCards.length === 0) return;

  const firstCard = selectedCards[0];

  const sameNumber = selectedCards.every(card => {
    return card.number === firstCard.number;
  });

  if (!sameNumber) {
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
  if (roundFinished) return;

  if (currentPlayerIndex !== 0) {
    alert("あなたの番ではありません");
    return;
  }

  executeDraw(players[0]);
});

donButton.addEventListener("click", () => {
  if (roundFinished) return;

  tryDon(0);
});

nextButton.addEventListener("click", () => {
  if (roundFinished) return;

  if (currentPlayerIndex === 0) {
    alert("あなたの番です");
    return;
  }

  cpuAction();
});

newRoundButton.addEventListener("click", () => {
  if (currentRound >= MAX_ROUNDS) return;

  currentRound++;
  parentIndex = (parentIndex + 1) % players.length;

  startRound();
});

newGameButton.addEventListener("click", () => {
  startGame();
});

function startGame() {
  currentRound = 1;
  parentIndex = 0;

  players = [
    { name: "あなた", hand: [], isCPU: false, score: START_SCORE },
    { name: "CPU1", hand: [], isCPU: true, score: START_SCORE },
    { name: "CPU2", hand: [], isCPU: true, score: START_SCORE },
    { name: "CPU3", hand: [], isCPU: true, score: START_SCORE }
  ];

  logArea.innerHTML = "";

  startRound();
}

function startRound() {
  currentRate = BASE_RATE;
  deckLoop = 1;

  deck = createDeck();
  discardPile = [];

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

  currentSuit = currentCard.suit;
  tableNumber = currentCard.number;

  selectedCards = [];
  pendingJCards = null;

  currentPlayerIndex = parentIndex;
  direction = 1;

  resetDrawState();

  donNumberActive = true;
  tableNumberOwnerIndex = null;

  roundFinished = false;
  resultArea.textContent = "";

  newRoundButton.classList.add("hidden");
  newGameButton.classList.add("hidden");

  addLog(currentRound + "回戦開始");
  addLog("親：" + players[parentIndex].name);
  addLog("最初の場札：" + cardHtml(currentCard));
  addLog("場数字：" + tableNumber);

  updateAll();

  checkOpeningDon();
}

function createDeck() {
  const newDeck = [];

  for (let suit of suits) {
    for (let number = 1; number <= 13; number++) {
      newDeck.push({
        suit,
        number,
        type: "normal"
      });
    }
  }

  newDeck.push({
    suit: "Joker",
    number: 0,
    type: "joker"
  });

  newDeck.push({
    suit: "Joker",
    number: 0,
    type: "joker"
  });

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
      (card.number === 1 && card.suit === drawSuit) ||
      card.type === "joker"
    );
  }

  if (drawState === DRAW_STATE.ASKIP) {
    return (
      card.number === 1 ||
      card.type === "joker"
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

  return false;
}

function playSelectedCards(selectedSuit) {
  const player = players[currentPlayerIndex];
  const playedCards = [...selectedCards];

  let total = 0;

  playedCards.forEach(card => {
    total += card.number;
  });

  if (currentCard) {
    discardPile.push(currentCard);
  }

  const topCard = playedCards[playedCards.length - 1];

  playedCards.forEach(card => {
    if (card !== topCard) {
      discardPile.push(card);
    }
  });

  tableNumber = total;
  currentCard = topCard;

  tableNumberOwnerIndex = currentPlayerIndex;
  donNumberActive = true;

  if (currentCard.number === 11) {
    currentSuit = selectedSuit;
  } else if (currentCard.type === "joker") {
    currentSuit = "Joker";
  } else {
    currentSuit = currentCard.suit;
  }

  removeCardsFromHand(player, playedCards);
  sortHand(player.hand);

  addLog(player.name + " は " + cardsHtml(playedCards) + " を出した");
  addLog("場数字：" + tableNumber);

  applyEffects(playedCards);

  selectedCards = [];

  afterAction();
}

function applyEffects(cards) {
  const first = cards[0];

  if (first.number === 1) {
    if (
      drawState === DRAW_STATE.DRAW2 ||
      drawState === DRAW_STATE.DRAW4 ||
      drawState === DRAW_STATE.ASKIP
    ) {
      drawState = DRAW_STATE.ASKIP;
      addLog("Aスキップ");
      return;
    }

    const skipCount = cards.length;

    addLog("Aスキップ：" + skipCount + "人");

    for (let i = 0; i < skipCount; i++) {
      advanceTurn();
      addLog(players[currentPlayerIndex].name + " はスキップ");
    }
  }

  if (first.number === 7) {
    for (let i = 0; i < cards.length; i++) {
      direction *= -1;
    }

    addLog("7リバース");
  }

  if (first.number === 2 || first.number === 8) {
    drawPenalty += cards.length * 2;
    drawState = DRAW_STATE.DRAW2;
    drawSuit = first.suit;
    drawNumber = first.number;

    addLog(
      '<span class="' +
      getSuitClass(first.suit) +
      '">' +
      numberText(first.number) +
      "</span>" +
      " ドロー2 累積：" +
      drawPenalty +
      "枚"
    );
  }

  if (first.number === 11) {
    addLog(
      'J マーク指定：<span class="' +
      getSuitClass(currentSuit) +
      '">' +
      currentSuit +
      "</span>"
    );
  }

  if (first.type === "joker") {
    drawPenalty += cards.length * 4;
    drawState = DRAW_STATE.DRAW4;
    drawSuit = null;
    drawNumber = 0;

    addLog(
      '<span class="card-joker">Joker</span> ドロー4 累積：' +
      drawPenalty +
      "枚"
    );
  }
}

function executeDraw(player) {
  const count = drawPenalty > 0 ? drawPenalty : 1;

  for (let i = 0; i < count; i++) {
    drawCard(player);
  }

  sortHand(player.hand);

  addLog(player.name + " は " + count + "枚引いた");

  if (drawPenalty > 0) {
    resetDrawState();
    addLog("ドロー状態解除。次の人は通常ルール");
  }

  if (checkHikiDon(currentPlayerIndex)) return;

  if (currentPlayerIndex === tableNumberOwnerIndex) {
    donNumberActive = false;
    addLog("一周したため、この場数字でのドンは無効");
  }

  afterAction();
}

function drawCard(player) {
  if (deck.length === 0) {
    recycleDeck();
  }

  if (deck.length === 0) {
    addLog("山札も捨て札もありません");
    return;
  }

  player.hand.push(deck.pop());
  sortHand(player.hand);
}

function recycleDeck() {
  if (discardPile.length === 0) return;

  deckLoop++;
  currentRate = BASE_RATE * deckLoop;

  deck = [...discardPile];
  discardPile = [];

  shuffle(deck);

  addLog(deckLoop + "周目突入");
  addLog("レート：" + currentRate);
}

function cpuAction() {
  const player = players[currentPlayerIndex];

  if (canCpuDon(currentPlayerIndex)) {
    tryDon(currentPlayerIndex);
    return;
  }

  const playableCards = player.hand.filter(card => {
    return canPlayCard(card);
  });

  if (playableCards.length === 0) {
    executeDraw(player);
    return;
  }

  let selectedCard = chooseCpuCard(player, playableCards);

  selectedCards = [selectedCard];

  if (selectedCard.number === 11) {
    playSelectedCards(chooseCpuSuit(player));
  } else {
    playSelectedCards(null);
  }
}

function chooseCpuCard(player, playableCards) {
  if (cpuLevel === "easy") {
    return playableCards[
      Math.floor(Math.random() * playableCards.length)
    ];
  }

  if (cpuLevel === "normal") {
    return chooseNormalCpuCard(playableCards);
  }

  if (cpuLevel === "hard") {
    return chooseHardCpuCard(player, playableCards);
  }

  return playableCards[0];
}

function chooseNormalCpuCard(playableCards) {
  const nonJoker = playableCards.filter(card => {
    return card.type !== "joker";
  });

  if (nonJoker.length > 0) {
    playableCards = nonJoker;
  }

  playableCards.sort((a, b) => {
    return b.number - a.number;
  });

  return playableCards[0];
}

function chooseHardCpuCard(player, playableCards) {
  let candidates = [...playableCards];

  const nonJoker = candidates.filter(card => {
    return card.type !== "joker";
  });

  if (nonJoker.length > 0) {
    candidates = nonJoker;
  }

  const nonSpecial = candidates.filter(card => {
    return (
      card.number !== 1 &&
      card.number !== 2 &&
      card.number !== 8 &&
      card.number !== 11
    );
  });

  if (nonSpecial.length > 0) {
    candidates = nonSpecial;
  }

  const safeCards = candidates.filter(card => {
    return !wouldGiveDonChance(card);
  });

  if (safeCards.length > 0) {
    candidates = safeCards;
  }

  candidates.sort((a, b) => {
    return b.number - a.number;
  });

  return candidates[0];
}

function wouldGiveDonChance(card) {
  const testNumber = card.number;

  for (let i = 0; i < players.length; i++) {
    if (i === currentPlayerIndex) continue;

    const total = getHandTotal(players[i].hand);

    if (total === testNumber) {
      return true;
    }
  }

  return false;
}

function chooseCpuSuit(player) {
  const suitCount = {
    "♠": 0,
    "♥": 0,
    "♦": 0,
    "♣": 0
  };

  player.hand.forEach(card => {
    if (suitCount[card.suit] !== undefined) {
      suitCount[card.suit]++;
    }
  });

  let bestSuit = "♠";
  let bestCount = -1;

  suits.forEach(suit => {
    if (suitCount[suit] > bestCount) {
      bestSuit = suit;
      bestCount = suitCount[suit];
    }
  });

  return bestSuit;
}

function tryDon(playerIndex) {
  if (!donNumberActive) {
    alert("この場数字でのドンは無効です");
    return;
  }

  if (playerIndex === tableNumberOwnerIndex) {
    alert("自分が出した場数字ではドンできません");
    return;
  }

  const total = getHandTotal(players[playerIndex].hand);

  if (total !== tableNumber) {
    if (playerIndex === 0) {
      alert("ドン失敗！");
    }

    return;
  }

  const donPlayers = getDonPlayers();

  resolveDonBattle(donPlayers, "ドン", 1);
}

function checkOpeningDon() {
  if (roundFinished) return;

  const openingDonPlayers = [];

  players.forEach((player, index) => {
    const total = getHandTotal(player.hand);

    if (total === tableNumber) {
      openingDonPlayers.push(index);
    }
  });

  if (openingDonPlayers.length === 0) return;

  const names = openingDonPlayers.map(index => players[index].name).join("、");

  addLog("開幕ドン成立：" + names);

  const payerIndexes = players.map((player, index) => index);

  finishRound(
    openingDonPlayers,
    "開幕ドン",
    5,
    payerIndexes
  );
}

function getDonPlayers() {
  const donPlayers = [];

  players.forEach((player, index) => {
    if (index === tableNumberOwnerIndex) return;

    const total = getHandTotal(player.hand);

    if (total === tableNumber) {
      donPlayers.push(index);
    }
  });

  return donPlayers;
}

function resolveDonBattle(donPlayers, winType, baseMultiplier) {
  if (donPlayers.length === 0) return;

  const canCounter =
    tableNumberOwnerIndex !== null &&
    getHandTotal(players[tableNumberOwnerIndex].hand) === tableNumber;

  if (canCounter) {
    finishRound(
      [tableNumberOwnerIndex],
      winType + "返し",
      baseMultiplier * 2,
      donPlayers
    );

    return;
  }

  finishRound(
    donPlayers,
    winType,
    baseMultiplier,
    [tableNumberOwnerIndex]
  );
}

function canCpuDon(playerIndex) {
  if (!donNumberActive) return false;
  if (playerIndex === tableNumberOwnerIndex) return false;

  const total = getHandTotal(players[playerIndex].hand);

  return total === tableNumber;
}

function checkHikiDon(playerIndex) {
  if (!donNumberActive) return false;

  if (playerIndex === tableNumberOwnerIndex) return false;

  const total = getHandTotal(players[playerIndex].hand);

  if (total === tableNumber) {
    const canCounter =
      tableNumberOwnerIndex !== null &&
      getHandTotal(players[tableNumberOwnerIndex].hand) === tableNumber;

    if (canCounter) {
      finishRound([tableNumberOwnerIndex], "引きドン返し", 4, [playerIndex]);
    } else {
      finishRound([playerIndex], "引きドン", 2, [tableNumberOwnerIndex]);
    }

    return true;
  }

  return false;
}

function finishRound(winnerIndexes, winType, winMultiplier, payerIndexes) {
  roundFinished = true;

  showDonEffect(winType);

  let resultTexts = [];

  winnerIndexes.forEach(winnerIndex => {
    const winner = players[winnerIndex];

    let multiplier = winMultiplier;

    if (winnerIndex === parentIndex) {
      multiplier *= 1.5;
    }

    const jokerCount = winner.hand.filter(card => {
      return card.type === "joker";
    }).length;

    if (jokerCount > 0) {
      multiplier *= Math.pow(2, jokerCount);
    }

    let totalCards = 0;

    players.forEach((player, index) => {
      if (index !== winnerIndex) {
        totalCards += player.hand.length;
      }
    });

    const pay = Math.floor(totalCards * currentRate * multiplier);

    payerIndexes.forEach(payerIndex => {
      const payer = players[payerIndex];

      if (!payer) return;
      if (payerIndex === winnerIndex) return;

      payer.score -= pay;
      winner.score += pay;

      addLog(payer.name + " → " + winner.name + "：" + pay + "点");
    });

    resultTexts.push(winner.name + " " + winType + " +" + pay + "点");

    addLog(winner.name + " が " + winType);
    addLog("倍率：" + multiplier + "倍");
    addLog("残り手札合計：" + totalCards + "枚");
  });

  resultArea.textContent =
    currentRound +
    "回戦終了：" +
    resultTexts.join(" / ");

  if (currentRound >= MAX_ROUNDS) {
    finishGame();
  } else {
    newRoundButton.classList.remove("hidden");
  }

  newGameButton.classList.remove("hidden");

  updateAll();
}

function showDonEffect(text) {
  donEffectArea.textContent = text.includes("返し")
    ? "返し!!"
    : "DON!!";

  donEffectArea.classList.remove("hidden");

  donEffectArea.style.animation = "none";
  void donEffectArea.offsetWidth;
  donEffectArea.style.animation = "donPop 0.9s ease-out forwards";

  setTimeout(() => {
    donEffectArea.classList.add("hidden");
  }, 900);
}

function finishGame() {
  const ranking = [...players].sort((a, b) => {
    return b.score - a.score;
  });

  const champion = ranking[0];

  resultArea.textContent =
    "全4回戦終了！ 総合優勝：" +
    champion.name +
    "（" +
    champion.score +
    "点）";

  newRoundButton.classList.add("hidden");
  newGameButton.classList.remove("hidden");
}

function afterAction() {
  checkDonNotice();
  advanceTurn();
  updateAll();
}

function checkDonNotice() {
  if (!donNumberActive) return;

  const donPlayers = getDonPlayers();

  if (donPlayers.length > 0) {
    const names = donPlayers.map(index => players[index].name).join("、");
    addLog(names + " はドン可能！");
  }
}

function advanceTurn() {
  currentPlayerIndex =
    (currentPlayerIndex + direction + players.length) %
    players.length;
}

function resetDrawState() {
  drawPenalty = 0;
  drawState = DRAW_STATE.NONE;
  drawSuit = null;
  drawNumber = null;
}

function removeCardsFromHand(player, cards) {
  cards.forEach(card => {
    const index = player.hand.indexOf(card);

    if (index !== -1) {
      player.hand.splice(index, 1);
    }
  });

  sortHand(player.hand);
}

function getHandTotal(hand) {
  let total = 0;

  hand.forEach(card => {
    total += card.number;
  });

  return total;
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
    if (a.type === "joker" && b.type !== "joker") return 1;
    if (a.type !== "joker" && b.type === "joker") return -1;
    if (a.type === "joker" && b.type === "joker") return 0;

    if (a.number !== b.number) {
      return a.number - b.number;
    }

    return suitOrder[a.suit] - suitOrder[b.suit];
  });
}

function updateAll() {
  updateTable();
  updateHand();
  updateScore();
  updateTurn();
  updateCPU();
}

function updateHand() {
  handArea.innerHTML = "";

  sortHand(players[0].hand);

  players[0].hand.forEach(card => {
    const button = document.createElement("button");

    button.textContent = cardText(card);
    button.title = getCardRoleText(card);
    button.classList.add(getCardClass(card));

    if (selectedCards.includes(card)) {
      button.classList.add("selected");
    }

    if (currentPlayerIndex !== 0 || roundFinished) {
      button.disabled = true;
    }

    button.addEventListener("click", () => {
      if (currentPlayerIndex !== 0 || roundFinished) return;

      if (selectedCards.includes(card)) {
        selectedCards = selectedCards.filter(c => c !== card);
      } else {
        selectedCards.push(card);
      }

      updateHand();
    });

    handArea.appendChild(button);
  });
}

function getCardClass(card) {
  if (card.type === "joker") {
    return "card-joker";
  }

  if (card.suit === "♥" || card.suit === "♦") {
    return "card-red";
  }

  return "card-black";
}

function getSuitClass(suit) {
  if (suit === "♥" || suit === "♦") {
    return "card-red";
  }

  if (suit === "Joker") {
    return "card-joker";
  }

  return "card-black";
}

function updateTable() {
  tableArea.innerHTML = "場札：" + cardHtml(currentCard);
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
    penaltyText = " / ドロー累積：" + drawPenalty + "枚";
  }

  suitArea.innerHTML =
    currentRound +
    "/" +
    MAX_ROUNDS +
    "回戦 / " +
    deckLoop +
    "周目 / レート：" +
    currentRate +
    " / 親：" +
    players[parentIndex].name +
    " / 山札：" +
    deck.length +
    "枚 / 指定：" +
    suitHtml(currentSuit) +
    " / 方向：" +
    getDirectionText() +
    stateText +
    penaltyText;
}

function updateTurn() {
  turnArea.textContent = roundFinished
    ? "ラウンド終了"
    : "現在：" + players[currentPlayerIndex].name;
}

function updateCPU() {
  document.getElementById("cpu1").textContent =
    "CPU1：" + players[1].hand.length + "枚";

  document.getElementById("cpu2").textContent =
    "CPU2：" + players[2].hand.length + "枚";

  document.getElementById("cpu3").textContent =
    "CPU3：" + players[3].hand.length + "枚";
}

function updateScore() {
  scoreArea.innerHTML = "";

  players.forEach((player, index) => {
    const div = document.createElement("div");
    div.className = "score-box";

    const parentText = index === parentIndex ? "（親）" : "";

    div.textContent =
      player.name +
      parentText +
      "：" +
      player.score +
      "点";

    scoreArea.appendChild(div);
  });
}

function addLog(text) {
  const div = document.createElement("div");

  div.className = "log-line";
  div.innerHTML = "・" + text;

  logArea.prepend(div);
}

function numberText(number) {
  if (number === 1) return "A";
  if (number === 11) return "J";
  if (number === 12) return "Q";
  if (number === 13) return "K";

  return String(number);
}

function cardText(card) {
  if (!card) return "";

  if (card.type === "joker") {
    return "Joker";
  }

  return card.suit + numberText(card.number);
}

function cardHtml(card) {
  if (!card) return "";

  if (card.type === "joker") {
    return '<span class="card-joker">Joker</span>';
  }

  return (
    '<span class="' +
    getSuitClass(card.suit) +
    '">' +
    card.suit +
    numberText(card.number) +
    "</span>"
  );
}

function suitHtml(suit) {
  if (!suit) return "なし";

  return (
    '<span class="' +
    getSuitClass(suit) +
    '">' +
    suit +
    "</span>"
  );
}

function getCardRoleText(card) {
  if (!card) return "";

  if (card.type === "joker") {
    return "Joker：ドロー4 / 数字0";
  }

  if (card.number === 1) {
    return "A：スキップ / ドロー中は返し札";
  }

  if (card.number === 2) {
    return "2：ドロー2";
  }

  if (card.number === 7) {
    return "7：リバース";
  }

  if (card.number === 8) {
    return "8：ドロー2";
  }

  if (card.number === 11) {
    return "J：マーク指定";
  }

  if (card.number === 12) {
    return "Q：通常カード";
  }

  if (card.number === 13) {
    return "K：通常カード";
  }

  return "通常カード";
}

function cardsText(cards) {
  return cards.map(card => cardText(card)).join("、");
}

function cardsHtml(cards) {
  return cards.map(card => cardHtml(card)).join("、");
}

function getDirectionText() {
  return direction === 1 ? "正順" : "逆順";
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]];
  }
}
