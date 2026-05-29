<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>ドン・ガバチョ</title>

  <link rel="stylesheet" href="style.css" />
</head>

<body>

  <div id="game-area">

    <h1>ドン・ガバチョ</h1>

    <!-- 点数 -->
    <div id="score-area"></div>

    <hr />

    <!-- 設定 -->
    <div id="setting-area">

      <div id="cpu-level-area">
        CPU強さ：

        <select id="cpu-level">
          <option value="easy">
            弱い
          </option>

          <option
            value="normal"
            selected
          >
            普通
          </option>

          <option value="hard">
            強い
          </option>
        </select>
      </div>

      <div id="auto-cpu-area">
        <label>
          <input
            type="checkbox"
            id="auto-cpu"
          />

          CPU自動進行
        </label>
      </div>

    </div>

    <!-- 役 -->
    <div id="role-area">

      <h2>役札</h2>

      <div class="role-list">

        <div>
          A：スキップ / ドロー中は返し札
        </div>

        <div>
          2：ドロー2
        </div>

        <div>
          7：リバース
        </div>

        <div>
          8：ドロー2
        </div>

        <div>
          J：マーク指定
        </div>

        <div>
          Joker：ドロー4 / 数字0
        </div>

      </div>

    </div>

    <!-- 現在 -->
    <div id="turn-area"></div>

    <!-- 卓 -->
<div id="table-center">

  <!-- CPU上 -->
  <div
    id="cpu-top"
    class="cpu-seat"
  >

    <div
      class="cpu-name"
      id="cpu2-name"
    >
      CPU2
    </div>

    <div
      class="cpu-cards cpu-top-cards"
      id="cpu2-cards"
    ></div>

  </div>

  <!-- CPU左 -->
  <div
    id="cpu-left"
    class="cpu-seat"
  >

    <div
      class="cpu-name"
      id="cpu1-name"
    >
      CPU1
    </div>

    <div
      class="cpu-cards cpu-left-cards"
      id="cpu1-cards"
    ></div>

  </div>

  <!-- CPU右 -->
  <div
    id="cpu-right"
    class="cpu-seat"
  >

    <div
      class="cpu-name"
      id="cpu3-name"
    >
      CPU3
    </div>

    <div
      class="cpu-cards cpu-right-cards"
      id="cpu3-cards"
    ></div>

  </div>

  <!-- 中央 -->
  <div id="table-area"></div>

</div>
    <!-- プレイヤー -->
    <div id="player-area">

      <div id="number-area"></div>

      <div id="suit-area"></div>

      <div id="result-area"></div>

      <!-- 手札 -->
      <div id="hand"></div>

      <!-- ボタン -->
      <div id="button-area">

        <button id="play-button">
          出す
        </button>

        <button id="draw-button">
          引く
        </button>

        <button id="don-button">
          ドン！
        </button>

        <button id="next-button">
          次へ
        </button>

        <button
          id="new-round-button"
          class="hidden"
        >
          次ラウンド
        </button>

        <button
          id="new-game-button"
          class="hidden"
        >
          新しいゲーム
        </button>

      </div>

    </div>

    <!-- マーク選択 -->
    <div
      id="suit-select"
      class="hidden"
    >

      <h2>
        マークを選択
      </h2>

      <button data-suit="♠">
        ♠
      </button>

      <button data-suit="♥">
        ♥
      </button>

      <button data-suit="♦">
        ♦
      </button>

      <button data-suit="♣">
        ♣
      </button>

    </div>

    <!-- ログ -->
    <div id="log-area">

      <h2>
        ログ
      </h2>

      <div id="log"></div>

    </div>

  </div>

  <!-- JS -->

  <script src="rules.js"></script>

  <script src="effects.js"></script>

  <script src="cpu.js"></script>

  <script src="script.js"></script>

</body>
</html>
