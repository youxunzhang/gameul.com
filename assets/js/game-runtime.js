(function () {
  'use strict';

  const stage = document.querySelector('[data-game-runtime]');
  if (!stage) return;

  const game = stage.dataset.gameRuntime;
  const escapeHtml = value => String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));

  function mount2048() {
    let board = Array(16).fill(0);
    let score = 0;
    let won = false;
    let touchStart = null;
    const bestKey = 'gameul-2048-best';
    let best = Number(localStorage.getItem(bestKey) || 0);

    stage.innerHTML = `
      <div class="game-ui">
        <div class="game-stats">
          <div class="stat-box">Score<strong data-score>0</strong></div>
          <div class="stat-box">Best<strong data-best>${best}</strong></div>
        </div>
        <div class="grid-2048" data-board role="application" aria-label="2048 game board"></div>
        <p class="game-message" data-message aria-live="polite">Use arrow keys or swipe to move the tiles.</p>
        <div class="game-controls"><button class="primary" type="button" data-new>New game</button></div>
      </div>`;

    const boardNode = stage.querySelector('[data-board]');
    const scoreNode = stage.querySelector('[data-score]');
    const bestNode = stage.querySelector('[data-best]');
    const messageNode = stage.querySelector('[data-message]');

    function addTile() {
      const empty = board.map((value, index) => value === 0 ? index : -1).filter(index => index >= 0);
      if (!empty.length) return;
      const index = empty[Math.floor(Math.random() * empty.length)];
      board[index] = Math.random() < 0.9 ? 2 : 4;
    }

    function render() {
      boardNode.innerHTML = board.map(value => `<div class="tile-2048" data-value="${value}" aria-label="${value || 'empty'}">${value || ''}</div>`).join('');
      scoreNode.textContent = String(score);
      if (score > best) {
        best = score;
        localStorage.setItem(bestKey, String(best));
      }
      bestNode.textContent = String(best);
    }

    function lineIndexes(line, direction) {
      const indexes = [];
      for (let position = 0; position < 4; position += 1) {
        if (direction === 'left') indexes.push(line * 4 + position);
        if (direction === 'right') indexes.push(line * 4 + (3 - position));
        if (direction === 'up') indexes.push(position * 4 + line);
        if (direction === 'down') indexes.push((3 - position) * 4 + line);
      }
      return indexes;
    }

    function move(direction) {
      const before = board.join(',');
      for (let line = 0; line < 4; line += 1) {
        const indexes = lineIndexes(line, direction);
        const values = indexes.map(index => board[index]).filter(Boolean);
        const merged = [];
        for (let index = 0; index < values.length; index += 1) {
          if (values[index] === values[index + 1]) {
            const value = values[index] * 2;
            merged.push(value);
            score += value;
            index += 1;
          } else {
            merged.push(values[index]);
          }
        }
        while (merged.length < 4) merged.push(0);
        indexes.forEach((index, position) => { board[index] = merged[position]; });
      }

      if (board.join(',') === before) return;
      addTile();
      if (!won && board.some(value => value >= 2048)) {
        won = true;
        messageNode.textContent = 'You made 2048! Keep going for a higher score.';
      } else if (isGameOver()) {
        messageNode.textContent = 'No moves left. Start a new game and try again.';
      } else {
        messageNode.textContent = 'Nice move. Keep the board open.';
      }
      render();
    }

    function isGameOver() {
      if (board.includes(0)) return false;
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          const value = board[row * 4 + col];
          if (col < 3 && value === board[row * 4 + col + 1]) return false;
          if (row < 3 && value === board[(row + 1) * 4 + col]) return false;
        }
      }
      return true;
    }

    function reset() {
      board = Array(16).fill(0);
      score = 0;
      won = false;
      addTile();
      addTile();
      messageNode.textContent = 'Use arrow keys or swipe to move the tiles.';
      render();
    }

    document.addEventListener('keydown', event => {
      const directions = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
      if (!directions[event.key]) return;
      event.preventDefault();
      move(directions[event.key]);
    });
    boardNode.addEventListener('touchstart', event => {
      const touch = event.changedTouches[0];
      touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    boardNode.addEventListener('touchend', event => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 28) {
        move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      }
      touchStart = null;
    }, { passive: true });
    stage.querySelector('[data-new]').addEventListener('click', reset);
    reset();
  }

  function mountMinesweeper() {
    const levels = {
      easy: { rows: 9, cols: 9, mines: 10 },
      medium: { rows: 12, cols: 12, mines: 22 },
      hard: { rows: 16, cols: 16, mines: 40 }
    };
    let config = levels.easy;
    let cells = [];
    let firstMove = true;
    let ended = false;
    let elapsed = 0;
    let timer = null;
    let longPressTimer = null;
    let suppressClick = false;

    stage.innerHTML = `
      <div class="game-ui">
        <div class="game-stats">
          <div class="stat-box">Mines<strong data-mines>10</strong></div>
          <div class="stat-box">Time<strong data-time>0</strong></div>
        </div>
        <div class="mines-grid" data-board role="grid" aria-label="Minesweeper board"></div>
        <p class="game-message" data-message aria-live="polite">Reveal a square to begin. Your first move is safe.</p>
        <div class="game-controls">
          <label>Difficulty <select data-level><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
          <button class="primary" type="button" data-new>New board</button>
        </div>
      </div>`;
    const boardNode = stage.querySelector('[data-board]');
    const minesNode = stage.querySelector('[data-mines]');
    const timeNode = stage.querySelector('[data-time]');
    const messageNode = stage.querySelector('[data-message]');
    const levelNode = stage.querySelector('[data-level]');

    function neighbours(index) {
      const row = Math.floor(index / config.cols);
      const col = index % config.cols;
      const result = [];
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          if (!dr && !dc) continue;
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r < config.rows && c >= 0 && c < config.cols) result.push(r * config.cols + c);
        }
      }
      return result;
    }

    function placeMines(safeIndex) {
      const forbidden = new Set([safeIndex, ...neighbours(safeIndex)]);
      const available = cells.map((_, index) => index).filter(index => !forbidden.has(index));
      for (let count = 0; count < config.mines; count += 1) {
        const choice = Math.floor(Math.random() * available.length);
        cells[available.splice(choice, 1)[0]].mine = true;
      }
      cells.forEach((cell, index) => {
        cell.near = neighbours(index).filter(neighbour => cells[neighbour].mine).length;
      });
    }

    function startTimer() {
      if (timer) return;
      timer = window.setInterval(() => {
        elapsed += 1;
        timeNode.textContent = String(elapsed);
      }, 1000);
    }

    function stopTimer() {
      window.clearInterval(timer);
      timer = null;
    }

    function render() {
      const flagged = cells.filter(cell => cell.flagged).length;
      minesNode.textContent = String(Math.max(0, config.mines - flagged));
      boardNode.innerHTML = cells.map((cell, index) => {
        const classes = ['mine-cell'];
        if (cell.revealed) classes.push('revealed');
        if (cell.flagged) classes.push('flagged');
        if (cell.revealed && cell.mine) classes.push('mine');
        const label = cell.flagged ? 'flagged square' : cell.revealed ? (cell.mine ? 'mine' : `${cell.near} nearby mines`) : 'hidden square';
        const content = cell.flagged ? '⚑' : cell.revealed ? (cell.mine ? '✹' : cell.near || '') : '';
        return `<button class="${classes.join(' ')}" type="button" data-index="${index}" data-near="${cell.near}" aria-label="${label}" role="gridcell">${content}</button>`;
      }).join('');
    }

    function floodReveal(startIndex) {
      const queue = [startIndex];
      const visited = new Set();
      while (queue.length) {
        const index = queue.shift();
        if (visited.has(index)) continue;
        visited.add(index);
        const cell = cells[index];
        if (!cell || cell.flagged || cell.mine) continue;
        cell.revealed = true;
        if (cell.near === 0) neighbours(index).forEach(neighbour => queue.push(neighbour));
      }
    }

    function reveal(index) {
      if (ended || cells[index].flagged || cells[index].revealed) return;
      if (firstMove) {
        firstMove = false;
        placeMines(index);
        startTimer();
      }
      if (cells[index].mine) {
        cells.forEach(cell => { if (cell.mine) cell.revealed = true; });
        ended = true;
        stopTimer();
        messageNode.textContent = 'That was a mine. Start a new board and try again.';
      } else {
        floodReveal(index);
        const safeRevealed = cells.filter(cell => cell.revealed && !cell.mine).length;
        if (safeRevealed === cells.length - config.mines) {
          ended = true;
          stopTimer();
          messageNode.textContent = `Board cleared in ${elapsed} seconds. Well done!`;
        } else {
          messageNode.textContent = 'Use the number clues to find the safe squares.';
        }
      }
      render();
    }

    function toggleFlag(index) {
      if (ended || cells[index].revealed) return;
      cells[index].flagged = !cells[index].flagged;
      render();
    }

    function reset() {
      stopTimer();
      config = levels[levelNode.value];
      cells = Array.from({ length: config.rows * config.cols }, () => ({ mine: false, near: 0, revealed: false, flagged: false }));
      firstMove = true;
      ended = false;
      elapsed = 0;
      timeNode.textContent = '0';
      boardNode.style.setProperty('--cols', String(config.cols));
      messageNode.textContent = 'Reveal a square to begin. Your first move is safe.';
      render();
    }

    boardNode.addEventListener('click', event => {
      const button = event.target.closest('[data-index]');
      if (!button) return;
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      reveal(Number(button.dataset.index));
    });
    boardNode.addEventListener('contextmenu', event => {
      const button = event.target.closest('[data-index]');
      if (!button) return;
      event.preventDefault();
      toggleFlag(Number(button.dataset.index));
    });
    boardNode.addEventListener('pointerdown', event => {
      const button = event.target.closest('[data-index]');
      if (!button || event.pointerType === 'mouse') return;
      longPressTimer = window.setTimeout(() => {
        suppressClick = true;
        toggleFlag(Number(button.dataset.index));
      }, 480);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => boardNode.addEventListener(type, () => window.clearTimeout(longPressTimer)));
    stage.querySelector('[data-new]').addEventListener('click', reset);
    levelNode.addEventListener('change', reset);
    reset();
  }

  function mountTicTacToe() {
    let board = Array(9).fill('');
    let turn = 'X';
    let mode = 'computer';
    let ended = false;
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    stage.innerHTML = `
      <div class="game-ui">
        <div class="ttt-board" data-board role="grid" aria-label="Tic Tac Toe board"></div>
        <p class="game-message" data-message aria-live="polite">Your turn: place X.</p>
        <div class="game-controls">
          <label>Mode <select data-mode><option value="computer">Vs computer</option><option value="two">Two players</option></select></label>
          <button class="primary" type="button" data-new>New round</button>
        </div>
      </div>`;
    const boardNode = stage.querySelector('[data-board]');
    const messageNode = stage.querySelector('[data-message]');
    const modeNode = stage.querySelector('[data-mode]');

    function winningLine() {
      return wins.find(line => board[line[0]] && line.every(index => board[index] === board[line[0]]));
    }

    function render() {
      const win = winningLine() || [];
      boardNode.innerHTML = board.map((mark, index) => `<button type="button" class="ttt-cell${win.includes(index) ? ' win' : ''}" data-index="${index}" data-mark="${mark}" aria-label="Square ${index + 1}${mark ? `, ${mark}` : ', empty'}" role="gridcell">${mark}</button>`).join('');
    }

    function finishIfNeeded() {
      const win = winningLine();
      if (win) {
        ended = true;
        messageNode.textContent = `${board[win[0]]} wins the round!`;
        render();
        return true;
      }
      if (board.every(Boolean)) {
        ended = true;
        messageNode.textContent = 'Draw. Neither side found a winning line.';
        return true;
      }
      return false;
    }

    function computerMove() {
      if (ended || mode !== 'computer') return;
      const open = board.map((value, index) => value ? -1 : index).filter(index => index >= 0);
      const findMove = mark => open.find(index => {
        board[index] = mark;
        const winsNow = Boolean(winningLine());
        board[index] = '';
        return winsNow;
      });
      const move = findMove('O') ?? findMove('X') ?? (board[4] === '' ? 4 : open[Math.floor(Math.random() * open.length)]);
      board[move] = 'O';
      turn = 'X';
      if (!finishIfNeeded()) messageNode.textContent = 'Your turn: place X.';
      render();
    }

    function play(index) {
      if (ended || board[index] || (mode === 'computer' && turn === 'O')) return;
      board[index] = turn;
      if (finishIfNeeded()) return;
      turn = turn === 'X' ? 'O' : 'X';
      render();
      if (mode === 'computer') {
        messageNode.textContent = 'Computer is choosing a move…';
        window.setTimeout(computerMove, 260);
      } else {
        messageNode.textContent = `${turn}'s turn.`;
      }
    }

    function reset() {
      board = Array(9).fill('');
      turn = 'X';
      ended = false;
      mode = modeNode.value;
      messageNode.textContent = mode === 'computer' ? 'Your turn: place X.' : "X's turn.";
      render();
    }

    boardNode.addEventListener('click', event => {
      const button = event.target.closest('[data-index]');
      if (button) play(Number(button.dataset.index));
    });
    modeNode.addEventListener('change', reset);
    stage.querySelector('[data-new]').addEventListener('click', reset);
    reset();
  }

  function mountSlidingPuzzle() {
    let tiles = Array.from({ length: 15 }, (_, index) => index + 1).concat(0);
    let moves = 0;
    let started = Date.now();
    stage.innerHTML = `
      <div class="game-ui">
        <div class="game-stats"><div class="stat-box">Moves<strong data-moves>0</strong></div></div>
        <div class="slide-board" data-board role="grid" aria-label="15 tile sliding puzzle"></div>
        <p class="game-message" data-message aria-live="polite">Put the numbers in order from 1 to 15.</p>
        <div class="game-controls"><button class="primary" type="button" data-new>Shuffle</button></div>
      </div>`;
    const boardNode = stage.querySelector('[data-board]');
    const movesNode = stage.querySelector('[data-moves]');
    const messageNode = stage.querySelector('[data-message]');

    function adjacent(index, emptyIndex) {
      const row = Math.floor(index / 4);
      const col = index % 4;
      const emptyRow = Math.floor(emptyIndex / 4);
      const emptyCol = emptyIndex % 4;
      return Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1;
    }

    function render() {
      boardNode.innerHTML = tiles.map((tile, index) => `<button type="button" class="slide-tile${tile === 0 ? ' empty' : ''}" data-index="${index}" role="gridcell" aria-label="${tile || 'empty space'}">${tile || ''}</button>`).join('');
      movesNode.textContent = String(moves);
    }

    function move(index, countMove = true) {
      const emptyIndex = tiles.indexOf(0);
      if (!adjacent(index, emptyIndex)) return false;
      [tiles[index], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[index]];
      if (countMove) moves += 1;
      render();
      if (countMove && tiles.every((tile, position) => tile === (position + 1) % 16)) {
        const seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
        messageNode.textContent = `Solved in ${moves} moves and ${seconds} seconds!`;
      }
      return true;
    }

    function shuffle() {
      tiles = Array.from({ length: 15 }, (_, index) => index + 1).concat(0);
      let previousEmpty = -1;
      for (let step = 0; step < 220; step += 1) {
        const emptyIndex = tiles.indexOf(0);
        const options = tiles.map((_, index) => index).filter(index => adjacent(index, emptyIndex) && index !== previousEmpty);
        const choice = options[Math.floor(Math.random() * options.length)];
        previousEmpty = emptyIndex;
        move(choice, false);
      }
      moves = 0;
      started = Date.now();
      messageNode.textContent = 'Put the numbers in order from 1 to 15.';
      render();
    }

    boardNode.addEventListener('click', event => {
      const button = event.target.closest('[data-index]');
      if (button) move(Number(button.dataset.index));
    });
    document.addEventListener('keydown', event => {
      const empty = tiles.indexOf(0);
      const row = Math.floor(empty / 4);
      const col = empty % 4;
      const targets = { ArrowLeft: col < 3 ? empty + 1 : -1, ArrowRight: col > 0 ? empty - 1 : -1, ArrowUp: row < 3 ? empty + 4 : -1, ArrowDown: row > 0 ? empty - 4 : -1 };
      if (targets[event.key] >= 0) {
        event.preventDefault();
        move(targets[event.key]);
      }
    });
    stage.querySelector('[data-new]').addEventListener('click', shuffle);
    shuffle();
  }

  function mountMemoryMatch() {
    const symbols = ['◆', '●', '▲', '★', '♥', '☀', '✿', '☂'];
    let cards = [];
    let open = [];
    let moves = 0;
    let locked = false;
    stage.innerHTML = `
      <div class="game-ui">
        <div class="game-stats"><div class="stat-box">Moves<strong data-moves>0</strong></div><div class="stat-box">Pairs<strong data-pairs>0 / 8</strong></div></div>
        <div class="memory-board" data-board role="grid" aria-label="Memory matching cards"></div>
        <p class="game-message" data-message aria-live="polite">Flip two cards and look for a matching pair.</p>
        <div class="game-controls"><button class="primary" type="button" data-new>New game</button></div>
      </div>`;
    const boardNode = stage.querySelector('[data-board]');
    const movesNode = stage.querySelector('[data-moves]');
    const pairsNode = stage.querySelector('[data-pairs]');
    const messageNode = stage.querySelector('[data-message]');

    function shuffle(values) {
      for (let index = values.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [values[index], values[swap]] = [values[swap], values[index]];
      }
      return values;
    }

    function render() {
      boardNode.innerHTML = cards.map((card, index) => {
        const visible = card.matched || open.includes(index);
        return `<button type="button" class="memory-card${visible ? ' flipped' : ''}${card.matched ? ' matched' : ''}" data-index="${index}" role="gridcell" aria-label="${visible ? card.symbol : 'hidden card'}">${visible ? card.symbol : '?'}</button>`;
      }).join('');
      movesNode.textContent = String(moves);
      pairsNode.textContent = `${cards.filter(card => card.matched).length / 2} / 8`;
    }

    function flip(index) {
      if (locked || cards[index].matched || open.includes(index)) return;
      open.push(index);
      render();
      if (open.length < 2) return;
      moves += 1;
      locked = true;
      const [first, second] = open;
      if (cards[first].symbol === cards[second].symbol) {
        cards[first].matched = true;
        cards[second].matched = true;
        open = [];
        locked = false;
        messageNode.textContent = 'Match found!';
        render();
        if (cards.every(card => card.matched)) messageNode.textContent = `All pairs found in ${moves} moves!`;
      } else {
        messageNode.textContent = 'Not a match. Remember both positions.';
        window.setTimeout(() => {
          open = [];
          locked = false;
          render();
        }, 720);
      }
    }

    function reset() {
      cards = shuffle([...symbols, ...symbols]).map(symbol => ({ symbol, matched: false }));
      open = [];
      moves = 0;
      locked = false;
      messageNode.textContent = 'Flip two cards and look for a matching pair.';
      render();
    }
    boardNode.addEventListener('click', event => {
      const button = event.target.closest('[data-index]');
      if (button) flip(Number(button.dataset.index));
    });
    stage.querySelector('[data-new]').addEventListener('click', reset);
    reset();
  }

  function mountSudoku() {
    const puzzles = {
      easy: ['530070000600195000098000060800060003400803001700020006060000280000419005000080079','534678912672195348198342567859761423426853791713924856961537284287419635345286179'],
      medium: ['000260701680070090190004500820100040004602900050003028009300074040050036703018000','435269781682571493197834562826195347374682915951743628519326874248957136763418259'],
      hard: ['000000907000420180000705026100904000050000040000507009920108000034059000507000000','483651927659423187271895426162934758795812643348567219926178534834259671517346892']
    };
    let puzzle = puzzles.easy[0];
    let solution = puzzles.easy[1];
    stage.innerHTML = `
      <div class="game-ui">
        <div class="sudoku-grid" data-board role="grid" aria-label="Sudoku puzzle"></div>
        <p class="game-message" data-message aria-live="polite">Fill every row, column and 3×3 box with 1–9.</p>
        <div class="game-controls">
          <label>Difficulty <select data-level><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
          <button type="button" data-check>Check</button><button type="button" data-hint>Hint</button><button class="primary" type="button" data-new>Reset</button>
        </div>
      </div>`;
    const boardNode = stage.querySelector('[data-board]');
    const messageNode = stage.querySelector('[data-message]');
    const levelNode = stage.querySelector('[data-level]');

    function render() {
      boardNode.innerHTML = puzzle.split('').map((value, index) => {
        const given = value !== '0';
        return `<input class="sudoku-cell${given ? ' given' : ''}" data-index="${index}" inputmode="numeric" maxlength="1" value="${given ? value : ''}" ${given ? 'readonly' : ''} aria-label="Row ${Math.floor(index / 9) + 1}, column ${index % 9 + 1}${given ? `, given ${value}` : ''}" role="gridcell">`;
      }).join('');
    }

    function values() {
      return Array.from(boardNode.querySelectorAll('input')).map(input => input.value || '0').join('');
    }

    boardNode.addEventListener('input', event => {
      const input = event.target;
      input.value = input.value.replace(/[^1-9]/g, '').slice(0, 1);
      input.classList.remove('error');
      if (values() === solution) messageNode.textContent = 'Puzzle complete. Excellent work!';
    });
    stage.querySelector('[data-check]').addEventListener('click', () => {
      let mistakes = 0;
      boardNode.querySelectorAll('input:not([readonly])').forEach(input => {
        const wrong = input.value && input.value !== solution[Number(input.dataset.index)];
        input.classList.toggle('error', Boolean(wrong));
        if (wrong) mistakes += 1;
      });
      messageNode.textContent = mistakes ? `${mistakes} ${mistakes === 1 ? 'entry needs' : 'entries need'} another look.` : 'No mistakes found in the filled cells.';
    });
    stage.querySelector('[data-hint]').addEventListener('click', () => {
      const candidates = Array.from(boardNode.querySelectorAll('input:not([readonly])')).filter(input => input.value !== solution[Number(input.dataset.index)]);
      if (!candidates.length) return;
      const input = candidates[Math.floor(Math.random() * candidates.length)];
      input.value = solution[Number(input.dataset.index)];
      input.classList.remove('error');
      messageNode.textContent = 'One correct number has been added.';
    });
    function reset() {
      [puzzle, solution] = puzzles[levelNode.value];
      messageNode.textContent = 'Fill every row, column and 3×3 box with 1–9.';
      render();
    }
    stage.querySelector('[data-new]').addEventListener('click', reset);
    levelNode.addEventListener('change', reset);
    reset();
  }

  function mountWordSearch() {
    const wordSets = [
      ['PUZZLE','ARCADE','SCORE','LEVEL','BONUS','PLAYER','TILES','LOGIC'],
      ['BROWSER','GAME','CLICK','QUEST','MATCH','BOARD','ROUND','SMART'],
      ['NUMBER','MEMORY','SEARCH','WINNER','MOVES','FOCUS','SKILL','PLAY']
    ];
    const size = 10;
    let grid = [];
    let words = [];
    let found = new Set();
    let startIndex = null;
    const directions = [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];
    stage.innerHTML = `
      <div class="game-ui">
        <div class="word-layout">
          <div class="word-grid" data-board role="grid" aria-label="Word Search letter grid"></div>
          <ul class="word-list" data-words aria-label="Words to find"></ul>
        </div>
        <p class="game-message" data-message aria-live="polite">Tap the first letter, then the last letter of a word.</p>
        <div class="game-controls"><button class="primary" type="button" data-new>New puzzle</button></div>
      </div>`;
    const boardNode = stage.querySelector('[data-board]');
    const wordsNode = stage.querySelector('[data-words]');
    const messageNode = stage.querySelector('[data-message]');

    function lineBetween(first, last) {
      const r1 = Math.floor(first / size);
      const c1 = first % size;
      const r2 = Math.floor(last / size);
      const c2 = last % size;
      const drRaw = r2 - r1;
      const dcRaw = c2 - c1;
      if (!(drRaw === 0 || dcRaw === 0 || Math.abs(drRaw) === Math.abs(dcRaw))) return [];
      const dr = Math.sign(drRaw);
      const dc = Math.sign(dcRaw);
      const length = Math.max(Math.abs(drRaw), Math.abs(dcRaw)) + 1;
      return Array.from({ length }, (_, index) => (r1 + dr * index) * size + c1 + dc * index);
    }

    function generate() {
      words = wordSets[Math.floor(Math.random() * wordSets.length)];
      found = new Set();
      startIndex = null;
      let complete = false;
      for (let restart = 0; restart < 30 && !complete; restart += 1) {
        grid = Array(size * size).fill('');
        complete = true;
        for (const word of words) {
          let placed = false;
          for (let attempt = 0; attempt < 250 && !placed; attempt += 1) {
            const [dr, dc] = directions[Math.floor(Math.random() * directions.length)];
            const row = Math.floor(Math.random() * size);
            const col = Math.floor(Math.random() * size);
            const endRow = row + dr * (word.length - 1);
            const endCol = col + dc * (word.length - 1);
            if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;
            const indexes = Array.from({ length: word.length }, (_, index) => (row + dr * index) * size + col + dc * index);
            if (indexes.every((position, index) => !grid[position] || grid[position] === word[index])) {
              indexes.forEach((position, index) => { grid[position] = word[index]; });
              placed = true;
            }
          }
          if (!placed) {
            complete = false;
            break;
          }
        }
      }
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      grid = grid.map(letter => letter || alphabet[Math.floor(Math.random() * alphabet.length)]);
      messageNode.textContent = 'Tap the first letter, then the last letter of a word.';
      render();
    }

    function render() {
      const foundIndexes = new Set();
      found.forEach(value => value.indexes.forEach(index => foundIndexes.add(index)));
      boardNode.innerHTML = grid.map((letter, index) => `<button type="button" class="word-cell${startIndex === index ? ' start' : ''}${foundIndexes.has(index) ? ' found' : ''}" data-index="${index}" role="gridcell" aria-label="${letter}, row ${Math.floor(index / size) + 1}, column ${index % size + 1}">${letter}</button>`).join('');
      wordsNode.innerHTML = words.map(word => `<li class="${Array.from(found).some(item => item.word === word) ? 'found' : ''}">${escapeHtml(word)}</li>`).join('');
    }

    function select(index) {
      if (startIndex === null) {
        startIndex = index;
        messageNode.textContent = 'Now tap the final letter.';
        render();
        return;
      }
      const indexes = lineBetween(startIndex, index);
      const letters = indexes.map(position => grid[position]).join('');
      const reversed = letters.split('').reverse().join('');
      const match = words.find(word => !Array.from(found).some(item => item.word === word) && (word === letters || word === reversed));
      if (match) {
        found.add({ word: match, indexes });
        messageNode.textContent = `Found ${match}!`;
        if (found.size === words.length) messageNode.textContent = 'All words found. Great searching!';
      } else {
        messageNode.textContent = 'That line is not in the list. Try another.';
      }
      startIndex = null;
      render();
    }

    boardNode.addEventListener('click', event => {
      const button = event.target.closest('[data-index]');
      if (button) select(Number(button.dataset.index));
    });
    stage.querySelector('[data-new]').addEventListener('click', generate);
    generate();
  }

  const mounts = {
    '2048': mount2048,
    minesweeper: mountMinesweeper,
    'tic-tac-toe': mountTicTacToe,
    'sliding-puzzle': mountSlidingPuzzle,
    'memory-match': mountMemoryMatch,
    sudoku: mountSudoku,
    'word-search': mountWordSearch
  };

  if (mounts[game]) mounts[game]();
})();
