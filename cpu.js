function runAutoCpuIfNeeded() {
  clearCpuAutoTimer();

  if (!autoCpuMode) return;
  if (roundFinished) return;
  if (gameFinished) return;
  if (currentPlayerIndex === 0) return;

  if (canHumanDon()) {
    addLog("あなたはドン可能！ 見送るなら「次へ」");
    updateAll();
    return;
  }

  const player = players[currentPlayerIndex];

  turnArea.textContent = player.name + " 思考中...";

  cpuAutoTimer = setTimeout(() => {
    cpuAutoTimer = null;

    try {
      if (!autoCpuMode) return;
      if (roundFinished) return;
      if (gameFinished) return;
      if (currentPlayerIndex === 0) return;

      if (canHumanDon()) {
        addLog("あなたはドン可能！ 見送るなら「次へ」");
        updateAll();
        return;
      }

      cpuActionSafe();

    } catch (error) {
      console.error(error);

      clearCpuAutoTimer();
      autoCpuMode = false;

      if (autoCpuCheckbox) {
        autoCpuCheckbox.checked = false;
      }

      addLog("CPU処理エラー。自動進行を停止しました");
      updateAll();
    }
  }, GAME_RULES.CPU_AUTO_DELAY);
}

function clearCpuAutoTimer() {
  if (cpuAutoTimer) {
    clearTimeout(cpuAutoTimer);
    cpuAutoTimer = null;
  }
}

function cpuActionSafe() {
  if (roundFinished || gameFinished) return;
  if (currentPlayerIndex === 0) return;

  const player = players[currentPlayerIndex];

  if (!player) {
    addLog("CPU取得エラー。次の人へ進めます");
    nextTurn();
    return;
  }

  if (
    donNumberActive &&
    tableNumberOwnerIndex !== currentPlayerIndex &&
    getHandTotal(player.hand) === tableNumber
  ) {
    addLog(player.name + " がドン！");
    tryDon(currentPlayerIndex);
    return;
  }

  const playableCards = player.hand.filter(card => canPlayCard(card));

  if (playableCards.length === 0) {
    executeDraw(player);
    return;
  }

  selectedCards = chooseCpuCards(player, playableCards);

  if (!selectedCards || selectedCards.length === 0) {
    executeDraw(player);
    return;
  }

  const topCard = selectedCards[selectedCards.length - 1];

  if (!topCard) {
    executeDraw(player);
    return;
  }

  if (topCard.number === 11) {
    playSelectedCards(chooseCpuSuit(player));
  } else {
    playSelectedCards(null);
  }
}

function chooseCpuCards(player, playableCards) {
  const selectedCard = chooseCpuCard(player, playableCards);

  if (!selectedCard) {
    return [];
  }

  const sameNumberCards = player.hand.filter(card => {
    return card.number === selectedCard.number;
  });

  if (!GAME_RULES.CPU_MULTI_PLAY) {
    return [selectedCard];
  }

  if (sameNumberCards.length <= 1) {
    return [selectedCard];
  }

  let shouldMultiPlay = false;

  if (cpuLevel === "easy") {
    shouldMultiPlay = Math.random() < 0.15;
  }

  if (cpuLevel === "normal") {
    shouldMultiPlay = Math.random() < 0.35;
  }

  if (cpuLevel === "hard") {
    shouldMultiPlay = shouldHardCpuMultiPlay(selectedCard, sameNumberCards);
  }

  if (!shouldMultiPlay) {
    return [selectedCard];
  }

  if (cpuLevel === "easy") {
    return sameNumberCards.slice(0, 2);
  }

  if (cpuLevel === "normal") {
    const maxCount = Math.random() < 0.75 ? 2 : 3;
    return sameNumberCards.slice(0, maxCount);
  }

  return chooseHardMultiCards(selectedCard, sameNumberCards);
}

function shouldHardCpuMultiPlay(selectedCard, sameNumberCards) {
  if (sameNumberCards.length <= 1) return false;

  const oneCardNumber = selectedCard.number;

  const allCardsNumber = sameNumberCards.reduce((sum, card) => {
    return sum + card.number;
  }, 0);

  const oneCardDanger = wouldGiveDonChanceByNumber(oneCardNumber);
  const allCardsDanger = wouldGiveDonChanceByNumber(allCardsNumber);

  if (oneCardDanger && !allCardsDanger) {
    return true;
  }

  if (selectedCard.type === "joker") {
    return false;
  }

  if (
    selectedCard.number === 1 ||
    selectedCard.number === 2 ||
    selectedCard.number === 8 ||
    selectedCard.number === 11
  ) {
    return Math.random() < 0.25;
  }

  return Math.random() < 0.55;
}

function chooseCpuCard(player, playableCards) {
  if (!playableCards || playableCards.length === 0) {
    return null;
  }

  if (cpuLevel === "easy") {
    return playableCards[Math.floor(Math.random() * playableCards.length)];
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
  let candidates = [...playableCards];

  const nonJoker = candidates.filter(card => {
    return card.type !== "joker";
  });

  if (nonJoker.length > 0) {
    candidates = nonJoker;
  }

  candidates.sort((a, b) => {
    return b.number - a.number;
  });

  return candidates[0];
}

function chooseHardCpuCard(player, playableCards) {
  let candidates = [...playableCards];

  const jokerCards = candidates.filter(card => {
    return card.type === "joker";
  });

  const nonJokerCards = candidates.filter(card => {
    return card.type !== "joker";
  });

  const shouldUseJokerNow =
    shouldHardCpuUseJoker(player, playableCards);

  if (!shouldUseJokerNow && nonJokerCards.length > 0) {
    candidates = nonJokerCards;
  }

  if (shouldUseJokerNow && jokerCards.length > 0) {
    candidates = jokerCards;
  }

  const nonSpecial = candidates.filter(card => {
    return (
      card.type !== "joker" &&
      card.number !== 1 &&
      card.number !== 2 &&
      card.number !== 8 &&
      card.number !== 11
    );
  });

  if (!shouldUseJokerNow && nonSpecial.length > 0) {
    candidates = nonSpecial;
  }

  const safeCards = candidates.filter(card => {
    return !wouldGiveDonChanceByNumber(card.number);
  });

  if (safeCards.length > 0) {
    candidates = safeCards;
  }

  candidates.sort((a, b) => {
    return b.number - a.number;
  });

  return candidates[0];
}

function shouldHardCpuUseJoker(player, playableCards) {
  const jokerCards = playableCards.filter(card => {
    return card.type === "joker";
  });

  if (jokerCards.length === 0) return false;

  const nonJokerCards = playableCards.filter(card => {
    return card.type !== "joker";
  });

  if (nonJokerCards.length === 0) {
    return true;
  }

  if (
    drawState === DRAW_STATE.DRAW2 ||
    drawState === DRAW_STATE.DRAW4 ||
    drawState === DRAW_STATE.ASKIP
  ) {
    return true;
  }

  if (player.hand.length <= 2) {
    return true;
  }

  const safeNonJokerCards = nonJokerCards.filter(card => {
    return !wouldGiveDonChanceByNumber(card.number);
  });

  if (safeNonJokerCards.length === 0) {
    return true;
  }

  return Math.random() < 0.12;
}

function chooseHardMultiCards(selectedCard, sameNumberCards) {
  let bestCards = [selectedCard];

  for (let count = 2; count <= sameNumberCards.length; count++) {
    const testCards = sameNumberCards.slice(0, count);

    const testNumber = testCards.reduce((sum, card) => {
      return sum + card.number;
    }, 0);

    if (!wouldGiveDonChanceByNumber(testNumber)) {
      bestCards = testCards;
    }
  }

  return bestCards;
}

function wouldGiveDonChanceByNumber(number) {
  for (let i = 0; i < players.length; i++) {
    if (i === currentPlayerIndex) continue;

    const total = getHandTotal(players[i].hand);

    if (total === number) {
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
